-- P6 workflow simplification: technician self-roster and auditable incomplete approval.
-- This migration deliberately preserves every existing roster, period, record and audit row.

alter table public.period_actions drop constraint if exists period_actions_action_check;
alter table public.period_actions add constraint period_actions_action_check
  check (action in ('MARK_READY','RETURN','APPROVE','APPROVE_INCOMPLETE','REOPEN_FOR_CORRECTION'));

-- An active STAFF account may create/update a roster only when it assigns itself.
-- Head/Admin retain the ability to manage any roster. TEST/SYSTEM accounts remain prohibited.
create or replace function public.save_duty_roster(
  target_date date,
  target_duty_kind text,
  target_user_ids uuid[],
  target_expected_lock integer default null
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  roster_id uuid;
  curr_roster public.duty_rosters%rowtype;
  uid uuid;
  ord integer := 1;
  u_role text;
  u_kind text;
  doc_count integer := 0;
  tech_count integer := 0;
  total_members integer;
  actor_is_privileged boolean := public.is_department_head() or public.current_is_admin();
  actor_is_active_staff boolean;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  select exists(
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.active and p.account_kind = 'STAFF'
  ) into actor_is_active_staff;
  if not actor_is_privileged and not actor_is_active_staff then
    raise exception using errcode='42501', message='Only active staff, department head or admin can save duty roster';
  end if;
  if target_duty_kind not in ('WEEKDAY_LUNCH', 'WEEKDAY_AFTERNOON', 'WEEKDAY_NIGHT', 'HOLIDAY_24H') then
    raise exception using errcode='22023', message='Invalid duty kind';
  end if;
  total_members := coalesce(array_length(target_user_ids, 1), 0);
  if total_members <> 2 then raise exception using errcode='22023', message='Duty roster must have exactly 2 members'; end if;
  if target_user_ids[1] = target_user_ids[2] then raise exception using errcode='22023', message='Roster members must be distinct'; end if;
  if not actor_is_privileged and not auth.uid() = any(target_user_ids) then
    raise exception using errcode='42501', message='Staff can only self-assign to a duty roster';
  end if;

  foreach uid in array target_user_ids loop
    select business_role, account_kind into u_role, u_kind from public.profiles where user_id = uid and active = true;
    if not found then raise exception using errcode='22023', message='User profile not found or inactive'; end if;
    if u_kind in ('TEST', 'SYSTEM') then raise exception using errcode='22023', message='TEST and SYSTEM accounts cannot be assigned to roster'; end if;
    if u_role in ('DOCTOR', 'DEPARTMENT_HEAD') then doc_count := doc_count + 1;
    elsif u_role = 'TECHNICIAN' then tech_count := tech_count + 1;
    end if;
  end loop;
  if target_duty_kind in ('WEEKDAY_LUNCH', 'WEEKDAY_NIGHT', 'HOLIDAY_24H') and (doc_count < 1 or tech_count < 1) then
    raise exception using errcode='22023', message='Shift requires 1 Doctor/Head and 1 Technician';
  end if;

  select * into curr_roster from public.duty_rosters
    where business_date = target_date and duty_kind = target_duty_kind and status = 'ACTIVE' for update;
  if curr_roster.id is not null then
    if target_expected_lock is not null and curr_roster.lock_version <> target_expected_lock then raise exception 'Roster changed; reload required'; end if;
    update public.duty_rosters set status = 'SUPERSEDED', updated_at = now() where id = curr_roster.id;
    insert into public.duty_rosters(business_date, duty_kind, status, revision_no, created_by, lock_version)
      values(target_date, target_duty_kind, 'ACTIVE', curr_roster.revision_no + 1, auth.uid(), 1) returning id into roster_id;
  else
    insert into public.duty_rosters(business_date, duty_kind, status, revision_no, created_by, lock_version)
      values(target_date, target_duty_kind, 'ACTIVE', 1, auth.uid(), 1) returning id into roster_id;
  end if;
  foreach uid in array target_user_ids loop
    insert into public.duty_roster_members(roster_id, user_id, member_order) values(roster_id, uid, ord);
    ord := ord + 1;
  end loop;
  perform public.audit_event('DUTY_ROSTER_SAVE', 'duty_roster', roster_id,
    case when curr_roster.id is not null then to_jsonb(curr_roster) end,
    (select to_jsonb(r) from public.duty_rosters r where r.id = roster_id));
  return roster_id;
end $$;

-- Owner-directed operational approval: allow Head to approve OPEN/RETURNED/READY periods.
-- Incomplete input stays visible in audit as APPROVE_INCOMPLETE and the immutable record safeguard remains unchanged.
create or replace function public.approve_period(target_period_id uuid,target_expected_lock integer)
returns void language plpgsql security definer set search_path='' as $$
declare
  p public.register_periods%rowtype;
  before_row jsonb;
  is_complete boolean;
  approval_action text;
begin
  if auth.uid() is null or not public.is_department_head() then
    raise exception using errcode='42501',message='Only department head can approve periods';
  end if;
  select * into p from public.register_periods where id=target_period_id for update;
  if not found or p.status not in ('OPEN','RETURNED','READY_FOR_REVIEW') then raise exception 'Period is not ready for approval'; end if;
  is_complete := public.period_is_complete(p.id);
  approval_action := case when is_complete then 'APPROVE' else 'APPROVE_INCOMPLETE' end;
  before_row := to_jsonb(p);
  update public.register_periods set status='APPROVED',approved_by=auth.uid(),approved_at=now(),returned_reason=null,lock_version=lock_version+1
    where id=p.id and lock_version=target_expected_lock;
  if not found then raise exception 'Period changed; reload required'; end if;
  insert into public.period_actions(period_id,action,actor_user_id,reason)
    values(p.id,approval_action,auth.uid(),case when is_complete then null else 'Owner approval granted with pending obligations' end);
  perform public.audit_event(approval_action,'register_period',p.id,before_row,(select to_jsonb(x) from public.register_periods x where x.id=p.id));
end $$;

revoke all on function public.save_duty_roster(date,text,uuid[],integer), public.approve_period(uuid,integer) from public;
grant execute on function public.save_duty_roster(date,text,uuid[],integer), public.approve_period(uuid,integer) to authenticated;

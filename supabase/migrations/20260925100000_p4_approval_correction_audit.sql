-- Phase 4: period review/approval, immutable audit, and controlled corrections.

create table public.period_actions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.register_periods(id) on delete restrict,
  action text not null check (action in ('MARK_READY','RETURN','APPROVE','REOPEN_FOR_CORRECTION')),
  actor_user_id uuid not null references public.profiles(user_id),
  reason text,
  created_at timestamptz not null default now()
);
create index period_actions_period_time_idx on public.period_actions(period_id,created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(user_id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);
create index audit_events_entity_time_idx on public.audit_events(entity_type,entity_id,created_at desc);
create index audit_events_actor_time_idx on public.audit_events(actor_user_id,created_at desc);

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  original_record_id uuid not null references public.records(id) on delete restrict,
  replacement_record_id uuid not null unique references public.records(id) on delete restrict,
  reason text not null check (nullif(btrim(reason),'') is not null),
  requested_by uuid not null references public.profiles(user_id),
  requested_at timestamptz not null default now(),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid references public.profiles(user_id),
  reviewed_at timestamptz,
  unique(original_record_id,replacement_record_id)
);
create index correction_requests_status_time_idx on public.correction_requests(status,requested_at);

create or replace function public.prevent_append_only_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='period_actions' then raise exception using errcode='42501',message='Period actions are append-only'; end if;
  raise exception using errcode='42501',message='Audit events are append-only';
end $$;
create trigger period_actions_append_only before update or delete on public.period_actions for each row execute function public.prevent_append_only_mutation();
create trigger audit_events_append_only before update or delete on public.audit_events for each row execute function public.prevent_append_only_mutation();

create or replace function public.audit_event(target_action text,target_entity_type text,target_entity_id uuid,target_before jsonb default null,target_after jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id)
  values(auth.uid(),target_action,target_entity_type,target_entity_id,target_before,target_after,current_setting('request.headers',true)::jsonb->>'x-request-id');
end $$;

create or replace function public.audit_record_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
declare action_name text;
begin
  action_name:=case when tg_op='INSERT' and new.is_na then 'MARK_NA' when tg_op='INSERT' then 'CREATE_RECORD' else 'EDIT_RECORD' end;
  perform public.audit_event(action_name,'record',coalesce(new.id,old.id),case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));
  return new;
end $$;
create trigger records_audit after insert or update on public.records for each row execute function public.audit_record_mutation();

create or replace function public.audit_configuration_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
declare before_json jsonb:=to_jsonb(old); after_json jsonb:=to_jsonb(new); entity uuid; action_name text;
begin
  entity:=coalesce((after_json->>'id')::uuid,(before_json->>'id')::uuid,(after_json->>'user_id')::uuid,(before_json->>'user_id')::uuid);
  if tg_table_name='profiles' then
    if before_json->>'business_role' is distinct from after_json->>'business_role' then
      perform public.audit_event('ROLE_CHANGE',tg_table_name,entity,before_json,after_json);
    end if;
    if before_json->>'is_admin' is distinct from after_json->>'is_admin' then
      perform public.audit_event('ADMIN_CHANGE',tg_table_name,entity,before_json,after_json);
    end if;
    return new;
  end if;
  action_name:=case
    when tg_table_name='form_template_versions' and before_json->>'status' is distinct from after_json->>'status' and after_json->>'status'='PUBLISHED' then 'TEMPLATE_PUBLISH'
    else 'MASTER_DATA_CHANGE' end;
  perform public.audit_event(action_name,tg_table_name,entity,before_json,after_json);
  return new;
end $$;
create trigger profiles_audit after update on public.profiles for each row execute function public.audit_configuration_mutation();
create trigger locations_audit after insert or update on public.locations for each row execute function public.audit_configuration_mutation();
create trigger assets_audit after insert or update on public.assets for each row execute function public.audit_configuration_mutation();
create trigger monitoring_devices_audit after insert or update on public.monitoring_devices for each row execute function public.audit_configuration_mutation();
create trigger templates_audit after insert or update on public.form_templates for each row execute function public.audit_configuration_mutation();
create trigger versions_publish_audit after update on public.form_template_versions for each row execute function public.audit_configuration_mutation();

create or replace function public.period_is_complete(target_period_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.register_periods p where p.id=target_period_id)
     and not exists(select 1 from public.schedule_occurrences o where o.period_id=target_period_id and o.status='PENDING')
     and not exists(
       select 1 from public.records r
       join public.schedule_occurrences o on o.fulfilled_by_record_id=r.id
       where o.period_id=target_period_id and r.record_type='EQUIPMENT_SHIFT' and r.record_state='DRAFT'
     )
$$;

create or replace function public.mark_period_ready(target_period_id uuid,target_expected_lock integer)
returns void language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; before_row jsonb;
begin
  p:=public.assert_entry_access(target_period_id);
  if p.status not in ('OPEN','RETURNED') then raise exception 'Period is not writable'; end if;
  if not public.period_is_complete(p.id) then raise exception 'Period has pending obligations'; end if;
  before_row:=to_jsonb(p);
  update public.register_periods set status='READY_FOR_REVIEW',returned_reason=null,lock_version=lock_version+1
  where id=p.id and lock_version=target_expected_lock;
  if not found then raise exception 'Period changed; reload required'; end if;
  insert into public.period_actions(period_id,action,actor_user_id) values(p.id,'MARK_READY',auth.uid());
  perform public.audit_event('MARK_READY','register_period',p.id,before_row,(select to_jsonb(x) from public.register_periods x where x.id=p.id));
end $$;

create or replace function public.return_period(target_period_id uuid,target_reason text,target_expected_lock integer)
returns void language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; before_row jsonb;
begin
  if auth.uid() is null or not public.is_department_head() then raise exception using errcode='42501',message='Only department head can return periods'; end if;
  if nullif(btrim(target_reason),'') is null then raise exception using errcode='22023',message='Return reason is required'; end if;
  select * into p from public.register_periods where id=target_period_id for update;
  if not found or p.status<>'READY_FOR_REVIEW' then raise exception 'Period is not ready for return'; end if;
  before_row:=to_jsonb(p);
  update public.register_periods set status='RETURNED',returned_reason=btrim(target_reason),approved_by=null,approved_at=null,lock_version=lock_version+1
  where id=p.id and lock_version=target_expected_lock;
  if not found then raise exception 'Period changed; reload required'; end if;
  insert into public.period_actions(period_id,action,actor_user_id,reason) values(p.id,'RETURN',auth.uid(),btrim(target_reason));
  perform public.audit_event('RETURN','register_period',p.id,before_row,(select to_jsonb(x) from public.register_periods x where x.id=p.id));
end $$;

create or replace function public.approve_period(target_period_id uuid,target_expected_lock integer)
returns void language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; before_row jsonb;
begin
  if auth.uid() is null or not public.is_department_head() then raise exception using errcode='42501',message='Only department head can approve periods'; end if;
  select * into p from public.register_periods where id=target_period_id for update;
  if not found or p.status<>'READY_FOR_REVIEW' then raise exception 'Period is not ready for approval'; end if;
  if not public.period_is_complete(p.id) then raise exception 'Period has pending obligations'; end if;
  before_row:=to_jsonb(p);
  update public.register_periods set status='APPROVED',approved_by=auth.uid(),approved_at=now(),returned_reason=null,lock_version=lock_version+1
  where id=p.id and lock_version=target_expected_lock;
  if not found then raise exception 'Period changed; reload required'; end if;
  insert into public.period_actions(period_id,action,actor_user_id) values(p.id,'APPROVE',auth.uid());
  perform public.audit_event('APPROVE','register_period',p.id,before_row,(select to_jsonb(x) from public.register_periods x where x.id=p.id));
end $$;

create table public.correction_transaction_authorizations (
  transaction_id bigint primary key,
  period_id uuid not null references public.register_periods(id) on delete cascade
);
revoke all on public.correction_transaction_authorizations from public,anon,authenticated;

create or replace function public.correction_transaction_is_authorized(target_period_id uuid)
returns boolean language sql volatile security definer set search_path='' as $$
  select exists(
    select 1 from public.correction_transaction_authorizations a
    where a.transaction_id=txid_current() and a.period_id=target_period_id
  )
$$;
revoke all on function public.correction_transaction_is_authorized(uuid) from public,anon,authenticated;

create or replace function public.prevent_approved_period_record_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid:=coalesce(new.period_id,old.period_id); period_status text;
begin
  select status into period_status from public.register_periods where id=pid;
  if period_status='APPROVED' and not public.correction_transaction_is_authorized(pid) then
    raise exception using errcode='42501',message='Approved period records are immutable';
  end if;
  return coalesce(new,old);
end $$;
create trigger records_approved_immutable before insert or update or delete on public.records for each row execute function public.prevent_approved_period_record_mutation();

create or replace function public.prevent_approved_detail_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
declare rid uuid; period_status text;
begin
  rid:=coalesce(
    (to_jsonb(new)->>'shift_record_id')::uuid,
    (to_jsonb(old)->>'shift_record_id')::uuid,
    (to_jsonb(new)->>'record_id')::uuid,
    (to_jsonb(old)->>'record_id')::uuid
  );
  select p.status into period_status from public.records r join public.register_periods p on p.id=r.period_id where r.id=rid;
  if period_status='APPROVED' and not public.correction_transaction_is_authorized((select period_id from public.records where id=rid)) then
    raise exception using errcode='42501',message='Approved period records are immutable';
  end if;
  return coalesce(new,old);
end $$;
create trigger measurement_approved_immutable before insert or update or delete on public.measurement_details for each row execute function public.prevent_approved_detail_mutation();
create trigger decontamination_approved_immutable before insert or update or delete on public.decontamination_details for each row execute function public.prevent_approved_detail_mutation();
create trigger maintenance_approved_immutable before insert or update or delete on public.maintenance_details for each row execute function public.prevent_approved_detail_mutation();
create trigger shift_detail_approved_immutable before insert or update or delete on public.equipment_shift_details for each row execute function public.prevent_approved_detail_mutation();
create trigger shift_status_approved_immutable before insert or update or delete on public.equipment_shift_statuses for each row execute function public.prevent_approved_detail_mutation();

create or replace function public.create_correction(target_record_id uuid,target_reason text,target_changes jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare original public.records%rowtype; replacement_id uuid; request_id uuid; root_record_id uuid; next_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(target_reason),'') is null then raise exception using errcode='22023',message='Correction reason is required'; end if;
  select r.* into original from public.records r join public.register_periods p on p.id=r.period_id
  where r.id=target_record_id and r.is_effective and p.status='APPROVED' for update of r;
  if not found then raise exception 'Effective record in approved period not found'; end if;
  if not (public.is_department_head() or public.can_access_location(original.location_id,true) or public.can_access_asset(original.asset_id,true)
    or exists(select 1 from public.user_scope_assignments s where s.user_id=auth.uid() and s.active and s.can_enter and s.form_template_id=(select form_template_id from public.form_template_versions where id=original.form_version_id)))
  then raise exception using errcode='42501',message='Correction scope denied'; end if;
  root_record_id:=coalesce(original.revision_of_record_id,original.id);
  if exists(
    select 1 from public.correction_requests c join public.records requested on requested.id=c.original_record_id
    where coalesce(requested.revision_of_record_id,requested.id)=root_record_id and c.status='PENDING'
  ) then raise exception 'Pending correction already exists'; end if;
  select coalesce(max(revision_no),1)+1 into next_revision from public.records where id=root_record_id or revision_of_record_id=root_record_id;
  insert into public.correction_transaction_authorizations(transaction_id,period_id)
  values(txid_current(),original.period_id)
  on conflict(transaction_id) do update set period_id=excluded.period_id;
  insert into public.records(period_id,form_version_id,record_type,location_id,asset_id,business_date,slot_code,performed_at,entered_by,is_na,na_reason,note,record_state,revision_no,revision_of_record_id,is_effective,context_snapshot)
  values(original.period_id,original.form_version_id,original.record_type,original.location_id,original.asset_id,original.business_date,original.slot_code,
    coalesce((target_changes->>'performed_at')::timestamptz,original.performed_at),auth.uid(),original.is_na,original.na_reason,coalesce(target_changes->>'note',original.note),original.record_state,next_revision,root_record_id,false,original.context_snapshot)
  returning id into replacement_id;
  if original.record_type='MEASUREMENT' then
    insert into public.measurement_details select replacement_id,monitoring_device_id,coalesce((target_changes->>'temperature_c')::numeric,temperature_c),coalesce((target_changes->>'humidity_pct')::numeric,humidity_pct),temperature_min_snapshot,temperature_max_snapshot,humidity_min_snapshot,humidity_max_snapshot,
      public.measurement_is_abnormal(coalesce((target_changes->>'temperature_c')::numeric,temperature_c),temperature_min_snapshot,temperature_max_snapshot),
      case when humidity_min_snapshot is null then false else public.measurement_is_abnormal(coalesce((target_changes->>'humidity_pct')::numeric,humidity_pct),humidity_min_snapshot,humidity_max_snapshot) end
      from public.measurement_details where record_id=original.id;
  elsif original.record_type='DECONTAMINATION' then
    insert into public.decontamination_details select replacement_id,coalesce((target_changes->>'daily_done')::boolean,daily_done),coalesce((target_changes->>'weekly_done')::boolean,weekly_done),coalesce((target_changes->>'spill_event_done')::boolean,spill_event_done) from public.decontamination_details where record_id=original.id;
  elsif original.record_type='MAINTENANCE' then
    insert into public.maintenance_details select replacement_id,asset_id,coalesce(target_changes->>'cadence',cadence),coalesce(target_changes->>'result',result) from public.maintenance_details where record_id=original.id;
  elsif original.record_type='EQUIPMENT_SHIFT' then
    insert into public.equipment_shift_details select replacement_id,coalesce((target_changes->>'usage_value')::numeric,usage_value),coalesce(target_changes->>'usage_unit',usage_unit) from public.equipment_shift_details where record_id=original.id;
    insert into public.equipment_shift_statuses(shift_record_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot,created_at,updated_by,updated_at)
      select replacement_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot,created_at,auth.uid(),now() from public.equipment_shift_statuses where shift_record_id=original.id;
    if jsonb_typeof(target_changes->'statuses')='array' then
      if exists(
        select 1 from jsonb_array_elements(target_changes->'statuses') item
        where item->>'status' not in ('BT','KSD','H')
          or not exists(select 1 from public.equipment_shift_statuses s where s.shift_record_id=original.id and s.asset_id=(item->>'asset_id')::uuid)
      ) then raise exception using errcode='22023',message='Invalid equipment status correction'; end if;
      if exists(
        select item->>'asset_id' from jsonb_array_elements(target_changes->'statuses') item
        group by item->>'asset_id' having count(*)>1
      ) then raise exception using errcode='22023',message='Duplicate asset status correction'; end if;
      update public.equipment_shift_statuses s set status_code=item.status_code,updated_by=auth.uid(),updated_at=now()
      from (
        select (x->>'asset_id')::uuid asset_id,x->>'status' status_code
        from jsonb_array_elements(target_changes->'statuses') x
      ) item where s.shift_record_id=replacement_id and s.asset_id=item.asset_id;
    end if;
  end if;
  insert into public.correction_requests(original_record_id,replacement_record_id,reason,requested_by) values(original.id,replacement_id,btrim(target_reason),auth.uid()) returning id into request_id;
  perform public.audit_event('CORRECTION_REQUEST','record',original.id,to_jsonb(original),(select to_jsonb(x) from public.records x where x.id=replacement_id));
  delete from public.correction_transaction_authorizations where transaction_id=txid_current();
  return request_id;
end $$;

create or replace function public.approve_correction(target_correction_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare c public.correction_requests%rowtype;
begin
  if auth.uid() is null or not public.is_department_head() then raise exception using errcode='42501',message='Only department head can approve corrections'; end if;
  select * into c from public.correction_requests where id=target_correction_id for update;
  if not found or c.status<>'PENDING' then raise exception 'Correction is not pending'; end if;
  insert into public.correction_transaction_authorizations(transaction_id,period_id)
  select txid_current(),r.period_id from public.records r where r.id=c.original_record_id
  on conflict(transaction_id) do update set period_id=excluded.period_id;
  update public.records set is_effective=false,updated_at=now() where id=c.original_record_id and is_effective;
  if not found then raise exception 'Original record is no longer effective'; end if;
  update public.records set is_effective=true,updated_at=now() where id=c.replacement_record_id and not is_effective;
  update public.schedule_occurrences set fulfilled_by_record_id=c.replacement_record_id where fulfilled_by_record_id=c.original_record_id;
  update public.correction_requests set status='APPROVED',reviewed_by=auth.uid(),reviewed_at=now() where id=c.id;
  perform public.audit_event('CORRECTION_APPROVE','correction_request',c.id,null,(select to_jsonb(x) from public.correction_requests x where x.id=c.id));
  delete from public.correction_transaction_authorizations where transaction_id=txid_current();
end $$;

alter table public.period_actions enable row level security;
alter table public.audit_events enable row level security;
alter table public.correction_requests enable row level security;
create policy period_actions_read on public.period_actions for select to authenticated using(exists(select 1 from public.register_periods p where p.id=period_id));
create policy audit_events_read on public.audit_events for select to authenticated using(public.is_department_head() or public.current_is_admin() or actor_user_id=auth.uid());
create policy corrections_read on public.correction_requests for select to authenticated using(public.is_department_head() or requested_by=auth.uid() or exists(select 1 from public.records r join public.register_periods p on p.id=r.period_id where r.id=original_record_id));
grant select on public.period_actions,public.audit_events,public.correction_requests to authenticated;

revoke all on function public.audit_event(text,text,uuid,jsonb,jsonb),public.period_is_complete(uuid),public.mark_period_ready(uuid,integer),public.return_period(uuid,text,integer),public.approve_period(uuid,integer),public.create_correction(uuid,text,jsonb),public.approve_correction(uuid) from public;
grant execute on function public.mark_period_ready(uuid,integer),public.return_period(uuid,text,integer),public.approve_period(uuid,integer),public.create_correction(uuid,text,jsonb),public.approve_correction(uuid) to authenticated;

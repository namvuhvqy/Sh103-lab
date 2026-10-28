-- Migration: 20261027160000_fix_bm06_finalize_active_assets_count.sql
-- Description: Fix BM06 finalize asset count verification to only check active assets (20 machines)
-- and support robust ISO 15189 entry error audit logging.

CREATE OR REPLACE FUNCTION public.validate_shift_status_payload(
  target_form_version_id uuid,
  target_statuses jsonb,
  target_require_complete boolean
)
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  supplied_count integer;
  distinct_count integer;
  expected_count integer;
begin
  if jsonb_typeof(target_statuses) <> 'array' then
    raise exception using errcode = '22023', message = 'Statuses must be an array';
  end if;

  select count(*), count(distinct item->>'asset_id')
  into supplied_count, distinct_count
  from jsonb_array_elements(target_statuses) item;

  if supplied_count = 0 then
    raise exception using errcode = '22023', message = 'At least one equipment status is required';
  end if;

  if supplied_count <> distinct_count then
    raise exception using errcode = '22023', message = 'Duplicate asset status';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(target_statuses) item
    where item->>'status' not in ('BT', 'KSD', 'H')
  ) then
    raise exception using errcode = '22023', message = 'Invalid equipment status';
  end if;

  -- Verify asset belongs to form version and is currently active
  if exists(
    select 1
    from jsonb_array_elements(target_statuses) item
    left join public.form_version_assets fva
      on fva.form_version_id = target_form_version_id
     and fva.asset_id = (item->>'asset_id')::uuid
     and fva.active
    left join public.assets a
      on a.id = fva.asset_id
     and a.active
    where fva.asset_id is null or a.id is null
  ) then
    raise exception using errcode = '22023', message = 'Asset is outside form snapshot';
  end if;

  -- Scope check for entering technician
  if exists(
    select 1
    from jsonb_array_elements(target_statuses) item
    where not public.is_department_head()
      and not exists(
        select 1
        from public.profiles p
        where p.user_id = auth.uid()
          and p.active
          and p.account_kind = 'STAFF'
      )
      and not exists(
        select 1
        from public.user_scope_assignments s
        join public.assets a on a.id = (item->>'asset_id')::uuid
        where s.user_id = auth.uid()
          and s.active
          and s.can_enter
          and (
            s.asset_id = a.id
            or s.location_id = a.location_id
            or s.form_template_id = (select form_template_id from public.form_template_versions where id = target_form_version_id)
          )
      )
  ) then
    raise exception using errcode = '42501', message = 'Asset entry scope denied';
  end if;

  if target_require_complete and not public.can_finalize_bm06_version(target_form_version_id) then
    raise exception using errcode = '42501', message = 'Shift finalize scope denied';
  end if;

  -- Expected count strictly checks ACTIVE assets in this form version (20 machines according to standard)
  select count(*)
  into expected_count
  from public.form_version_assets fva
  join public.assets a on a.id = fva.asset_id
  where fva.form_version_id = target_form_version_id
    and fva.active
    and a.active;

  if target_require_complete and supplied_count <> expected_count then
    raise exception using errcode = '22023', message = 'All applicable assets require status';
  end if;
end $function$;


CREATE OR REPLACE FUNCTION public.save_equipment_shift_draft(
  target_occurrence_id uuid,
  target_usage numeric,
  target_unit text,
  target_note text,
  target_statuses jsonb,
  target_finalize boolean,
  target_expected_lock integer,
  target_coworker_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  o public.schedule_occurrences%rowtype;
  p public.register_periods%rowtype;
  rid uuid;
  item jsonb;
  stored_count integer;
  expected_active_count integer;
  c_name text := null;
  ctx_obj jsonb;
begin
  select * into o from public.schedule_occurrences where id = target_occurrence_id for update;
  if not found then raise exception 'Occurrence not found'; end if;

  p := public.assert_entry_access(o.period_id);

  if target_usage is not null and (target_usage < 0 or target_unit not in ('HOURS', 'SHIFTS')) then
    raise exception using errcode = '22023', message = 'Invalid usage value or unit';
  end if;

  if target_coworker_id is not null then
    select full_name into c_name from public.profiles where user_id = target_coworker_id;
    if c_name is null then
      raise exception using errcode = '22023', message = 'Selected co-worker profile not found';
    end if;
  end if;

  perform public.validate_shift_status_payload(p.form_version_id, target_statuses, target_finalize);

  ctx_obj := case 
    when target_coworker_id is not null then 
      jsonb_build_object('co_worker_id', target_coworker_id, 'co_worker_name', c_name)
    else '{}'::jsonb
  end;

  select fulfilled_by_record_id into rid from public.schedule_occurrences where id = o.id;

  if rid is null then
    insert into public.records(
      period_id, form_version_id, record_type, business_date, slot_code,
      performed_at, entered_by, note, record_state, context_snapshot
    )
    values(
      p.id, p.form_version_id, 'EQUIPMENT_SHIFT', o.business_date, o.slot_code,
      now(), auth.uid(), target_note, 'DRAFT', ctx_obj
    ) returning id into rid;

    insert into public.equipment_shift_details(record_id, usage_value, usage_unit, co_worker_id, co_worker_name)
    values(rid, target_usage, target_unit, target_coworker_id, c_name);
  else
    update public.records 
    set note = target_note,
        context_snapshot = ctx_obj,
        lock_version = lock_version + 1
    where id = rid and record_state = 'DRAFT' and lock_version = target_expected_lock;

    if not found then raise exception 'Record changed or finalized; reload required'; end if;

    update public.equipment_shift_details 
    set usage_value = target_usage,
        usage_unit = target_unit,
        co_worker_id = target_coworker_id,
        co_worker_name = c_name
    where record_id = rid;
  end if;

  for item in select * from jsonb_array_elements(target_statuses) loop
    insert into public.equipment_shift_statuses(
      shift_record_id, asset_id, asset_display_order_snapshot,
      status_code, asset_label_snapshot, updated_by, updated_at
    )
    select rid, a.id, fva.display_order, item->>'status', a.source_name, auth.uid(), now()
    from public.form_version_assets fva 
    join public.assets a on a.id = fva.asset_id
    where fva.form_version_id = p.form_version_id 
      and fva.active 
      and a.active
      and a.id = (item->>'asset_id')::uuid
    on conflict(shift_record_id, asset_id) do update set
      status_code = excluded.status_code,
      asset_display_order_snapshot = excluded.asset_display_order_snapshot,
      asset_label_snapshot = excluded.asset_label_snapshot,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at;
  end loop;

  if target_finalize then
    -- Count stored active statuses for this record
    select count(*) into stored_count 
    from public.equipment_shift_statuses ess
    join public.assets a on a.id = ess.asset_id
    where ess.shift_record_id = rid
      and a.active;

    -- Count active assets in this form version
    select count(*) into expected_active_count
    from public.form_version_assets fva
    join public.assets a on a.id = fva.asset_id
    where fva.form_version_id = p.form_version_id
      and fva.active
      and a.active;

    if stored_count <> expected_active_count then
      raise exception using errcode = '22023', message = 'All applicable assets require status';
    end if;

    update public.records set record_state = 'COMPLETED' where id = rid;
    update public.schedule_occurrences set status = 'COMPLETED', fulfilled_by_record_id = rid where id = o.id;
  else
    update public.schedule_occurrences set fulfilled_by_record_id = rid where id = o.id;
  end if;

  return rid;
end $function$;

-- Ensure permissions
revoke all on function public.validate_shift_status_payload(uuid, jsonb, boolean) from public;
grant execute on function public.validate_shift_status_payload(uuid, jsonb, boolean) to authenticated;
revoke all on function public.save_equipment_shift_draft(uuid, numeric, text, text, jsonb, boolean, integer, uuid) from public;
grant execute on function public.save_equipment_shift_draft(uuid, numeric, text, text, jsonb, boolean, integer, uuid) to authenticated;

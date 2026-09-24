-- Preserve the latest authenticated contributor and update time per BM.06 asset status.
alter table public.equipment_shift_statuses
  add column updated_by uuid references public.profiles(user_id),
  add column updated_at timestamptz not null default now();

create or replace function public.save_equipment_shift_draft(target_occurrence_id uuid,target_usage numeric,target_unit text,target_note text,target_statuses jsonb,target_finalize boolean,target_expected_lock integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; rid uuid; item jsonb; stored_count integer;
begin
 select * into o from public.schedule_occurrences where id=target_occurrence_id for update;
 if not found then raise exception 'Occurrence not found'; end if;
 p:=public.assert_entry_access(o.period_id);
 if target_usage is null or target_usage<0 or target_unit not in ('HOURS','SHIFTS') then raise exception using errcode='22023',message='Usage value and unit are required'; end if;
 perform public.validate_shift_status_payload(p.form_version_id,target_statuses,target_finalize);
 select fulfilled_by_record_id into rid from public.schedule_occurrences where id=o.id;
 if rid is null then
  insert into public.records(period_id,form_version_id,record_type,business_date,slot_code,performed_at,entered_by,note,record_state)
  values(p.id,p.form_version_id,'EQUIPMENT_SHIFT',o.business_date,o.slot_code,now(),auth.uid(),target_note,'DRAFT') returning id into rid;
  insert into public.equipment_shift_details values(rid,target_usage,target_unit);
 else
  update public.records set note=target_note,lock_version=lock_version+1 where id=rid and record_state='DRAFT' and lock_version=target_expected_lock;
  if not found then raise exception 'Record changed or finalized; reload required'; end if;
  update public.equipment_shift_details set usage_value=target_usage,usage_unit=target_unit where record_id=rid;
 end if;
 for item in select * from jsonb_array_elements(target_statuses) loop
  insert into public.equipment_shift_statuses(shift_record_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot,updated_by,updated_at)
  select rid,a.id,fva.display_order,item->>'status',a.source_name,auth.uid(),now()
  from public.form_version_assets fva join public.assets a on a.id=fva.asset_id
  where fva.form_version_id=p.form_version_id and fva.active and a.id=(item->>'asset_id')::uuid
  on conflict(shift_record_id,asset_id) do update set
    status_code=excluded.status_code,
    asset_display_order_snapshot=excluded.asset_display_order_snapshot,
    asset_label_snapshot=excluded.asset_label_snapshot,
    updated_by=excluded.updated_by,
    updated_at=excluded.updated_at;
 end loop;
 if target_finalize then
  select count(*) into stored_count from public.equipment_shift_statuses where shift_record_id=rid;
  if stored_count<>(select count(*) from public.form_version_assets where form_version_id=p.form_version_id and active) then raise exception using errcode='22023',message='All applicable assets require status'; end if;
  update public.records set record_state='COMPLETED' where id=rid;
  update public.schedule_occurrences set status='COMPLETED',fulfilled_by_record_id=rid where id=o.id;
 else
  update public.schedule_occurrences set fulfilled_by_record_id=rid where id=o.id;
 end if;
 return rid;
end $$;

-- Preserve each KNBM action and allow independent BM.06 area drafts.

create table public.decontamination_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.decontamination_details(record_id) on delete cascade,
  activity_type text not null check (activity_type in ('DAILY','WEEKLY','SPILL')),
  performed_by uuid not null references public.profiles(user_id),
  performed_at timestamptz not null default now(),
  note text
);
create index decontamination_events_record_time_idx on public.decontamination_events(record_id,performed_at);
alter table public.decontamination_events enable row level security;
create policy decontamination_events_read on public.decontamination_events for select to authenticated
using(exists(select 1 from public.records r where r.id=record_id));
grant select on public.decontamination_events to authenticated;

create or replace function public.save_decontamination_record(target_period_id uuid,target_business_date date,target_daily boolean,target_weekly boolean,target_spill boolean,target_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; rid uuid;
begin
 p:=public.assert_entry_access(target_period_id);
 if not(target_daily or target_weekly or target_spill) then raise exception 'At least one activity required'; end if;
 select id into rid from public.records where period_id=p.id and business_date=target_business_date and record_type='DECONTAMINATION' and is_effective and is_na=false for update;
 if rid is null then
  insert into public.records(period_id,form_version_id,record_type,location_id,business_date,performed_at,entered_by,note,record_state)
  values(p.id,p.form_version_id,'DECONTAMINATION',p.location_id,target_business_date,now(),auth.uid(),target_note,'COMPLETED') returning id into rid;
  insert into public.decontamination_details values(rid,target_daily,target_weekly,target_spill);
 else
  update public.records set note=coalesce(target_note,note),lock_version=lock_version+1 where id=rid;
  update public.decontamination_details set daily_done=daily_done or target_daily,weekly_done=weekly_done or target_weekly,spill_event_done=spill_event_done or target_spill where record_id=rid;
 end if;
 if target_daily then insert into public.decontamination_events(record_id,activity_type,performed_by,note) values(rid,'DAILY',auth.uid(),target_note); end if;
 if target_weekly then insert into public.decontamination_events(record_id,activity_type,performed_by,note) values(rid,'WEEKLY',auth.uid(),target_note); end if;
 if target_spill then insert into public.decontamination_events(record_id,activity_type,performed_by,note) values(rid,'SPILL',auth.uid(),target_note); end if;
 update public.schedule_occurrences o set status='COMPLETED',fulfilled_by_record_id=rid
 from public.form_schedule_rules r
 where o.schedule_rule_id=r.id and o.period_id=p.id and o.status='PENDING'
 and ((r.schedule_type='DAILY' and target_daily and o.business_date=target_business_date)
 or (r.schedule_type='WEEKLY_ONCE' and target_weekly and target_business_date between (o.window_start at time zone 'Asia/Ho_Chi_Minh')::date and ((o.window_end-interval '1 second') at time zone 'Asia/Ho_Chi_Minh')::date));
 return rid;
end $$;

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
  if target_finalize then
   update public.records set note=target_note,lock_version=lock_version+1 where id=rid and record_state='DRAFT' and lock_version=target_expected_lock;
   if not found then raise exception 'Record changed or finalized; reload required'; end if;
  else
   update public.records set note=coalesce(target_note,note),lock_version=lock_version+1 where id=rid and record_state='DRAFT';
   if not found then raise exception 'Record finalized; reload required'; end if;
  end if;
  update public.equipment_shift_details set usage_value=target_usage,usage_unit=target_unit where record_id=rid;
 end if;
 for item in select * from jsonb_array_elements(target_statuses) loop
  insert into public.equipment_shift_statuses(shift_record_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot,updated_by,updated_at)
  select rid,a.id,fva.display_order,item->>'status',a.source_name,auth.uid(),now()
  from public.form_version_assets fva join public.assets a on a.id=fva.asset_id
  where fva.form_version_id=p.form_version_id and fva.active and a.id=(item->>'asset_id')::uuid
  on conflict(shift_record_id,asset_id) do update set status_code=excluded.status_code,asset_display_order_snapshot=excluded.asset_display_order_snapshot,asset_label_snapshot=excluded.asset_label_snapshot,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
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

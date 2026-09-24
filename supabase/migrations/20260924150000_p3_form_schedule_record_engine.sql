-- Phase 3: bounded form/register/schedule engine for six locked forms.

create table public.form_template_versions (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references public.form_templates(id),
  version_label text not null,
  status text not null check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  effective_from date,
  effective_to date,
  config_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(form_template_id,version_label),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);
create index form_template_versions_template_status_idx on public.form_template_versions(form_template_id,status);

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null,
  required boolean not null default false,
  unit text,
  normal_min numeric,
  normal_max numeric,
  display_order integer not null,
  config_json jsonb not null default '{}'::jsonb,
  unique(form_version_id,field_key),
  unique(form_version_id,display_order),
  check (normal_max is null or normal_min is null or normal_max >= normal_min)
);

create table public.form_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  schedule_type text not null check (schedule_type in ('SLOT_DAILY','DAILY','WEEKLY_ONCE','MONTHLY_ONCE','EVENT')),
  slot_code text,
  local_start_time time,
  local_end_time time,
  ends_next_day boolean not null default false,
  target_count integer not null default 1 check (target_count > 0),
  display_order integer not null,
  config_json jsonb not null default '{}'::jsonb,
  unique(form_version_id,display_order)
);

create table public.form_version_assets (
  form_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  display_order integer not null,
  active boolean not null default true,
  primary key(form_version_id,asset_id),
  unique(form_version_id,display_order)
);

create table public.form_version_locations (
  form_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  active boolean not null default true,
  primary key(form_version_id,location_id)
);

create table public.register_periods (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_template_versions(id),
  location_id uuid references public.locations(id),
  asset_id uuid references public.assets(id),
  period_start date not null,
  period_end date not null,
  period_label text,
  book_number text,
  status text not null default 'OPEN' check (status in ('OPEN','READY_FOR_REVIEW','RETURNED','APPROVED')),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lock_version integer not null default 1,
  approved_by uuid references public.profiles(user_id),
  approved_at timestamptz,
  returned_reason text,
  check (period_end >= period_start)
);
create unique index register_periods_identity_idx on public.register_periods(
  form_version_id,coalesce(location_id,'00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(asset_id,'00000000-0000-0000-0000-000000000000'::uuid),period_start,period_end
);
create index register_periods_date_idx on public.register_periods(form_version_id,period_start,period_end);
create index register_periods_status_idx on public.register_periods(status);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.register_periods(id),
  form_version_id uuid not null references public.form_template_versions(id),
  record_type text not null check (record_type in ('MEASUREMENT','DECONTAMINATION','MAINTENANCE','EQUIPMENT_SHIFT')),
  location_id uuid references public.locations(id),
  asset_id uuid references public.assets(id),
  business_date date not null,
  slot_code text,
  performed_at timestamptz,
  entered_at timestamptz not null default now(),
  entered_by uuid not null references public.profiles(user_id),
  is_na boolean not null default false,
  na_reason text,
  note text,
  record_state text not null default 'DRAFT' check (record_state in ('DRAFT','COMPLETED','N_A')),
  revision_no integer not null default 1 check (revision_no > 0),
  revision_of_record_id uuid references public.records(id),
  is_effective boolean not null default true,
  context_snapshot jsonb not null default '{}'::jsonb,
  lock_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint records_na_reason_check check (not is_na or nullif(btrim(na_reason),'') is not null)
);
create index records_period_idx on public.records(period_id);
create index records_actor_time_idx on public.records(entered_by,entered_at);
create index records_asset_date_idx on public.records(asset_id,business_date);
create index records_location_date_idx on public.records(location_id,business_date);
create index records_effective_idx on public.records(is_effective) where is_effective=true;
create unique index records_decontamination_day_idx on public.records(period_id,business_date) where record_type='DECONTAMINATION' and is_effective=true and is_na=false;

create table public.schedule_occurrences (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.register_periods(id) on delete cascade,
  schedule_rule_id uuid not null references public.form_schedule_rules(id),
  business_date date,
  window_start timestamptz not null,
  window_end timestamptz not null,
  slot_code text,
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','N_A')),
  fulfilled_by_record_id uuid references public.records(id),
  created_at timestamptz not null default now(),
  check (window_end > window_start)
);
create unique index schedule_occurrences_identity_idx on public.schedule_occurrences(
  period_id,schedule_rule_id,coalesce(business_date,'0001-01-01'::date),window_start,coalesce(slot_code,'')
);
create index schedule_occurrences_period_date_idx on public.schedule_occurrences(period_id,business_date);
create index schedule_occurrences_status_idx on public.schedule_occurrences(status);
create index schedule_occurrences_record_idx on public.schedule_occurrences(fulfilled_by_record_id);

create table public.measurement_details (
  record_id uuid primary key references public.records(id) on delete cascade,
  monitoring_device_id uuid references public.monitoring_devices(id),
  temperature_c numeric,
  humidity_pct numeric,
  temperature_min_snapshot numeric,
  temperature_max_snapshot numeric,
  humidity_min_snapshot numeric,
  humidity_max_snapshot numeric,
  temperature_abnormal boolean not null default false,
  humidity_abnormal boolean not null default false
);

create table public.decontamination_details (
  record_id uuid primary key references public.records(id) on delete cascade,
  daily_done boolean not null default false,
  weekly_done boolean not null default false,
  spill_event_done boolean not null default false,
  check (daily_done or weekly_done or spill_event_done)
);

create table public.maintenance_details (
  record_id uuid primary key references public.records(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  cadence text not null check (cadence in ('DAILY','WEEKLY','MONTHLY')),
  result text not null check (result in ('PASS','FAIL'))
);

create table public.equipment_shift_details (
  record_id uuid primary key references public.records(id) on delete cascade,
  usage_value numeric,
  usage_unit text check (usage_unit in ('HOURS','SHIFTS')),
  check (usage_value is null or usage_value >= 0)
);

create table public.equipment_shift_statuses (
  id uuid primary key default gen_random_uuid(),
  shift_record_id uuid not null references public.equipment_shift_details(record_id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  asset_display_order_snapshot integer not null,
  status_code text not null check (status_code in ('BT','KSD','H')),
  asset_label_snapshot text not null,
  created_at timestamptz not null default now(),
  unique(shift_record_id,asset_id),
  unique(shift_record_id,asset_display_order_snapshot)
);
create index equipment_shift_statuses_shift_idx on public.equipment_shift_statuses(shift_record_id);
create index equipment_shift_statuses_asset_status_idx on public.equipment_shift_statuses(asset_id,status_code);

create trigger form_template_versions_set_updated_at before update on public.register_periods for each row execute function public.set_updated_at();
create trigger records_set_updated_at before update on public.records for each row execute function public.set_updated_at();

create or replace function public.prevent_published_version_mutation() returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='PUBLISHED' then raise exception 'Published form versions are immutable'; end if;
  return new;
end $$;
create trigger prevent_published_version_update before update or delete on public.form_template_versions for each row execute function public.prevent_published_version_mutation();

create or replace function public.prevent_published_config_mutation() returns trigger language plpgsql set search_path='' as $$
declare target_version uuid:=coalesce(old.form_version_id,new.form_version_id); published boolean;
begin
 select status='PUBLISHED' into published from public.form_template_versions where id=target_version;
 if published then raise exception 'Published form configuration is immutable'; end if;
 return coalesce(new,old);
end $$;
create trigger prevent_published_fields_mutation before update or delete on public.form_fields for each row execute function public.prevent_published_config_mutation();
create trigger prevent_published_rules_mutation before update or delete on public.form_schedule_rules for each row execute function public.prevent_published_config_mutation();
create trigger prevent_published_assets_mutation before update or delete on public.form_version_assets for each row execute function public.prevent_published_config_mutation();
create trigger prevent_published_locations_mutation before update or delete on public.form_version_locations for each row execute function public.prevent_published_config_mutation();

create or replace function public.measurement_is_abnormal(value numeric, minimum numeric, maximum numeric)
returns boolean language sql immutable set search_path='' as $$ select value is not null and (value < minimum or value > maximum) $$;

create or replace function public.create_or_get_period(
  target_form_version_id uuid,target_location_id uuid,target_asset_id uuid,
  target_start date,target_end date,target_label text default null,target_book text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; version_status text;
begin
  select status into version_status from public.form_template_versions where id=target_form_version_id;
  if version_status <> 'PUBLISHED' then raise exception 'Only published versions can create periods'; end if;
  insert into public.register_periods(form_version_id,location_id,asset_id,period_start,period_end,period_label,book_number,created_by)
  values(target_form_version_id,target_location_id,target_asset_id,target_start,target_end,target_label,target_book,auth.uid())
  on conflict (form_version_id,(coalesce(location_id,'00000000-0000-0000-0000-000000000000'::uuid)),(coalesce(asset_id,'00000000-0000-0000-0000-000000000000'::uuid)),period_start,period_end)
  do update set period_label=coalesce(public.register_periods.period_label,excluded.period_label)
  returning id into result_id;
  return result_id;
end $$;

create or replace function public.generate_period_occurrences(target_period_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; r record; d date; ws timestamptz; we timestamptz; inserted_count integer:=0; week_start date; month_start date;
begin
  select * into p from public.register_periods where id=target_period_id;
  if not found then raise exception 'Period not found'; end if;
  for r in select * from public.form_schedule_rules where form_version_id=p.form_version_id order by display_order loop
    if r.schedule_type in ('SLOT_DAILY','DAILY') then
      for d in select generate_series(p.period_start,p.period_end,'1 day')::date loop
        ws := (d::timestamp + coalesce(r.local_start_time,'00:00'::time)) at time zone 'Asia/Ho_Chi_Minh';
        we := ((d + case when r.ends_next_day then 1 else 0 end)::timestamp + coalesce(r.local_end_time,'23:59:59'::time)) at time zone 'Asia/Ho_Chi_Minh';
        insert into public.schedule_occurrences(period_id,schedule_rule_id,business_date,window_start,window_end,slot_code)
        values(p.id,r.id,d,ws,we,r.slot_code) on conflict do nothing;
        inserted_count:=inserted_count+case when found then 1 else 0 end;
      end loop;
    elsif r.schedule_type='WEEKLY_ONCE' then
      week_start:=date_trunc('week',p.period_start)::date;
      while week_start<=p.period_end loop
        ws := greatest(week_start,p.period_start)::timestamp at time zone 'Asia/Ho_Chi_Minh';
        we := (least(week_start+6,p.period_end)+1)::timestamp at time zone 'Asia/Ho_Chi_Minh';
        insert into public.schedule_occurrences(period_id,schedule_rule_id,business_date,window_start,window_end,slot_code)
        values(p.id,r.id,null,ws,we,r.slot_code) on conflict do nothing;
        inserted_count:=inserted_count+case when found then 1 else 0 end; week_start:=week_start+7;
      end loop;
    elsif r.schedule_type='MONTHLY_ONCE' then
      month_start:=date_trunc('month',p.period_start)::date;
      while month_start<=p.period_end loop
        ws:=greatest(month_start,p.period_start)::timestamp at time zone 'Asia/Ho_Chi_Minh';
        we:=(least((month_start + interval '1 month' - interval '1 day')::date,p.period_end)+1)::timestamp at time zone 'Asia/Ho_Chi_Minh';
        insert into public.schedule_occurrences(period_id,schedule_rule_id,business_date,window_start,window_end,slot_code)
        values(p.id,r.id,null,ws,we,r.slot_code) on conflict do nothing;
        inserted_count:=inserted_count+case when found then 1 else 0 end; month_start:=(month_start+interval '1 month')::date;
      end loop;
    end if;
  end loop;
  return inserted_count;
end $$;

create or replace function public.can_access_bm06_version(target_version_id uuid, require_enter boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select public.is_department_head() or exists(
  select 1 from public.user_scope_assignments s
  where s.user_id=auth.uid() and s.active and s.can_view and (not require_enter or s.can_enter) and (
   s.form_template_id=(select form_template_id from public.form_template_versions where id=target_version_id)
   or exists(select 1 from public.form_version_assets fva join public.assets a on a.id=fva.asset_id where fva.form_version_id=target_version_id and fva.active and (s.asset_id=a.id or s.location_id=a.location_id))
  )
 )
$$;

create or replace function public.can_finalize_bm06_version(target_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select public.is_department_head() or exists(select 1 from public.user_scope_assignments s where s.user_id=auth.uid() and s.active and s.can_enter and s.form_template_id=(select form_template_id from public.form_template_versions where id=target_version_id))
$$;

create or replace function public.assert_entry_access(target_period_id uuid) returns public.register_periods
language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype;
begin
 select * into p from public.register_periods where id=target_period_id;
 if not found or p.status not in ('OPEN','RETURNED') then raise exception 'Period is not writable'; end if;
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not (public.is_department_head() or
   exists(select 1 from public.user_scope_assignments s where s.user_id=auth.uid() and s.active and s.can_enter and (
     (p.location_id is not null and s.location_id=p.location_id) or
     (p.asset_id is not null and (s.asset_id=p.asset_id or s.location_id=(select a.location_id from public.assets a where a.id=p.asset_id))) or
     s.form_template_id=(select form_template_id from public.form_template_versions where id=p.form_version_id)
   )) or
   (p.location_id is null and p.asset_id is null and public.can_access_bm06_version(p.form_version_id,true))
 ) then raise exception 'Entry scope denied'; end if;
 return p;
end $$;

create or replace function public.save_measurement_record(target_occurrence_id uuid,target_performed_at timestamptz,target_temperature numeric,target_humidity numeric,target_note text,target_is_na boolean,target_na_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; tcode text; rid uuid; min_t numeric; max_t numeric; min_h numeric; max_h numeric; monitor uuid;
begin
 select * into o from public.schedule_occurrences where id=target_occurrence_id for update;
 if not found then raise exception 'Occurrence not found'; end if;
 if o.status<>'PENDING' then raise exception 'Occurrence already fulfilled'; end if;
 p:=public.assert_entry_access(o.period_id);
 select t.code into tcode from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where v.id=p.form_version_id;
 if target_is_na and nullif(btrim(target_na_reason),'') is null then raise exception 'N/A reason required'; end if;
 if not target_is_na and (target_performed_at is null or target_temperature is null or (tcode='BM.01/QL.HTAT.01' and target_humidity is null)) then raise exception 'Required measurement values missing'; end if;
 if tcode='BM.01/QL.HTAT.01' then min_t:=21;max_t:=26;min_h:=20;max_h:=80; elsif tcode='BM.02/QL.HTAT.01' then min_t:=2;max_t:=8; elsif tcode='BM.03/QL.HTAT.01' then min_t:=-30;max_t:=-10; else raise exception 'Not a measurement form'; end if;
 if p.location_id is not null then select monitoring_device_id into monitor from public.monitoring_assignments where location_id=p.location_id and valid_to is null order by valid_from desc limit 1; else select monitoring_device_id into monitor from public.monitoring_assignments where asset_id=p.asset_id and valid_to is null order by valid_from desc limit 1; end if;
 insert into public.records(period_id,form_version_id,record_type,location_id,asset_id,business_date,slot_code,performed_at,entered_by,is_na,na_reason,note,record_state,context_snapshot)
 values(p.id,p.form_version_id,'MEASUREMENT',p.location_id,p.asset_id,o.business_date,o.slot_code,target_performed_at,auth.uid(),target_is_na,target_na_reason,target_note,case when target_is_na then 'N_A' else 'COMPLETED' end,jsonb_build_object('template_code',tcode)) returning id into rid;
 if not target_is_na then insert into public.measurement_details values(rid,monitor,target_temperature,target_humidity,min_t,max_t,min_h,max_h,public.measurement_is_abnormal(target_temperature,min_t,max_t),case when min_h is null then false else public.measurement_is_abnormal(target_humidity,min_h,max_h) end); end if;
 update public.schedule_occurrences set status=case when target_is_na then 'N_A' else 'COMPLETED' end,fulfilled_by_record_id=rid where id=o.id;
 return rid;
end $$;

create or replace function public.mark_occurrence_na(target_occurrence_id uuid,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; template_code text; rid uuid;
begin
 select * into o from public.schedule_occurrences where id=target_occurrence_id for update;
 if not found then raise exception 'Occurrence not found'; end if;
 if o.status<>'PENDING' then raise exception 'Occurrence already fulfilled'; end if;
 if nullif(btrim(target_reason),'') is null then raise exception 'N/A reason required'; end if;
 p:=public.assert_entry_access(o.period_id);
 select t.code into template_code from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where v.id=p.form_version_id;
 if template_code='BM.06/QL.TRTB.01' then raise exception 'BM.06 uses KSD or H, not N/A'; end if;
 insert into public.records(period_id,form_version_id,record_type,location_id,asset_id,business_date,slot_code,entered_by,is_na,na_reason,record_state,context_snapshot)
 values(p.id,p.form_version_id,case when template_code='BM.01_KNBM' then 'DECONTAMINATION' when template_code='BM.02/QL.TRTB.01' then 'MAINTENANCE' else 'MEASUREMENT' end,p.location_id,p.asset_id,coalesce(o.business_date,(o.window_start at time zone 'Asia/Ho_Chi_Minh')::date),o.slot_code,auth.uid(),true,target_reason,'N_A',jsonb_build_object('template_code',template_code)) returning id into rid;
 update public.schedule_occurrences set status='N_A',fulfilled_by_record_id=rid where id=o.id;
 return rid;
end $$;

create or replace function public.save_decontamination_record(target_period_id uuid,target_business_date date,target_daily boolean,target_weekly boolean,target_spill boolean,target_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype; rid uuid;
begin
 p:=public.assert_entry_access(target_period_id); if not(target_daily or target_weekly or target_spill) then raise exception 'At least one activity required'; end if;
 select id into rid from public.records where period_id=p.id and business_date=target_business_date and record_type='DECONTAMINATION' and is_effective for update;
 if rid is null then
  insert into public.records(period_id,form_version_id,record_type,location_id,business_date,performed_at,entered_by,note,record_state)
  values(p.id,p.form_version_id,'DECONTAMINATION',p.location_id,target_business_date,now(),auth.uid(),target_note,'COMPLETED') returning id into rid;
  insert into public.decontamination_details values(rid,target_daily,target_weekly,target_spill);
 else
  update public.records set performed_at=now(),entered_by=auth.uid(),note=coalesce(target_note,note),lock_version=lock_version+1 where id=rid;
  update public.decontamination_details set daily_done=daily_done or target_daily,weekly_done=weekly_done or target_weekly,spill_event_done=spill_event_done or target_spill where record_id=rid;
 end if;
 update public.schedule_occurrences o set status='COMPLETED',fulfilled_by_record_id=rid from public.form_schedule_rules r where o.schedule_rule_id=r.id and o.period_id=p.id and o.status='PENDING' and ((r.schedule_type='DAILY' and target_daily and o.business_date=target_business_date) or (r.schedule_type='WEEKLY_ONCE' and target_weekly and target_business_date between o.window_start::date and (o.window_end-interval '1 second')::date));
 return rid;
end $$;

create or replace function public.validate_maintenance_values(target_cadence text,target_result text)
returns void language plpgsql immutable set search_path='' as $$
begin
 if target_cadence not in ('DAILY','WEEKLY','MONTHLY') then raise exception using errcode='22023',message='Invalid maintenance cadence'; end if;
 if target_result not in ('PASS','FAIL') then raise exception using errcode='22023',message='Invalid maintenance result'; end if;
end $$;

create or replace function public.validate_shift_status_payload(target_form_version_id uuid,target_statuses jsonb,target_require_complete boolean)
returns void language plpgsql stable set search_path='' as $$
declare supplied_count integer; distinct_count integer; expected_count integer;
begin
 if jsonb_typeof(target_statuses)<>'array' then raise exception using errcode='22023',message='Statuses must be an array'; end if;
 select count(*),count(distinct item->>'asset_id') into supplied_count,distinct_count from jsonb_array_elements(target_statuses) item;
 if supplied_count=0 then raise exception using errcode='22023',message='At least one equipment status is required'; end if;
 if supplied_count<>distinct_count then raise exception using errcode='22023',message='Duplicate asset status'; end if;
 if exists(select 1 from jsonb_array_elements(target_statuses) item where item->>'status' not in ('BT','KSD','H')) then raise exception using errcode='22023',message='Invalid equipment status'; end if;
 if exists(select 1 from jsonb_array_elements(target_statuses) item left join public.form_version_assets fva on fva.form_version_id=target_form_version_id and fva.asset_id=(item->>'asset_id')::uuid and fva.active where fva.asset_id is null) then raise exception using errcode='22023',message='Asset is outside form snapshot'; end if;
 if exists(select 1 from jsonb_array_elements(target_statuses) item where not public.is_department_head() and not exists(select 1 from public.user_scope_assignments s join public.assets a on a.id=(item->>'asset_id')::uuid where s.user_id=auth.uid() and s.active and s.can_enter and (s.asset_id=a.id or s.location_id=a.location_id or s.form_template_id=(select form_template_id from public.form_template_versions where id=target_form_version_id)))) then raise exception using errcode='42501',message='Asset entry scope denied'; end if;
 if target_require_complete and not public.can_finalize_bm06_version(target_form_version_id) then raise exception using errcode='42501',message='Shift finalize scope denied'; end if;
 select count(*) into expected_count from public.form_version_assets where form_version_id=target_form_version_id and active;
 if target_require_complete and supplied_count<>expected_count then raise exception using errcode='22023',message='All applicable assets require status'; end if;
end $$;

create or replace function public.save_maintenance_record(target_occurrence_id uuid,target_performed_at timestamptz,target_cadence text,target_result text,target_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; rid uuid; occurrence_cadence text;
begin select * into o from public.schedule_occurrences where id=target_occurrence_id for update; if not found then raise exception 'Occurrence not found'; end if; if o.status<>'PENDING' then raise exception 'Occurrence already fulfilled'; end if; p:=public.assert_entry_access(o.period_id);
 perform public.validate_maintenance_values(target_cadence,target_result);
 select r.slot_code into occurrence_cadence from public.form_schedule_rules r where r.id=o.schedule_rule_id;
 if occurrence_cadence<>target_cadence then raise exception using errcode='22023',message='Cadence does not match occurrence'; end if;
 if target_performed_at is null then raise exception using errcode='22023',message='Performed time is required'; end if;
 insert into public.records(period_id,form_version_id,record_type,asset_id,business_date,slot_code,performed_at,entered_by,note,record_state) values(p.id,p.form_version_id,'MAINTENANCE',p.asset_id,coalesce(o.business_date,(target_performed_at at time zone 'Asia/Ho_Chi_Minh')::date),o.slot_code,target_performed_at,auth.uid(),target_note,'COMPLETED') returning id into rid;
 insert into public.maintenance_details values(rid,p.asset_id,target_cadence,target_result); update public.schedule_occurrences set status='COMPLETED',fulfilled_by_record_id=rid where id=o.id; return rid; end $$;

create or replace function public.save_equipment_shift_draft(target_occurrence_id uuid,target_usage numeric,target_unit text,target_note text,target_statuses jsonb,target_finalize boolean,target_expected_lock integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; rid uuid; item jsonb; stored_count integer;
begin select * into o from public.schedule_occurrences where id=target_occurrence_id for update; if not found then raise exception 'Occurrence not found'; end if; p:=public.assert_entry_access(o.period_id);
 if target_usage is null or target_usage<0 or target_unit not in ('HOURS','SHIFTS') then raise exception using errcode='22023',message='Usage value and unit are required'; end if;
 perform public.validate_shift_status_payload(p.form_version_id,target_statuses,target_finalize);
 select fulfilled_by_record_id into rid from public.schedule_occurrences where id=o.id;
 if rid is null then insert into public.records(period_id,form_version_id,record_type,business_date,slot_code,performed_at,entered_by,note,record_state) values(p.id,p.form_version_id,'EQUIPMENT_SHIFT',o.business_date,o.slot_code,now(),auth.uid(),target_note,'DRAFT') returning id into rid; insert into public.equipment_shift_details values(rid,target_usage,target_unit);
 else update public.records set note=target_note,lock_version=lock_version+1 where id=rid and record_state='DRAFT' and lock_version=target_expected_lock; if not found then raise exception 'Record changed or finalized; reload required'; end if; update public.equipment_shift_details set usage_value=target_usage,usage_unit=target_unit where record_id=rid; end if;
 for item in select * from jsonb_array_elements(target_statuses) loop
  insert into public.equipment_shift_statuses(shift_record_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot)
  select rid,a.id,fva.display_order,item->>'status',a.source_name from public.form_version_assets fva join public.assets a on a.id=fva.asset_id where fva.form_version_id=p.form_version_id and fva.active and a.id=(item->>'asset_id')::uuid
  on conflict(shift_record_id,asset_id) do update set status_code=excluded.status_code,asset_display_order_snapshot=excluded.asset_display_order_snapshot,asset_label_snapshot=excluded.asset_label_snapshot;
 end loop;
 if target_finalize then
  select count(*) into stored_count from public.equipment_shift_statuses where shift_record_id=rid;
  if stored_count<>(select count(*) from public.form_version_assets where form_version_id=p.form_version_id and active) then raise exception using errcode='22023',message='All applicable assets require status'; end if;
  update public.records set record_state='COMPLETED' where id=rid; update public.schedule_occurrences set status='COMPLETED',fulfilled_by_record_id=rid where id=o.id;
 else update public.schedule_occurrences set fulfilled_by_record_id=rid where id=o.id; end if; return rid; end $$;

create or replace function public.ensure_operational_month(target_date date)
returns integer language plpgsql security definer set search_path='' as $$
declare month_start date:=date_trunc('month',target_date)::date; month_end date:=(date_trunc('month',target_date) + interval '1 month' - interval '1 day')::date; item record; period_id uuid; period_count integer:=0;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 for item in
  select v.id version_id,l.location_id,null::uuid asset_id from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id join public.form_version_locations l on l.form_version_id=v.id and l.active where v.status='PUBLISHED' and t.code in('BM.01/QL.HTAT.01','BM.01_KNBM')
  union all
  select v.id,null::uuid,a.asset_id from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id join public.form_version_assets a on a.form_version_id=v.id and a.active where v.status='PUBLISHED' and t.code in('BM.02/QL.HTAT.01','BM.03/QL.HTAT.01','BM.02/QL.TRTB.01')
  union all
  select v.id,null::uuid,null::uuid from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where v.status='PUBLISHED' and t.code='BM.06/QL.TRTB.01'
 loop
  period_id:=public.create_or_get_period(item.version_id,item.location_id,item.asset_id,month_start,month_end,'Tháng '||to_char(month_start,'MM/YYYY'),null);
  perform public.generate_period_occurrences(period_id); period_count:=period_count+1;
 end loop;
 return period_count;
end $$;

revoke all on function public.create_or_get_period(uuid,uuid,uuid,date,date,text,text),public.generate_period_occurrences(uuid),public.ensure_operational_month(date),public.mark_occurrence_na(uuid,text),public.save_measurement_record(uuid,timestamptz,numeric,numeric,text,boolean,text),public.save_decontamination_record(uuid,date,boolean,boolean,boolean,text),public.save_maintenance_record(uuid,timestamptz,text,text,text),public.save_equipment_shift_draft(uuid,numeric,text,text,jsonb,boolean,integer) from public;
grant execute on function public.ensure_operational_month(date),public.mark_occurrence_na(uuid,text),public.save_measurement_record(uuid,timestamptz,numeric,numeric,text,boolean,text),public.save_decontamination_record(uuid,date,boolean,boolean,boolean,text),public.save_maintenance_record(uuid,timestamptz,text,text,text),public.save_equipment_shift_draft(uuid,numeric,text,text,jsonb,boolean,integer) to authenticated;

alter table public.form_template_versions enable row level security; alter table public.form_fields enable row level security; alter table public.form_schedule_rules enable row level security; alter table public.form_version_assets enable row level security; alter table public.form_version_locations enable row level security; alter table public.register_periods enable row level security; alter table public.schedule_occurrences enable row level security; alter table public.records enable row level security; alter table public.measurement_details enable row level security; alter table public.decontamination_details enable row level security; alter table public.maintenance_details enable row level security; alter table public.equipment_shift_details enable row level security; alter table public.equipment_shift_statuses enable row level security;

create policy versions_read on public.form_template_versions for select to authenticated using(status='PUBLISHED' or public.current_is_admin());
create policy fields_read on public.form_fields for select to authenticated using(exists(select 1 from public.form_template_versions v where v.id=form_version_id and (v.status='PUBLISHED' or public.current_is_admin())));
create policy rules_read on public.form_schedule_rules for select to authenticated using(exists(select 1 from public.form_template_versions v where v.id=form_version_id and (v.status='PUBLISHED' or public.current_is_admin())));
create policy version_assets_read on public.form_version_assets for select to authenticated using(true);
create policy version_locations_read on public.form_version_locations for select to authenticated using(true);
create policy periods_read_scoped on public.register_periods for select to authenticated using(public.is_department_head() or public.current_is_admin() or (location_id is not null and public.can_access_location(location_id,false)) or (asset_id is not null and public.can_access_asset(asset_id,false)) or exists(select 1 from public.user_scope_assignments s where s.user_id=auth.uid() and s.active and s.form_template_id=(select form_template_id from public.form_template_versions where id=form_version_id) and s.can_view) or (location_id is null and asset_id is null and public.can_access_bm06_version(form_version_id,false)));
create policy occurrences_read_scoped on public.schedule_occurrences for select to authenticated using(exists(select 1 from public.register_periods p where p.id=period_id));
create policy records_read_scoped on public.records for select to authenticated using(exists(select 1 from public.register_periods p where p.id=period_id));
create policy measurement_read on public.measurement_details for select to authenticated using(exists(select 1 from public.records r where r.id=record_id));
create policy decontamination_read on public.decontamination_details for select to authenticated using(exists(select 1 from public.records r where r.id=record_id));
create policy maintenance_read on public.maintenance_details for select to authenticated using(exists(select 1 from public.records r where r.id=record_id));
create policy shift_read on public.equipment_shift_details for select to authenticated using(exists(select 1 from public.records r where r.id=record_id));
create policy shift_status_read on public.equipment_shift_statuses for select to authenticated using(exists(select 1 from public.records r where r.id=shift_record_id));

grant select on public.form_template_versions,public.form_fields,public.form_schedule_rules,public.form_version_assets,public.form_version_locations,public.register_periods,public.schedule_occurrences,public.records,public.measurement_details,public.decontamination_details,public.maintenance_details,public.equipment_shift_details,public.equipment_shift_statuses to authenticated;

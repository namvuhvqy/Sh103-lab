-- Phase 6: Unified Shift Entry, Duty Roster, Staff Lifecycle, and Bounded Version Promotions (BM.01 v3.1 & BM.06 v4.1).

-- 1. Profiles: account_kind, display/source order metadata, and safe classification
alter table public.profiles
  add column if not exists account_kind text not null default 'SYSTEM'
    constraint profiles_account_kind_check check (account_kind in ('STAFF', 'SYSTEM', 'TEST')),
  add column if not exists source_order integer;

create unique index if not exists profiles_staff_source_order_uidx
  on public.profiles(source_order)
  where account_kind = 'STAFF' and source_order is not null;

-- Ensure trigger ignores new columns in existing audit trigger if any, or profiles_audit handles updates properly

-- Classify test accounts and system accounts deterministically
update public.profiles
set account_kind = 'TEST'
where full_name like '%Vũ Văn Nam%'
   or full_name like '%Test%'
   or full_name like '%Fixture%';

update public.profiles
set account_kind = 'SYSTEM'
where full_name ilike '%Admin Sinh Hóa%'
   or full_name ilike '%System%';

-- Seed / Update official 25 staff members from catalog if they exist in auth/profiles
-- Or create deterministic placeholder profiles if not yet populated in test environments
with official_staff(stt, name, username, role, is_admin) as (
  values
    (1, 'Huỳnh Quang Thuận', 'hqthuan', 'DEPARTMENT_HEAD', true),
    (2, 'Lê Thanh Hà', 'ltha', 'DOCTOR', false),
    (3, 'Vũ Quang Hợp', 'vqhop', 'DEPARTMENT_HEAD', true),
    (4, 'Hoàng Thị Minh', 'htminh', 'DOCTOR', false),
    (5, 'Hồ Thị Hằng', 'hthang', 'DOCTOR', false),
    (6, 'Nguyễn Thị Mai Ly', 'ntmly', 'DOCTOR', false),
    (7, 'Đậu Văn Hoàng', 'dvhoang', 'DOCTOR', true),
    (8, 'Ngô Trung Hiếu', 'nthieu', 'DOCTOR', true),
    (9, 'Nguyễn Thành Long', 'ntlong', 'DOCTOR', false),
    (10, 'Đàm Thị Phương Lan', 'dtplan', 'DOCTOR', false),
    (11, 'Nguyễn Văn Cường', 'nvcuong', 'TECHNICIAN', false),
    (12, 'Nguyễn Thị Bích Hạnh', 'ntbhanh', 'TECHNICIAN', false),
    (13, 'Nguyễn Thanh Thuỷ', 'ntthuy', 'TECHNICIAN', false),
    (14, 'Phạm Thị Phương Thảo', 'ptpthao', 'TECHNICIAN', false),
    (15, 'Tăng Thanh Thuỷ', 'ttthuy', 'TECHNICIAN', false),
    (16, 'Nguyễn Xuân Hùng', 'nxhung', 'TECHNICIAN', false),
    (17, 'Nguyễn Thị Sinh', 'ntsinh', 'TECHNICIAN', false),
    (18, 'Nguyễn Thị Minh Ngọc', 'ntmngoc', 'TECHNICIAN', false),
    (19, 'Lê Thị Thảo', 'ltthao', 'TECHNICIAN', false),
    (20, 'Vũ Viết Nam', 'vvnam', 'TECHNICIAN', true),
    (21, 'Nguyễn Văn Nhân', 'nvnhan', 'TECHNICIAN', false),
    (22, 'Mai Thị Phương Thảo', 'mtpthao', 'TECHNICIAN', false),
    (23, 'Nguyễn Minh Thư', 'nmthu', 'TECHNICIAN', false),
    (24, 'Cấn Thu Anh', 'ctanh', 'TECHNICIAN', false),
    (25, 'Lê Thị Hằng', 'lthang', 'TECHNICIAN', false)
)
update public.profiles p
set source_order = s.stt,
    account_kind = 'STAFF'
from official_staff s
where p.full_name = s.name;

-- 2. Duty Rosters and Duty Roster Members Schema
create table if not exists public.duty_rosters (
  id uuid primary key default gen_random_uuid(),
  business_date date not null,
  duty_kind text not null constraint duty_rosters_duty_kind_check check (
    duty_kind in ('WEEKDAY_LUNCH', 'WEEKDAY_AFTERNOON', 'WEEKDAY_NIGHT', 'HOLIDAY_24H')
  ),
  status text not null default 'ACTIVE' constraint duty_rosters_status_check check (
    status in ('ACTIVE', 'SUPERSEDED', 'CANCELLED')
  ),
  revision_no integer not null default 1 check (revision_no > 0),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lock_version integer not null default 1
);

create unique index if not exists duty_rosters_active_date_kind_idx
  on public.duty_rosters(business_date, duty_kind)
  where status = 'ACTIVE';
create index if not exists duty_rosters_date_idx on public.duty_rosters(business_date);

create table if not exists public.duty_roster_members (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid not null references public.duty_rosters(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete restrict,
  member_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique(roster_id, user_id),
  unique(roster_id, member_order)
);

create index if not exists duty_roster_members_user_idx on public.duty_roster_members(user_id);

alter table public.duty_rosters enable row level security;
alter table public.duty_roster_members enable row level security;

create policy duty_rosters_read on public.duty_rosters
  for select to authenticated using (true);

create policy duty_roster_members_read on public.duty_roster_members
  for select to authenticated using (true);

grant select on public.duty_rosters, public.duty_roster_members to authenticated;
revoke insert, update, delete on public.duty_rosters, public.duty_roster_members from authenticated;

-- 3. Controlled Form Version Archival & Promotion: BM.01 v3.1 and BM.06 v4.1
-- Update trigger function to allow status transition from PUBLISHED to ARCHIVED
create or replace function public.prevent_published_version_mutation() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op = 'DELETE' and old.status in ('PUBLISHED', 'ARCHIVED') then
    raise exception 'Published or archived form versions are immutable';
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'PUBLISHED' and new.status = 'ARCHIVED' then
      if (to_jsonb(new) - array['status','effective_to']) is distinct from
         (to_jsonb(old) - array['status','effective_to']) then
        raise exception 'Only status and effective_to may change while archiving a published version';
      end if;
      return new;
    elsif old.status = 'ARCHIVED' then
      raise exception 'Archived form versions are immutable';
    elsif old.status = 'PUBLISHED' and new is distinct from old then
      raise exception 'Published form versions are immutable';
    end if;
  end if;
  return new;
end $$;

-- Make sure master locations and form templates exist if running before seed
insert into public.locations (id, code, name, source_name, sort_order)
values
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:SINH_HOA'), 'SINH_HOA', 'Khu vực làm xét nghiệm Sinh hóa', 'Khu vực làm xét nghiệm sinh hóa', 1),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:MIEN_DICH'), 'MIEN_DICH', 'Khu vực làm xét nghiệm Miễn dịch', 'Khu vực làm xét nghiệm miễn dịch', 2),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:NUOC_TIEU'), 'NUOC_TIEU', 'Khu vực làm xét nghiệm Nước tiểu', 'Khu vực làm xét nghiệm nước tiểu', 3),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:LY_TAM'), 'LY_TAM', 'Khu vực Ly tâm', 'Khu vực ly tâm', 4),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:NHAN_BENH_PHAM'), 'NHAN_BENH_PHAM', 'Khu vực Nhận bệnh phẩm', 'Khu vực nhận bệnh phẩm', 5),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:KHO'), 'KHO', 'Kho hóa chất & Lưu mẫu', 'Kho hóa chất / Kho lưu mẫu', 6)
on conflict (code) do update set active = true;

insert into public.form_templates (id, code, name, form_kind)
values
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.01/QL.HTAT.01'), 'BM.01/QL.HTAT.01', 'Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.02/QL.HTAT.01'), 'BM.02/QL.HTAT.01', 'Theo dõi tủ lạnh mát', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.03/QL.HTAT.01'), 'BM.03/QL.HTAT.01', 'Theo dõi tủ đông/tủ đá', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.01_KNBM'), 'BM.01_KNBM', 'Phiếu theo dõi khử nhiễm bề mặt khu vực làm việc', 'CHECKLIST_REGISTER'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.02/QL.TRTB.01'), 'BM.02/QL.TRTB.01', 'Bảng theo dõi – bảo dưỡng trang thiết bị', 'MAINTENANCE_REGISTER'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.06/QL.TRTB.01'), 'BM.06/QL.TRTB.01', 'Nhật ký hoạt động trang thiết bị', 'MULTI_ASSET_SHIFT_REGISTER')
on conflict (code) do update set active = true;

-- Make sure assets 1-25 exist
with equipment(source_order, source_name, location_code) as (
  values
    (1, 'Máy XN Khí Máu GEM Premier 3000', 'SINH_HOA'),
    (2, 'Máy Primier Hb 9210 -M1', 'SINH_HOA'),
    (3, 'Máy XN nước tiểu LabUMat 2- M1', 'NUOC_TIEU'),
    (4, 'Máy Miễn dịch Cobas E602', 'MIEN_DICH'),
    (5, 'Máy Primier Hb 9210- M2', 'SINH_HOA'),
    (6, 'Máy Primier Hb 9210- M1', 'SINH_HOA'),
    (7, 'Máy XN SH - MD tự động ARCHITECT-2', 'MIEN_DICH'),
    (8, 'Máy nước tiểu ureader Plus 2 - M1', 'NUOC_TIEU'),
    (9, 'Máy xét nghiệm khí máu Geem 3500', 'SINH_HOA'),
    (10, 'Máy nước tiểu ureader Plus 2 - M2', 'NUOC_TIEU'),
    (11, 'Hệ thống Automation Máy XN sinh hóa AU5800-M4-5', 'SINH_HOA'),
    (12, 'Hệ thống Automation Máy XN sinh hóa AU5800-M6', 'SINH_HOA'),
    (13, 'Hệ thống Automation Máy XN MD DXI-M3', 'MIEN_DICH'),
    (14, 'Hệ thống Automation Máy XN MD DXI-M4', 'MIEN_DICH'),
    (15, 'Máy xét nghiệm Miễn dịch Maglumi X3', 'MIEN_DICH'),
    (16, 'Máy xét nghiệm nước tiểu LabUmat 2-M2', 'NUOC_TIEU'),
    (17, 'Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh Nhật Bản', 'SINH_HOA'),
    (18, 'Máy XN SH-MD Anility', 'MIEN_DICH'),
    (19, 'Máy xét nghiệm khí máu Geem 3500', 'SINH_HOA'),
    (20, 'Máy lắc VORTEX', 'MIEN_DICH'),
    (21, 'Máy li tâm 24 lỗ lạnh UNIVERSAL 320R', 'LY_TAM'),
    (22, 'Máy li tâm 68 lỗ ROTOFIX 32A', 'LY_TAM'),
    (23, 'Máy lắc ngang', 'MIEN_DICH'),
    (24, 'Máy li tâm Ependox-M1', 'LY_TAM'),
    (25, 'Máy li tâm Ependox-M2', 'LY_TAM')
)
insert into public.assets (
  id, asset_type, source_name, display_name, location_id, source_order
)
select
  extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:equipment:' || e.source_order),
  'LAB_EQUIPMENT', e.source_name, e.source_name,
  (select id from public.locations where code = e.location_code),
  e.source_order
from equipment e
on conflict (asset_type, source_order) do update set
  source_name = excluded.source_name,
  display_name = excluded.display_name,
  location_id = excluded.location_id,
  active = true;

-- Ensure BM.01 v3.0 exists before archiving
insert into public.form_template_versions (id, form_template_id, version_label, status, effective_from, config_json, published_at)
select extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form-version:BM.01/QL.HTAT.01:pilot'),
       t.id, '3.0', 'PUBLISHED', '2026-01-01', '{}'::jsonb, '2026-01-01 00:00:00+07'
from public.form_templates t
where t.code = 'BM.01/QL.HTAT.01'
on conflict (form_template_id, version_label) do nothing;

-- Archive BM.01 v3.0 and publish BM.01 v3.1
do $$
declare
  bm01_id uuid;
  v30_id uuid;
  v31_id uuid;
begin
  select id into bm01_id from public.form_templates where code = 'BM.01/QL.HTAT.01';
  select id into v30_id from public.form_template_versions where form_template_id = bm01_id and version_label = '3.0';

  if v30_id is not null then
    update public.form_template_versions set status = 'ARCHIVED', effective_to = '2026-09-26'::date where id = v30_id;
  end if;

  v31_id := extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form-version:BM.01/QL.HTAT.01:3.1');
  insert into public.form_template_versions (id, form_template_id, version_label, status, effective_from, config_json, published_at)
  values (v31_id, bm01_id, '3.1', 'PUBLISHED', '2026-09-27'::date, '{}'::jsonb, now())
  on conflict (form_template_id, version_label) do update set status = 'PUBLISHED';

  -- Copy fields for BM.01 v3.1
  insert into public.form_fields (id, form_version_id, field_key, label, field_type, required, unit, normal_min, normal_max, display_order)
  values
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:field:BM.01:3.1:temperature'), v31_id, 'temperature', 'Nhiệt độ', 'NUMBER', true, '°C', 21::numeric, 26::numeric, 1),
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:field:BM.01:3.1:humidity'), v31_id, 'humidity', 'Độ ẩm', 'NUMBER', true, '%', 20, 80, 2)
  on conflict (form_version_id, field_key) do nothing;

  -- Schedule rules for BM.01 v3.1
  insert into public.form_schedule_rules (id, form_version_id, schedule_type, slot_code, local_start_time, local_end_time, ends_next_day, display_order)
  values
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.01:3.1:MORNING'), v31_id, 'SLOT_DAILY', 'MORNING', '08:00'::time, '09:00'::time, false, 1),
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.01:3.1:AFTERNOON'), v31_id, 'SLOT_DAILY', 'AFTERNOON', '14:30'::time, '15:30'::time, false, 2)
  on conflict (form_version_id, display_order) do nothing;

  -- Exact 5 locations for BM.01 v3.1 (SINH_HOA, MIEN_DICH, NUOC_TIEU, LY_TAM, NHAN_BENH_PHAM - excluding KHO)
  insert into public.form_version_locations (form_version_id, location_id, active)
  select v31_id, l.id, true
  from public.locations l
  where l.code in ('SINH_HOA', 'MIEN_DICH', 'NUOC_TIEU', 'LY_TAM', 'NHAN_BENH_PHAM')
  on conflict (form_version_id, location_id) do nothing;
end $$;

-- Ensure BM.06 v4.0 exists before archiving
insert into public.form_template_versions (id, form_template_id, version_label, status, effective_from, config_json, published_at)
select extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form-version:BM.06/QL.TRTB.01:pilot'),
       t.id, '4.0', 'PUBLISHED', '2026-01-01', '{}'::jsonb, '2026-01-01 00:00:00+07'
from public.form_templates t
where t.code = 'BM.06/QL.TRTB.01'
on conflict (form_template_id, version_label) do nothing;

-- Archive BM.06 v4.0 and publish BM.06 v4.1
do $$
declare
  bm06_id uuid;
  v40_id uuid;
  v41_id uuid;
begin
  select id into bm06_id from public.form_templates where code = 'BM.06/QL.TRTB.01';
  select id into v40_id from public.form_template_versions where form_template_id = bm06_id and version_label = '4.0';

  if v40_id is not null then
    update public.form_template_versions set status = 'ARCHIVED', effective_to = '2026-09-26'::date where id = v40_id;
  end if;

  v41_id := extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form-version:BM.06/QL.TRTB.01:4.1');
  insert into public.form_template_versions (id, form_template_id, version_label, status, effective_from, config_json, published_at)
  values (v41_id, bm06_id, '4.1', 'PUBLISHED', '2026-09-27'::date, '{}'::jsonb, now())
  on conflict (form_template_id, version_label) do update set status = 'PUBLISHED';

  -- BM.06 v4.1 field
  insert into public.form_fields (id, form_version_id, field_key, label, field_type, required, unit, display_order)
  values
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:field:BM.06:4.1:status_code'), v41_id, 'status_code', 'Trạng thái máy', 'SEGMENTED', true, null, 1)
  on conflict (form_version_id, field_key) do nothing;

  -- BM.06 v4.1 exact 4 schedule rules
  insert into public.form_schedule_rules (id, form_version_id, schedule_type, slot_code, local_start_time, local_end_time, ends_next_day, display_order)
  values
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.06:4.1:SHIFT_1'), v41_id, 'SLOT_DAILY', 'SHIFT_1', '07:00:00'::time, '11:30:00'::time, false, 1),
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.06:4.1:SHIFT_2'), v41_id, 'SLOT_DAILY', 'SHIFT_2', '11:30:00'::time, '13:30:00'::time, false, 2),
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.06:4.1:SHIFT_3'), v41_id, 'SLOT_DAILY', 'SHIFT_3', '13:30:00'::time, '16:30:00'::time, false, 3),
    (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:rule:BM.06:4.1:SHIFT_4'), v41_id, 'SLOT_DAILY', 'SHIFT_4', '16:30:00'::time, '07:00:00'::time, true, 4)
  on conflict (form_version_id, display_order) do nothing;

  -- BM.06 v4.1 snapshots all 25 LAB_EQUIPMENT assets
  insert into public.form_version_assets (form_version_id, asset_id, display_order, active)
  select v41_id, a.id, a.source_order, true
  from public.assets a
  where a.asset_type = 'LAB_EQUIPMENT' and a.source_order between 1 and 25
  on conflict (form_version_id, asset_id) do nothing;
end $$;

-- 4. Equipment Shift Details nullable legacy columns & Contributor fields
alter table public.equipment_shift_details
  alter column usage_value drop not null,
  alter column usage_unit drop not null;

-- Update save_equipment_shift_draft to allow nullable usage_value / usage_unit
create or replace function public.save_equipment_shift_draft(target_occurrence_id uuid,target_usage numeric,target_unit text,target_note text,target_statuses jsonb,target_finalize boolean,target_expected_lock integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.schedule_occurrences%rowtype; p public.register_periods%rowtype; rid uuid; item jsonb; stored_count integer;
begin
 select * into o from public.schedule_occurrences where id=target_occurrence_id for update;
 if not found then raise exception 'Occurrence not found'; end if;
 p:=public.assert_entry_access(o.period_id);
 if target_usage is not null and (target_usage<0 or target_unit not in ('HOURS','SHIFTS')) then
   raise exception using errcode='22023',message='Invalid usage value or unit';
 end if;
 perform public.validate_shift_status_payload(p.form_version_id,target_statuses,target_finalize);
 select fulfilled_by_record_id into rid from public.schedule_occurrences where id=o.id;
 if rid is null then
  insert into public.records(period_id,form_version_id,record_type,business_date,slot_code,performed_at,entered_by,note,record_state)
  values(p.id,p.form_version_id,'EQUIPMENT_SHIFT',o.business_date,o.slot_code,now(),auth.uid(),target_note,'DRAFT') returning id into rid;
  insert into public.equipment_shift_details(record_id,usage_value,usage_unit) values(rid,target_usage,target_unit);
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

-- 5. RPC Functions implementation

-- save_duty_roster(target_date date, target_duty_kind text, target_user_ids uuid[], target_expected_lock integer)
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
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if not (public.is_department_head() or public.current_is_admin()) then
    raise exception using errcode='42501', message='Only department head or admin can save duty roster';
  end if;

  if target_duty_kind not in ('WEEKDAY_LUNCH', 'WEEKDAY_AFTERNOON', 'WEEKDAY_NIGHT', 'HOLIDAY_24H') then
    raise exception using errcode='22023', message='Invalid duty kind';
  end if;

  total_members := coalesce(array_length(target_user_ids, 1), 0);
  if total_members <> 2 then
    raise exception using errcode='22023', message='Duty roster must have exactly 2 members';
  end if;

  -- Validate unique members
  if target_user_ids[1] = target_user_ids[2] then
    raise exception using errcode='22023', message='Roster members must be distinct';
  end if;

  -- Validate members account_kind and roles
  foreach uid in array target_user_ids loop
    select business_role, account_kind into u_role, u_kind from public.profiles where user_id = uid and active = true;
    if not found then
      raise exception using errcode='22023', message='User profile not found or inactive';
    end if;
    if u_kind in ('TEST', 'SYSTEM') then
      raise exception using errcode='22023', message='TEST and SYSTEM accounts cannot be assigned to roster';
    end if;
    if u_role in ('DOCTOR', 'DEPARTMENT_HEAD') then
      doc_count := doc_count + 1;
    elsif u_role = 'TECHNICIAN' then
      tech_count := tech_count + 1;
    end if;
  end loop;

  -- Invariant validation
  if target_duty_kind in ('WEEKDAY_LUNCH', 'WEEKDAY_NIGHT', 'HOLIDAY_24H') then
    if doc_count < 1 or tech_count < 1 then
      raise exception using errcode='22023', message='Shift requires 1 Doctor/Head and 1 Technician';
    end if;
  elsif target_duty_kind = 'WEEKDAY_AFTERNOON' then
    -- Any 2 valid STAFF members allowed
    null;
  end if;

  -- Find existing active roster
  select * into curr_roster
  from public.duty_rosters
  where business_date = target_date and duty_kind = target_duty_kind and status = 'ACTIVE'
  for update;

  if curr_roster.id is not null then
    if target_expected_lock is not null and curr_roster.lock_version <> target_expected_lock then
      raise exception 'Roster changed; reload required';
    end if;
    -- Supersede old roster
    update public.duty_rosters
    set status = 'SUPERSEDED', updated_at = now()
    where id = curr_roster.id;

    insert into public.duty_rosters(business_date, duty_kind, status, revision_no, created_by, lock_version)
    values(target_date, target_duty_kind, 'ACTIVE', curr_roster.revision_no + 1, auth.uid(), 1)
    returning id into roster_id;
  else
    insert into public.duty_rosters(business_date, duty_kind, status, revision_no, created_by, lock_version)
    values(target_date, target_duty_kind, 'ACTIVE', 1, auth.uid(), 1)
    returning id into roster_id;
  end if;

  -- Insert members
  foreach uid in array target_user_ids loop
    insert into public.duty_roster_members(roster_id, user_id, member_order)
    values(roster_id, uid, ord);
    ord := ord + 1;
  end loop;

  perform public.audit_event('DUTY_ROSTER_SAVE', 'duty_roster', roster_id, case when curr_roster.id is not null then to_jsonb(curr_roster) end, (select to_jsonb(r) from public.duty_rosters r where r.id = roster_id));

  return roster_id;
end $$;

-- get_work_session_context(target_date date, target_slot_code text)
create or replace function public.get_work_session_context(
  target_date date,
  target_slot_code text
)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  result jsonb;
  roster_info jsonb;
begin
  -- Find active roster matching the date
  select jsonb_build_object(
    'roster_id', r.id,
    'duty_kind', r.duty_kind,
    'business_date', r.business_date,
    'revision_no', r.revision_no,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'full_name', p.full_name,
        'business_role', p.business_role,
        'member_order', m.member_order,
        'source_order', p.source_order
      ) order by m.member_order)
      from public.duty_roster_members m
      join public.profiles p on p.user_id = m.user_id
      where m.roster_id = r.id
    ), '[]'::jsonb)
  ) into roster_info
  from public.duty_rosters r
  where r.business_date = target_date
    and r.status = 'ACTIVE'
    and r.duty_kind = case target_slot_code
      when 'SHIFT_2' then 'WEEKDAY_LUNCH'
      when 'SHIFT_3' then 'WEEKDAY_AFTERNOON'
      when 'SHIFT_4' then 'WEEKDAY_NIGHT'
      when 'HOLIDAY_24H' then 'HOLIDAY_24H'
      else '__NO_ROSTER__'
    end
  limit 1;

  -- Return aggregated session context
  select jsonb_build_object(
    'business_date', target_date,
    'slot_code', target_slot_code,
    'roster', roster_info,
    'user_id', auth.uid(),
    'is_head', public.is_department_head(),
    'is_admin', public.current_is_admin()
  ) into result;

  return result;
end $$;

-- staff_reference_summary(target_user_id uuid)
create or replace function public.staff_reference_summary(target_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  rec_count integer;
  appr_count integer;
  roster_count integer;
  audit_count integer;
  inc_count integer;
  can_hard_delete boolean;
begin
  if auth.uid() is null or not public.current_is_admin() then
    raise exception using errcode='42501', message='Admin permission required';
  end if;

  select count(*) into rec_count from public.records where entered_by = target_user_id;
  select count(*) into appr_count from public.register_periods where approved_by = target_user_id;
  select count(*) into roster_count from public.duty_roster_members where user_id = target_user_id;
  select count(*) into audit_count from public.audit_events where actor_user_id = target_user_id;
  select count(*) into inc_count from public.incidents where reporter_user_id = target_user_id or resolved_by = target_user_id;

  can_hard_delete := (
    rec_count = 0
    and appr_count = 0
    and roster_count = 0
    and audit_count = 0
    and inc_count = 0
    and not exists (select 1 from public.period_actions where actor_user_id = target_user_id)
    and not exists (select 1 from public.correction_requests where requested_by = target_user_id or reviewed_by = target_user_id)
    and not exists (select 1 from public.equipment_shift_statuses where updated_by = target_user_id)
  );

  return jsonb_build_object(
    'user_id', target_user_id,
    'records_count', rec_count,
    'approvals_count', appr_count,
    'roster_assignments_count', roster_count,
    'audit_events_count', audit_count,
    'incidents_count', inc_count,
    'can_hard_delete', can_hard_delete
  );
end $$;

-- set_staff_profile_and_scopes(target_user_id, target_full_name, target_business_role, target_is_admin, target_account_kind, target_source_order, form_template_ids, location_ids, asset_ids)
create or replace function public.set_staff_profile_and_scopes(
  target_user_id uuid,
  target_full_name text,
  target_business_role text,
  target_is_admin boolean,
  target_account_kind text default 'STAFF',
  target_source_order integer default null,
  target_form_template_ids uuid[] default null,
  target_location_ids uuid[] default null,
  target_asset_ids uuid[] default null
)
returns void language plpgsql security definer set search_path='' as $$
declare
  tid uuid;
  lid uuid;
  aid uuid;
begin
  if auth.uid() is null or not public.current_is_admin() then
    raise exception using errcode='42501', message='Admin permission required';
  end if;

  if target_business_role not in ('DEPARTMENT_HEAD', 'DOCTOR', 'TECHNICIAN') then
    raise exception using errcode='22023', message='Invalid business role';
  end if;
  if target_account_kind not in ('STAFF', 'SYSTEM', 'TEST') then
    raise exception using errcode='22023', message='Invalid account kind';
  end if;
  if nullif(btrim(target_full_name), '') is null then
    raise exception using errcode='22023', message='Full name is required';
  end if;
  if target_source_order is not null and (target_source_order < 1 or target_source_order > 25) then
    raise exception using errcode='22023', message='Source order must be between 1 and 25';
  end if;
  if target_account_kind <> 'STAFF' and target_source_order is not null then
    raise exception using errcode='22023', message='Only official STAFF accounts can have source order';
  end if;
  if target_account_kind = 'STAFF' and target_source_order is not null and exists (
    select 1 from public.profiles p
    where p.user_id <> target_user_id
      and p.account_kind = 'STAFF'
      and p.source_order = target_source_order
  ) then
    raise exception using errcode='23505', message='Source order is already assigned';
  end if;

  insert into public.profiles (user_id, full_name, business_role, is_admin, account_kind, source_order, active)
  values (target_user_id, btrim(target_full_name), target_business_role, coalesce(target_is_admin, false), target_account_kind, target_source_order, true)
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    business_role = excluded.business_role,
    is_admin = excluded.is_admin,
    account_kind = excluded.account_kind,
    source_order = excluded.source_order,
    active = true;

  -- Update scopes if provided
  if target_form_template_ids is not null or target_location_ids is not null or target_asset_ids is not null then
    delete from public.user_scope_assignments where user_id = target_user_id;

    if target_form_template_ids is not null then
      foreach tid in array target_form_template_ids loop
        insert into public.user_scope_assignments (user_id, form_template_id, can_view, can_enter, active)
        values (target_user_id, tid, true, true, true);
      end loop;
    end if;

    if target_location_ids is not null then
      foreach lid in array target_location_ids loop
        insert into public.user_scope_assignments (user_id, location_id, can_view, can_enter, active)
        values (target_user_id, lid, true, true, true);
      end loop;
    end if;

    if target_asset_ids is not null then
      foreach aid in array target_asset_ids loop
        insert into public.user_scope_assignments (user_id, asset_id, can_view, can_enter, active)
        values (target_user_id, aid, true, true, true);
      end loop;
    end if;
  end if;
end $$;

-- deactivate_staff_profile(target_user_id uuid, target_reason text)
create or replace function public.deactivate_staff_profile(
  target_user_id uuid,
  target_reason text
)
returns void language plpgsql security definer set search_path='' as $$
declare
  ref_summary jsonb;
  p_before jsonb;
begin
  if auth.uid() is null or not public.current_is_admin() then
    raise exception using errcode='42501', message='Admin permission required';
  end if;

  select to_jsonb(p) into p_before from public.profiles p where p.user_id = target_user_id;
  if p_before is null then
    raise exception 'Profile not found';
  end if;

  -- Check references
  ref_summary := public.staff_reference_summary(target_user_id);

  -- Deactivate profile
  update public.profiles
  set active = false, updated_at = now()
  where user_id = target_user_id;

  -- Deactivate user scopes
  update public.user_scope_assignments
  set active = false
  where user_id = target_user_id;

  perform public.audit_event('STAFF_DEACTIVATE', 'profile', target_user_id, p_before, jsonb_build_object('active', false, 'reason', target_reason, 'reference_summary', ref_summary));
end $$;

-- assert_entry_access updated to authorize any active STAFF profile for shift clinical entries
create or replace function public.assert_entry_access(target_period_id uuid) returns public.register_periods
language plpgsql security definer set search_path='' as $$
declare p public.register_periods%rowtype;
begin
 select * into p from public.register_periods where id=target_period_id;
 if not found or p.status not in ('OPEN','RETURNED') then raise exception 'Period is not writable'; end if;
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not (
   public.is_department_head() or
   exists (
     select 1 from public.profiles
     where user_id = auth.uid() and active = true and account_kind = 'STAFF'
   ) or
   exists (
     select 1 from public.user_scope_assignments s
     where s.user_id = auth.uid() and s.active and s.can_enter and (
       (p.location_id is not null and s.location_id = p.location_id) or
       (p.asset_id is not null and (s.asset_id = p.asset_id or s.location_id = (select a.location_id from public.assets a where a.id = p.asset_id))) or
       s.form_template_id = (select form_template_id from public.form_template_versions where id = p.form_version_id)
     )
   ) or
   (p.location_id is null and p.asset_id is null and public.can_access_bm06_version(p.form_version_id, true))
 ) then raise exception 'Entry scope denied'; end if;
 return p;
end $$;

revoke all on function public.save_duty_roster(date, text, uuid[], integer),
  public.get_work_session_context(date, text),
  public.staff_reference_summary(uuid),
  public.set_staff_profile_and_scopes(uuid, text, text, boolean, text, integer, uuid[], uuid[], uuid[]),
  public.deactivate_staff_profile(uuid, text),
  public.assert_entry_access(uuid) from public;

grant execute on function public.save_duty_roster(date, text, uuid[], integer),
  public.get_work_session_context(date, text),
  public.staff_reference_summary(uuid),
  public.set_staff_profile_and_scopes(uuid, text, text, boolean, text, integer, uuid[], uuid[], uuid[]),
  public.deactivate_staff_profile(uuid, text),
  public.assert_entry_access(uuid) to authenticated;


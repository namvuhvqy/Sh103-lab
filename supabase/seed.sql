-- Idempotent P2 master-data seed.
-- UUIDs are deterministic so source duplicates remain distinct by source order.

begin;

insert into public.locations (id, code, name, source_name, sort_order)
values
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:SINH_HOA'), 'SINH_HOA', 'Khu vực làm xét nghiệm Sinh hóa', 'Khu vực làm xét nghiệm sinh hóa', 1),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:MIEN_DICH'), 'MIEN_DICH', 'Khu vực làm xét nghiệm Miễn dịch', 'Khu vực làm xét nghiệm miễn dịch', 2),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:NUOC_TIEU'), 'NUOC_TIEU', 'Khu vực làm xét nghiệm Nước tiểu', 'Khu vực làm xét nghiệm nước tiểu', 3),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:LY_TAM'), 'LY_TAM', 'Khu vực Ly tâm', 'Khu vực ly tâm', 4),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:NHAN_BENH_PHAM'), 'NHAN_BENH_PHAM', 'Khu vực Nhận bệnh phẩm', 'Khu vực nhận bệnh phẩm', 5),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:location:KHO'), 'KHO', 'Kho hóa chất & Lưu mẫu', 'Kho hóa chất / Kho lưu mẫu', 6)
on conflict (code) do update set
  name = excluded.name,
  source_name = excluded.source_name,
  sort_order = excluded.sort_order,
  active = true;

insert into public.monitoring_devices (id, source_code, display_name)
values
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NAKĐT-01'), 'NAKĐT-01', 'Thiết bị theo dõi môi trường Khu Sinh hóa'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NAKĐT-02'), 'NAKĐT-02', 'Thiết bị theo dõi môi trường Khu Miễn dịch'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NAKĐT-03'), 'NAKĐT-03', 'Thiết bị theo dõi môi trường Kho'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-01'), 'NKĐT-01', 'Thiết bị theo dõi NKĐT-01'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-12'), 'NKĐT-12', 'Thiết bị theo dõi NKĐT-12'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-09'), 'NKĐT-09', 'Thiết bị theo dõi NKĐT-09'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-05'), 'NKĐT-05', 'Thiết bị theo dõi NKĐT-05'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-08'), 'NKĐT-08', 'Thiết bị theo dõi NKĐT-08'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-10'), 'NKĐT-10', 'Thiết bị theo dõi NKĐT-10'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-14'), 'NKĐT-14', 'Thiết bị theo dõi NKĐT-14'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKĐT-06'), 'NKĐT-06', 'Thiết bị theo dõi NKĐT-06'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKTG-01'), 'NKTG-01', 'Thiết bị theo dõi NKTG-01'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKTG-02'), 'NKTG-02', 'Thiết bị theo dõi NKTG-02'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor:NKTG-03'), 'NKTG-03', 'Thiết bị theo dõi NKTG-03')
on conflict (source_code) do update set display_name = excluded.display_name, active = true;

insert into public.form_templates (id, code, name, form_kind)
values
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.01/QL.HTAT.01'), 'BM.01/QL.HTAT.01', 'Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.02/QL.HTAT.01'), 'BM.02/QL.HTAT.01', 'Theo dõi tủ lạnh mát', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.03/QL.HTAT.01'), 'BM.03/QL.HTAT.01', 'Theo dõi tủ đông/tủ đá', 'MEASUREMENT'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.01_KNBM'), 'BM.01_KNBM', 'Phiếu theo dõi khử nhiễm bề mặt khu vực làm việc', 'CHECKLIST_REGISTER'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.02/QL.TRTB.01'), 'BM.02/QL.TRTB.01', 'Bảng theo dõi – bảo dưỡng trang thiết bị', 'MAINTENANCE_REGISTER'),
  (extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:form:BM.06/QL.TRTB.01'), 'BM.06/QL.TRTB.01', 'Nhật ký hoạt động trang thiết bị', 'MULTI_ASSET_SHIFT_REGISTER')
on conflict (code) do update set name = excluded.name, form_kind = excluded.form_kind, active = true;

with fridge(source_order, source_name, source_code, monitor_code, range_kind, storage_purpose) as (
  values
    (101, 'Tủ âm sâu Overmed', 'TU-01', null, 'FROZEN', 'Tủ lưu mẫu'),
    (102, 'Tủ lạnh TOWASHI', 'TU 02', 'NKĐT-01', 'COOL', 'HC kho lẻ'),
    (103, 'Tủ lạnh MITSUBISHI (mát)', 'TU 03', 'NKĐT-12', 'COOL', 'Cal, QC'),
    (104, 'Tủ lạnh MITSUBISHI (đá)', 'TU 03', 'NKĐT-12', 'FROZEN', 'Cal, QC'),
    (105, 'Tủ lạnh SANAKY', 'TU 04', 'NKĐT-09', 'COOL', 'HC kho chính'),
    (106, 'Tủ lạnh SANAKY', 'TU 05', 'NKĐT-05', 'COOL', 'Tủ lưu mẫu'),
    (107, 'Tủ lạnh LG (ngăn mát)', 'TU 06', 'NKĐT-08', 'COOL', 'QC, Cal'),
    (108, 'Tủ lạnh LG (ngăn đông)', 'TU 06', 'NKĐT-10', 'FROZEN', 'Không ghi rõ trong phần Phụ lục đã trích'),
    (109, 'Tủ lạnh MITSUBISHI (mát)', 'TU 07', 'NKĐT-14', 'COOL', 'HC kho chính'),
    (110, 'Tủ lạnh MITSUBISHI (đông)', 'TU 07', 'NKĐT-06', 'FROZEN', 'HC kho chính'),
    (111, 'Tủ lạnh Acuma', 'TU-08', 'NKTG-01', 'COOL', 'Tủ lưu mẫu'),
    (112, 'Tủ lạnh Alaska', 'TU 09', 'NKTG-02', 'COOL', 'HC kho chính'),
    (113, 'Tủ lạnh Sanaky', 'TU-10', 'NKTG-03', 'COOL', 'HC kho chính')
)
insert into public.assets (
  id, asset_type, source_code, source_name, display_name, location_id,
  storage_purpose, source_order
)
select
  extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:fridge:' || f.source_order),
  'FRIDGE_COMPARTMENT', f.source_code, f.source_name,
  f.source_code || ' — ' || f.source_name,
  (select id from public.locations where code = 'KHO'),
  f.storage_purpose, f.source_order
from fridge f
on conflict (asset_type, source_order) do update set
  source_code = excluded.source_code,
  source_name = excluded.source_name,
  display_name = excluded.display_name,
  location_id = excluded.location_id,
  storage_purpose = excluded.storage_purpose,
  active = true;

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

insert into public.monitoring_assignments (
  id, monitoring_device_id, location_id, valid_from
)
select
  extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor-assignment:location:' || mapping.monitor_code),
  d.id, l.id, '2026-01-01 00:00:00+07'::timestamptz
from (values
  ('NAKĐT-01', 'SINH_HOA'),
  ('NAKĐT-02', 'MIEN_DICH'),
  ('NAKĐT-03', 'KHO')
) mapping(monitor_code, location_code)
join public.monitoring_devices d on d.source_code = mapping.monitor_code
join public.locations l on l.code = mapping.location_code
on conflict (id) do update set
  monitoring_device_id = excluded.monitoring_device_id,
  location_id = excluded.location_id,
  asset_id = null,
  valid_to = null;

with fridge_monitor(source_order, monitor_code) as (
  values
    (102, 'NKĐT-01'), (103, 'NKĐT-12'), (104, 'NKĐT-12'),
    (105, 'NKĐT-09'), (106, 'NKĐT-05'), (107, 'NKĐT-08'),
    (108, 'NKĐT-10'), (109, 'NKĐT-14'), (110, 'NKĐT-06'),
    (111, 'NKTG-01'), (112, 'NKTG-02'), (113, 'NKTG-03')
)
insert into public.monitoring_assignments (
  id, monitoring_device_id, asset_id, valid_from
)
select
  extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'sh103:monitor-assignment:fridge:' || fm.source_order),
  d.id, a.id, '2026-01-01 00:00:00+07'::timestamptz
from fridge_monitor fm
join public.monitoring_devices d on d.source_code = fm.monitor_code
join public.assets a on a.asset_type = 'FRIDGE_COMPARTMENT' and a.source_order = fm.source_order
on conflict (id) do update set
  monitoring_device_id = excluded.monitoring_device_id,
  location_id = null,
  asset_id = excluded.asset_id,
  valid_to = null;

-- P3 bounded published versions. Existing published versions are immutable,
-- therefore seed rows use deterministic IDs and DO NOTHING on repeat runs.
insert into public.form_template_versions(id,form_template_id,version_label,status,effective_from,config_json,published_at)
select extensions.uuid_generate_v5(extensions.uuid_ns_url(),'sh103:form-version:'||t.code||':pilot'),t.id,
  case t.code when 'BM.01/QL.HTAT.01' then '3.0' when 'BM.02/QL.HTAT.01' then '3.0' when 'BM.03/QL.HTAT.01' then '3.0' when 'BM.02/QL.TRTB.01' then '4.0' when 'BM.06/QL.TRTB.01' then '4.0' else 'Pilot 1.0' end,
  'PUBLISHED','2026-01-01',case when t.code='BM.03/QL.HTAT.01' then '{"source_tab":"NganDa"}'::jsonb else '{}'::jsonb end,'2026-01-01 00:00:00+07'
from public.form_templates t
on conflict (form_template_id,version_label) do nothing;

with fields(template_code,field_key,label,field_type,required,unit,min_value,max_value,display_order) as (values
 ('BM.01/QL.HTAT.01','temperature','Nhiệt độ','NUMBER',true,'°C',21::numeric,26::numeric,1),
 ('BM.01/QL.HTAT.01','humidity','Độ ẩm','NUMBER',true,'%',20,80,2),
 ('BM.02/QL.HTAT.01','temperature','Nhiệt độ tủ mát','NUMBER',true,'°C',2,8,1),
 ('BM.03/QL.HTAT.01','temperature','Nhiệt độ tủ đông','NUMBER',true,'°C',-30,-10,1),
 ('BM.01_KNBM','daily_done','Hằng ngày','BOOLEAN',false,null,null,null,1),
 ('BM.01_KNBM','weekly_done','Hằng tuần','BOOLEAN',false,null,null,null,2),
 ('BM.01_KNBM','spill_event_done','Xử lý tràn đổ','BOOLEAN',false,null,null,null,3),
 ('BM.02/QL.TRTB.01','cadence','Chu kỳ','SELECT',true,null,null,null,1),
 ('BM.02/QL.TRTB.01','result','Kết quả','SELECT',true,null,null,null,2),
 ('BM.06/QL.TRTB.01','status_code','Trạng thái máy','SEGMENTED',true,null,null,null,1)
)
insert into public.form_fields(id,form_version_id,field_key,label,field_type,required,unit,normal_min,normal_max,display_order)
select extensions.uuid_generate_v5(extensions.uuid_ns_url(),'sh103:field:'||f.template_code||':'||f.field_key),v.id,f.field_key,f.label,f.field_type,f.required,f.unit,f.min_value,f.max_value,f.display_order
from fields f join public.form_templates t on t.code=f.template_code join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED'
on conflict(form_version_id,field_key) do nothing;

with rules(template_code,schedule_type,slot_code,start_time,end_time,next_day,display_order) as (values
 ('BM.01/QL.HTAT.01','SLOT_DAILY','MORNING','08:00'::time,'09:00'::time,false,1),('BM.01/QL.HTAT.01','SLOT_DAILY','AFTERNOON','14:30','15:30',false,2),
 ('BM.02/QL.HTAT.01','SLOT_DAILY','MORNING','08:00','09:00',false,1),('BM.02/QL.HTAT.01','SLOT_DAILY','AFTERNOON','14:30','15:30',false,2),
 ('BM.03/QL.HTAT.01','SLOT_DAILY','MORNING','08:00','09:00',false,1),('BM.03/QL.HTAT.01','SLOT_DAILY','AFTERNOON','14:30','15:30',false,2),
 ('BM.01_KNBM','DAILY','DAILY','00:00','23:59:59',false,1),('BM.01_KNBM','WEEKLY_ONCE','WEEKLY',null,null,false,2),('BM.01_KNBM','EVENT','SPILL',null,null,false,3),
 ('BM.02/QL.TRTB.01','DAILY','DAILY','00:00','23:59:59',false,1),('BM.02/QL.TRTB.01','WEEKLY_ONCE','WEEKLY',null,null,false,2),('BM.02/QL.TRTB.01','MONTHLY_ONCE','MONTHLY',null,null,false,3),
 ('BM.06/QL.TRTB.01','SLOT_DAILY','SHIFT_1','07:00','11:30',false,1),('BM.06/QL.TRTB.01','SLOT_DAILY','SHIFT_2','11:30','13:30',false,2),('BM.06/QL.TRTB.01','SLOT_DAILY','SHIFT_3','13:30','16:30',false,3),('BM.06/QL.TRTB.01','SLOT_DAILY','SHIFT_4','16:30','07:00',true,4)
)
insert into public.form_schedule_rules(id,form_version_id,schedule_type,slot_code,local_start_time,local_end_time,ends_next_day,display_order)
select extensions.uuid_generate_v5(extensions.uuid_ns_url(),'sh103:rule:'||r.template_code||':'||r.slot_code),v.id,r.schedule_type,r.slot_code,r.start_time,r.end_time,r.next_day,r.display_order
from rules r join public.form_templates t on t.code=r.template_code join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED'
on conflict(form_version_id,display_order) do nothing;

insert into public.form_version_assets(form_version_id,asset_id,display_order)
select v.id,a.id,a.source_order from public.form_templates t join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED' join public.assets a on a.asset_type='LAB_EQUIPMENT'
where t.code='BM.06/QL.TRTB.01' on conflict(form_version_id,asset_id) do nothing;

insert into public.form_version_assets(form_version_id,asset_id,display_order)
select v.id,a.id,a.source_order from public.form_templates t join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED' join public.assets a on a.asset_type='LAB_EQUIPMENT'
where t.code='BM.02/QL.TRTB.01' on conflict(form_version_id,asset_id) do nothing;

insert into public.form_version_assets(form_version_id,asset_id,display_order)
select v.id,a.id,a.source_order from public.form_templates t join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED' join public.assets a on a.asset_type='FRIDGE_COMPARTMENT'
where (t.code='BM.02/QL.HTAT.01' and a.source_order in(102,103,105,106,107,109,111,112,113)) or (t.code='BM.03/QL.HTAT.01' and a.source_order in(101,104,108,110))
on conflict(form_version_id,asset_id) do nothing;

insert into public.form_version_locations(form_version_id,location_id)
select v.id,l.id from public.form_templates t join public.form_template_versions v on v.form_template_id=t.id and v.status='PUBLISHED' join public.locations l on
 (t.code='BM.01/QL.HTAT.01' and l.code in('SINH_HOA','MIEN_DICH','KHO')) or
 (t.code='BM.01_KNBM' and l.code in('SINH_HOA','MIEN_DICH','NUOC_TIEU','LY_TAM','NHAN_BENH_PHAM'))
on conflict do nothing;

commit;

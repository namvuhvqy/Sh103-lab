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

commit;

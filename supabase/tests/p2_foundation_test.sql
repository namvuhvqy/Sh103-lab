begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_scope_assignments', 'scope assignments table exists');
select has_table('public', 'locations', 'locations table exists');
select has_table('public', 'assets', 'assets table exists');
select has_table('public', 'monitoring_devices', 'monitoring devices table exists');
select has_table('public', 'monitoring_assignments', 'monitoring assignments table exists');

select col_is_pk('public', 'profiles', 'user_id', 'profiles.user_id is the primary key');
select col_has_check('public', 'profiles', 'business_role', 'business role is constrained');
select col_has_check('public', 'assets', 'asset_type', 'asset type is constrained');
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.monitoring_assignments'::regclass
      and conname = 'monitoring_assignments_target_check'
  ),
  'monitor target is exclusive'
);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_scope_assignments'::regclass), 'scope assignments have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.locations'::regclass), 'locations have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.assets'::regclass), 'assets have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.monitoring_devices'::regclass), 'monitoring devices have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.monitoring_assignments'::regclass), 'monitoring assignments have RLS enabled');

select is((select count(*)::integer from public.locations), 6, 'six locations are seeded');
select is((select count(*)::integer from public.assets where asset_type in ('FRIDGE', 'FRIDGE_COMPARTMENT')), 13, 'thirteen fridge rows are seeded');
select is((select count(*)::integer from public.assets where asset_type = 'LAB_EQUIPMENT'), 25, 'twenty-five equipment rows are seeded');
select is((select count(distinct source_order)::integer from public.assets where asset_type = 'LAB_EQUIPMENT'), 25, 'equipment source order is unique from 1 to 25');
select is((select count(*)::integer from public.assets a join public.locations l on l.id = a.location_id where a.asset_type = 'LAB_EQUIPMENT' and l.code = 'SINH_HOA'), 9, 'Sinh hoa has 9 machines');
select is((select count(*)::integer from public.assets a join public.locations l on l.id = a.location_id where a.asset_type = 'LAB_EQUIPMENT' and l.code = 'MIEN_DICH'), 8, 'Mien dich has 8 machines');
select is((select count(*)::integer from public.assets a join public.locations l on l.id = a.location_id where a.asset_type = 'LAB_EQUIPMENT' and l.code = 'NUOC_TIEU'), 4, 'Nuoc tieu has 4 machines');
select is((select count(*)::integer from public.assets a join public.locations l on l.id = a.location_id where a.asset_type = 'LAB_EQUIPMENT' and l.code = 'LY_TAM'), 4, 'Ly tam has 4 machines');
select is((select count(*)::integer from public.assets a join public.locations l on l.id = a.location_id where a.asset_type = 'LAB_EQUIPMENT' and l.code = 'NHAN_BENH_PHAM'), 0, 'Nhan benh pham has no machines');

select is(
  (select string_agg(source_name, '|' order by source_order) from public.assets where asset_type = 'LAB_EQUIPMENT'),
  'Máy XN Khí Máu GEM Premier 3000|Máy Primier Hb 9210 -M1|Máy XN nước tiểu LabUMat 2- M1|Máy Miễn dịch Cobas E602|Máy Primier Hb 9210- M2|Máy Primier Hb 9210- M1|Máy XN SH - MD tự động ARCHITECT-2|Máy nước tiểu ureader Plus 2 - M1|Máy xét nghiệm khí máu Geem 3500|Máy nước tiểu ureader Plus 2 - M2|Hệ thống Automation Máy XN sinh hóa AU5800-M4-5|Hệ thống Automation Máy XN sinh hóa AU5800-M6|Hệ thống Automation Máy XN MD DXI-M3|Hệ thống Automation Máy XN MD DXI-M4|Máy xét nghiệm Miễn dịch Maglumi X3|Máy xét nghiệm nước tiểu LabUmat 2-M2|Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh Nhật Bản|Máy XN SH-MD Anility|Máy xét nghiệm khí máu Geem 3500|Máy lắc VORTEX|Máy li tâm 24 lỗ lạnh UNIVERSAL 320R|Máy li tâm 68 lỗ ROTOFIX 32A|Máy lắc ngang|Máy li tâm Ependox-M1|Máy li tâm Ependox-M2',
  'all 25 source names remain exact and ordered'
);
select is(
  (select string_agg(source_code || ':' || source_name, '|' order by source_order) from public.assets where asset_type = 'FRIDGE_COMPARTMENT'),
  'TU-01:Tủ âm sâu Overmed|TU 02:Tủ lạnh TOWASHI|TU 03:Tủ lạnh MITSUBISHI (mát)|TU 03:Tủ lạnh MITSUBISHI (đá)|TU 04:Tủ lạnh SANAKY|TU 05:Tủ lạnh SANAKY|TU 06:Tủ lạnh LG (ngăn mát)|TU 06:Tủ lạnh LG (ngăn đông)|TU 07:Tủ lạnh MITSUBISHI (mát)|TU 07:Tủ lạnh MITSUBISHI (đông)|TU-08:Tủ lạnh Acuma|TU 09:Tủ lạnh Alaska|TU-10:Tủ lạnh Sanaky',
  'all 13 fridge identities remain exact and ordered'
);
select is((select count(*)::integer from public.form_templates), 6, 'six bounded form templates are seeded');
select is(
  (select count(*)::integer from public.monitoring_devices) * 100 + (select count(*)::integer from public.monitoring_assignments),
  1415,
  'fourteen monitoring devices and fifteen assignment rows are seeded'
);

select * from finish();
rollback;

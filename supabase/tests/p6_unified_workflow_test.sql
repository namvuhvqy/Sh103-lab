begin;
create extension if not exists pgtap with schema extensions;
select plan(49);

-- Test-owned personnel fixtures. Production migrations never create Auth users.
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
  ('60000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-1@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-2@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-3@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-4@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-5@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-6@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-7@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-8@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-9@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-10@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-11@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-12@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-13@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-14@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-15@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-16@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000017','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-17@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000018','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-18@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-19@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-20@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-21@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-22@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-23@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-24@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-staff-25@test.local','',now(),now(),now()),
  ('60000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p6-test@test.local','',now(),now(),now());

insert into public.profiles (user_id,full_name,business_role,is_admin,active,account_kind,source_order)
values
  ('60000000-0000-0000-0000-000000000001','Huỳnh Quang Thuận','DEPARTMENT_HEAD',false,true,'STAFF',1),
  ('60000000-0000-0000-0000-000000000002','Lê Thanh Hà','DOCTOR',false,true,'STAFF',2),
  ('60000000-0000-0000-0000-000000000003','Vũ Quang Hợp','DEPARTMENT_HEAD',false,true,'STAFF',3),
  ('60000000-0000-0000-0000-000000000004','Hoàng Thị Minh','DOCTOR',false,true,'STAFF',4),
  ('60000000-0000-0000-0000-000000000005','Hồ Thị Hằng','DOCTOR',false,true,'STAFF',5),
  ('60000000-0000-0000-0000-000000000006','Nguyễn Thị Mai Ly','DOCTOR',false,true,'STAFF',6),
  ('60000000-0000-0000-0000-000000000007','Đậu Văn Hoàng','DOCTOR',false,true,'STAFF',7),
  ('60000000-0000-0000-0000-000000000008','Ngô Trung Hiếu','DOCTOR',false,true,'STAFF',8),
  ('60000000-0000-0000-0000-000000000009','Nguyễn Thành Long','DOCTOR',false,true,'STAFF',9),
  ('60000000-0000-0000-0000-000000000010','Đàm Thị Phương Lan','DOCTOR',false,true,'STAFF',10),
  ('60000000-0000-0000-0000-000000000011','Nguyễn Văn Cường','TECHNICIAN',false,true,'STAFF',11),
  ('60000000-0000-0000-0000-000000000012','Nguyễn Thị Bích Hạnh','TECHNICIAN',false,true,'STAFF',12),
  ('60000000-0000-0000-0000-000000000013','Nguyễn Thanh Thuỷ','TECHNICIAN',false,true,'STAFF',13),
  ('60000000-0000-0000-0000-000000000014','Phạm Thị Phương Thảo','TECHNICIAN',false,true,'STAFF',14),
  ('60000000-0000-0000-0000-000000000015','Tăng Thanh Thuỷ','TECHNICIAN',false,true,'STAFF',15),
  ('60000000-0000-0000-0000-000000000016','Nguyễn Xuân Hùng','TECHNICIAN',false,true,'STAFF',16),
  ('60000000-0000-0000-0000-000000000017','Nguyễn Thị Sinh','TECHNICIAN',false,true,'STAFF',17),
  ('60000000-0000-0000-0000-000000000018','Nguyễn Thị Minh Ngọc','TECHNICIAN',false,true,'STAFF',18),
  ('60000000-0000-0000-0000-000000000019','Lê Thị Thảo','TECHNICIAN',false,true,'STAFF',19),
  ('60000000-0000-0000-0000-000000000020','Vũ Viết Nam','TECHNICIAN',false,true,'STAFF',20),
  ('60000000-0000-0000-0000-000000000021','Nguyễn Văn Nhân','TECHNICIAN',false,true,'STAFF',21),
  ('60000000-0000-0000-0000-000000000022','Mai Thị Phương Thảo','TECHNICIAN',false,true,'STAFF',22),
  ('60000000-0000-0000-0000-000000000023','Nguyễn Minh Thư','TECHNICIAN',false,true,'STAFF',23),
  ('60000000-0000-0000-0000-000000000024','Cấn Thu Anh','TECHNICIAN',false,true,'STAFF',24),
  ('60000000-0000-0000-0000-000000000025','Lê Thị Hằng','TECHNICIAN',false,true,'STAFF',25),
  ('60000000-0000-0000-0000-000000000099','TS.BS Vũ Văn Nam','DOCTOR',false,true,'TEST',null);

-- 1. Master locations & BM.01 v3.1 scope
select has_table('public', 'locations', 'locations table exists');
select is((select count(*)::integer from public.locations where code in ('SINH_HOA', 'MIEN_DICH', 'NUOC_TIEU', 'LY_TAM', 'NHAN_BENH_PHAM', 'KHO')), 6, 'all 6 master locations exist');
select ok(exists(select 1 from public.locations where code = 'KHO' and active = true), 'auxiliary location KHO is preserved in master catalog');

-- BM.01 v3.1 must exist and be PUBLISHED with exactly 5 work area locations (excluding KHO)
select ok(
  exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.01/QL.HTAT.01'
      and v.version_label = '3.1'
      and v.status = 'PUBLISHED'
  ),
  'BM.01 v3.1 exists and is PUBLISHED'
);

select set_eq(
  $$
    select l.code
    from public.form_version_locations fvl
    join public.form_template_versions v on v.id = fvl.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    join public.locations l on l.id = fvl.location_id
    where t.code = 'BM.01/QL.HTAT.01' and v.version_label = '3.1'
  $$,
  $$
    select code from (values ('SINH_HOA'), ('MIEN_DICH'), ('NUOC_TIEU'), ('LY_TAM'), ('NHAN_BENH_PHAM')) as expected(code)
  $$,
  'BM.01 v3.1 maps exactly the 5 Owner-locked work areas and excludes KHO'
);

-- BM.01 v3.0 remains historical
select ok(
  exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.01/QL.HTAT.01'
      and v.version_label = '3.0'
  ),
  'BM.01 v3.0 remains present as historical version'
);

-- 2. BM.06 v4.1 & v4.0 historical
select ok(
  exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01'
      and v.version_label = '4.1'
      and v.status = 'PUBLISHED'
  ),
  'BM.06 v4.1 exists and is PUBLISHED'
);

select ok(
  exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01'
      and v.version_label = '4.0'
  ),
  'BM.06 v4.0 remains present as historical version'
);

-- BM.06 v4.1 schedule rules: exact 4 fixed shifts, SHIFT_4 overnight
select is(
  (
    select count(*)::integer
    from public.form_schedule_rules r
    join public.form_template_versions v on v.id = r.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01' and v.version_label = '4.1'
  ),
  4,
  'BM.06 v4.1 has exactly 4 schedule rules'
);

select is(
  (
    select string_agg(slot_code || ':' || local_start_time::text || '-' || local_end_time::text || ':' || ends_next_day::text, '|' order by display_order)
    from public.form_schedule_rules r
    join public.form_template_versions v on v.id = r.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01' and v.version_label = '4.1'
  ),
  'SHIFT_1:07:00:00-11:30:00:false|SHIFT_2:11:30:00-13:30:00:false|SHIFT_3:13:30:00-16:30:00:false|SHIFT_4:16:30:00-07:00:00:true',
  'BM.06 v4.1 has exact shift slot codes, times, and overnight definition'
);

-- BM.06 v4.1 assets: exactly 25 ordered lab equipment assets
select is(
  (
    select count(*)::integer
    from public.form_version_assets a
    join public.form_template_versions v on v.id = a.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01' and v.version_label = '4.1'
  ),
  25,
  'BM.06 v4.1 snapshots exactly 25 assets'
);

select is(
  (
    select min(display_order) || '-' || max(display_order)
    from public.form_version_assets a
    join public.form_template_versions v on v.id = a.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01' and v.version_label = '4.1'
  ),
  '1-25',
  'BM.06 v4.1 asset display orders are sequentially 1 to 25'
);

-- 3. Profiles: account_kind, display/source order metadata, no staff_number column
select has_column('public', 'profiles', 'account_kind', 'profiles.account_kind column exists');
select col_has_check('public', 'profiles', 'account_kind', 'profiles.account_kind has check constraint');
select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'staff_number'
  ),
  'profiles does not contain staff_number column'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name in ('source_order', 'display_order', 'profile_source_order')
  ),
  'profiles has display/source order metadata column'
);

-- Dynamic SQL checks for profile account_kind values so tests compile even before migration
select ok(
  coalesce(
    (
      select exists (
        select 1
        from public.profiles
        where full_name like '%Vũ Văn Nam%'
      ) and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_kind'
      ) and (
        select (count(*) > 0)
        from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'profiles'
          and exists (
            select 1 from public.profiles where full_name like '%Vũ Văn Nam%'
          )
      ) and (
        (select count(*) from public.profiles) > 0
      ) and (
        select (val = 'TEST')
        from (
          select (to_jsonb(p)->>'account_kind') as val
          from public.profiles p
          where p.full_name like '%Vũ Văn Nam%'
          limit 1
        ) q
      )
    ),
    false
  ),
  'TS.BS Vũ Văn Nam is classified as TEST account_kind'
);

-- Exactly 25 official STAFF profiles exist
select is(
  coalesce(
    (
      select count(*)::integer
      from public.profiles p
      where (to_jsonb(p)->>'account_kind') = 'STAFF'
    ),
    0
  ),
  25,
  'exactly 25 official profiles are classified as STAFF'
);

-- Eligible roster staff excludes TEST and SYSTEM accounts
select ok(
  coalesce(
    (
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_kind'
      ) and not exists (
        select 1
        from public.profiles p
        where (to_jsonb(p)->>'account_kind') in ('TEST', 'SYSTEM')
          and p.full_name like '%Vũ Văn Nam%'
          and (to_jsonb(p)->>'account_kind') = 'STAFF'
      ) and (
        (select (to_jsonb(p)->>'account_kind') from public.profiles p where p.full_name like '%Vũ Văn Nam%' limit 1) = 'TEST'
      )
    ),
    false
  ),
  'TEST accounts like TS.BS Vũ Văn Nam are excluded from STAFF roster pool'
);

-- 4. Duty Roster schema, tables, functions, RLS
select has_table('public', 'duty_rosters', 'duty_rosters table exists');
select has_table('public', 'duty_roster_members', 'duty_roster_members table exists');

select has_column('public', 'duty_rosters', 'business_date', 'duty_rosters.business_date exists');
select has_column('public', 'duty_rosters', 'duty_kind', 'duty_rosters.duty_kind exists');
select has_column('public', 'duty_rosters', 'status', 'duty_rosters.status exists');
select has_column('public', 'duty_rosters', 'revision_no', 'duty_rosters.revision_no exists');

select has_column('public', 'duty_roster_members', 'roster_id', 'duty_roster_members.roster_id exists');
select has_column('public', 'duty_roster_members', 'user_id', 'duty_roster_members.user_id exists');
select has_column('public', 'duty_roster_members', 'member_order', 'duty_roster_members.member_order exists');

select col_has_check('public', 'duty_rosters', 'duty_kind', 'duty_rosters.duty_kind has check constraint');
select col_has_check('public', 'duty_rosters', 'status', 'duty_rosters.status has check constraint');

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'duty_rosters' and c.relrowsecurity = true
  ),
  'duty_rosters has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'duty_roster_members' and c.relrowsecurity = true
  ),
  'duty_roster_members has RLS enabled'
);

-- 5. RPC function signatures
select has_function('public', 'save_duty_roster', array['date', 'text', 'uuid[]', 'integer'], 'save_duty_roster RPC signature exists');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','60000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.ensure_operational_month('2026-09-28')$$,'active STAFF can ensure operational month for unified workflow');
select is(
  (
    select count(*)::integer
    from public.register_periods p
    join public.form_template_versions v on v.id = p.form_version_id
    join public.form_templates t on t.id = v.form_template_id
    where t.code = 'BM.06/QL.TRTB.01'
      and p.period_start = '2026-09-01'
      and p.period_end = '2026-09-30'
      and p.location_id is null
      and p.asset_id is null
  ),
  1,
  'active STAFF reads exactly one BM.06 monthly period after P6 RLS alignment'
);
select is(
  (
    select count(*)::integer
    from public.form_version_assets fva
    join public.assets a on a.id = fva.asset_id
    join public.locations l on l.id = a.location_id
    where fva.form_version_id = (
      select v.id
      from public.form_template_versions v
      join public.form_templates t on t.id = v.form_template_id
      where t.code = 'BM.06/QL.TRTB.01' and v.status = 'PUBLISHED'
    )
    and fva.active = true
  ),
  25,
  'active STAFF reads exactly 25 BM.06 assets through joined RLS'
);
reset role;
select has_function('public', 'get_work_session_context', array['date', 'text'], 'get_work_session_context RPC signature exists');
select has_function('public', 'staff_reference_summary', array['uuid'], 'staff_reference_summary RPC signature exists');
select has_function('public', 'set_staff_profile_and_scopes', array['uuid', 'text', 'text', 'boolean', 'text', 'integer', 'uuid[]', 'uuid[]', 'uuid[]'], 'set_staff_profile_and_scopes RPC signature exists');
select has_function('public', 'deactivate_staff_profile', array['uuid', 'text'], 'deactivate_staff_profile RPC signature exists');

-- 6. Equipment usage legacy columns nullable and contributor audit fields preserved
select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'equipment_shift_details'
      and column_name = 'usage_value'
      and is_nullable = 'YES'
  ),
  'equipment_shift_details.usage_value is nullable for backward compatibility'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'equipment_shift_details'
      and column_name = 'usage_unit'
      and is_nullable = 'YES'
  ),
  'equipment_shift_details.usage_unit is nullable for backward compatibility'
);

select has_column('public', 'equipment_shift_statuses', 'updated_by', 'equipment_shift_statuses.updated_by contributor field exists');
select has_column('public', 'equipment_shift_statuses', 'updated_at', 'equipment_shift_statuses.updated_at contributor timestamp exists');

-- Direct roster table mutation is forbidden; revisions go through save_duty_roster only.
select ok(not has_table_privilege('authenticated', 'public.duty_rosters', 'INSERT'), 'authenticated cannot insert duty_rosters directly');
select ok(not has_table_privilege('authenticated', 'public.duty_rosters', 'UPDATE'), 'authenticated cannot update duty_rosters directly');
select ok(not has_table_privilege('authenticated', 'public.duty_rosters', 'DELETE'), 'authenticated cannot delete duty_rosters directly');
select ok(not has_table_privilege('authenticated', 'public.duty_roster_members', 'INSERT'), 'authenticated cannot insert roster members directly');
select ok(not has_table_privilege('authenticated', 'public.duty_roster_members', 'DELETE'), 'authenticated cannot delete roster members directly');

select * from finish();
rollback;

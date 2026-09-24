begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'head@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doctor@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tech@test.local', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-tech@test.local', '', now(), now(), now());

insert into public.profiles (user_id, full_name, business_role, is_admin)
values
  ('10000000-0000-0000-0000-000000000001', 'Trưởng khoa Test', 'DEPARTMENT_HEAD', false),
  ('10000000-0000-0000-0000-000000000002', 'Bác sĩ Test', 'DOCTOR', false),
  ('10000000-0000-0000-0000-000000000003', 'Kỹ thuật viên Test', 'TECHNICIAN', false),
  ('10000000-0000-0000-0000-000000000004', 'KTV Admin Test', 'TECHNICIAN', true);

insert into public.user_scope_assignments (user_id, location_id, can_view, can_enter)
select '10000000-0000-0000-0000-000000000003', id, true, true
from public.locations where code = 'SINH_HOA';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is(public.current_business_role(), 'TECHNICIAN', 'technician role resolves from JWT');
select is(public.current_is_admin(), false, 'technician is not admin');
select is(public.is_department_head(), false, 'technician cannot approve as department head');
select is(
  (select count(*)::integer from public.assets),
  9,
  'technician only reads equipment in assigned Sinh hoa scope'
);
select is(
  (select count(*)::integer from public.profiles),
  1,
  'technician only reads own profile'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is(public.current_business_role(), 'DOCTOR', 'doctor role resolves from JWT');
select is(public.is_department_head(), false, 'doctor cannot approve as department head');
select is((select count(*)::integer from public.assets), 0, 'doctor without scope reads no equipment');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is(public.is_department_head(), true, 'department head is the sole business approver role');
select is((select count(*)::integer from public.assets), 38, 'department head reads all equipment and fridge assets');
select is((select count(*)::integer from public.profiles), 4, 'department head reads department profiles');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is(public.current_is_admin(), true, 'technician admin has system administration flag');
select is(public.is_department_head(), false, 'technician admin still cannot approve');
select lives_ok(
  $$ update public.locations set name = name where code = 'SINH_HOA' $$,
  'admin can manage master data'
);

select * from finish();
rollback;

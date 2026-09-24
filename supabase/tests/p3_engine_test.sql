begin;
create extension if not exists pgtap with schema extensions;
select plan(56);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p3@test.local','',now(),now(),now());
insert into public.profiles(user_id,full_name,business_role,is_admin)
values('30000000-0000-0000-0000-000000000001','P3 Test','TECHNICIAN',false);

select has_table('public','form_template_versions','version table exists');
select has_table('public','form_fields','field metadata exists');
select has_table('public','form_schedule_rules','schedule rules exist');
select has_table('public','form_version_assets','version asset snapshot exists');
select has_table('public','form_version_locations','version location scope exists');
select has_table('public','register_periods','period table exists');
select has_table('public','schedule_occurrences','occurrence table exists');
select has_table('public','records','record header exists');
select has_table('public','measurement_details','measurement detail exists');
select has_table('public','decontamination_details','KNBM detail exists');
select has_table('public','maintenance_details','maintenance detail exists');
select has_table('public','equipment_shift_details','BM06 header detail exists');
select has_table('public','equipment_shift_statuses','BM06 statuses exist');

select is((select count(*)::integer from public.form_template_versions where status='PUBLISHED'),6,'six published versions seeded');
select is((select count(*)::integer from public.form_schedule_rules r join public.form_template_versions v on v.id=r.form_version_id join public.form_templates t on t.id=v.form_template_id where t.code='BM.01/QL.HTAT.01'),2,'BM01 has two slot rules');
select is((select count(*)::integer from public.form_schedule_rules r join public.form_template_versions v on v.id=r.form_version_id join public.form_templates t on t.id=v.form_template_id where t.code='BM.06/QL.TRTB.01'),4,'BM06 has four shift rules');
select is((select count(*)::integer from public.form_version_assets a join public.form_template_versions v on v.id=a.form_version_id join public.form_templates t on t.id=v.form_template_id where t.code='BM.06/QL.TRTB.01'),25,'BM06 snapshots 25 assets');
select is((select min(display_order) from public.form_version_assets a join public.form_template_versions v on v.id=a.form_version_id join public.form_templates t on t.id=v.form_template_id where t.code='BM.06/QL.TRTB.01'),1,'BM06 order starts at 1');
select is((select max(display_order) from public.form_version_assets a join public.form_template_versions v on v.id=a.form_version_id join public.form_templates t on t.id=v.form_template_id where t.code='BM.06/QL.TRTB.01'),25,'BM06 order ends at 25');

select throws_ok($$update public.form_template_versions set version_label='changed' where status='PUBLISHED'$$,'P0001','Published form versions are immutable','published version update is rejected');
select throws_ok($$update public.form_fields set label='changed' where form_version_id=(select id from public.form_template_versions where status='PUBLISHED' limit 1)$$,'P0001','Published form configuration is immutable','published fields update is rejected');
select throws_ok($$delete from public.form_schedule_rules where form_version_id=(select id from public.form_template_versions where status='PUBLISHED' limit 1)$$,'P0001','Published form configuration is immutable','published rules delete is rejected');
select has_function('public','mark_occurrence_na',array['uuid','text'],'generic N/A RPC exists');

select lives_ok($$
  select public.create_or_get_period(
    (select v.id from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where t.code='BM.01/QL.HTAT.01' and v.status='PUBLISHED'),
    (select id from public.locations where code='SINH_HOA'), null,
    '2026-09-01','2026-09-30','Tháng 09/2026',null
  )
$$,'create period works');
select lives_ok($$
  select public.create_or_get_period(
    (select v.id from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where t.code='BM.01/QL.HTAT.01' and v.status='PUBLISHED'),
    (select id from public.locations where code='SINH_HOA'), null,
    '2026-09-01','2026-09-30','Tháng 09/2026',null
  )
$$,'creating same period twice is idempotent');
select is((select count(*)::integer from public.register_periods),1,'duplicate period not created');
select lives_ok($$select public.generate_period_occurrences((select id from public.register_periods limit 1))$$,'occurrence generation works');
select lives_ok($$select public.generate_period_occurrences((select id from public.register_periods limit 1))$$,'occurrence generation is idempotent');
select is((select count(*)::integer from public.schedule_occurrences),60,'BM01 September has exactly two slots per day');
select is((select count(distinct slot_code)::integer from public.schedule_occurrences),2,'BM01 occurrences use two distinct slots');

select is(public.measurement_is_abnormal(21,21,26),false,'21 is normal');
select is(public.measurement_is_abnormal(26,21,26),false,'26 is normal');
select is(public.measurement_is_abnormal(20.9,21,26),true,'20.9 is abnormal');
select is(public.measurement_is_abnormal(26.1,21,26),true,'26.1 is abnormal');
select is(public.measurement_is_abnormal(-30,-30,-10),false,'-30 is normal');
select is(public.measurement_is_abnormal(-10,-30,-10),false,'-10 is normal');
select is(public.measurement_is_abnormal(-30.1,-30,-10),true,'below -30 is abnormal');
select is(public.measurement_is_abnormal(-9.9,-30,-10),true,'above -10 is abnormal');

select throws_ok($$insert into public.records(id,period_id,form_version_id,record_type,business_date,entered_by,is_na,na_reason,record_state) values(gen_random_uuid(),(select id from public.register_periods limit 1),(select form_version_id from public.register_periods limit 1),'MEASUREMENT','2026-09-01',(select user_id from public.profiles limit 1),true,null,'COMPLETED')$$,'23514',null,'N/A without reason rejected');
select col_has_check('public','maintenance_details','cadence','maintenance cadence constrained');
select col_has_check('public','maintenance_details','result','maintenance result constrained');
select col_has_check('public','equipment_shift_statuses','status_code','BM06 status constrained');
select col_is_unique('public','equipment_shift_statuses',array['shift_record_id','asset_id'],'one status per asset per shift');
select has_function('public','save_measurement_record',array['uuid','timestamptz','numeric','numeric','text','boolean','text'],'measurement save RPC exists');
select has_function('public','save_decontamination_record',array['uuid','date','boolean','boolean','boolean','text'],'KNBM save RPC exists');
select has_function('public','save_maintenance_record',array['uuid','timestamptz','text','text','text'],'maintenance save RPC exists');
select has_function('public','save_equipment_shift_draft',array['uuid','numeric','text','text','jsonb','boolean','integer'],'BM06 draft/finalize RPC exists');
select ok((select relrowsecurity from pg_class where oid='public.records'::regclass),'records RLS enabled');

select throws_ok($$select public.validate_maintenance_values('QUARTERLY','PASS')$$,'22023','Invalid maintenance cadence','maintenance rejects non-MVP cadence');
select throws_ok($$select public.validate_maintenance_values('DAILY','UNKNOWN')$$,'22023','Invalid maintenance result','maintenance rejects invalid result');
select throws_ok($$select public.validate_shift_status_payload(
  (select v.id from public.form_template_versions v join public.form_templates t on t.id=v.form_template_id where t.code='BM.06/QL.TRTB.01' and v.status='PUBLISHED'),
  jsonb_build_array(
    jsonb_build_object('asset_id',(select asset_id from public.form_version_assets limit 1),'status','BT'),
    jsonb_build_object('asset_id',(select asset_id from public.form_version_assets limit 1),'status','BT')
  ),false
)$$,'22023','Duplicate asset status','BM06 rejects duplicate asset IDs');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin-only@test.local','',now(),now(),now());
insert into public.profiles(user_id,full_name,business_role,is_admin) values('30000000-0000-0000-0000-000000000002','Admin only','TECHNICIAN',true);
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.assert_entry_access((select id from public.register_periods limit 1))$$,'P0001','Entry scope denied','admin flag alone cannot enter business records');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
select is(public.ensure_operational_month('2026-10-15'),47,'operational month creates all 47 scoped periods');
select is((select count(*)::integer from public.register_periods where period_start='2026-10-01'),47,'October has exactly 47 periods');
select is(public.ensure_operational_month('2026-10-15'),47,'operational month bootstrap is repeatable');
select is((select count(*)::integer from public.schedule_occurrences o join public.register_periods p on p.id=o.period_id join public.form_schedule_rules r on r.id=o.schedule_rule_id where p.period_start='2026-10-01' and r.schedule_type='EVENT'),0,'spill event creates no scheduled obligation');

select * from finish();
rollback;

begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','head-p4@test.local','',now(),now(),now()),
('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tech-p4@test.local','',now(),now(),now()),
('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin-tech-p4@test.local','',now(),now(),now());
insert into public.profiles(user_id,full_name,business_role,is_admin) values
('40000000-0000-0000-0000-000000000001','Head P4','DEPARTMENT_HEAD',false),
('40000000-0000-0000-0000-000000000002','Tech P4','TECHNICIAN',false),
('40000000-0000-0000-0000-000000000003','Admin Tech P4','TECHNICIAN',true);
insert into public.user_scope_assignments(user_id,location_id,can_view,can_enter)
select '40000000-0000-0000-0000-000000000002',id,true,true from public.locations where code='SINH_HOA';

select has_table('public','period_actions','period workflow history exists');
select has_table('public','audit_events','append-only audit exists');
select has_table('public','correction_requests','correction workflow exists');
select has_function('public','mark_period_ready',array['uuid','integer'],'mark ready RPC exists');
select has_function('public','return_period',array['uuid','text','integer'],'return RPC exists');
select has_function('public','approve_period',array['uuid','integer'],'approve RPC exists');
select has_function('public','create_correction',array['uuid','text','jsonb'],'create correction RPC exists');
select has_function('public','approve_correction',array['uuid'],'approve correction RPC exists');
select ok((select relrowsecurity from pg_class where oid='public.period_actions'::regclass),'period actions RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.audit_events'::regclass),'audit RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.correction_requests'::regclass),'correction RLS enabled');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select public.ensure_operational_month('2026-11-15');
reset role;
insert into public.period_actions(period_id,action,actor_user_id)
select p.id,'MARK_READY','40000000-0000-0000-0000-000000000001' from public.register_periods p join public.locations l on l.id=p.location_id where l.code='MIEN_DICH' limit 1;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.period_actions pa join public.register_periods p on p.id=pa.period_id join public.locations l on l.id=p.location_id where l.code='MIEN_DICH'),0,'period action history is hidden outside user scope');
create temporary table p4_target_period as
select p.id from public.register_periods p
join public.form_template_versions v on v.id=p.form_version_id
join public.form_templates t on t.id=v.form_template_id
join public.locations l on l.id=p.location_id
where p.period_start='2026-11-01' and t.code='BM.01/QL.HTAT.01' and l.code='SINH_HOA';
select throws_ok($$select public.mark_period_ready((select id from p4_target_period),1)$$,'P0001','Period has pending obligations','pending period cannot be ready');
reset role;
insert into public.records(id,period_id,form_version_id,record_type,location_id,business_date,slot_code,performed_at,entered_by,record_state)
select '40000000-0000-0000-0000-000000000101',p.id,p.form_version_id,'MEASUREMENT',p.location_id,'2026-11-01','MORNING',now(),'40000000-0000-0000-0000-000000000002','COMPLETED'
from public.register_periods p where p.id=(select id from p4_target_period);
insert into public.measurement_details(record_id,temperature_c,humidity_pct,temperature_min_snapshot,temperature_max_snapshot,humidity_min_snapshot,humidity_max_snapshot)
values('40000000-0000-0000-0000-000000000101',23,55,21,26,20,80);
update public.schedule_occurrences set status='N_A' where period_id=(select id from p4_target_period);
update public.schedule_occurrences set status='COMPLETED',fulfilled_by_record_id='40000000-0000-0000-0000-000000000101' where id=(select id from public.schedule_occurrences where period_id=(select id from p4_target_period) order by business_date,slot_code limit 1);
set local role authenticated;
select lives_ok($$select public.mark_period_ready((select id from p4_target_period),1)$$,'scoped entrant can mark complete period ready');
select is((select status from public.register_periods where id=(select id from p4_target_period)),'READY_FOR_REVIEW','period is ready');
select is((select count(*)::integer from public.period_actions where action='MARK_READY'),1,'mark ready action appended');
select is((select count(*)::integer from public.audit_events where action='MARK_READY'),1,'mark ready audited');
select throws_ok($$select public.approve_period((select id from p4_target_period),2)$$,'42501','Only department head can approve periods','technician cannot approve');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.approve_period((select id from p4_target_period),2)$$,'42501','Only department head can approve periods','admin technician cannot approve');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000001',true);
select throws_ok($$select public.return_period((select id from p4_target_period),' ',2)$$,'22023','Return reason is required','return reason required');
select lives_ok($$select public.return_period((select id from p4_target_period),'Bổ sung thông tin',2)$$,'head returns period');
select is((select status from public.register_periods where id=(select id from p4_target_period)),'RETURNED','period returned');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.mark_period_ready((select id from p4_target_period),3)$$,'returned period can be resubmitted');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.approve_period((select id from p4_target_period),4)$$,'head approves complete ready period');
select is((select status from public.register_periods where id=(select id from p4_target_period)),'APPROVED','period approved');
select ok((select approved_by is not null and approved_at is not null from public.register_periods where id=(select id from p4_target_period)),'approval metadata recorded');
select throws_ok($$select public.approve_period((select id from p4_target_period),5)$$,'P0001','Period is not ready for approval','double approve protected');
select is((select count(*)::integer from public.period_actions where action='APPROVE'),1,'single approve action appended');
reset role;
select throws_ok($$update public.records set note='tamper' where id='40000000-0000-0000-0000-000000000101'$$,'42501','Approved period records are immutable','approved record direct update rejected');
select set_config('app.correction_workflow','on',true);
select throws_ok($$update public.records set note='spoofed workflow' where id='40000000-0000-0000-0000-000000000101'$$,'42501','Approved period records are immutable','legacy workflow flag cannot bypass immutable trigger');
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.create_correction('40000000-0000-0000-0000-000000000101',' ',jsonb_build_object('temperature_c',24))$$,'22023','Correction reason is required','correction reason required');
select lives_ok($$select public.create_correction('40000000-0000-0000-0000-000000000101','Hiệu chỉnh nhiệt độ',jsonb_build_object('temperature_c',24))$$,'scoped entrant creates pending correction');
select is((select count(*)::integer from public.records where revision_of_record_id='40000000-0000-0000-0000-000000000101'),1,'replacement revision created');
select ok((select is_effective from public.records where id='40000000-0000-0000-0000-000000000101'),'original remains effective before correction approval');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.approve_correction((select id from public.correction_requests limit 1))$$,'head approves correction');
select is((select count(*)::integer from public.records where revision_of_record_id='40000000-0000-0000-0000-000000000101' and is_effective),1,'replacement becomes effective');
select isnt((select fulfilled_by_record_id from public.schedule_occurrences where fulfilled_by_record_id is not null limit 1),'40000000-0000-0000-0000-000000000101'::uuid,'occurrence pointer moves from original');
select is((select count(*)::integer from public.audit_events where action in ('CORRECTION_REQUEST','CORRECTION_APPROVE')),2,'correction actions audited');
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.create_correction((select id from public.records where revision_of_record_id='40000000-0000-0000-0000-000000000101' and is_effective),'Hiệu chỉnh lần hai',jsonb_build_object('temperature_c',25))$$,'second correction can target effective revision');
select ok((select count(*)=1 from public.records where revision_of_record_id='40000000-0000-0000-0000-000000000101' and revision_no=3),'second correction stays on root chain with revision 3');
reset role;
select throws_ok($$update public.period_actions set reason='tamper'$$,'42501','Period actions are append-only','period action update rejected');
select throws_ok($$delete from public.audit_events$$,'42501','Audit events are append-only','audit delete rejected');
select ok((select count(*) from public.audit_events where action='CREATE_RECORD')>=2,'record creation audited');
select ok((select count(*) from public.audit_events where action='EDIT_RECORD')>=2,'record edits audited');
insert into public.records(id,period_id,form_version_id,record_type,location_id,business_date,entered_by,is_na,na_reason,record_state)
select '40000000-0000-0000-0000-000000000102',p.id,p.form_version_id,'MEASUREMENT',p.location_id,'2026-11-02','40000000-0000-0000-0000-000000000002',true,'Ngày nghỉ','N_A' from public.register_periods p where p.period_start='2026-11-01' and p.status='OPEN' limit 1;
select is((select count(*)::integer from public.audit_events where action='MARK_NA'),1,'N/A audited');
update public.profiles set business_role='DOCTOR' where user_id='40000000-0000-0000-0000-000000000002';
select is((select count(*)::integer from public.audit_events where action='ROLE_CHANGE'),1,'business role changes audited');
update public.profiles set is_admin=true where user_id='40000000-0000-0000-0000-000000000002';
select is((select count(*)::integer from public.audit_events where action='ADMIN_CHANGE'),1,'admin flag changes audited');
update public.profiles set business_role='DOCTOR',is_admin=false where user_id='40000000-0000-0000-0000-000000000003';
select ok((select count(*) from public.audit_events where action='ROLE_CHANGE')=2 and (select count(*) from public.audit_events where action='ADMIN_CHANGE')=2,'combined role and admin update emits both audit events');
update public.locations set name=name where code='SINH_HOA';
select ok((select count(*) from public.audit_events where action='MASTER_DATA_CHANGE')>=1,'master data changes audited');
insert into public.form_template_versions(id,form_template_id,version_label,status,created_by)
select '40000000-0000-0000-0000-000000000105',id,'p4-audit-draft','DRAFT','40000000-0000-0000-0000-000000000001' from public.form_templates limit 1;
update public.form_template_versions set status='PUBLISHED',published_at=now() where id='40000000-0000-0000-0000-000000000105';
select is((select count(*)::integer from public.audit_events where action='TEMPLATE_PUBLISH'),1,'template publishing audited');

insert into public.correction_transaction_authorizations(transaction_id,period_id) values(txid_current(),(select id from p4_target_period));
insert into public.records(id,period_id,form_version_id,record_type,location_id,business_date,entered_by,record_state)
select '40000000-0000-0000-0000-000000000103',p.id,p.form_version_id,'DECONTAMINATION',p.location_id,'2026-11-03','40000000-0000-0000-0000-000000000002','COMPLETED' from public.register_periods p where p.id=(select id from p4_target_period);
insert into public.decontamination_details(record_id,daily_done,weekly_done) values('40000000-0000-0000-0000-000000000103',true,true);
insert into public.records(id,period_id,form_version_id,record_type,location_id,business_date,slot_code,entered_by,record_state)
select '40000000-0000-0000-0000-000000000104',p.id,p.form_version_id,'EQUIPMENT_SHIFT',p.location_id,'2026-11-03','SHIFT_4','40000000-0000-0000-0000-000000000002','COMPLETED' from public.register_periods p where p.id=(select id from p4_target_period);
insert into public.equipment_shift_details(record_id) values('40000000-0000-0000-0000-000000000104');
insert into public.equipment_shift_statuses(shift_record_id,asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot)
select '40000000-0000-0000-0000-000000000104',a.id,a.source_order,'BT',a.source_name from public.assets a where a.location_id=(select location_id from public.register_periods where id=(select id from p4_target_period)) order by a.source_order limit 1;
delete from public.correction_transaction_authorizations where transaction_id=txid_current();
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.create_correction('40000000-0000-0000-0000-000000000103','Bỏ vệ sinh ngày',jsonb_build_object('daily_done',false,'weekly_done',true,'spill_event_done',false))$$,'KNBM correction accepts explicit false');
select is((select daily_done from public.decontamination_details d join public.records r on r.id=d.record_id where r.revision_of_record_id='40000000-0000-0000-0000-000000000103'),false,'KNBM replacement stores false');
select lives_ok($$select public.create_correction('40000000-0000-0000-0000-000000000104','Máy chuyển trạng thái hỏng',jsonb_build_object('statuses',jsonb_build_array(jsonb_build_object('asset_id',(select asset_id from public.equipment_shift_statuses where shift_record_id='40000000-0000-0000-0000-000000000104'),'status','H'))))$$,'BM06 correction accepts per-asset statuses');
select is((select status_code from public.equipment_shift_statuses s join public.records r on r.id=s.shift_record_id where r.revision_of_record_id='40000000-0000-0000-0000-000000000104'),'H','BM06 replacement applies corrected status');

select * from finish();
rollback;

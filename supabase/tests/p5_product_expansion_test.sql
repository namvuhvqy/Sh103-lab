begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

select has_table('public','announcements','announcements table exists');
select has_table('public','notifications','notifications table exists');
select has_table('public','incident_categories','incident categories table exists');
select has_table('public','incidents','incidents table exists');
select has_table('public','incident_events','incident timeline exists');
select has_function('public','publish_announcement',array['uuid'],'announcement publish RPC exists');
select has_function('public','mark_notification_read',array['uuid'],'notification read RPC exists');
select has_function('public','mark_all_notifications_read',array[]::text[],'all-read RPC exists');
select has_function('public','create_incident',array['date','timestamp with time zone','uuid','uuid','uuid','text','text','text','text','uuid'],'incident creation RPC exists');
select has_function('public','transition_incident',array['uuid','text','text'],'incident transition RPC exists');
select ok((select relrowsecurity from pg_class where oid='public.announcements'::regclass),'announcement RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.notifications'::regclass),'notification RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.incidents'::regclass),'incident RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.incident_events'::regclass),'incident event RLS enabled');
select is((select count(*)::integer from public.incident_categories where active),5,'five approved incident categories seeded');
select set_eq(
  $$select code from public.incident_categories where active$$,
  $$select code from (values('EQUIPMENT'),('ENVIRONMENT'),('SAFETY_SPILL'),('PROCESS'),('OTHER')) as expected(code)$$,
  'only approved category codes exist'
);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','head-p5@test.local','',now(),now(),now()),
('50000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tech-p5@test.local','',now(),now(),now()),
('50000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin-tech-p5@test.local','',now(),now(),now()),
('50000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','doctor-p5@test.local','',now(),now(),now());
insert into public.profiles(user_id,full_name,business_role,is_admin) values
('50000000-0000-0000-0000-000000000001','Head P5','DEPARTMENT_HEAD',false),
('50000000-0000-0000-0000-000000000002','Tech P5','TECHNICIAN',false),
('50000000-0000-0000-0000-000000000003','Admin Tech P5','TECHNICIAN',true),
('50000000-0000-0000-0000-000000000004','Doctor P5','DOCTOR',false);
insert into public.user_scope_assignments(user_id,location_id,can_view,can_enter)
select '50000000-0000-0000-0000-000000000002',id,true,true from public.locations where code='SINH_HOA';
insert into public.user_scope_assignments(user_id,location_id,can_view,can_enter)
select '50000000-0000-0000-0000-000000000004',id,true,true from public.locations where code='MIEN_DICH';

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select throws_ok($$insert into public.announcements(title,body,audience_type,severity,publish_at,created_by) values('x','x','ALL','INFO',now(),auth.uid())$$,'42501',null,'non-admin cannot create announcement directly');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select lives_ok($$insert into public.announcements(title,body,audience_type,severity,publish_at,created_by) values('Bản nháp','Nội dung','ALL','INFO',now(),auth.uid())$$,'admin creates announcement draft');
select throws_ok($$insert into public.announcements(title,body,audience_type,severity,publish_at,created_by,active) values('Bypass','Nội dung','ALL','INFO',now(),auth.uid(),true)$$,'42501',null,'admin cannot bypass publish RPC with active insert');
select is_empty($$update public.announcements set active=true where title='Bản nháp' returning id$$,'admin cannot bypass audited publish RPC with direct update');
reset role;

insert into public.announcements(id,title,body,audience_type,severity,publish_at,created_by,active)
values('50000000-0000-0000-0000-000000000101','Thông báo toàn khoa','Nội dung','ALL','INFO',now(),'50000000-0000-0000-0000-000000000003',false);
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.publish_announcement('50000000-0000-0000-0000-000000000101')$$,'42501','Admin permission required','non-admin cannot publish');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select lives_ok($$select public.publish_announcement('50000000-0000-0000-0000-000000000101')$$,'admin publishes announcement');
reset role;
select is((select count(*)::integer from public.notifications where source_type='ANNOUNCEMENT' and source_id='50000000-0000-0000-0000-000000000101'),4,'announcement fans out once to active users');
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select lives_ok($$select public.publish_announcement('50000000-0000-0000-0000-000000000101')$$,'announcement publish is idempotent');
reset role;
select is((select count(*)::integer from public.notifications where source_type='ANNOUNCEMENT' and source_id='50000000-0000-0000-0000-000000000101'),4,'idempotency prevents duplicate notifications');
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.notifications),1,'recipient sees only own notification');
select lives_ok($$select public.mark_notification_read((select id from public.notifications limit 1))$$,'recipient marks own notification read');
select ok((select read_at is not null from public.notifications limit 1),'read timestamp recorded');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000004',true);
select lives_ok($$select public.mark_all_notifications_read()$$,'recipient marks all notifications read');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.create_incident('2026-09-25',now(),(select id from public.locations where code='SINH_HOA'),null,(select id from public.incident_categories where code='EQUIPMENT'),'HIGH','Lỗi máy','Mô tả sự cố','Đã cô lập máy',null)$$,'scoped technician creates incident manually');
select is((select status from public.incidents where reporter_user_id=auth.uid()),'OPEN','new incident starts OPEN');
select ok((select incident_code ~ '^SC-[0-9]{8}-[0-9]{4}$' from public.incidents where reporter_user_id=auth.uid()),'incident code generated server-side');
select is((select count(*)::integer from public.incident_events where action='CREATE'),1,'incident creation event appended');
select throws_ok($$select public.create_incident('2026-09-25',now(),(select id from public.locations where code='MIEN_DICH'),null,(select id from public.incident_categories where code='OTHER'),'LOW','Ngoài scope','Không được phép',null,null)$$,'42501','Incident scope denied','technician cannot create outside scope');
select throws_ok($$select public.transition_incident((select id from public.incidents where reporter_user_id=auth.uid()),'IN_REVIEW','Đang xem')$$,'42501','Only department head can transition incidents','technician cannot review incident');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.transition_incident((select id from public.incidents limit 1),'IN_REVIEW','Admin review')$$,'42501','Only department head can transition incidents','admin technician cannot review incident');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.transition_incident((select id from public.incidents limit 1),'IN_REVIEW','Đã tiếp nhận')$$,'head moves incident to review');
select lives_ok($$select public.transition_incident((select id from public.incidents limit 1),'RESOLVED','Đã xử lý an toàn')$$,'head resolves incident');
select lives_ok($$select public.transition_incident((select id from public.incidents limit 1),'CLOSED','Đóng hồ sơ')$$,'head closes incident');
select is((select status from public.incidents limit 1),'CLOSED','incident reaches CLOSED');
select ok((select resolved_by='50000000-0000-0000-0000-000000000001' and resolved_at is not null from public.incidents limit 1),'resolution actor and time recorded');
select throws_ok($$select public.transition_incident((select id from public.incidents limit 1),'OPEN','reopen')$$,'P0001','Invalid incident transition','closed incident cannot reopen');
reset role;
select throws_ok($$update public.incident_events set note='tamper'$$,'42501','Audit events are append-only','incident event update rejected');
select throws_ok($$delete from public.incident_events$$,'42501','Audit events are append-only','incident event delete rejected');
select ok((select count(*) from public.audit_events where action in ('ANNOUNCEMENT_PUBLISH','INCIDENT_CREATE','INCIDENT_STATUS_CHANGE'))>=5,'P5 workflows audited');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='incidents' and column_name in ('patient_id','patient_name','attachment_url')),'incident schema contains no patient or attachment fields');

select * from finish();
rollback;

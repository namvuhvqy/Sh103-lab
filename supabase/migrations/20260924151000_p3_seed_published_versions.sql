-- Phase 3: Bootstrap published version snapshots for the six locked pilot forms.
-- Deterministic UUIDv5 IDs and idempotent on conflict clauses.

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

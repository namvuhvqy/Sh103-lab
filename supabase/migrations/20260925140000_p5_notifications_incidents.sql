-- Phase 5: in-app notifications, admin announcements, and manual incident workflow.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (nullif(btrim(title),'') is not null),
  body text not null check (nullif(btrim(body),'') is not null),
  audience_type text not null check (audience_type in ('ALL','ROLE','LOCATION','USER')),
  audience_ref text,
  severity text not null default 'INFO' check (severity in ('INFO','SUCCESS','WARNING','CRITICAL')),
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active boolean not null default false,
  published_at timestamptz,
  check ((audience_type='ALL' and audience_ref is null) or (audience_type<>'ALL' and nullif(btrim(audience_ref),'') is not null)),
  check (expires_at is null or expires_at > publish_at)
);
create index announcements_active_time_idx on public.announcements(active,publish_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(user_id) on delete restrict,
  kind text not null,
  title text not null check (nullif(btrim(title),'') is not null),
  body text not null check (nullif(btrim(body),'') is not null),
  severity text not null default 'INFO' check (severity in ('INFO','SUCCESS','WARNING','CRITICAL')),
  target_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz,
  source_type text,
  source_id uuid,
  idempotency_key text not null unique
);
create index notifications_recipient_unread_idx on public.notifications(recipient_user_id,created_at desc) where read_at is null;
create index notifications_recipient_time_idx on public.notifications(recipient_user_id,created_at desc);

create table public.incident_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  sort_order integer not null,
  created_at timestamptz not null default now()
);
insert into public.incident_categories(id,code,name,sort_order) values
('51000000-0000-0000-0000-000000000001','EQUIPMENT','Thiết bị',1),
('51000000-0000-0000-0000-000000000002','ENVIRONMENT','Môi trường',2),
('51000000-0000-0000-0000-000000000003','SAFETY_SPILL','An toàn / tràn đổ',3),
('51000000-0000-0000-0000-000000000004','PROCESS','Quy trình',4),
('51000000-0000-0000-0000-000000000005','OTHER','Khác',5)
on conflict(code) do update set name=excluded.name,sort_order=excluded.sort_order;

create sequence public.incident_code_sequence;
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique,
  business_date date not null,
  occurred_at timestamptz not null,
  reported_at timestamptz not null default now(),
  reporter_user_id uuid not null references public.profiles(user_id),
  location_id uuid references public.locations(id),
  asset_id uuid references public.assets(id),
  category_id uuid not null references public.incident_categories(id),
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  title text not null check (nullif(btrim(title),'') is not null),
  description text not null check (nullif(btrim(description),'') is not null and char_length(description)<=500),
  immediate_action text,
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','CLOSED')),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(user_id),
  resolution_note text,
  linked_record_id uuid references public.records(id),
  updated_at timestamptz not null default now(),
  lock_version integer not null default 1,
  check (location_id is not null or asset_id is not null),
  check ((status in ('RESOLVED','CLOSED') and resolved_at is not null and resolved_by is not null and nullif(btrim(resolution_note),'') is not null) or status in ('OPEN','IN_REVIEW'))
);
create index incidents_status_time_idx on public.incidents(status,reported_at desc);
create index incidents_location_time_idx on public.incidents(location_id,reported_at desc);
create index incidents_reporter_time_idx on public.incidents(reporter_user_id,reported_at desc);

create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete restrict,
  action text not null check (action in ('CREATE','EDIT','IN_REVIEW','RESOLVE','CLOSE')),
  actor_user_id uuid not null references public.profiles(user_id),
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now()
);
create index incident_events_incident_time_idx on public.incident_events(incident_id,created_at);
create trigger incident_events_append_only before update or delete on public.incident_events for each row execute function public.prevent_append_only_mutation();

create or replace function public.notification_audience_matches(target_user uuid, target_type text, target_ref text)
returns boolean language sql stable security definer set search_path='' as $$
  select case target_type
    when 'ALL' then true
    when 'ROLE' then exists(select 1 from public.profiles p where p.user_id=target_user and p.business_role=target_ref and p.active)
    when 'USER' then target_user::text=target_ref
    when 'LOCATION' then exists(select 1 from public.user_scope_assignments s join public.locations l on l.id=s.location_id where s.user_id=target_user and s.active and l.code=target_ref)
    else false end
$$;
revoke all on function public.notification_audience_matches(uuid,text,text) from public,anon,authenticated;

create or replace function public.publish_announcement(target_announcement_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare a public.announcements%rowtype; before_row jsonb;
begin
  if auth.uid() is null or not public.current_is_admin() then raise exception using errcode='42501',message='Admin permission required'; end if;
  select * into a from public.announcements where id=target_announcement_id for update;
  if not found then raise exception 'Announcement not found'; end if;
  before_row:=to_jsonb(a);
  update public.announcements set active=true,published_at=coalesce(published_at,now()),updated_at=now() where id=a.id;
  insert into public.notifications(recipient_user_id,kind,title,body,severity,target_url,expires_at,source_type,source_id,idempotency_key)
  select p.user_id,'ADMIN_ANNOUNCEMENT',a.title,a.body,a.severity,'/notifications',a.expires_at,'ANNOUNCEMENT',a.id,'announcement:'||a.id::text||':'||p.user_id::text
  from public.profiles p where p.active and public.notification_audience_matches(p.user_id,a.audience_type,a.audience_ref)
  on conflict(idempotency_key) do nothing;
  perform public.audit_event('ANNOUNCEMENT_PUBLISH','announcement',a.id,before_row,(select to_jsonb(x) from public.announcements x where x.id=a.id));
end $$;

create or replace function public.deactivate_announcement(target_announcement_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare before_row jsonb;
begin
  if auth.uid() is null or not public.current_is_admin() then raise exception using errcode='42501',message='Admin permission required'; end if;
  select to_jsonb(a) into before_row from public.announcements a where a.id=target_announcement_id for update;
  if before_row is null then raise exception 'Announcement not found'; end if;
  update public.announcements set active=false,updated_at=now() where id=target_announcement_id;
  perform public.audit_event('ANNOUNCEMENT_DEACTIVATE','announcement',target_announcement_id,before_row,(select to_jsonb(x) from public.announcements x where x.id=target_announcement_id));
end $$;

create or replace function public.mark_notification_read(target_notification_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.notifications set read_at=coalesce(read_at,now()) where id=target_notification_id and recipient_user_id=auth.uid();
  if not found then raise exception using errcode='42501',message='Notification access denied'; end if;
end $$;

create or replace function public.mark_all_notifications_read()
returns integer language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Authentication required'; end if;
  update public.notifications set read_at=now() where recipient_user_id=auth.uid() and read_at is null;
  get diagnostics affected=row_count;
  return affected;
end $$;

create or replace function public.incident_scope_allowed(target_location_id uuid,target_asset_id uuid,target_enter boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
  select public.is_department_head() or exists(
    select 1 from public.user_scope_assignments s
    where s.user_id=auth.uid() and s.active and s.can_view
      and (not target_enter or s.can_enter)
      and (
        (target_location_id is not null and s.location_id=target_location_id)
        or (target_asset_id is not null and (s.asset_id=target_asset_id or s.location_id=(select a.location_id from public.assets a where a.id=target_asset_id)))
      )
  )
$$;
revoke all on function public.incident_scope_allowed(uuid,uuid,boolean) from public,anon;
grant execute on function public.incident_scope_allowed(uuid,uuid,boolean) to authenticated;

create or replace function public.create_incident(
  target_business_date date,target_occurred_at timestamptz,target_location_id uuid,target_asset_id uuid,target_category_id uuid,
  target_severity text,target_title text,target_description text,target_immediate_action text default null,target_linked_record_id uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; new_code text;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if not public.incident_scope_allowed(target_location_id,target_asset_id,true) then raise exception using errcode='42501',message='Incident scope denied'; end if;
  if target_asset_id is not null and target_location_id is not null and not exists(select 1 from public.assets a where a.id=target_asset_id and a.location_id=target_location_id) then raise exception using errcode='22023',message='Asset does not belong to location'; end if;
  if target_linked_record_id is not null and not exists(select 1 from public.records r where r.id=target_linked_record_id) then raise exception using errcode='22023',message='Linked record not found'; end if;
  new_code:='SC-'||to_char(target_business_date,'YYYYMMDD')||'-'||lpad(nextval('public.incident_code_sequence')::text,4,'0');
  insert into public.incidents(incident_code,business_date,occurred_at,reporter_user_id,location_id,asset_id,category_id,severity,title,description,immediate_action,linked_record_id)
  values(new_code,target_business_date,target_occurred_at,auth.uid(),target_location_id,target_asset_id,target_category_id,target_severity,btrim(target_title),btrim(target_description),nullif(btrim(target_immediate_action),''),target_linked_record_id)
  returning id into new_id;
  insert into public.incident_events(incident_id,action,actor_user_id,to_status) values(new_id,'CREATE',auth.uid(),'OPEN');
  perform public.audit_event('INCIDENT_CREATE','incident',new_id,null,(select to_jsonb(x) from public.incidents x where x.id=new_id));
  return new_id;
end $$;

create or replace function public.transition_incident(target_incident_id uuid,target_status text,target_note text)
returns void language plpgsql security definer set search_path='' as $$
declare i public.incidents%rowtype; expected text; event_action text; before_row jsonb;
begin
  if auth.uid() is null or not public.is_department_head() then raise exception using errcode='42501',message='Only department head can transition incidents'; end if;
  if nullif(btrim(target_note),'') is null then raise exception using errcode='22023',message='Transition note is required'; end if;
  select * into i from public.incidents where id=target_incident_id for update;
  if not found then raise exception 'Incident not found'; end if;
  expected:=case i.status when 'OPEN' then 'IN_REVIEW' when 'IN_REVIEW' then 'RESOLVED' when 'RESOLVED' then 'CLOSED' else null end;
  if target_status is distinct from expected then raise exception 'Invalid incident transition'; end if;
  before_row:=to_jsonb(i);
  event_action:=case target_status when 'IN_REVIEW' then 'IN_REVIEW' when 'RESOLVED' then 'RESOLVE' else 'CLOSE' end;
  update public.incidents set status=target_status,
    resolved_at=case when target_status in ('RESOLVED','CLOSED') then coalesce(resolved_at,now()) else null end,
    resolved_by=case when target_status in ('RESOLVED','CLOSED') then coalesce(resolved_by,auth.uid()) else null end,
    resolution_note=case when target_status in ('RESOLVED','CLOSED') then btrim(target_note) else resolution_note end,
    updated_at=now(),lock_version=lock_version+1 where id=i.id;
  insert into public.incident_events(incident_id,action,actor_user_id,from_status,to_status,note) values(i.id,event_action,auth.uid(),i.status,target_status,btrim(target_note));
  perform public.audit_event('INCIDENT_STATUS_CHANGE','incident',i.id,before_row,(select to_jsonb(x) from public.incidents x where x.id=i.id));
end $$;

alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.incident_categories enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_events enable row level security;

create policy announcements_admin_read on public.announcements for select to authenticated using(public.current_is_admin());
create policy announcements_admin_create on public.announcements for insert to authenticated
  with check(public.current_is_admin() and created_by=auth.uid() and active=false and published_at is null);
create policy notifications_own_read on public.notifications for select to authenticated using(recipient_user_id=auth.uid() and (expires_at is null or expires_at>now()));
create policy incident_categories_read on public.incident_categories for select to authenticated using(active or public.current_is_admin());
create policy incidents_scope_read on public.incidents for select to authenticated using(reporter_user_id=auth.uid() or public.incident_scope_allowed(location_id,asset_id,false));
create policy incident_events_scope_read on public.incident_events for select to authenticated using(exists(select 1 from public.incidents i where i.id=incident_id and (i.reporter_user_id=auth.uid() or public.incident_scope_allowed(i.location_id,i.asset_id,false))));

grant select,insert on public.announcements to authenticated;
grant select on public.notifications,public.incident_categories,public.incidents,public.incident_events to authenticated;
revoke all on function public.publish_announcement(uuid),public.deactivate_announcement(uuid),public.mark_notification_read(uuid),public.mark_all_notifications_read(),public.create_incident(date,timestamptz,uuid,uuid,uuid,text,text,text,text,uuid),public.transition_incident(uuid,text,text) from public;
grant execute on function public.publish_announcement(uuid),public.deactivate_announcement(uuid),public.mark_notification_read(uuid),public.mark_all_notifications_read(),public.create_incident(date,timestamptz,uuid,uuid,uuid,text,text,text,text,uuid),public.transition_incident(uuid,text,text) to authenticated;

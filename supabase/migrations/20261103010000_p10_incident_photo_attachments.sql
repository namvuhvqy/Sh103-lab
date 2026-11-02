-- Incident photo evidence (chụp ảnh / ghi nhận hình ảnh sự cố).
-- Purely additive: new table + new private storage bucket + one SECURITY DEFINER RPC.
-- Does NOT alter incidents, incident_events, or any existing policy/function.

create table if not exists public.incident_attachments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete restrict,
  storage_path text not null unique,
  thumb_path text unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  caption text check (caption is null or char_length(caption) <= 200),
  uploaded_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists incident_attachments_incident_time_idx on public.incident_attachments(incident_id, created_at);

-- ISO 15189 traceability: evidence is append-only (no edit / delete through the API).
drop trigger if exists incident_attachments_append_only on public.incident_attachments;
create trigger incident_attachments_append_only before update or delete on public.incident_attachments
  for each row execute function public.prevent_append_only_mutation();

alter table public.incident_attachments enable row level security;
drop policy if exists incident_attachments_scope_read on public.incident_attachments;
create policy incident_attachments_scope_read on public.incident_attachments for select to authenticated
  using (exists (
    select 1 from public.incidents i
    where i.id = incident_id
      and (i.reporter_user_id = auth.uid() or public.incident_scope_allowed(i.location_id, i.asset_id, false))
  ));
revoke all on public.incident_attachments from public, anon, authenticated;
grant select on public.incident_attachments to authenticated;

create or replace function public.add_incident_attachment(
  target_incident_id uuid,
  target_storage_path text,
  target_thumb_path text,
  target_mime_type text,
  target_size_bytes integer,
  target_width integer default null,
  target_height integer default null,
  target_caption text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare i public.incidents%rowtype; new_id uuid; existing integer; prefix text;
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select * into i from public.incidents where id = target_incident_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Incident not found'; end if;
  if not (i.reporter_user_id = auth.uid() or public.incident_scope_allowed(i.location_id, i.asset_id, false)) then
    raise exception using errcode = '42501', message = 'Incident scope denied';
  end if;
  if i.status = 'CLOSED' then raise exception using errcode = '22023', message = 'Incident is closed'; end if;
  prefix := 'incidents/' || i.id::text || '/';
  if left(target_storage_path, char_length(prefix)) <> prefix
     or (target_thumb_path is not null and left(target_thumb_path, char_length(prefix)) <> prefix) then
    raise exception using errcode = '22023', message = 'Invalid attachment path';
  end if;
  select count(*) into existing from public.incident_attachments where incident_id = i.id;
  if existing >= 8 then raise exception using errcode = '22023', message = 'Attachment limit reached'; end if;
  insert into public.incident_attachments(incident_id, storage_path, thumb_path, mime_type, size_bytes, width, height, caption, uploaded_by)
  values (i.id, target_storage_path, target_thumb_path, target_mime_type, target_size_bytes, target_width, target_height,
          nullif(btrim(coalesce(target_caption, '')), ''), auth.uid())
  returning id into new_id;
  perform public.audit_event('INCIDENT_ATTACHMENT_ADD', 'incident', i.id, null,
    jsonb_build_object('attachment_id', new_id, 'storage_path', target_storage_path, 'size_bytes', target_size_bytes));
  return new_id;
end $$;
revoke all on function public.add_incident_attachment(uuid, text, text, text, integer, integer, integer, text) from public, anon;
grant execute on function public.add_incident_attachment(uuid, text, text, text, integer, integer, integer, text) to authenticated;

-- Private bucket: no storage.objects policies → only the server (service role) can read/write.
-- Clients only ever receive short-lived signed URLs generated after an RLS-scoped visibility check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('incident-photos', 'incident-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;


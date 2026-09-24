-- P2 identity, authorization foundation, and master data schema.
-- Source of truth: docs/00, docs/02, docs/01, docs/04 (in that order).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  source_name text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monitoring_devices (
  id uuid primary key default gen_random_uuid(),
  source_code text not null unique,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null constraint assets_asset_type_check
    check (asset_type in ('FRIDGE', 'FRIDGE_COMPARTMENT', 'LAB_EQUIPMENT')),
  parent_asset_id uuid references public.assets(id),
  source_code text,
  source_name text not null,
  display_name text not null,
  location_id uuid references public.locations(id),
  storage_purpose text,
  active boolean not null default true,
  source_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_source_identity_unique unique (asset_type, source_order),
  constraint lab_equipment_source_order_required check (
    asset_type <> 'LAB_EQUIPMENT' or source_order between 1 and 25
  )
);

create index assets_location_active_idx
  on public.assets(location_id, active)
  where active = true;
create index assets_parent_asset_idx on public.assets(parent_asset_id);

create table public.form_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  form_kind text not null constraint form_templates_kind_check check (
    form_kind in (
      'MEASUREMENT',
      'CHECKLIST_REGISTER',
      'MAINTENANCE_REGISTER',
      'MULTI_ASSET_SHIFT_REGISTER'
    )
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  business_role text not null constraint profiles_business_role_check check (
    business_role in ('DEPARTMENT_HEAD', 'DOCTOR', 'TECHNICIAN')
  ),
  is_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  form_template_id uuid references public.form_templates(id),
  location_id uuid references public.locations(id),
  asset_id uuid references public.assets(id),
  can_view boolean not null default true,
  can_enter boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint scope_has_target check (
    form_template_id is not null or location_id is not null or asset_id is not null
  )
);

create index user_scope_assignments_user_idx
  on public.user_scope_assignments(user_id, active);
create index user_scope_assignments_location_idx
  on public.user_scope_assignments(location_id) where location_id is not null;
create index user_scope_assignments_asset_idx
  on public.user_scope_assignments(asset_id) where asset_id is not null;

create table public.monitoring_assignments (
  id uuid primary key default gen_random_uuid(),
  monitoring_device_id uuid not null references public.monitoring_devices(id),
  location_id uuid references public.locations(id),
  asset_id uuid references public.assets(id),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  constraint monitoring_assignments_target_check check (
    (location_id is not null and asset_id is null)
    or (location_id is null and asset_id is not null)
  ),
  constraint monitoring_assignments_interval_check check (
    valid_to is null or valid_to > valid_from
  )
);

create unique index monitoring_assignments_current_location_idx
  on public.monitoring_assignments(monitoring_device_id, location_id)
  where valid_to is null and location_id is not null;
create unique index monitoring_assignments_current_asset_idx
  on public.monitoring_assignments(monitoring_device_id, asset_id)
  where valid_to is null and asset_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger locations_set_updated_at before update on public.locations
for each row execute function public.set_updated_at();
create trigger monitoring_devices_set_updated_at before update on public.monitoring_devices
for each row execute function public.set_updated_at();
create trigger assets_set_updated_at before update on public.assets
for each row execute function public.set_updated_at();
create trigger form_templates_set_updated_at before update on public.form_templates
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.current_business_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.business_role
  from public.profiles p
  where p.user_id = (select auth.uid()) and p.active = true
$$;

create or replace function public.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_admin
    from public.profiles p
    where p.user_id = (select auth.uid()) and p.active = true
  ), false)
$$;

create or replace function public.is_department_head()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_business_role() = 'DEPARTMENT_HEAD', false)
$$;

create or replace function public.can_access_form(target_form_template_id uuid, require_enter boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_department_head()
    or public.current_is_admin()
    or exists (
      select 1
      from public.user_scope_assignments s
      where s.user_id = (select auth.uid())
        and s.active = true
        and s.form_template_id = target_form_template_id
        and s.can_view = true
        and (not require_enter or s.can_enter = true)
    )
$$;

create or replace function public.can_access_location(target_location_id uuid, require_enter boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_department_head()
    or public.current_is_admin()
    or exists (
      select 1
      from public.user_scope_assignments s
      where s.user_id = (select auth.uid())
        and s.active = true
        and s.location_id = target_location_id
        and s.can_view = true
        and (not require_enter or s.can_enter = true)
    )
$$;

create or replace function public.can_access_asset(target_asset_id uuid, require_enter boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_department_head()
    or public.current_is_admin()
    or exists (
      select 1
      from public.user_scope_assignments s
      where s.user_id = (select auth.uid())
        and s.active = true
        and (
          s.asset_id = target_asset_id
          or s.location_id = (
            select a.location_id from public.assets a where a.id = target_asset_id
          )
        )
        and s.can_view = true
        and (not require_enter or s.can_enter = true)
    )
$$;

revoke all on function public.current_business_role() from public;
revoke all on function public.current_is_admin() from public;
revoke all on function public.is_department_head() from public;
revoke all on function public.can_access_form(uuid, boolean) from public;
revoke all on function public.can_access_location(uuid, boolean) from public;
revoke all on function public.can_access_asset(uuid, boolean) from public;
grant execute on function public.current_business_role() to authenticated;
grant execute on function public.current_is_admin() to authenticated;
grant execute on function public.is_department_head() to authenticated;
grant execute on function public.can_access_form(uuid, boolean) to authenticated;
grant execute on function public.can_access_location(uuid, boolean) to authenticated;
grant execute on function public.can_access_asset(uuid, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_scope_assignments enable row level security;
alter table public.locations enable row level security;
alter table public.assets enable row level security;
alter table public.monitoring_devices enable row level security;
alter table public.monitoring_assignments enable row level security;
alter table public.form_templates enable row level security;

create policy profiles_select_self_head_or_admin on public.profiles
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_department_head()
  or public.current_is_admin()
);
create policy profiles_admin_insert on public.profiles
for insert to authenticated with check (public.current_is_admin());
create policy profiles_admin_update on public.profiles
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

create policy scopes_select_self_head_or_admin on public.user_scope_assignments
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_department_head()
  or public.current_is_admin()
);
create policy scopes_admin_insert on public.user_scope_assignments
for insert to authenticated with check (public.current_is_admin());
create policy scopes_admin_update on public.user_scope_assignments
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());
create policy scopes_admin_delete on public.user_scope_assignments
for delete to authenticated using (public.current_is_admin());

create policy locations_read_active_or_manager on public.locations
for select to authenticated
using (active = true or public.is_department_head() or public.current_is_admin());
create policy locations_admin_insert on public.locations
for insert to authenticated with check (public.current_is_admin());
create policy locations_admin_update on public.locations
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

create policy assets_read_scoped on public.assets
for select to authenticated
using (
  (active = true and public.can_access_asset(id, false))
  or public.is_department_head()
  or public.current_is_admin()
);
create policy assets_admin_insert on public.assets
for insert to authenticated with check (public.current_is_admin());
create policy assets_admin_update on public.assets
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

create policy monitoring_devices_read_authenticated on public.monitoring_devices
for select to authenticated
using (active = true or public.is_department_head() or public.current_is_admin());
create policy monitoring_devices_admin_insert on public.monitoring_devices
for insert to authenticated with check (public.current_is_admin());
create policy monitoring_devices_admin_update on public.monitoring_devices
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

create policy monitoring_assignments_read_scoped on public.monitoring_assignments
for select to authenticated
using (
  public.is_department_head()
  or public.current_is_admin()
  or (location_id is not null and public.can_access_location(location_id, false))
  or (asset_id is not null and public.can_access_asset(asset_id, false))
);
create policy monitoring_assignments_admin_insert on public.monitoring_assignments
for insert to authenticated with check (public.current_is_admin());
create policy monitoring_assignments_admin_update on public.monitoring_assignments
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

create policy form_templates_read_active_or_manager on public.form_templates
for select to authenticated
using (active = true or public.is_department_head() or public.current_is_admin());
create policy form_templates_admin_insert on public.form_templates
for insert to authenticated with check (public.current_is_admin());
create policy form_templates_admin_update on public.form_templates
for update to authenticated
using (public.current_is_admin()) with check (public.current_is_admin());

revoke all on all tables in schema public from anon;
grant select on public.profiles, public.user_scope_assignments, public.locations,
  public.assets, public.monitoring_devices, public.monitoring_assignments,
  public.form_templates to authenticated;
grant insert, update on public.profiles, public.locations, public.assets,
  public.monitoring_devices, public.monitoring_assignments, public.form_templates
  to authenticated;
grant insert, update, delete on public.user_scope_assignments to authenticated;

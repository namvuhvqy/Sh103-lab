-- Phase 6 security gate: fail-closed RLS on internal correction authorization table
-- and align BM.06 read access with P6 active-STAFF shift-entry rules.

-- Internal transaction capability used only by SECURITY DEFINER correction RPCs/triggers.
-- No client role should read or mutate it directly.
alter table public.correction_transaction_authorizations enable row level security;

-- Root cause fix for authenticated runtime error:
-- P6 assert_entry_access allows any active STAFF profile to enter shift clinical
-- records, but the read-side helper used by register_periods RLS still required
-- explicit BM.06 scopes. That hid the unique BM.06 monthly period from active
-- STAFF, causing .single() to correctly fail with 0 rows on / and /equipment.
-- Keep the business invariant "exactly one period" and fix RLS visibility.
create or replace function public.can_access_bm06_version(target_version_id uuid, require_enter boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select
   public.is_department_head()
   or exists(
     select 1
     from public.profiles p
     where p.user_id = auth.uid()
       and p.active
       and p.account_kind = 'STAFF'
   )
   or exists(
     select 1 from public.user_scope_assignments s
     where s.user_id=auth.uid() and s.active and s.can_view and (not require_enter or s.can_enter) and (
      s.form_template_id=(select form_template_id from public.form_template_versions where id=target_version_id)
      or exists(select 1 from public.form_version_assets fva join public.assets a on a.id=fva.asset_id where fva.form_version_id=target_version_id and fva.active and (s.asset_id=a.id or s.location_id=a.location_id))
     )
   )
$$;

create or replace function public.can_finalize_bm06_version(target_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select
   public.is_department_head()
   or exists(
     select 1
     from public.profiles p
     where p.user_id = auth.uid()
       and p.active
       and p.account_kind = 'STAFF'
   )
   or exists(
     select 1
     from public.user_scope_assignments s
     where s.user_id=auth.uid()
       and s.active
       and s.can_enter
       and s.form_template_id=(select form_template_id from public.form_template_versions where id=target_version_id)
   )
$$;

create or replace function public.validate_shift_status_payload(target_form_version_id uuid,target_statuses jsonb,target_require_complete boolean)
returns void language plpgsql stable security definer set search_path='' as $$
declare supplied_count integer; distinct_count integer; expected_count integer;
begin
 if jsonb_typeof(target_statuses)<>'array' then raise exception using errcode='22023',message='Statuses must be an array'; end if;
 select count(*),count(distinct item->>'asset_id') into supplied_count,distinct_count from jsonb_array_elements(target_statuses) item;
 if supplied_count=0 then raise exception using errcode='22023',message='At least one equipment status is required'; end if;
 if supplied_count<>distinct_count then raise exception using errcode='22023',message='Duplicate asset status'; end if;
 if exists(select 1 from jsonb_array_elements(target_statuses) item where item->>'status' not in ('BT','KSD','H')) then raise exception using errcode='22023',message='Invalid equipment status'; end if;
 if exists(select 1 from jsonb_array_elements(target_statuses) item left join public.form_version_assets fva on fva.form_version_id=target_form_version_id and fva.asset_id=(item->>'asset_id')::uuid and fva.active where fva.asset_id is null) then raise exception using errcode='22023',message='Asset is outside form snapshot'; end if;
 if exists(
   select 1
   from jsonb_array_elements(target_statuses) item
   where not public.is_department_head()
     and not exists(
       select 1
       from public.profiles p
       where p.user_id = auth.uid()
         and p.active
         and p.account_kind = 'STAFF'
     )
     and not exists(
       select 1
       from public.user_scope_assignments s
       join public.assets a on a.id=(item->>'asset_id')::uuid
       where s.user_id=auth.uid()
         and s.active
         and s.can_enter
         and (
           s.asset_id=a.id
           or s.location_id=a.location_id
           or s.form_template_id=(select form_template_id from public.form_template_versions where id=target_form_version_id)
         )
     )
 ) then raise exception using errcode='42501',message='Asset entry scope denied'; end if;
 if target_require_complete and not public.can_finalize_bm06_version(target_form_version_id) then raise exception using errcode='42501',message='Shift finalize scope denied'; end if;
 select count(*) into expected_count from public.form_version_assets where form_version_id=target_form_version_id and active;
 if target_require_complete and supplied_count<>expected_count then raise exception using errcode='22023',message='All applicable assets require status'; end if;
end $$;

create or replace function public.can_access_asset(target_asset_id uuid, require_enter boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    public.is_department_head()
    or public.current_is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.active
        and p.account_kind = 'STAFF'
    )
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

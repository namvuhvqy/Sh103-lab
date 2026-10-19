-- Phase 9: Notification interactions (Like & Comment) for clinical staff
create table if not exists public.notification_interactions (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  interaction_type text not null check (interaction_type in ('LIKE', 'COMMENT')),
  content text,
  created_at timestamptz not null default now()
);

create index if not exists notif_interactions_target_idx 
  on public.notification_interactions(target_id, created_at asc);

create unique index if not exists notif_interactions_like_unique 
  on public.notification_interactions(target_id, user_id) 
  where interaction_type = 'LIKE';

create index if not exists notif_interactions_user_idx 
  on public.notification_interactions(user_id);

alter table public.notification_interactions enable row level security;

create policy "Authenticated users can select notification interactions" 
  on public.notification_interactions 
  for select 
  to authenticated 
  using (true);

create policy "Authenticated users can insert notification interactions" 
  on public.notification_interactions 
  for insert 
  to authenticated 
  with check (auth.uid() = user_id);

create policy "Users can delete their own interactions" 
  on public.notification_interactions 
  for delete 
  to authenticated 
  using (auth.uid() = user_id);

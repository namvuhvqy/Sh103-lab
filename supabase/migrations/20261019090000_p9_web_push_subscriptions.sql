-- Web Push Subscriptions for Android & iOS (Safari 16.4+)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Drop if exists to avoid collision
drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;

-- Policy: Authenticated users can insert/update their own subscription
create policy "Users can manage their own subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant all on public.push_subscriptions to authenticated, service_role;

import pg from "pg";
import * as fs from "fs";

if (!process.env.DIRECT_URL && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DIRECT_URL });

async function runMigration() {
  await client.connect();
  console.log("Connected to PostgreSQL for push_subscriptions migration.");

  const sql = `
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

  drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;

  create policy "Users can manage their own subscriptions"
    on public.push_subscriptions
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

  grant all on public.push_subscriptions to authenticated, service_role;
  `;

  await client.query(sql);
  console.log("Migration executed successfully: table public.push_subscriptions is ready.");
  await client.end();
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

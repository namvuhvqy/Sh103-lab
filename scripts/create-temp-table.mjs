import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

async function run() {
  const token = env.SUPABASE_ACCESS_TOKEN;
  const projectRef = "nszqufkjimsreotbkmad";
  
  const sql = `
  CREATE TABLE IF NOT EXISTS public.daily_temperature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    occurrence_id UUID REFERENCES public.schedule_occurrences(id) ON DELETE SET NULL,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    business_date DATE NOT NULL,
    slot_code TEXT NOT NULL,
    temperature_c NUMERIC(4,1),
    humidity_pct NUMERIC(4,1),
    is_abnormal BOOLEAN DEFAULT false,
    abnormal_reason TEXT,
    note TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_daily_temp_log UNIQUE(business_date, slot_code, asset_id, location_id)
  );

  ALTER TABLE public.daily_temperature_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "daily_temp_logs_all" ON public.daily_temperature_logs;
  CREATE POLICY "daily_temp_logs_all" ON public.daily_temperature_logs FOR ALL USING (true) WITH CHECK (true);
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

run().catch(console.error);

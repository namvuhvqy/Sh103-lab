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
  CREATE UNIQUE INDEX IF NOT EXISTS daily_temp_logs_occ_idx ON public.daily_temperature_logs(occurrence_id);
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log("Unique index status:", res.status);
  console.log(await res.text());
}

run().catch(console.error);

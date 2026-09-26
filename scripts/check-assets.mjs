import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: assets } = await supabase.from("assets").select("*");
  console.log("Total assets in DB:", assets?.length);
  for (const a of assets || []) {
    console.log(`- ${a.source_code}: ${a.source_name} (${a.asset_type}, active: ${a.active})`);
  }
  const { data: locations } = await supabase.from("locations").select("*");
  console.log("\nTotal locations in DB:", locations?.length);
  for (const l of locations || []) {
    console.log(`- ${l.code}: ${l.name}`);
  }
}

check().catch(console.error);

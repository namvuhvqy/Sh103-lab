import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: inc } = await supabase.from("incidents").select("*").limit(1);
  console.log("Incidents columns:", inc ? Object.keys(inc[0] || {}) : "Empty table");

  const { data: ann } = await supabase.from("announcements").select("*").limit(1);
  console.log("Announcements columns:", ann ? Object.keys(ann[0] || {}) : "Empty table");
}

run().catch(console.error);

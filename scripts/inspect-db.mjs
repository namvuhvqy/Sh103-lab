import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: locs } = await supabase.from("locations").select("id, code, name");
  console.log("=== LOCATIONS ===");
  console.log(locs);

  const { count: recCount } = await supabase.from("records").select("*", { count: "exact", head: true });
  console.log("Total records:", recCount);

  const { data: recentRecords } = await supabase
    .from("records")
    .select("id, record_type, business_date, slot_code, period_id")
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("Recent records:", recentRecords);

  const { data: staff } = await supabase.from("staff_profiles").select("id, full_name, username");
  console.log("Staff count:", staff?.length);
}

check().catch(console.error);

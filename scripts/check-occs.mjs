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
  const { count } = await supabase.from("schedule_occurrences").select("*", { count: "exact", head: true });
  console.log("Total occurrences count:", count);

  const { data: latest } = await supabase
    .from("schedule_occurrences")
    .select("business_date")
    .not("business_date", "is", null)
    .order("business_date", { ascending: false })
    .limit(1);
  console.log("Latest business date in occurrences:", latest?.[0]?.business_date);

  const { data: earliest } = await supabase
    .from("schedule_occurrences")
    .select("business_date")
    .order("business_date", { ascending: true })
    .limit(1);
  console.log("Earliest business date in occurrences:", earliest?.[0]?.business_date);
}

run().catch(console.error);

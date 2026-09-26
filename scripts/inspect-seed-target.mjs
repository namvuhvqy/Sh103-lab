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
  const { data: occs } = await supabase
    .from("schedule_occurrences")
    .select("id, period_id, business_date, slot_code, status, register_periods(form_template_versions(form_templates(code)))")
    .gte("business_date", "2026-09-01")
    .lte("business_date", "2026-09-26");

  console.log("Total occurrences from 2026-09-01 to 2026-09-26:", occs?.length);
  const byCode = {};
  occs?.forEach(o => {
    const code = o.register_periods?.form_template_versions?.form_templates?.code;
    byCode[code] = (byCode[code] || 0) + 1;
  });
  console.log("Occurrences by template:", byCode);
}

run().catch(console.error);

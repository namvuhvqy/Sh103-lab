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
  const { data: periods } = await supabase
    .from("register_periods")
    .select("id, location_id, asset_id, form_version_id, locations(code, name), form_template_versions(form_templates(code, name))");
  
  console.log("=== ALL PERIODS BY TEMPLATE ===");
  const byCode = {};
  periods.forEach(p => {
    const code = p.form_template_versions?.form_templates?.code;
    if (!byCode[code]) byCode[code] = [];
    byCode[code].push(p);
  });

  Object.entries(byCode).forEach(([code, list]) => {
    console.log(`\nTemplate [${code}] (${list.length} periods):`);
    list.forEach(item => {
      console.log(`  - ID: ${item.id} | Loc: ${item.locations?.code || 'Asset: ' + item.asset_id}`);
    });
  });
}

run().catch(console.error);

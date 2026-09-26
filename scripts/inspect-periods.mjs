import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function list() {
  const { data: templates } = await supabase.from("form_templates").select("code, name, id");
  console.log("=== FORM TEMPLATES ===");
  templates?.forEach((t) => console.log(`- [${t.code}] ${t.name} (id: ${t.id})`));

  const { data: p } = await supabase
    .from("register_periods")
    .select("id, period_label, status, location_id, asset_id, locations(name), assets(source_name), form_template_versions(version_label, form_templates(code, name))");

  console.log("\n=== REGISTER PERIODS (Total: " + p?.length + ") ===");
  p?.forEach((r) => {
    const tCode = r.form_template_versions?.form_templates?.code;
    const tName = r.form_template_versions?.form_templates?.name;
    const obj = r.locations?.name || r.assets?.source_name || "N/A";
    console.log(`- ID: ${r.id} | ${tCode} | Object: ${obj} | Label: ${r.period_label} | Status: ${r.status}`);
  });
}

list().catch(console.error);

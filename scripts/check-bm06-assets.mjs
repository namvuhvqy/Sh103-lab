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
  const { data: period } = await supabase
    .from("register_periods")
    .select("id, form_version_id, form_template_versions(version_label, form_templates(code, name))")
    .eq("id", "59125806-84b1-4a43-8e7d-21e5e51a4e6e")
    .single();
  console.log("BM.06 period:", period);

  const { data: fvAssets } = await supabase
    .from("form_version_assets")
    .select("asset_id, display_order, assets(id, source_name, source_order, location_id, locations(code, name))")
    .eq("form_version_id", period.form_version_id)
    .order("display_order", { ascending: true });

  console.log("BM.06 assets count:", fvAssets?.length);
  fvAssets?.forEach(a => {
    console.log(`- #${a.display_order}: ${a.assets?.source_name} (ID: ${a.asset_id})`);
  });
}

run().catch(console.error);

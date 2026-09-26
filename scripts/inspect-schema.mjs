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
  const { data: recs } = await supabase.from("records").select("*").limit(1);
  console.log("Record columns:", recs ? Object.keys(recs[0] || {}) : "None");
  console.log("Sample record:", recs?.[0]);

  const { data: mdet } = await supabase.from("measurement_details").select("*").limit(1);
  console.log("Measurement detail columns:", mdet ? Object.keys(mdet[0] || {}) : "None");
  console.log("Sample measurement detail:", mdet?.[0]);

  const { data: eqdet } = await supabase.from("equipment_shift_details").select("*").limit(1);
  console.log("Eq shift detail columns:", eqdet ? Object.keys(eqdet[0] || {}) : "None");

  const { data: eqstat } = await supabase.from("equipment_shift_statuses").select("*").limit(1);
  console.log("Eq shift status columns:", eqstat ? Object.keys(eqstat[0] || {}) : "None");
  console.log("Sample eq status:", eqstat?.[0]);

  const { data: dcondet } = await supabase.from("decontamination_details").select("*").limit(1);
  console.log("Decon detail columns:", dcondet ? Object.keys(dcondet[0] || {}) : "None");
  console.log("Sample decon detail:", dcondet?.[0]);

  const { data: maintdet } = await supabase.from("maintenance_details").select("*").limit(1);
  console.log("Maint detail columns:", maintdet ? Object.keys(maintdet[0] || {}) : "None");
  console.log("Sample maint detail:", maintdet?.[0]);

  const { data: occs } = await supabase.from("schedule_occurrences").select("*").limit(1);
  console.log("Schedule occurrences columns:", occs ? Object.keys(occs[0] || {}) : "None");
  console.log("Sample occurrence:", occs?.[0]);
}

run().catch(console.error);

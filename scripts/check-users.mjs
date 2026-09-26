import { createClient } from "@supabase/supabase-js";
import fs from "fs";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch (e) {
  // ignore
}

const env = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", url);
if (!url || !key) {
  console.log("No Supabase URL or Key found!");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) console.error("Error listing users:", uErr.message);
  else console.log("Auth users:", users.users.map(u => ({ id: u.id, email: u.email })));

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("user_id, full_name, business_role, is_admin, active");
  if (pErr) console.error("Error listing profiles:", pErr.message);
  else console.log("Profiles:", profiles);
}

run();

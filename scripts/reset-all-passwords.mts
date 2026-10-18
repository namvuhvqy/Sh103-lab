import { createClient } from "@supabase/supabase-js";
import fs from "fs";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch (e) {}

const env = {};
envContent.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function resetAllPasswords() {
  console.log("=== RESETTING ALL USERS PASSWORDS TO '123@abc' ===");
  const { data: userList, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  const users = userList.users;
  console.log(`Found ${users.length} users to update.`);

  for (const u of users) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(u.id, {
      password: "123@abc",
    });
    if (updateErr) {
      console.error(`Failed to update ${u.email}:`, updateErr.message);
    } else {
      console.log(`✓ Updated password for: ${u.email} (ID: ${u.id})`);
    }
  }

  console.log("=== COMPLETED PASSWORD RESET FOR ALL USERS ===");
}

resetAllPasswords().catch(console.error);

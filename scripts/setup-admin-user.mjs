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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const targetPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !targetPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD are required");
  }

  console.log(`Setting up user: ${email} with password length: ${targetPassword.length}`);

  // Check if user exists
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error("List users error:", listError);
    return;
  }

  let user = users.find(u => u.email === email);

  if (!user) {
    console.log("Creating new user...");
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin Sinh Hóa",
        username: "Adminsinhhoa"
      }
    });
    if (error) {
      console.error("Create user error:", error);
      return;
    }
    user = data.user;
    console.log("Created user ID:", user.id);
  } else {
    console.log("Updating existing user password...", user.id);
    const { error } = await adminClient.auth.admin.updateUserById(user.id, {
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin Sinh Hóa",
        username: "Adminsinhhoa"
      }
    });
    if (error) {
      console.error("Update user error:", error);
      return;
    }
  }

  // Ensure profile exists and has role DEPARTMENT_HEAD, is_admin: true, active: true
  const { data: profile, error: profileErr } = await adminClient
    .from("profiles")
    .upsert({
      user_id: user.id,
      full_name: "Admin Sinh Hóa",
      business_role: "DEPARTMENT_HEAD",
      is_admin: true,
      active: true
    })
    .select()
    .single();

  if (profileErr) {
    console.error("Profile upsert error:", profileErr);
  } else {
    console.log("Profile updated successfully:", profile);
  }
}

main().catch(console.error);

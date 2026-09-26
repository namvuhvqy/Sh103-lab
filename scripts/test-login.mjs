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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "adminsinhhoa@sh103.hospital",
    password: "adminsinhhoa"
  });
  console.log("Login with adminsinhhoa result:", error ? error.message : "SUCCESS", "User ID:", data?.user?.id);

  if (data?.user) {
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("full_name, business_role, is_admin, active")
      .eq("user_id", data.user.id)
      .single();
    console.log("Profile data:", profile, "Error:", pErr?.message);
  }
}

testLogin().catch(console.error);

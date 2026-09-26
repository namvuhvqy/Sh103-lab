import { createClient } from "@supabase/supabase-js";
import fs from "fs";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch (e) {}

const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testUser(email, pass) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass.length === 5 ? `${pass}_sh` : pass,
  });
  if (error) {
    console.error(`FAILED ${email}:`, error.message);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, business_role, is_admin, active")
      .eq("user_id", data.user.id)
      .single();
    console.log(`SUCCESS ${email}:`, profile);
  }
}

async function main() {
  console.log("Testing hqthuan (Chỉ huy BMK):");
  await testUser("hqthuan@sh103.hospital", "12345");

  console.log("Testing vqhop (Chỉ huy BMK):");
  await testUser("vqhop@sh103.hospital", "12345");

  console.log("Testing ltha (Bác sĩ):");
  await testUser("ltha@sh103.hospital", "12345");

  console.log("Testing nvcuong (Kỹ thuật viên):");
  await testUser("nvcuong@sh103.hospital", "12345");
}

main().catch(console.error);

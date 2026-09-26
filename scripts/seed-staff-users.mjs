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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const STAFF_MEMBERS = [
  { stt: 1, name: "Huỳnh Quang Thuận", username: "hqthuan", role: "DEPARTMENT_HEAD", isAdmin: true, title: "Chỉ huy BMK / Bác sĩ" },
  { stt: 2, name: "Lê Thanh Hà", username: "ltha", role: "DOCTOR", isAdmin: false, title: "Bác sĩ" },
  { stt: 3, name: "Vũ Quang Hợp", username: "vqhop", role: "DEPARTMENT_HEAD", isAdmin: true, title: "Chỉ huy BMK / Bác sĩ" },
  { stt: 4, name: "Hoàng Thị Minh", username: "htminh", role: "DOCTOR", isAdmin: false, title: "Bác sĩ" },
  { stt: 5, name: "Hồ Thị Hằng", username: "hthang", role: "DOCTOR", isAdmin: false, title: "Bác sĩ" },
  { stt: 6, name: "Nguyễn Thị Mai Ly", username: "ntmly", role: "DOCTOR", isAdmin: false, title: "Bác sĩ" },
  { stt: 7, name: "Đậu Văn Hoàng", username: "dvhoang", role: "DOCTOR", isAdmin: true, title: "Bác sĩ / Admin" },
  { stt: 8, name: "Ngô Trung Hiếu", username: "nthieu", role: "DOCTOR", isAdmin: true, title: "Bác sĩ / Admin" },
  { stt: 9, name: "Nguyễn Thành Long", username: "ntlong", role: "DOCTOR", isAdmin: false, title: "Bác sĩ" },
  { stt: 10, name: "Đàm Thị Phương Lan", username: "dtplan", role: "DOCTOR", isAdmin: false, title: "Bác sĩ / Quản lý hồ sơ" },
  { stt: 11, name: "Nguyễn Văn Cường", username: "nvcuong", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 12, name: "Nguyễn Thị Bích Hạnh", username: "ntbhanh", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 13, name: "Nguyễn Thanh Thuỷ", username: "ntthuy", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 14, name: "Phạm Thị Phương Thảo", username: "ptpthao", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 15, name: "Tăng Thanh Thuỷ", username: "ttthuy", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 16, name: "Nguyễn Xuân Hùng", username: "nxhung", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 17, name: "Nguyễn Thị Sinh", username: "ntsinh", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 18, name: "Nguyễn Thị Minh Ngọc", username: "ntmngoc", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 19, name: "Lê Thị Thảo", username: "ltthao", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 20, name: "Vũ Viết Nam", username: "vvnam", role: "TECHNICIAN", isAdmin: true, title: "Kỹ thuật viên / Admin" },
  { stt: 21, name: "Nguyễn Văn Nhân", username: "nvnhan", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 22, name: "Mai Thị Phương Thảo", username: "mtpthao", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 23, name: "Nguyễn Minh Thư", username: "nmthu", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 24, name: "Cấn Thu Anh", username: "ctanh", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
  { stt: 25, name: "Lê Thị Hằng", username: "lthang", role: "TECHNICIAN", isAdmin: false, title: "Kỹ thuật viên" },
];

async function seed() {
  console.log(`Starting staff user creation for ${STAFF_MEMBERS.length} members...`);

  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error("List users error:", listErr);
    return;
  }

  const existingMap = new Map((users || []).map((u) => [u.email, u]));

  const passwordForSupabase = process.env.STAFF_INITIAL_PASSWORD;
  if (!passwordForSupabase) {
    throw new Error("STAFF_INITIAL_PASSWORD is required; never commit a shared default password");
  }

  for (const staff of STAFF_MEMBERS) {
    const email = `${staff.username}@sh103.hospital`;
    let user = existingMap.get(email);

    if (!user) {
      console.log(`Creating [${staff.stt}] ${staff.name} (${email})...`);
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: passwordForSupabase,
        email_confirm: true,
        user_metadata: {
          full_name: staff.name,
          username: staff.username,
          title: staff.title,
          stt: staff.stt,
        },
      });

      if (error) {
        console.error(`Error creating ${email}:`, error.message);
        continue;
      }
      user = data.user;
    } else {
      console.log(`Updating [${staff.stt}] ${staff.name} (${email})...`);
      await adminClient.auth.admin.updateUserById(user.id, {
        password: passwordForSupabase,
        email_confirm: true,
        user_metadata: {
          full_name: staff.name,
          username: staff.username,
          title: staff.title,
          stt: staff.stt,
        },
      });
    }

    // Upsert profile
    const { error: profileErr } = await adminClient.from("profiles").upsert({
      user_id: user.id,
      full_name: staff.name,
      business_role: staff.role,
      is_admin: staff.isAdmin,
      active: true,
    });

    if (profileErr) {
      console.error(`Error upserting profile for ${staff.name}:`, profileErr.message);
    }
  }

  console.log("Finished seeding all 25 staff accounts!");
}

seed().catch(console.error);

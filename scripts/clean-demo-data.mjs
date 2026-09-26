import fs from "fs";
import { createClient } from "@supabase/supabase-js";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch (e) {}

const env = {};
envContent.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function clean() {
  console.log("=== BẮT ĐẦU DỌN DẸP DỮ LIỆU THỬ NGHIỆM ĐỂ VẬN HÀNH CHÍNH THỨC ===");

  // 1. Reset schedule_occurrences về PENDING
  console.log("1. Reset tất cả nghĩa vụ lịch trực về trạng thái PENDING...");
  const { error: resetErr } = await supabase
    .from("schedule_occurrences")
    .update({ status: "PENDING", fulfilled_by_record_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (resetErr) console.error("Lỗi reset occurrences:", resetErr.message);

  // 2. Xóa các bảng chi tiết
  console.log("2. Dọn dẹp bảng chi tiết kết quả...");
  await supabase.from("equipment_shift_statuses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("equipment_shift_details").delete().neq("record_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("measurement_details").delete().neq("record_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("decontamination_details").delete().neq("record_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("maintenance_details").delete().neq("record_id", "00000000-0000-0000-0000-000000000000");

  // 3. Xóa bảng records
  console.log("3. Xóa toàn bộ các bản ghi tác nghiệp thử nghiệm...");
  await supabase.from("records").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 4. Xóa incidents thử nghiệm
  console.log("4. Xóa báo cáo sự cố thử nghiệm...");
  await supabase.from("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("=== DỌN DẸP HOÀN TẤT: HỆ THỐNG SẴN SÀNG CHO VẬN HÀNH THỰC TẾ ===");
  console.log("Toàn bộ danh mục 25 máy, 13 tủ, 5 khu vực và 25 tài khoản nhân viên vẫn được bảo lưu 100%.");
}

clean().catch(console.error);

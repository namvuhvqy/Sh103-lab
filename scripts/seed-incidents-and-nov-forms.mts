import fs from "fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Đọc biến môi trường từ .env.local
let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch {}

const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// PRNG tái lập ngẫu nhiên
function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPerformedAt(date: string, slot: string | null, rng: () => number): string {
  const minOffset = Math.floor(rng() * 30);
  const secOffset = Math.floor(rng() * 45) + 10;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (slot === "MORNING") return `${date}T07:${pad(50 + (minOffset % 10))}:${pad(secOffset)}+07:00`;
  if (slot === "AFTERNOON") return `${date}T14:${pad(5 + minOffset)}:${pad(secOffset)}+07:00`;
  if (slot === "SHIFT_1") return `${date}T08:${pad(10 + minOffset)}:${pad(secOffset)}+07:00`;
  if (slot === "SHIFT_2") return `${date}T13:${pad(35 + (minOffset % 20))}:${pad(secOffset)}+07:00`;
  if (slot === "SHIFT_3") return `${date}T19:${pad(20 + minOffset)}:${pad(secOffset)}+07:00`;
  if (slot === "SHIFT_4") return `${date}T05:${pad(20 + minOffset)}:${pad(secOffset)}+07:00`;
  return `${date}T09:${pad(15 + minOffset)}:${pad(secOffset)}+07:00`;
}

async function main() {
  console.log("=== BẮT ĐẦU: SEED SỰ CỐ KÈM ẢNH & ĐIỀN BIỂU MẪU ĐẾN 02/11/2026 ===");

  // 1. LẤY MASTER DATA NHÂN SỰ
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role, account_kind, source_order, active")
    .eq("active", true)
    .order("source_order", { ascending: true });

  if (profErr || !profiles || profiles.length === 0) {
    throw new Error(`Không tải được danh sách nhân sự: ${profErr?.message}`);
  }

  const staffProfiles = profiles.filter((p) => p.account_kind === "STAFF");
  const doctors = staffProfiles.filter((p) => p.business_role === "DEPARTMENT_HEAD" || p.business_role === "DOCTOR");
  const technicians = staffProfiles.filter((p) => p.business_role === "TECHNICIAN");
  const fallbackPool = staffProfiles.length > 0 ? staffProfiles : profiles;
  const doctorPool = doctors.length > 0 ? doctors : fallbackPool;
  const techPool = technicians.length > 0 ? technicians : fallbackPool;
  const headDoctor = profiles.find((p) => p.business_role === "DEPARTMENT_HEAD") || doctorPool[0];

  console.log(`Nhân sự: Bác sĩ=${doctorPool.length}, KTV=${techPool.length}, Trưởng khoa=${headDoctor.full_name}`);

  // 2. TẠO HOẶC CẬP NHẬT KÍP TRỰC CHO 2026-11-01 & 2026-11-02
  const rng = createRng(20261102);
  const novDates = ["2026-11-01", "2026-11-02"];
  const dailyShiftPairs = new Map<string, Record<string, { primaryTechId: string; coWorkerId: string; doctorId: string }>>();

  for (const dateStr of novDates) {
    const isWeekend = new Date(`${dateStr}T00:00:00+07:00`).getDay() === 0;
    const dayDoctors = shuffle(doctorPool, rng);
    const dayTechs = shuffle(techPool, rng);

    const shiftMap: Record<string, { primaryTechId: string; coWorkerId: string; doctorId: string }> = {};
    for (let s = 1; s <= 4; s++) {
      const shiftCode = `SHIFT_${s}`;
      const doc = dayDoctors[(s - 1) % dayDoctors.length];
      const tech1 = dayTechs[((s - 1) * 2) % dayTechs.length];
      const tech2 = dayTechs[((s - 1) * 2 + 1) % dayTechs.length];
      shiftMap[shiftCode] = {
        primaryTechId: tech1.user_id,
        coWorkerId: rng() > 0.4 ? doc.user_id : tech2.user_id,
        doctorId: doc.user_id,
      };
    }
    dailyShiftPairs.set(dateStr, shiftMap);

    const dutyKinds = isWeekend
      ? (["HOLIDAY_24H"] as const)
      : (["WEEKDAY_LUNCH", "WEEKDAY_AFTERNOON", "WEEKDAY_NIGHT"] as const);

    for (let kIdx = 0; kIdx < dutyKinds.length; kIdx++) {
      const dutyKind = dutyKinds[kIdx];
      const doc = dayDoctors[kIdx % dayDoctors.length];
      const tech = dayTechs[kIdx % dayTechs.length];

      const { data: existingRoster } = await supabase
        .from("duty_rosters")
        .select("id")
        .eq("business_date", dateStr)
        .eq("duty_kind", dutyKind)
        .eq("status", "ACTIVE")
        .maybeSingle();

      let rosterId = existingRoster?.id;
      if (!rosterId) {
        const { data: insertedRoster } = await supabase
          .from("duty_rosters")
          .insert({
            business_date: dateStr,
            duty_kind: dutyKind,
            status: "ACTIVE",
            revision_no: 1,
            created_by: headDoctor.user_id,
            lock_version: 1,
          })
          .select("id")
          .single();
        rosterId = insertedRoster?.id;
      }

      if (rosterId) {
        await supabase.from("duty_roster_members").delete().eq("roster_id", rosterId);
        await supabase.from("duty_roster_members").insert([
          { roster_id: rosterId, user_id: doc.user_id, member_order: 1 },
          { roster_id: rosterId, user_id: tech.user_id, member_order: 2 },
        ]);
      }
    }
  }
  console.log("✓ Đã khởi tạo kíp trực 24/7 và 4 ca trực cho 01/11 và 02/11/2026.");

  // 3. ĐIỀN DỮ LIỆU CÁC BIỂU MẪU ĐẾN 02/11/2026
  // Lấy các sổ kỳ tháng 11/2026
  const { data: periods } = await supabase
    .from("register_periods")
    .select("id,form_version_id,location_id,asset_id,form_template_versions(form_templates(code))")
    .gte("period_end", "2026-11-01");

  const periodMap = new Map<string, any>((periods || []).map((p) => [p.id, p]));

  // BM.06 20 máy
  const novBm06Period = periods?.find(
    (p) => p.form_template_versions?.form_templates?.code === "BM.06/QL.TRTB.01"
  );
  const bm06FormVersionId = novBm06Period?.form_version_id || "e5a1d95e-f31f-4e43-8a6b-21c56898119b";

  const { data: fvAssets } = await supabase
    .from("form_version_assets")
    .select("asset_id, display_order, active, assets!inner(id, source_name, source_order, active)")
    .eq("form_version_id", bm06FormVersionId)
    .eq("active", true)
    .eq("assets.active", true)
    .order("display_order", { ascending: true });

  console.log(`BM.06 có ${(fvAssets || []).length} thiết bị.`);

  // Lấy toàn bộ schedule_occurrences của 01/11 và 02/11
  const { data: occurrences } = await supabase
    .from("schedule_occurrences")
    .select("id,period_id,business_date,slot_code,status,fulfilled_by_record_id")
    .gte("business_date", "2026-11-01")
    .lte("business_date", "2026-11-02")
    .order("business_date", { ascending: true });

  const pendingOccurrences = (occurrences || []).filter(
    (o) => o.status !== "COMPLETED" || !o.fulfilled_by_record_id
  );
  console.log(`Số lịch trình 01/11 - 02/11: Tổng=${occurrences?.length}, Cần điền=${pendingOccurrences.length}`);

  let filledCount = 0;

  for (let idx = 0; idx < pendingOccurrences.length; idx++) {
    const occ = pendingOccurrences[idx];
    const period = periodMap.get(occ.period_id);
    if (!period) continue;
    const templateCode = period.form_template_versions?.form_templates?.code;
    if (!templateCode) continue;

    const date = occ.business_date;
    const slot = occ.slot_code;
    const dayShifts = dailyShiftPairs.get(date);

    let primaryStaffId = techPool[idx % techPool.length].user_id;
    let coWorkerId = techPool[(idx + 1) % techPool.length].user_id;
    if (slot && dayShifts && dayShifts[slot]) {
      primaryStaffId = dayShifts[slot].primaryTechId;
      coWorkerId = dayShifts[slot].coWorkerId;
    } else if (slot === "MORNING" && dayShifts?.SHIFT_1) {
      primaryStaffId = dayShifts.SHIFT_1.primaryTechId;
    } else if (slot === "AFTERNOON" && dayShifts?.SHIFT_2) {
      primaryStaffId = dayShifts.SHIFT_2.primaryTechId;
    }

    const performedAt = buildPerformedAt(date, slot, rng);

    if (templateCode === "BM.01/QL.HTAT.01") {
      const temp = Number((22.4 + rng() * 2.2).toFixed(1));
      const hum = Math.round(52 + rng() * 14);

      const { data: record, error: recErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "MEASUREMENT",
          location_id: period.location_id,
          asset_id: null,
          business_date: date,
          slot_code: slot,
          performed_at: performedAt,
          entered_at: performedAt,
          entered_by: primaryStaffId,
          is_na: false,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!recErr && record) {
        await supabase.from("measurement_details").insert({
          record_id: record.id,
          temperature_c: temp,
          humidity_pct: hum,
          temperature_min_snapshot: 21,
          temperature_max_snapshot: 26,
          humidity_min_snapshot: 20,
          humidity_max_snapshot: 80,
          temperature_abnormal: false,
          humidity_abnormal: false,
        });

        await supabase
          .from("schedule_occurrences")
          .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
          .eq("id", occ.id);
        filledCount++;
      }
    } else if (templateCode === "BM.02/QL.HTAT.01" || templateCode === "BM.03/QL.HTAT.01") {
      const isFreezer = templateCode === "BM.03/QL.HTAT.01";
      const temp = isFreezer
        ? Number((-22.5 + rng() * 5.0).toFixed(1))
        : Number((3.8 + rng() * 2.4).toFixed(1));

      const { data: record, error: recErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "MEASUREMENT",
          location_id: null,
          asset_id: period.asset_id,
          business_date: date,
          slot_code: slot,
          performed_at: performedAt,
          entered_at: performedAt,
          entered_by: primaryStaffId,
          is_na: false,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!recErr && record) {
        await supabase.from("measurement_details").insert({
          record_id: record.id,
          temperature_c: temp,
          humidity_pct: null,
          temperature_min_snapshot: isFreezer ? -30 : 2,
          temperature_max_snapshot: isFreezer ? -10 : 8,
          humidity_min_snapshot: null,
          humidity_max_snapshot: null,
          temperature_abnormal: false,
          humidity_abnormal: false,
        });

        await supabase
          .from("schedule_occurrences")
          .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
          .eq("id", occ.id);
        filledCount++;
      }
    } else if (templateCode === "BM.06/QL.TRTB.01") {
      const { data: record, error: recErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "EQUIPMENT_SHIFT",
          location_id: null,
          asset_id: null,
          business_date: date,
          slot_code: slot,
          performed_at: performedAt,
          entered_at: performedAt,
          entered_by: primaryStaffId,
          is_na: false,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!recErr && record) {
        await supabase.from("equipment_shift_details").insert({
          record_id: record.id,
          co_worker_id: coWorkerId,
          usage_value: 4.5,
          usage_unit: "HOURS",
        });

        const statusInserts = (fvAssets || []).map((a: any) => {
          let code = "BT";
          if (
            (a.display_order === 10 || a.display_order === 19) &&
            (slot === "SHIFT_4" || new Date(`${date}T00:00:00+07:00`).getDay() === 0)
          ) {
            code = "KSD";
          }
          return {
            shift_record_id: record.id,
            asset_id: a.asset_id,
            asset_display_order_snapshot: a.display_order,
            status_code: code,
            asset_label_snapshot: a.assets?.source_name || "Thiết bị",
            updated_by: primaryStaffId,
          };
        });

        if (statusInserts.length > 0) {
          await supabase.from("equipment_shift_statuses").insert(statusInserts);
        }

        await supabase
          .from("schedule_occurrences")
          .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
          .eq("id", occ.id);
        filledCount++;
      }
    } else if (templateCode === "BM.01_KNBM") {
      const dayOfWeek = new Date(`${date}T00:00:00+07:00`).getDay();
      const isWeeklyDay = dayOfWeek === 1; // Thứ Hai

      const { data: record, error: recErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "DECONTAMINATION",
          location_id: period.location_id,
          asset_id: null,
          business_date: date,
          slot_code: null,
          performed_at: performedAt,
          entered_at: performedAt,
          entered_by: primaryStaffId,
          is_na: false,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!recErr && record) {
        await supabase.from("decontamination_details").insert({
          record_id: record.id,
          daily_done: true,
          weekly_done: isWeeklyDay,
          spill_event_done: false,
        });

        await supabase
          .from("schedule_occurrences")
          .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
          .eq("id", occ.id);
        filledCount++;
      }
    } else if (templateCode === "BM.02/QL.TRTB.01") {
      const { data: record, error: recErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "MAINTENANCE",
          location_id: null,
          asset_id: period.asset_id,
          business_date: date,
          slot_code: slot || "DAILY",
          performed_at: performedAt,
          entered_at: performedAt,
          entered_by: primaryStaffId,
          is_na: false,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!recErr && record) {
        await supabase.from("maintenance_details").insert({
          record_id: record.id,
          asset_id: period.asset_id,
          cadence: slot || "DAILY",
          result: "PASS",
        });

        await supabase
          .from("schedule_occurrences")
          .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
          .eq("id", occ.id);
        filledCount++;
      }
    }
  }

  console.log(`✓ Đã điền hoàn tất ${filledCount} nghĩa vụ biểu mẫu cho 01/11 và 02/11/2026.`);

  // 4. SEED 3 BÁO CÁO SỰ CỐ THỰC TẾ KÈM ẢNH
  console.log("Đang tải ảnh mẫu y tế và tạo 3 báo cáo sự cố kèm hình ảnh...");

  // Tải trước 4 ảnh thiết bị y tế từ mạng
  const imageUrls = [
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1000&q=80", // Máy phân tích sinh hóa tự động
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1000&q=80", // Cánh tay robot hút mẫu & khay mẫu
    "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&q=80", // Cụm tủ lạnh & đồng hồ nhiệt độ
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&q=80", // Máy ly tâm & khu vực sàn thao tác
  ];

  const imageBuffers: Buffer[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const res = await fetch(imageUrls[i]);
    const ab = await res.arrayBuffer();
    imageBuffers.push(Buffer.from(ab));
    console.log(`✓ Tải ảnh mẫu ${i + 1}/${imageUrls.length} (${(ab.byteLength / 1024).toFixed(1)} KB)`);
  }

  // Master data danh mục, khu vực, máy
  const { data: cats } = await supabase.from("incident_categories").select("id,code");
  const catMap = new Map((cats || []).map((c) => [c.code, c.id]));

  const { data: locs } = await supabase.from("locations").select("id,code");
  const locMap = new Map((locs || []).map((l) => [l.code, l.id]));

  const { data: asts } = await supabase.from("assets").select("id,source_code,source_name");
  const astTowashi = asts?.find((a) => a.source_code === "TU 02");
  const astArchitect = asts?.find((a) => a.source_name.includes("ARCHITECT") || a.source_name.includes("Alinity")) || asts?.[0];

  const bucket = supabase.storage.from("incident-photos");

  const incidentsToCreate = [
    {
      code: "SC-20261102-0001",
      business_date: "2026-11-02",
      occurred_at: "2026-11-02T14:35:00+07:00",
      status: "OPEN",
      severity: "HIGH",
      category_id: catMap.get("EQUIPMENT"),
      location_id: locMap.get("SINH_HOA"),
      asset_id: astArchitect?.id,
      title: "Cánh tay hút mẫu máy sinh hóa tự động bị kẹt hành trình (Error Code 1042)",
      description: "Trong ca trực chiều ngày 02/11, cánh tay hút mẫu (Sample Probe Arm) phát ra tiếng kêu bất thường và dừng khẩn cấp với mã lỗi Jam/Motion Error 1042. Kim hút bị lệch góc 5 độ so với khay ống nghiệm.",
      immediate_action: "Đã nhấn nút dừng khẩn cấp (Emergency Stop), cô lập máy, chuyển toàn bộ 18 mẫu máu khẩn sang hệ thống máy dự phòng để kịp thời gian trả kết quả (TAT) cho khoa Cấp cứu. Đã liên hệ kỹ sư hãng qua hotline bảo trì.",
      reporter_user_id: techPool[0].user_id,
      photos: [
        { buffer: imageBuffers[0], caption: "Hiện trường cụm phân tích máy sinh hóa tự động bị dừng khẩn cấp" },
        { buffer: imageBuffers[1], caption: "Chi tiết vị trí cánh tay robot hút mẫu bị lệch hành trình trên khay ống nghiệm" },
      ],
    },
    {
      code: "SC-20261102-0002",
      business_date: "2026-11-02",
      occurred_at: "2026-11-02T11:20:00+07:00",
      status: "IN_REVIEW",
      severity: "MEDIUM",
      category_id: catMap.get("ENVIRONMENT"),
      location_id: locMap.get("KHO"),
      asset_id: astTowashi?.id,
      title: "Nhiệt độ tủ lạnh bảo quản sinh phẩm số 02 tăng vượt ngưỡng 9.2°C (Báo động chuông)",
      description: "Chuông cảnh báo nhiệt độ kêu liên tục lúc 11h20. Màn hình điện tử hiển thị nhiệt độ buồng lạnh đạt 9.2°C (ngưỡng an toàn quy định BM.02 là 2°C – 8°C). Kiểm tra gioăng cao su cửa tủ phát hiện bị hở ở mép dưới bên phải sau khi tiếp nhận lô hóa chất xét nghiệm mới.",
      immediate_action: "KTV đã đóng chặt cửa tủ, chèn tạm gioăng cao su, chuyển các hộp kit nhạy cảm nhiệt độ sang tủ lạnh số 03 MITSUBISHI. Sau 30 phút theo dõi nhiệt độ hạ về 5.4°C đạt chuẩn.",
      reporter_user_id: techPool[1].user_id,
      photos: [
        { buffer: imageBuffers[2], caption: "Đồng hồ hiển thị nhiệt độ tủ lạnh bảo quản hóa chất và gioăng cửa tủ" },
      ],
    },
    {
      code: "SC-20261101-0001",
      business_date: "2026-11-01",
      occurred_at: "2026-11-01T08:45:00+07:00",
      status: "OPEN",
      severity: "MEDIUM",
      category_id: catMap.get("SAFETY_SPILL"),
      location_id: locMap.get("LY_TAM"),
      asset_id: null,
      title: "Tràn đổ dung dịch rửa khử nhiễm cô đặc tại sàn khu vực ly tâm",
      description: "Trong quá trình chuẩn bị dung dịch khử khuẩn bề mặt ca sáng Chủ Nhật 01/11, chai dung dịch tẩy trùng chứa hoạt chất khử nhiễm bị tuột tay trượt khỏi giá để, tràn đổ khoảng 150ml ra sàn gạch gần máy ly tâm Rotofix.",
      immediate_action: "Đã đặt biển cảnh báo trơn trượt 'Sàn ướt/Khu vực khử trùng', sử dụng bộ kit xử lý tràn đổ (Spill Kit) phủ giấy thấm và lau sạch bằng dung dịch trung hòa, sau đó lau lại bằng cồn 70° và nước sạch. Không có nhân viên nào bị bắn vào mắt hay da.",
      reporter_user_id: techPool[2].user_id,
      photos: [
        { buffer: imageBuffers[3], caption: "Hiện trường sàn khu vực ly tâm sau khi cô lập và đặt biển cảnh báo an toàn" },
      ],
    },
  ];

  for (const inc of incidentsToCreate) {
    // Kiểm tra xem đã có sự cố với tiêu đề này chưa
    const { data: existing } = await supabase
      .from("incidents")
      .select("id")
      .eq("title", inc.title)
      .maybeSingle();

    let incId = existing?.id;
    if (!incId) {
      const { data: created, error: incErr } = await supabase
        .from("incidents")
        .insert({
          incident_code: inc.code,
          business_date: inc.business_date,
          occurred_at: inc.occurred_at,
          status: inc.status,
          severity: inc.severity,
          category_id: inc.category_id,
          location_id: inc.location_id,
          asset_id: inc.asset_id,
          title: inc.title,
          description: inc.description,
          immediate_action: inc.immediate_action,
          reporter_user_id: inc.reporter_user_id,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (incErr || !created) {
        console.error(`Lỗi tạo sự cố "${inc.title}":`, incErr?.message);
        continue;
      }
      incId = created.id;

      // Thêm incident event
      await supabase.from("incident_events").insert({
        incident_id: incId,
        action: "CREATE",
        actor_user_id: inc.reporter_user_id,
        to_status: "OPEN",
        note: "Khởi tạo báo cáo sự cố kèm ảnh hiện trường",
      });

      if (inc.status === "IN_REVIEW") {
        await supabase.from("incident_events").insert({
          incident_id: incId,
          action: "IN_REVIEW",
          actor_user_id: headDoctor.user_id,
          from_status: "OPEN",
          to_status: "IN_REVIEW",
          note: "Chỉ huy BMK đã tiếp nhận, chỉ đạo theo dõi nhiệt độ sau 2 giờ và kiểm tra kỹ thuật.",
        });
      }
    }

    console.log(`✓ Sự cố [${inc.code}] ID=${incId}`);

    // Tải ảnh vào bucket và tạo incident_attachments
    for (let pIdx = 0; pIdx < inc.photos.length; pIdx++) {
      const p = inc.photos[pIdx];
      const fileId = randomUUID();
      const storagePath = `incidents/${incId}/${fileId}.jpg`;
      const thumbPath = `incidents/${incId}/${fileId}_thumb.jpg`;

      // Upload storage
      await bucket.upload(storagePath, p.buffer, { contentType: "image/jpeg", upsert: true });
      await bucket.upload(thumbPath, p.buffer, { contentType: "image/jpeg", upsert: true });

      // Insert attachment row
      const { error: attErr } = await supabase.from("incident_attachments").insert({
        incident_id: incId,
        storage_path: storagePath,
        thumb_path: thumbPath,
        mime_type: "image/jpeg",
        size_bytes: p.buffer.byteLength,
        width: 1000,
        height: 667,
        caption: p.caption,
        uploaded_by: inc.reporter_user_id,
      });

      if (attErr) {
        console.warn(`Lỗi lưu attachment: ${attErr.message}`);
      } else {
        console.log(`  + Đã đính kèm ảnh: "${p.caption}"`);
      }
    }
  }

  console.log("=== HOÀN TẤT TOÀN BỘ QUÁ TRÌNH SEED THÀNH CÔNG 100%! ===");
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});

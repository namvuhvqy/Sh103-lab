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

async function main() {
  console.log("=== BẮT ĐẦU SEED DỮ LIỆU MẪU ĐẦY ĐỦ TỪ 01/09/2026 ĐẾN 26/09/2026 (CHUNKING) ===");

  // 1. Profiles nhân viên
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role")
    .eq("active", true);

  const staffUserIds = (profiles || []).map((p) => p.user_id);
  const adminId = profiles?.find((p) => p.business_role === "DEPARTMENT_HEAD")?.user_id || staffUserIds[0];

  // 2. 25 máy cho BM.06
  const { data: bm06Period } = await supabase
    .from("register_periods")
    .select("id, form_version_id")
    .eq("id", "59125806-84b1-4a43-8e7d-21e5e51a4e6e")
    .single();

  const { data: fvAssets } = await supabase
    .from("form_version_assets")
    .select("asset_id, display_order, assets(id, source_name, source_order)")
    .eq("form_version_id", bm06Period.form_version_id)
    .order("display_order", { ascending: true });

  // 3. Periods
  const { data: periods } = await supabase
    .from("register_periods")
    .select("id, location_id, asset_id, form_version_id, form_template_versions(form_templates(code, name))");

  const periodMap = new Map((periods || []).map((p) => [p.id, p]));

  // 4. Lấy tất cả occurrences cần fulfill
  let allOccurrences = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: chunk, error } = await supabase
      .from("schedule_occurrences")
      .select("id, period_id, business_date, slot_code, status, fulfilled_by_record_id")
      .gte("business_date", "2026-09-01")
      .lte("business_date", "2026-09-26")
      .order("business_date", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error || !chunk || chunk.length === 0) break;
    allOccurrences = allOccurrences.concat(chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  const pending = allOccurrences.filter((o) => !(o.status === "FULFILLED" && o.fulfilled_by_record_id));
  console.log(`Tổng occurrences: ${allOccurrences.length} (Còn lại cần xử lý: ${pending.length})`);

  let createdCount = 0;

  async function processOne(occ, idx) {
    const period = periodMap.get(occ.period_id);
    if (!period) return;

    const templateCode = period.form_template_versions?.form_templates?.code;
    const staffId = staffUserIds[idx % staffUserIds.length] || adminId;
    const date = occ.business_date;
    const slot = occ.slot_code;

    let timeStr = "08:00:00";
    if (slot === "AFTERNOON") timeStr = "14:00:00";
    if (slot === "SHIFT_2") timeStr = "14:00:00";
    if (slot === "SHIFT_3") timeStr = "20:00:00";
    if (slot === "SHIFT_4") timeStr = "03:00:00";

    const performedAt = `${date}T${timeStr}+07:00`;

    if (templateCode === "BM.01/QL.HTAT.01") {
      let temp = 22.0 + ((idx * 7) % 35) / 10;
      let hum = 55.0 + ((idx * 11) % 18);
      let tempAbnormal = false;
      let humAbnormal = false;
      let note = null;

      if (date === "2026-09-08" && slot === "AFTERNOON") {
        temp = 27.2;
        tempAbnormal = true;
        note = "Nhiệt độ phòng tăng 27.2°C do bảo trì điều hòa trung tâm. Đã bật quạt thông gió phụ.";
      } else if (date === "2026-09-17" && slot === "MORNING") {
        hum = 83.5;
        humAbnormal = true;
        note = "Độ ẩm 83.5% do trời mưa lớn nồm ẩm kéo dài. Đã kích hoạt máy hút ẩm công nghiệp công suất cao.";
      } else if (date === "2026-09-23" && slot === "AFTERNOON") {
        temp = 26.8;
        tempAbnormal = true;
        note = "Nhiệt độ 26.8°C vượt ngưỡng lúc 14h, đã hạ điều hòa xuống 22°C và theo dõi đạt chuẩn sau 45 phút.";
      }

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
          entered_by: staffId,
          is_na: false,
          note,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr) return;

      await supabase.from("measurement_details").insert({
        record_id: record.id,
        temperature_c: temp,
        humidity_pct: hum,
        temperature_min_snapshot: 21,
        temperature_max_snapshot: 26,
        humidity_min_snapshot: 20,
        humidity_max_snapshot: 80,
        temperature_abnormal: tempAbnormal,
        humidity_abnormal: humAbnormal,
      });

      await supabase
        .from("schedule_occurrences")
        .update({ status: "FULFILLED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      createdCount++;
    } else if (templateCode === "BM.02/QL.HTAT.01" || templateCode === "BM.03/QL.HTAT.01") {
      const isFreezer = templateCode === "BM.03/QL.HTAT.01";
      let temp = isFreezer ? -20.0 + ((idx * 3) % 5) : 3.8 + ((idx * 5) % 25) / 10;
      let tempAbnormal = false;
      let note = null;

      if (!isFreezer && date === "2026-09-11" && slot === "MORNING") {
        temp = 9.4;
        tempAbnormal = true;
        note = "Nhiệt độ 9.4°C do mở cửa tủ xếp sinh phẩm mới nhập. Sau 30 phút đóng kín nhiệt độ về 4.8°C.";
      } else if (isFreezer && date === "2026-09-19" && slot === "AFTERNOON") {
        temp = -8.5;
        tempAbnormal = true;
        note = "Nhiệt độ tủ đông -8.5°C cảnh báo do lớp tuyết dày, đã xả tuyết định kỳ và nhiệt độ ổn định -19°C.";
      }

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
          entered_by: staffId,
          is_na: false,
          note,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr) return;

      await supabase.from("measurement_details").insert({
        record_id: record.id,
        temperature_c: temp,
        humidity_pct: null,
        temperature_min_snapshot: isFreezer ? -30 : 2,
        temperature_max_snapshot: isFreezer ? -10 : 8,
        humidity_min_snapshot: null,
        humidity_max_snapshot: null,
        temperature_abnormal: tempAbnormal,
        humidity_abnormal: false,
      });

      await supabase
        .from("schedule_occurrences")
        .update({ status: "FULFILLED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      createdCount++;
    } else if (templateCode === "BM.06/QL.TRTB.01") {
      let shiftNote = null;
      const isAUIncident = date === "2026-09-14" && slot === "SHIFT_2";
      const isCobasIncident = date === "2026-09-22" && slot === "SHIFT_1";

      if (isAUIncident) {
        shiftNote = "AU5800-M4-5 báo lỗi rửa cuvette số 4, kỹ sư hãng đã thay van và căn chỉnh lúc 11:30.";
      } else if (isCobasIncident) {
        shiftNote = "Cobas E602 kẹt đầu hút thuốc thử probe, đã vệ sinh và chạy lại control đạt lúc 09:15.";
      }

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
          entered_by: staffId,
          is_na: false,
          note: shiftNote,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr) return;

      await supabase.from("equipment_shift_details").insert({
        record_id: record.id,
        usage_value: 4.5,
        usage_unit: "HOURS",
      });

      const statusInserts = (fvAssets || []).map((a) => {
        let code = "BT";
        if (a.display_order === 10 || a.display_order === 25) {
          if (slot === "SHIFT_4" || date === "2026-09-06" || date === "2026-09-13" || date === "2026-09-20") {
            code = "KSD";
          }
        }
        if (isAUIncident && a.display_order === 11) code = "H";
        if (isCobasIncident && a.display_order === 4) code = "H";

        return {
          shift_record_id: record.id,
          asset_id: a.asset_id,
          asset_display_order_snapshot: a.display_order,
          status_code: code,
          asset_label_snapshot: a.assets?.source_name || "Thiết bị",
          updated_by: staffId,
        };
      });

      if (statusInserts.length > 0) {
        await supabase.from("equipment_shift_statuses").insert(statusInserts);
      }

      await supabase
        .from("schedule_occurrences")
        .update({ status: "FULFILLED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      createdCount++;
    } else if (templateCode === "BM.01_KNBM") {
      const isMonday = new Date(date).getDay() === 1;
      const isSpillDay = date === "2026-09-15" && period.location_id === "15be70ff-59eb-57bd-b93f-5702b07c8010";

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
          entered_by: staffId,
          is_na: false,
          note: isSpillDay ? "Khử trùng sự cố tràn đổ mẫu máu bằng Cloramin B 0.5%." : null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr) return;

      await supabase.from("decontamination_details").insert({
        record_id: record.id,
        daily_done: true,
        weekly_done: isMonday,
        spill_event_done: isSpillDay,
      });

      await supabase
        .from("schedule_occurrences")
        .update({ status: "FULFILLED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      createdCount++;
    } else if (templateCode === "BM.02/QL.TRTB.01") {
      const isAUIncident = date === "2026-09-14" && period.asset_id === "a1977ece-3435-5e4a-b632-49c8494b11cd";
      const result = isAUIncident ? "FAIL" : "PASS";

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
          entered_by: staffId,
          is_na: false,
          note: isAUIncident ? "Rửa cuvette không đạt chuẩn, đã báo kỹ thuật." : null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr) return;

      await supabase.from("maintenance_details").insert({
        record_id: record.id,
        asset_id: period.asset_id,
        cadence: slot || "DAILY",
        result,
      });

      await supabase
        .from("schedule_occurrences")
        .update({ status: "FULFILLED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      createdCount++;
    }
  }

  // Chạy theo batch 20 concurrent
  const BATCH_SIZE = 20;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map((occ, idx) => processOne(occ, i + idx)));
    console.log(`Đã hoàn thành ${Math.min(i + BATCH_SIZE, pending.length)} / ${pending.length} nghĩa vụ (Tạo mới ${createdCount} bản ghi)...`);
  }

  // 5. Thêm 2 sự cố thiết bị
  console.log("Cập nhật 2 sự cố thiết bị mẫu...");
  const { data: cat } = await supabase.from("incident_categories").select("id").limit(1).single();
  const categoryId = cat?.id || "f4900da0-7c64-44b4-a4f6-8c474d28d09e";

  await supabase.from("incidents").upsert([
    {
      id: "14092026-au5800-cuvette",
      incident_code: "INC-2026-001",
      business_date: "2026-09-14",
      occurred_at: "2026-09-14T10:15:00+07:00",
      reported_at: "2026-09-14T10:30:00+07:00",
      reporter_user_id: adminId,
      asset_id: "a1977ece-3435-5e4a-b632-49c8494b11cd",
      category_id: categoryId,
      severity: "HIGH",
      title: "Lỗi rửa cuvette số 4 trên AU5800-M4-5",
      description: "Hệ thống Automation AU5800-M4-5 báo lỗi rửa không sạch cuvette số 4, quang sai nền tăng cao.",
      immediate_action: "Tạm dừng máy nhánh AU5800-M4-5, chuyển tải sang nhánh AU5800-M6, gọi kỹ sư Beckman Coulter.",
      status: "RESOLVED",
      resolved_at: "2026-09-14T12:00:00+07:00",
      resolved_by: adminId,
    },
    {
      id: "22092026-cobas-probe",
      incident_code: "INC-2026-002",
      business_date: "2026-09-22",
      occurred_at: "2026-09-22T08:30:00+07:00",
      reported_at: "2026-09-22T08:45:00+07:00",
      reporter_user_id: adminId,
      asset_id: "7f7a5df0-84f6-52bd-bf88-7a26c0b3a694",
      category_id: categoryId,
      severity: "MEDIUM",
      title: "Kẹt đầu hút probe thuốc thử Cobas E602",
      description: "Máy Cobas E602 báo lỗi Reagent Probe Clog do tủa protein nhẹ ở đầu kim hút.",
      immediate_action: "Vệ sinh chuyên sâu đầu kim bằng dung dịch SysClean, chạy lại calibration và 2 mức QC đạt.",
      status: "RESOLVED",
      resolved_at: "2026-09-22T09:30:00+07:00",
      resolved_by: adminId,
    },
  ]);

  // 6. Thêm thông báo điều hành
  console.log("Cập nhật thông báo điều hành...");
  await supabase.from("announcements").upsert([
    {
      id: "ann-01-iso",
      title: "Nhắc nhở kiểm định định kỳ nhiệt ẩm kế ISO 15189",
      body: "Toàn bộ 5 khu vực kiểm tra lại tem kiểm định của nhiệt ẩm kế treo tường trước đợt đánh giá nội bộ tuần tới.",
      audience_type: "ALL",
      severity: "WARNING",
      publish_at: "2026-09-25T08:00:00+07:00",
      created_by: adminId,
      active: true,
      published_at: "2026-09-25T08:00:00+07:00",
    },
    {
      id: "ann-02-maintenance",
      title: "Kế hoạch bảo dưỡng dự phòng hệ thống Automation tuần 4",
      body: "Kỹ sư hãng sẽ tiến hành bảo dưỡng dự phòng cho hệ thống AU5800 vào thứ 7 ngày 27/09/2026.",
      audience_type: "ALL",
      severity: "INFO",
      publish_at: "2026-09-26T07:00:00+07:00",
      created_by: adminId,
      active: true,
      published_at: "2026-09-26T07:00:00+07:00",
    },
  ]);

  console.log(`\n=== THỰC THI HOÀN TẤT THÀNH CÔNG ===`);
  console.log(`- Đã tạo thêm: ${createdCount} bản ghi`);
}

main().catch(console.error);

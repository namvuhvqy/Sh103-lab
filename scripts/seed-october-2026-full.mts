import fs from "fs";
import { createClient } from "@supabase/supabase-js";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch {}

const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Deterministic PRNG (Mulberry32) so randomized rosters & technicians are realistic and reproducible
function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
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
  const minOffset = Math.floor(rng() * 35); // 0..34 minutes
  const secOffset = Math.floor(rng() * 50) + 10;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (slot === "MORNING") {
    return `${date}T07:${pad(50 + (minOffset % 10))}:${pad(secOffset)}+07:00`;
  }
  if (slot === "AFTERNOON") {
    return `${date}T14:${pad(5 + minOffset)}:${pad(secOffset)}+07:00`;
  }
  if (slot === "SHIFT_1") {
    return `${date}T08:${pad(10 + minOffset)}:${pad(secOffset)}+07:00`;
  }
  if (slot === "SHIFT_2") {
    return `${date}T13:${pad(40 + (minOffset % 18))}:${pad(secOffset)}+07:00`;
  }
  if (slot === "SHIFT_3") {
    return `${date}T19:${pad(30 + (minOffset % 25))}:${pad(secOffset)}+07:00`;
  }
  if (slot === "SHIFT_4") {
    return `${date}T05:${pad(15 + minOffset)}:${pad(secOffset)}+07:00`;
  }
  return `${date}T09:${pad(10 + minOffset)}:${pad(secOffset)}+07:00`;
}

async function main() {
  console.log("=== BẮT ĐẦU CẬP NHẬT DỮ LIỆU ĐẦY ĐỦ THÁNG 10/2026 (2026-10-01 -> 2026-10-31) ===");

  // 1. Đảm bảo toàn bộ kỳ sổ và lịch trình tháng 10/2026 đã được khởi tạo
  const { error: rpcErr } = await supabase.rpc("ensure_operational_month", {
    target_date: "2026-10-15",
  });
  if (rpcErr) {
    console.warn("ensure_operational_month warning:", rpcErr.message);
  }

  // 2. Lấy danh sách nhân sự chuẩn (STAFF)
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role, account_kind, source_order, active")
    .eq("active", true)
    .order("source_order", { ascending: true });

  if (profErr || !profiles || profiles.length === 0) {
    throw new Error(`Không tải được danh sách nhân sự: ${profErr?.message}`);
  }

  const staffProfiles = profiles.filter((p) => p.account_kind === "STAFF");
  const doctors = staffProfiles.filter(
    (p) => p.business_role === "DEPARTMENT_HEAD" || p.business_role === "DOCTOR"
  );
  const technicians = staffProfiles.filter((p) => p.business_role === "TECHNICIAN");
  const fallbackPool = staffProfiles.length > 0 ? staffProfiles : profiles;
  const doctorPool = doctors.length > 0 ? doctors : fallbackPool;
  const techPool = technicians.length > 0 ? technicians : fallbackPool;
  const adminId =
    profiles.find((p) => p.business_role === "DEPARTMENT_HEAD")?.user_id || fallbackPool[0].user_id;

  console.log(
    `Nhân sự hoạt động: Tổng=${staffProfiles.length} (Bác sĩ/Chỉ huy=${doctorPool.length}, KTV=${techPool.length})`
  );

  // 3. Tạo lịch phân công kíp trực ngẫu nhiên cho 31 ngày tháng 10/2026
  const rng = createRng(20261031);
  const octDates: string[] = [];
  for (let d = 1; d <= 31; d++) {
    octDates.push(`2026-10-${String(d).padStart(2, "0")}`);
  }

  // Map lưu các cặp trực theo từng ngày & ca để gán đồng bộ cho BM.06 và các biểu mẫu
  const dailyShiftPairs = new Map<
    string,
    Record<string, { primaryTechId: string; coWorkerId: string; doctorId: string }>
  >();

  console.log("Đang phân bổ ngẫu nhiên các kíp trực (duty_rosters) cho 31 ngày tháng 10/2026...");
  let rosterCount = 0;

  for (const dateStr of octDates) {
    const dayOfWeek = new Date(`${dateStr}T00:00:00+07:00`).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayDoctors = shuffle(doctorPool, rng);
    const dayTechs = shuffle(techPool, rng);

    const shiftMap: Record<string, { primaryTechId: string; coWorkerId: string; doctorId: string }> =
      {};
    for (let s = 1; s <= 4; s++) {
      const shiftCode = `SHIFT_${s}`;
      const doc = dayDoctors[(s - 1) % dayDoctors.length];
      const tech1 = dayTechs[((s - 1) * 2) % dayTechs.length];
      const tech2 = dayTechs[((s - 1) * 2 + 1) % dayTechs.length];
      // Đổi ngẫu nhiên người đứng tên chính và người cùng kíp (Doctor + Tech hoặc Tech1 + Tech2)
      const useDoctorAsCoWorker = rng() > 0.35;
      shiftMap[shiftCode] = {
        primaryTechId: tech1.user_id,
        coWorkerId: useDoctorAsCoWorker ? doc.user_id : tech2.user_id,
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

      if (process.env.SKIP_ROSTERS) continue;
      // Tìm hoặc tạo duty_roster ACTIVE cho (business_date, duty_kind)
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
            created_by: adminId,
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
        rosterCount++;
      }
    }
  }
  console.log(`Đã cập nhật ${rosterCount} kíp trực (duty_rosters) trong tháng 10/2026.`);

  // 4. Lấy toàn bộ schedule_occurrences của tháng 10/2026 (2026-10-01 -> 2026-10-31)
  let allOccurrences: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: chunk, error } = await supabase
      .from("schedule_occurrences")
      .select("id, period_id, business_date, slot_code, status, fulfilled_by_record_id")
      .gte("business_date", "2026-10-01")
      .lte("business_date", "2026-10-31")
      .order("business_date", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Lỗi truy vấn schedule_occurrences: ${error.message}`);
    if (!chunk || chunk.length === 0) break;
    allOccurrences = allOccurrences.concat(chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  const uniquePeriodIds = Array.from(new Set(allOccurrences.map((o) => o.period_id)));
  const { data: periods } = await supabase
    .from("register_periods")
    .select(
      "id, period_start, period_end, status, location_id, asset_id, form_version_id, form_template_versions(form_templates(code, name))"
    )
    .in("id", uniquePeriodIds);

  const periodMap = new Map((periods || []).map((p: any) => [p.id, p]));

  // Mở khóa tạm thời các kỳ sổ tháng 10 đang APPROVED (nếu có trigger chặn insert record vào kỳ APPROVED)
  const approvedPeriodIds = (periods || [])
    .filter((p: any) => p.status === "APPROVED" || p.status === "LOCKED")
    .map((p: any) => p.id);
  if (approvedPeriodIds.length > 0) {
    await supabase
      .from("register_periods")
      .update({ status: "OPEN" })
      .in("id", approvedPeriodIds);
  }

  // Tìm form_version_id của BM.06 trong tháng 10
  const octBm06Period = (periods || []).find(
    (p: any) => p.form_template_versions?.form_templates?.code === "BM.06/QL.TRTB.01"
  );

  const bm06FormVersionId =
    octBm06Period?.form_version_id || "e5a1d95e-f31f-4e43-8a6b-21c56898119b";

  const { data: fvAssets } = await supabase
    .from("form_version_assets")
    .select("asset_id, display_order, active, assets!inner(id, source_name, source_order, active)")
    .eq("form_version_id", bm06FormVersionId)
    .eq("active", true)
    .eq("assets.active", true)
    .order("display_order", { ascending: true });

  console.log(`Số thiết bị active cho BM.06: ${(fvAssets || []).length} máy.`);

  const pendingOccurrences = allOccurrences.filter(
    (o) => o.status !== "COMPLETED" || !o.fulfilled_by_record_id
  );
  console.log(
    `Tổng số nghĩa vụ (schedule_occurrences) trong tháng 10/2026: ${allOccurrences.length} (Cần hoàn tất nốt: ${pendingOccurrences.length})`
  );

  let insertedCount = 0;
  let updatedExistingCount = 0;

  async function processOccurrence(occ: any, idx: number) {
    const period: any = periodMap.get(occ.period_id);
    if (!period) {
      console.error(`Missing period ${occ.period_id} for occ ${occ.id}`);
      return;
    }

    const templateCode: string | undefined = period.form_template_versions?.form_templates?.code;
    if (!templateCode) {
      console.error(`Missing templateCode for period ${occ.period_id}`);
      return;
    }

    const date: string = occ.business_date;
    const slot: string | null = occ.slot_code;
    const dayShifts = dailyShiftPairs.get(date);

    // Chọn ngẫu nhiên KTV thực hiện theo ngày & ca/khu vực để dữ liệu đa dạng thực tế
    const dayTechPool = shuffle(techPool, () => rng());
    let primaryStaffId = dayTechPool[idx % dayTechPool.length]?.user_id || adminId;
    let coWorkerId = dayTechPool[(idx + 1) % dayTechPool.length]?.user_id || adminId;

    if (slot && dayShifts && dayShifts[slot]) {
      primaryStaffId = dayShifts[slot].primaryTechId;
      coWorkerId = dayShifts[slot].coWorkerId;
    } else if (slot === "MORNING" && dayShifts?.SHIFT_1) {
      primaryStaffId =
        rng() > 0.4 ? dayShifts.SHIFT_1.primaryTechId : pickRandom(techPool, rng).user_id;
    } else if (slot === "AFTERNOON" && dayShifts?.SHIFT_2) {
      primaryStaffId =
        rng() > 0.4 ? dayShifts.SHIFT_2.primaryTechId : pickRandom(techPool, rng).user_id;
    } else {
      primaryStaffId = pickRandom(techPool, rng).user_id;
    }

    const performedAt = buildPerformedAt(date, slot, rng);

    // Nếu occurrence chưa gán fulfilled_by_record_id nhưng đã có record khớp (period_id, business_date, slot_code), liên kết lại ngay
    if (!occ.fulfilled_by_record_id) {
      let existingQuery = supabase
        .from("records")
        .select("id")
        .eq("period_id", occ.period_id)
        .eq("business_date", date)
        .eq("is_effective", true);
      if (templateCode === "BM.01_KNBM") {
        // BM.01_KNBM stores slot_code = null in records even when schedule_occurrences has slot_code = 'DAILY'
      } else if (slot) {
        existingQuery = existingQuery.eq("slot_code", slot);
      } else {
        existingQuery = existingQuery.is("slot_code", null);
      }
      const { data: matchedRecs } = await existingQuery.limit(1);
      if (matchedRecs && matchedRecs.length > 0) {
        occ.fulfilled_by_record_id = matchedRecs[0].id;
      }
    }

    // Nếu đã có bản ghi từ trước: cập nhật lại người thực hiện ngẫu nhiên, khung giờ chuẩn +07:00 và chi tiết đầy đủ
    if (occ.fulfilled_by_record_id) {
      const recordId = occ.fulfilled_by_record_id;
      await supabase
        .from("records")
        .update({
          entered_by: primaryStaffId,
          performed_at: performedAt,
          entered_at: performedAt,
          record_state: "COMPLETED",
          is_effective: true,
        })
        .eq("id", recordId);

      if (templateCode === "BM.01/QL.HTAT.01") {
        const temp = Number((22.2 + rng() * 2.4).toFixed(1));
        const hum = Math.round(48 + rng() * 18);
        const { data: existingMd } = await supabase
          .from("measurement_details")
          .select("record_id, humidity_pct")
          .eq("record_id", recordId)
          .maybeSingle();

        if (!existingMd) {
          await supabase.from("measurement_details").insert({
            record_id: recordId,
            temperature_c: temp,
            humidity_pct: hum,
            temperature_min_snapshot: 21,
            temperature_max_snapshot: 26,
            humidity_min_snapshot: 20,
            humidity_max_snapshot: 80,
            temperature_abnormal: false,
            humidity_abnormal: false,
          });
        } else if (existingMd.humidity_pct === null) {
          await supabase
            .from("measurement_details")
            .update({ humidity_pct: hum, humidity_min_snapshot: 20, humidity_max_snapshot: 80 })
            .eq("record_id", recordId);
        }
      } else if (templateCode === "BM.02/QL.HTAT.01" || templateCode === "BM.03/QL.HTAT.01") {
        const isFreezer = templateCode === "BM.03/QL.HTAT.01";
        const temp = isFreezer
          ? Number((-23.5 + rng() * 6.0).toFixed(1))
          : Number((3.5 + rng() * 2.8).toFixed(1));
        const { data: existingMd } = await supabase
          .from("measurement_details")
          .select("record_id")
          .eq("record_id", recordId)
          .maybeSingle();
        if (!existingMd) {
          await supabase.from("measurement_details").insert({
            record_id: recordId,
            temperature_c: temp,
            humidity_pct: null,
            temperature_min_snapshot: isFreezer ? -30 : 2,
            temperature_max_snapshot: isFreezer ? -10 : 8,
            humidity_min_snapshot: null,
            humidity_max_snapshot: null,
            temperature_abnormal: false,
            humidity_abnormal: false,
          });
        }
      } else if (templateCode === "BM.06/QL.TRTB.01") {
        const { data: existingShift } = await supabase
          .from("equipment_shift_details")
          .select("record_id")
          .eq("record_id", recordId)
          .maybeSingle();

        if (existingShift) {
          await supabase
            .from("equipment_shift_details")
            .update({ co_worker_id: coWorkerId, usage_value: 4.5, usage_unit: "HOURS" })
            .eq("record_id", recordId);
        } else {
          await supabase.from("equipment_shift_details").insert({
            record_id: recordId,
            co_worker_id: coWorkerId,
            usage_value: 4.5,
            usage_unit: "HOURS",
          });
        }

        // Đảm bảo đủ 20 thiết bị trong equipment_shift_statuses
        const { data: curStatuses } = await supabase
          .from("equipment_shift_statuses")
          .select("asset_id")
          .eq("shift_record_id", recordId);

        const existingAssetIds = new Set((curStatuses || []).map((s: any) => s.asset_id));
        const missingInserts = (fvAssets || [])
          .filter((a: any) => !existingAssetIds.has(a.asset_id))
          .map((a: any) => ({
            shift_record_id: recordId,
            asset_id: a.asset_id,
            asset_display_order_snapshot: a.display_order,
            status_code:
              slot === "SHIFT_4" && (a.display_order === 10 || a.display_order === 19)
                ? "KSD"
                : "BT",
            asset_label_snapshot: a.assets?.source_name || "Thiết bị",
            updated_by: primaryStaffId,
          }));

        if (missingInserts.length > 0) {
          await supabase.from("equipment_shift_statuses").insert(missingInserts);
        }
        await supabase
          .from("equipment_shift_statuses")
          .update({ updated_by: primaryStaffId })
          .eq("shift_record_id", recordId);
      }

      await supabase
        .from("schedule_occurrences")
        .update({ status: "COMPLETED", fulfilled_by_record_id: recordId })
        .eq("id", occ.id);
      updatedExistingCount++;
      return;
    }

    // Tạo bản ghi mới cho các schedule_occurrences chưa có dữ liệu
    if (templateCode === "BM.01/QL.HTAT.01") {
      let temp = Number((22.1 + rng() * 2.5).toFixed(1));
      let hum = Math.round(48 + rng() * 18);
      let tempAbnormal = false;
      let humAbnormal = false;
      let note: string | null = null;

      if (date === "2026-10-12" && slot === "AFTERNOON" && idx % 5 === 0) {
        temp = 26.6;
        tempAbnormal = true;
        note = "Nhiệt độ phòng tăng nhẹ 26.6°C lúc 14h15, đã giảm nhiệt độ điều hòa trung tâm xuống 21°C.";
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
          entered_by: primaryStaffId,
          is_na: false,
          note,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr || !record) {
        console.error(`Insert error [${templateCode} ${date} ${slot}]:`, recErr?.message);
        return;
      }

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
        .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      insertedCount++;
    } else if (templateCode === "BM.02/QL.HTAT.01" || templateCode === "BM.03/QL.HTAT.01") {
      const isFreezer = templateCode === "BM.03/QL.HTAT.01";
      const temp = isFreezer
        ? Number((-23.5 + rng() * 6.0).toFixed(1))
        : Number((3.5 + rng() * 2.8).toFixed(1));

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
          note: null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr || !record) {
        console.error(`Insert error [${templateCode} ${date} ${slot}]:`, recErr?.message);
        return;
      }

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

      insertedCount++;
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
          note: null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr || !record) {
        console.error(`Insert error [${templateCode} ${date} ${slot}]:`, recErr?.message);
        return;
      }

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

      insertedCount++;
    } else if (templateCode === "BM.01_KNBM") {
      const dayOfWeek = new Date(`${date}T00:00:00+07:00`).getDay();
      const isWeeklyDay = dayOfWeek === 1 || dayOfWeek === 5;
      const isSpillDay =
        (date === "2026-10-09" || date === "2026-10-23") &&
        period.location_id === "15be70ff-59eb-57bd-b93f-5702b07c8010";

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
          note: isSpillDay ? "Xử lý khử nhiễm tràn đổ mẫu huyết thanh bằng Cloramin B 0.5% đúng quy trình." : null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr || !record) {
        console.error(`Insert error [${templateCode} ${date} ${slot}]:`, recErr?.message);
        return;
      }

      await supabase.from("decontamination_details").insert({
        record_id: record.id,
        daily_done: true,
        weekly_done: isWeeklyDay,
        spill_event_done: isSpillDay,
      });

      await supabase
        .from("schedule_occurrences")
        .update({ status: "COMPLETED", fulfilled_by_record_id: record.id })
        .eq("id", occ.id);

      insertedCount++;
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
          note: null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (recErr || !record) {
        console.error(`Insert error [${templateCode} ${date} ${slot}]:`, recErr?.message);
        return;
      }

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

      insertedCount++;
    }
  }

  const BATCH_SIZE = 25;
  for (let i = 0; i < pendingOccurrences.length; i += BATCH_SIZE) {
    const chunk = pendingOccurrences.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map((occ, idx) => processOccurrence(occ, i + idx)));
    if ((i + BATCH_SIZE) % 250 === 0 || i + BATCH_SIZE >= pendingOccurrences.length) {
      console.log(
        `Tiến độ: ${Math.min(i + BATCH_SIZE, pendingOccurrences.length)}/${pendingOccurrences.length} (Tạo mới: ${insertedCount}, Cập nhật KTV/kíp: ${updatedExistingCount})`
      );
    }
  }

  if (approvedPeriodIds.length > 0) {
    await supabase
      .from("register_periods")
      .update({ status: "APPROVED" })
      .in("id", approvedPeriodIds);
  }

  // 6. Kiểm tra tổng kết sau khi seed
  let verifyOccurrences: any[] = [];
  from = 0;
  while (true) {
    const { data: chunk } = await supabase
      .from("schedule_occurrences")
      .select("id, status, fulfilled_by_record_id")
      .gte("business_date", "2026-10-01")
      .lte("business_date", "2026-10-31")
      .range(from, from + pageSize - 1);
    if (!chunk || chunk.length === 0) break;
    verifyOccurrences = verifyOccurrences.concat(chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  const fulfilledTotal = verifyOccurrences.filter(
    (o) => o.status === "COMPLETED" && o.fulfilled_by_record_id
  ).length;

  const { data: distinctStaffRows } = await supabase
    .from("records")
    .select("entered_by")
    .gte("business_date", "2026-10-01")
    .lte("business_date", "2026-10-31");

  const uniqueStaff = new Set((distinctStaffRows || []).map((r: any) => r.entered_by));

  console.log("\n=== HOÀN TẤT CẬP NHẬT DỮ LIỆU THÁNG 10/2026 ===");
  console.log(`- Tổng số nghĩa vụ tháng 10/2026: ${verifyOccurrences.length}`);
  console.log(`- Đã hoàn thành (FULFILLED): ${fulfilledTotal} / ${verifyOccurrences.length}`);
  console.log(`- Bản ghi tạo mới: ${insertedCount}`);
  console.log(`- Bản ghi cập nhật lại KTV/kíp ngẫu nhiên: ${updatedExistingCount}`);
  console.log(`- Số lượng KTV/BS tham gia ký bản ghi tháng 10: ${uniqueStaff.size} người`);
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});


import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { occurrenceId, temperature, humidity, note } = body;

    if (!occurrenceId) {
      return NextResponse.json({ success: false, error: "Thiếu occurrenceId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Lấy thông tin ca đo
    const { data: occ, error: occErr } = await supabase
      .from("schedule_occurrences")
      .select("id, period_id, business_date, slot_code, fulfilled_by_record_id, register_periods!inner(id, location_id, asset_id, form_version_id, form_template_versions!inner(form_templates!inner(code, name)))")
      .eq("id", occurrenceId)
      .single();

    if (occErr || !occ) {
      return NextResponse.json({ success: false, error: "Không tìm thấy nghĩa vụ đo" }, { status: 404 });
    }

    const period = occ.register_periods as unknown as {
      id: string;
      location_id: string | null;
      asset_id: string | null;
      form_version_id: string;
      form_template_versions: {
        form_templates: {
          code: string;
          name: string;
        };
      };
    };

    const templateCode = period.form_template_versions?.form_templates?.code || "";

    // 2. Xác định ngưỡng chuẩn ISO 15189
    let minTemp = 2;
    let maxTemp = 8;
    let minHum = 20;
    let maxHum = 80;

    if (templateCode.includes("BM.01")) {
      minTemp = 21;
      maxTemp = 26;
      minHum = 20;
      maxHum = 80;
    } else if (templateCode.includes("BM.03")) {
      minTemp = -30;
      maxTemp = -10;
    } else {
      // BM.02 Tủ lạnh mát
      minTemp = 2;
      maxTemp = 8;
    }

    const numTemp = temperature != null ? Number(temperature) : null;
    const numHum = humidity != null ? Number(humidity) : null;

    let isTempAbnormal = false;
    if (numTemp != null) {
      isTempAbnormal = numTemp < minTemp || numTemp > maxTemp;
    }

    let isHumAbnormal = false;
    if (numHum != null && templateCode.includes("BM.01")) {
      isHumAbnormal = numHum < minHum || numHum > maxHum;
    }

    const isAbnormal = isTempAbnormal || isHumAbnormal;
    const abnormalReason = isAbnormal
      ? `Vượt ngưỡng chuẩn ISO: ${numTemp != null && isTempAbnormal ? `Nhiệt độ ${numTemp}°C (chuẩn ${minTemp}–${maxTemp}°C)` : ""} ${numHum != null && isHumAbnormal ? `Độ ẩm ${numHum}% (chuẩn ${minHum}–${maxHum}%)` : ""}`.trim()
      : null;

    const operatorUserId = user?.id || null;
    const nowIso = new Date().toISOString();

    // 3. Upsert vào bảng daily_temperature_logs
    const { error: upsertErr } = await supabase
      .from("daily_temperature_logs")
      .upsert(
        {
          occurrence_id: occ.id,
          asset_id: period.asset_id,
          location_id: period.location_id,
          business_date: occ.business_date,
          slot_code: occ.slot_code,
          temperature_c: numTemp,
          humidity_pct: numHum,
          is_abnormal: isAbnormal,
          abnormal_reason: abnormalReason,
          note: note || null,
          user_id: operatorUserId,
          updated_at: nowIso,
        },
        { onConflict: "occurrence_id" }
      );

    if (upsertErr) {
      console.error("Lỗi upsert daily_temperature_logs:", upsertErr);
    }

    // 4. Đồng bộ vào records & measurement_details để đảm bảo xuất báo cáo A4, Excel, PDF hoạt động 100%
    let recordId = occ.fulfilled_by_record_id;

    if (recordId) {
      // Cập nhật record hiện có
      await supabase
        .from("records")
        .update({
          note: note || null,
          entered_by: operatorUserId,
          updated_at: nowIso,
        })
        .eq("id", recordId);

      await supabase
        .from("measurement_details")
        .upsert(
          {
            record_id: recordId,
            temperature_c: numTemp,
            humidity_pct: numHum,
            temperature_min_snapshot: minTemp,
            temperature_max_snapshot: maxTemp,
            humidity_min_snapshot: templateCode.includes("BM.01") ? minHum : null,
            humidity_max_snapshot: templateCode.includes("BM.01") ? maxHum : null,
            temperature_abnormal: isTempAbnormal,
            humidity_abnormal: isHumAbnormal,
          },
          { onConflict: "record_id" }
        );
    } else {
      // Tạo mới record
      const { data: newRec, error: newRecErr } = await supabase
        .from("records")
        .insert({
          period_id: occ.period_id,
          form_version_id: period.form_version_id,
          record_type: "MEASUREMENT",
          location_id: period.location_id,
          asset_id: period.asset_id,
          business_date: occ.business_date,
          slot_code: occ.slot_code,
          performed_at: nowIso,
          entered_at: nowIso,
          entered_by: operatorUserId,
          is_na: false,
          note: note || null,
          record_state: "COMPLETED",
          revision_no: 1,
          is_effective: true,
          lock_version: 1,
        })
        .select("id")
        .single();

      if (!newRecErr && newRec) {
        recordId = newRec.id;

        await supabase.from("measurement_details").insert({
          record_id: recordId,
          temperature_c: numTemp,
          humidity_pct: numHum,
          temperature_min_snapshot: minTemp,
          temperature_max_snapshot: maxTemp,
          humidity_min_snapshot: templateCode.includes("BM.01") ? minHum : null,
          humidity_max_snapshot: templateCode.includes("BM.01") ? maxHum : null,
          temperature_abnormal: isTempAbnormal,
          humidity_abnormal: isHumAbnormal,
        });

        await supabase
          .from("schedule_occurrences")
          .update({
            status: "FULFILLED",
            fulfilled_by_record_id: recordId,
          })
          .eq("id", occ.id);
      }
    }

    return NextResponse.json({
      success: true,
      occurrenceId: occ.id,
      recordId,
      temperature: numTemp,
      humidity: numHum,
      isAbnormal,
      minTemp,
      maxTemp,
      badgeText: numTemp != null ? `Đã đo: ${numTemp}°C` : "Chưa đo",
      abnormalReason,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

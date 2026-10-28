import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateShiftStatuses } from "@/lib/forms/validation";

const resultUrl = (request: Request, area: string, params: Record<string, string>) => {
  const referer = request.headers.get("referer") ?? "";
  const refererUrl = referer ? new URL(referer) : null;
  const basePath = referer.includes("/equipment") ? "/equipment" : "/bm06";
  const origin = refererUrl?.origin ?? new URL(request.url).origin;
  const url = new URL(basePath, origin);
  if (area) url.searchParams.set("area", area);
  const date = refererUrl?.searchParams.get("date");
  const shift = refererUrl?.searchParams.get("shift");
  if (basePath === "/equipment" && date) url.searchParams.set("date", date);
  if (basePath === "/equipment" && shift) url.searchParams.set("shift", shift);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (basePath === "/equipment") url.hash = "bm06-entry";
  return url;
};

const redirectError = (request: Request, area: string, message: string) => {
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (wantsJson) {
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
  return NextResponse.redirect(resultUrl(request, area, { error: message }), 303);
};

function translateBm06Error(message?: string): string {
  if (!message) return "Không thể lưu ca. Vui lòng kiểm tra lại.";
  if (message.includes("All applicable assets require status")) {
    return "Cần ghi nhận đủ 20/20 máy để hoàn tất ca.";
  }
  if (message.includes("Entry scope denied")) {
    return "Tài khoản của bạn chưa có quyền ghi nhận ca này.";
  }
  if (message.includes("Occurrence not found")) {
    return "Không tìm thấy phiên làm việc.";
  }
  if (message.includes("Record changed or finalized")) {
    return "Bản ghi đã được hoàn tất hoặc cập nhật bởi nhân sự khác; vui lòng tải lại trang.";
  }
  return `Không thể lưu ca: ${message}`;
}

export async function POST(request: Request) {
  const data = await request.formData();
  const occurrenceId = String(data.get("occurrenceId") ?? "");
  const areaCode = String(data.get("areaCode") ?? "");
  const intent = String(data.get("intent") ?? "draft");
  const coWorkerUserId = String(data.get("coWorkerUserId") ?? "").trim() || null;
  const incomingNote = String(data.get("note") || "").trim() || null;

  let statuses: unknown;
  try {
    statuses = JSON.parse(String(data.get("statuses") ?? "[]"));
  } catch {
    return redirectError(request, areaCode, "Payload trạng thái không hợp lệ");
  }

  if (!Array.isArray(statuses)) {
    return redirectError(request, areaCode, "Payload trạng thái không hợp lệ");
  }

  const supabase = await createClient();
  const { data: occ, error: occurrenceError } = await supabase
    .from("schedule_occurrences")
    .select("period_id, register_periods(form_version_id), fulfilled_by_record_id")
    .eq("id", occurrenceId)
    .single();

  const period = occ?.register_periods as unknown as { form_version_id: string } | null;
  if (occurrenceError || !period) {
    return redirectError(request, areaCode, "Không tìm thấy ca hoặc bạn không có quyền truy cập");
  }

  // Pre-load existing draft record if one already exists to preserve general shift info
  // (Prevents wiping note, usage, unit, or coworker on first save AND on retry!)
  let existingRec: any = null;
  if (occ?.fulfilled_by_record_id) {
    const { data: recData } = await supabase
      .from("records")
      .select(`
        id,
        record_state,
        lock_version,
        note,
        equipment_shift_details(usage_value, usage_unit, co_worker_id),
        equipment_shift_statuses(asset_id, status_code, updated_at)
      `)
      .eq("id", occ.fulfilled_by_record_id)
      .maybeSingle();
    existingRec = recData;
  }

  // Check if draft is already finalized
  if (existingRec && existingRec.record_state === "COMPLETED" && intent === "draft") {
    return redirectError(request, areaCode, "Ca làm việc đã được hoàn tất; không thể sửa đổi trạng thái.");
  }

  const { data: expected, error: assetError } = await supabase
    .from("form_version_assets")
    .select("asset_id, assets!inner(active)")
    .eq("form_version_id", period.form_version_id)
    .eq("active", true)
    .eq("assets.active", true);

  if (assetError) {
    return redirectError(request, areaCode, "Không tải được danh sách thiết bị");
  }

  // Guard against offline sync overwriting newer server data:
  // If an incoming machine has client_timestamp older than server updated_at, skip updating that asset
  const existingStatuses = (existingRec?.equipment_shift_statuses || []) as Array<{ asset_id: string; status_code: string; updated_at?: string }>;
  const existingStatusMap = new Map(existingStatuses.map((s) => [s.asset_id, s]));

  const filteredStatuses: Array<{ asset_id: string; status: string }> = [];
  const skippedOutdatedAssets: string[] = [];

  for (const s of statuses as Array<{ asset_id: string; status: string; client_timestamp?: string }>) {
    const existing = existingStatusMap.get(s.asset_id);
    if (existing && existing.updated_at && s.client_timestamp) {
      const serverTime = new Date(existing.updated_at).getTime();
      const clientTime = new Date(s.client_timestamp).getTime();
      if (serverTime > clientTime) {
        skippedOutdatedAssets.push(s.asset_id);
        continue;
      }
    }
    filteredStatuses.push({ asset_id: s.asset_id, status: s.status });
  }

  // If all items were outdated and skipped, return gracefully without overwriting
  if (filteredStatuses.length === 0 && skippedOutdatedAssets.length > 0) {
    const wantsJson = request.headers.get("accept")?.includes("application/json");
    if (wantsJson) {
      return NextResponse.json({
        success: true,
        saved: "1",
        intent,
        lockVersion: existingRec?.lock_version ?? 1,
        skippedOutdated: skippedOutdatedAssets,
        message: "Dữ liệu trên máy chủ đã mới hơn, giữ nguyên trạng thái mới nhất từ máy chủ.",
      });
    }
  }

  // When finalizing, merge draft statuses previously saved in DB with incoming statuses:
  // This allows technicians to finalize even if they navigated/entered machines by area.
  const statusMap = new Map<string, string>();
  if (intent === "finalize" && existingStatuses.length > 0) {
    for (const es of existingStatuses) {
      if (es.asset_id && es.status_code) {
        statusMap.set(es.asset_id, es.status_code);
      }
    }
  }
  for (const s of filteredStatuses) {
    statusMap.set(s.asset_id, s.status);
  }

  const effectiveStatuses = intent === "finalize"
    ? Array.from(statusMap.entries()).map(([asset_id, status]) => ({ asset_id, status }))
    : filteredStatuses;

  const mapped = effectiveStatuses.map((item) => ({
    assetId: item.asset_id,
    status: item.status,
  }));

  const required = intent === "finalize" ? (expected ?? []).map((item) => item.asset_id) : mapped.map((item) => item.assetId);
  const validation = validateShiftStatuses(mapped, required);
  if (!validation.ok) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { logAuditEvent } = await import("@/lib/audit");
      await logAuditEvent({
        action: "BM06_ENTRY_ERROR",
        entityType: "schedule_occurrences",
        entityId: occurrenceId,
        actorUserId: user?.id,
        afterData: {
          action_label: "Lỗi kiểm tra nhập liệu BM.06",
          error: validation.error,
          intent,
          area_code: areaCode || "ALL",
          provided_count: mapped.length,
          required_count: required.length,
        },
      });
    } catch (auditErr) {
      console.warn("[BM06 Entry Error Audit Warning]:", auditErr);
    }
    return redirectError(request, areaCode, validation.error);
  }

  // Preserve existing note if incoming is empty/not provided
  const targetNote = incomingNote ? incomingNote : (existingRec?.note ?? null);
  const resolvedNote = targetNote;

  // Preserve existing coworker if incoming is null/not provided
  const existingCoworker = existingRec?.equipment_shift_details?.[0]?.co_worker_id || null;
  const resolvedCoworker = coWorkerUserId ? coWorkerUserId : existingCoworker;

  // Preserve existing usage values
  const resolvedUsage = existingRec?.equipment_shift_details?.[0]?.usage_value ?? null;
  const resolvedUnit = existingRec?.equipment_shift_details?.[0]?.usage_unit ?? null;

  let lockVersion = Number(data.get("lockVersion") || existingRec?.lock_version || 1);

  let { error } = await supabase.rpc("save_equipment_shift_draft", {
    target_occurrence_id: occurrenceId,
    target_usage: resolvedUsage ?? null, // preserves target_usage: null for v4.1 compatibility
    target_unit: resolvedUnit ?? null, // preserves target_unit: null for v4.1 compatibility
    target_note: targetNote,
    target_statuses: effectiveStatuses,
    target_finalize: intent === "finalize",
    target_expected_lock: lockVersion,
    target_coworker_id: resolvedCoworker,
  });

  // Concurrency resolution for draft saves:
  // If another technician updated the draft concurrently:
  // 1. Verify the record is still in DRAFT mode (if finalized, do not retry).
  // 2. Check for human conflicts on the SAME machine: if incoming status contradicts an already recorded status, reject with conflict warning.
  // 3. Preserve existing note, coworker, and usage values.
  if (error && intent === "draft" && error.message.includes("Record changed or finalized")) {
    const { data: latestOcc } = await supabase
      .from("schedule_occurrences")
      .select(`
        records:fulfilled_by_record_id(
          record_state,
          lock_version,
          note,
          equipment_shift_details(usage_value, usage_unit, co_worker_id),
          equipment_shift_statuses(asset_id, status_code)
        )
      `)
      .eq("id", occurrenceId)
      .maybeSingle();

    const rec = latestOcc?.records as any;
    if (rec && rec.record_state === "DRAFT" && typeof rec.lock_version === "number") {
      // Check for direct status conflicts on the same machine
      const currentStatuses = (rec.equipment_shift_statuses || []) as Array<{ asset_id: string; status_code: string }>;
      const currentStatusMap = new Map(currentStatuses.map((s) => [s.asset_id, s.status_code]));

      let hasConflict = false;
      for (const s of filteredStatuses) {
        const initialStatus = existingStatusMap.get(s.asset_id)?.status_code;
        const currentCode = currentStatusMap.get(s.asset_id);
        const wasTouchedConcurrently = currentCode !== initialStatus;
        if (wasTouchedConcurrently && currentCode !== undefined && currentCode !== s.status) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        return redirectError(
          request,
          areaCode,
          "Xung đột dữ liệu: Thiết bị này vừa được cập nhật trạng thái khác bởi nhân sự khác trong cùng ca. Vui lòng tải lại trang để đối soát."
        );
      }

      // Preserve existing note and coworker if not supplied
      const retryNote = incomingNote ? incomingNote : (rec.note ?? resolvedNote);
      const retryCoworker = coWorkerUserId ? coWorkerUserId : (rec.equipment_shift_details?.[0]?.co_worker_id ?? resolvedCoworker);
      const retryUsage = rec.equipment_shift_details?.[0]?.usage_value ?? resolvedUsage;
      const retryUnit = rec.equipment_shift_details?.[0]?.usage_unit ?? resolvedUnit;

      lockVersion = rec.lock_version;
      const retryRes = await supabase.rpc("save_equipment_shift_draft", {
        target_occurrence_id: occurrenceId,
        target_usage: retryUsage ?? null, // preserves target_usage: null for v4.1 compatibility
        target_unit: retryUnit ?? null, // preserves target_unit: null for v4.1 compatibility
        target_note: retryNote,
        target_statuses: effectiveStatuses,
        target_finalize: false,
        target_expected_lock: lockVersion,
        target_coworker_id: retryCoworker,
      });
      error = retryRes.error;
    }
  }

  if (error) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { logAuditEvent } = await import("@/lib/audit");
      await logAuditEvent({
        action: "BM06_ENTRY_ERROR",
        entityType: "schedule_occurrences",
        entityId: occurrenceId,
        actorUserId: user?.id,
        afterData: {
          action_label: intent === "finalize" ? "Lỗi hoàn tất ca BM.06" : "Lỗi lưu ca BM.06",
          error: translateBm06Error(error.message),
          raw_error: error.message,
          intent,
          area_code: areaCode || "ALL",
        },
      });
    } catch (auditErr) {
      console.warn("[BM06 RPC Error Audit Warning]:", auditErr);
    }
    return redirectError(request, areaCode, translateBm06Error(error.message));
  }

  // Audit logging according to ISO 15189 compliance: record note + machine statuses
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { logAuditEvent } = await import("@/lib/audit");
    const statuses = filteredStatuses;
    await logAuditEvent({
      action: intent === "finalize" ? "BM06_FINALIZE_SHIFT" : "BM06_SAVE_SHIFT",
      entityType: "schedule_occurrences",
      entityId: occurrenceId,
      actorUserId: user?.id,
      afterData: {
        action_label: intent === "finalize" ? "Hoàn tất ca BM.06" : "Lưu trạng thái BM.06",
        note: targetNote,
        statuses_count: statuses.length,
        machine_statuses: statuses,
        area_code: areaCode || "ALL",
        co_worker_user_id: resolvedCoworker,
        finalized: intent === "finalize",
      },
    });
  } catch (auditErr) {
    console.warn("[BM06 Audit Log Warning]:", auditErr);
  }

  try {
    revalidatePath("/");
    revalidatePath("/equipment");
    revalidatePath("/bm06");
    revalidatePath("/quick-duty");
    revalidatePath("/dashboard");
    revalidatePath("/approvals");
    revalidatePath("/reports");
  } catch {
    // Revalidation may be a no-op in standalone test environments
  }

  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (wantsJson) {
    // Fetch latest lockVersion to send back to client
    const { data: latestRec } = await supabase
      .from("schedule_occurrences")
      .select("records:fulfilled_by_record_id(lock_version)")
      .eq("id", occurrenceId)
      .maybeSingle();
    const currentLock = (latestRec?.records as any)?.lock_version ?? (lockVersion + 1);
    return NextResponse.json({
      success: true,
      saved: "1",
      intent,
      lockVersion: currentLock,
      skippedOutdated: skippedOutdatedAssets,
    });
  }
  return NextResponse.redirect(resultUrl(request, areaCode, { saved: "1", intent }), 303);
}

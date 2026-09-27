import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateShiftStatuses } from "@/lib/forms/validation";

const redirectError = (request: Request, area: string, message: string) =>
  NextResponse.redirect(
    new URL(`/bm06?area=${encodeURIComponent(area)}&error=${encodeURIComponent(message)}`, request.url),
    303
  );

function translateBm06Error(message?: string): string {
  if (!message) return "Không thể lưu ca. Vui lòng kiểm tra lại.";
  if (message.includes("All applicable assets require status")) {
    return "Cần ghi nhận đủ 25/25 máy để hoàn tất ca.";
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
    .select("period_id, register_periods(form_version_id)")
    .eq("id", occurrenceId)
    .single();

  const period = occ?.register_periods as unknown as { form_version_id: string } | null;
  if (occurrenceError || !period) {
    return redirectError(request, areaCode, "Không tìm thấy ca hoặc bạn không có quyền truy cập");
  }

  const { data: expected, error: assetError } = await supabase
    .from("form_version_assets")
    .select("asset_id")
    .eq("form_version_id", period.form_version_id)
    .eq("active", true);

  if (assetError) {
    return redirectError(request, areaCode, "Không tải được danh sách thiết bị");
  }

  const mapped = statuses.map((item: Record<string, unknown>) => ({
    assetId: String(item.asset_id),
    status: String(item.status),
  }));

  const required = intent === "finalize" ? (expected ?? []).map((item) => item.asset_id) : mapped.map((item) => item.assetId);
  const validation = validateShiftStatuses(mapped, required);
  if (!validation.ok) {
    return redirectError(request, areaCode, validation.error);
  }

  const { error } = await supabase.rpc("save_equipment_shift_draft", {
    target_occurrence_id: occurrenceId,
    target_usage: null,
    target_unit: null,
    target_note: String(data.get("note") || "") || null,
    target_statuses: statuses,
    target_finalize: intent === "finalize",
    target_expected_lock: Number(data.get("lockVersion") || 1),
  });

  if (error) {
    return redirectError(request, areaCode, translateBm06Error(error.message));
  }

  return NextResponse.redirect(
    new URL(`/bm06?area=${encodeURIComponent(areaCode)}&saved=1&intent=${encodeURIComponent(intent)}`, request.url),
    303
  );
}

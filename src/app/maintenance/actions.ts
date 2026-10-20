"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateMaintenance } from "@/lib/forms/validation";
import { vietnamLocalDateTimeToIso } from "@/lib/forms/datetime";

const fail = (id: string, message: string): never =>
  redirect(`/maintenance/${id}?error=${encodeURIComponent(message)}`);

export async function saveMaintenanceAction(form: FormData) {
  const isAjax = form.get("ajax") === "1";
  const id = String(form.get("occurrenceId") ?? "");
  const cadence = String(form.get("cadence") ?? "");
  const result = String(form.get("result") ?? "");

  const validation = validateMaintenance(cadence, result);
  if (!validation.ok) {
    if (isAjax) return { success: false, error: validation.error };
    fail(id, validation.error);
  }

  const raw = String(form.get("performedAt") ?? "");
  let performedAt = "";
  try {
    performedAt = vietnamLocalDateTimeToIso(raw);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ngày giờ không hợp lệ";
    if (isAjax) return { success: false, error: msg };
    fail(id, msg);
  }

  const targetNote = String(form.get("note") || "") || null;
  const supabase = await createClient();

  // Check occurrence status in database to handle both initial save and edit/correction
  const { data: occurrence, error: occError } = await supabase
    .from("schedule_occurrences")
    .select("id, status, fulfilled_by_record_id, register_periods (status)")
    .eq("id", id)
    .single();

  if (occError || !occurrence) {
    const errorMsg = "Không tìm thấy lịch bảo dưỡng (occurrence).";
    if (isAjax) return { success: false, error: errorMsg };
    return fail(id, errorMsg);
  }

  if (occurrence.status === "COMPLETED" && occurrence.fulfilled_by_record_id) {
    // If already fulfilled, check whether the register period is approved
    const period = occurrence.register_periods as unknown as { status: string } | null;
    if (period?.status === "APPROVED") {
      const errorMsg =
        "Kỳ bảo dưỡng đã được phê duyệt, không thể chỉnh sửa trực tiếp. Vui lòng tạo phiếu yêu cầu hiệu chỉnh (Correction).";
      if (isAjax) return { success: false, error: errorMsg };
      return fail(id, errorMsg);
    }

    // Update existing record and maintenance details
    const { error: recUpdateError } = await supabase
      .from("records")
      .update({
        performed_at: performedAt,
        note: targetNote,
      })
      .eq("id", occurrence.fulfilled_by_record_id);

    const { error: detUpdateError } = await supabase
      .from("maintenance_details")
      .update({
        cadence,
        result,
      })
      .eq("record_id", occurrence.fulfilled_by_record_id);

    if (recUpdateError || detUpdateError) {
      const errorMsg =
        recUpdateError?.message ||
        detUpdateError?.message ||
        "Không thể cập nhật kết quả bảo dưỡng. Vui lòng thử lại.";
      if (isAjax) return { success: false, error: errorMsg };
      return fail(id, errorMsg);
    }
  } else {
    // Initial save via standard RPC
    const { error } = await supabase.rpc("save_maintenance_record", {
      target_occurrence_id: id,
      target_performed_at: performedAt,
      target_cadence: cadence,
      target_result: result,
      target_note: targetNote,
    });

    if (error) {
      const errorMsg = error.message
        ? `Lỗi hệ thống: ${error.message}`
        : "Không thể lưu bảo dưỡng. Vui lòng tải lại và thử lại.";
      if (isAjax) return { success: false, error: errorMsg };
      return fail(id, errorMsg);
    }
  }

  try {
    revalidatePath("/maintenance");
    revalidatePath(`/maintenance/${id}`);
    revalidatePath("/quick-duty");
    revalidatePath("/equipment");
    revalidatePath("/");
  } catch {
    // Revalidation may be a no-op in isolated test environments
  }

  const redirectUrl = `/maintenance?saved=${encodeURIComponent(id)}`;
  if (isAjax) return { success: true, redirectUrl };
  redirect(redirectUrl);
}

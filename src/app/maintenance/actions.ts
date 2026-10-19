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

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_maintenance_record", {
    target_occurrence_id: id,
    target_performed_at: performedAt,
    target_cadence: cadence,
    target_result: result,
    target_note: String(form.get("note") || "") || null,
  });

  if (error) {
    const errorMsg = error.message ? `Lỗi hệ thống: ${error.message}` : "Không thể lưu bảo dưỡng. Vui lòng tải lại và thử lại.";
    if (isAjax) return { success: false, error: errorMsg };
    fail(id, errorMsg);
  }

  try {
    revalidatePath("/tasks");
    revalidatePath(`/maintenance/${id}`);
    revalidatePath("/equipment");
    revalidatePath("/");
  } catch {
    // Revalidation may be a no-op in isolated test environments
  }

  if (isAjax) return { success: true, redirectUrl: "/tasks?saved=maintenance" };
  redirect("/tasks?saved=maintenance");
}

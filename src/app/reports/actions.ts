"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function toggleInternalConfirmationAction(periodId: string, confirmed: boolean) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, message: "Vui lòng đăng nhập để thực hiện xác nhận." };
  }

  // Check role: Only DEPARTMENT_HEAD or is_admin can toggle
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_role, is_admin, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const canConfirm = Boolean(profile?.is_admin || profile?.business_role === "DEPARTMENT_HEAD");
  if (!canConfirm) {
    return { ok: false, message: "Chỉ Chỉ huy BMK hoặc Quản trị viên mới có quyền xác nhận nội bộ." };
  }

  const updates = confirmed
    ? {
        status: "APPROVED",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }
    : {
        status: "OPEN",
        approved_by: null,
        approved_at: null,
      };

  // `register_periods` chỉ có policy SELECT cho authenticated (P3). Nếu UPDATE bằng client
  // người dùng, RLS lọc mất hàng và trả về 0 dòng KHÔNG báo lỗi → giao diện tưởng đã lưu
  // nhưng dữ liệu không đổi (lỗi "tích xong lại mất"). Quyền đã được kiểm tra ở trên
  // (Chỉ huy BMK / Quản trị viên), nên ghi bằng service-role và BẮT BUỘC xác minh số dòng.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "Máy chủ thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY, không thể lưu xác nhận." };
  }
  const admin = createAdminClient();
  const { data: updatedRows, error: updateErr } = await admin
    .from("register_periods")
    .update(updates)
    .eq("id", periodId)
    .select("id,status");

  if (updateErr) {
    console.error("Error updating register_period:", updateErr);
    return { ok: false, message: "Không thể lưu trạng thái xác nhận: " + updateErr.message };
  }
  if (!updatedRows || updatedRows.length !== 1 || updatedRows[0].status !== updates.status) {
    console.error("[toggleInternalConfirmationAction] No row persisted for period", periodId);
    return { ok: false, message: "Không tìm thấy sổ kỳ hoặc trạng thái chưa được lưu. Vui lòng tải lại trang." };
  }

  // Insert audit event
  try {
    const { error: rpcErr } = await supabase.rpc("audit_event", {
      target_action: confirmed ? "INTERNAL_CONFIRMATION_CHECK" : "INTERNAL_CONFIRMATION_UNCHECK",
      target_entity_type: "register_period",
      target_entity_id: periodId,
      target_before: null,
      target_after: {
        confirmed,
        confirmed_by: profile?.full_name,
        period_id: periodId,
        timestamp: new Date().toISOString(),
      },
    });
    if (rpcErr) {
      console.error("[toggleInternalConfirmationAction] Audit log error:", rpcErr);
    }
  } catch (e) {
    console.warn("Audit log warning (non-fatal):", e);
  }

  revalidatePath("/reports");
  revalidatePath("/periods");
  revalidatePath("/");
  return { ok: true, confirmed };
}

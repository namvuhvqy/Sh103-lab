"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("mark_notification_read", {
      target_notification_id: notificationId,
    });
    if (error) throw error;
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể cập nhật trạng thái thông báo") };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResponse<number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("mark_all_notifications_read");
    if (error) throw error;
    revalidatePath("/notifications");
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể đánh dấu đã đọc tất cả thông báo") };
  }
}

export async function createAnnouncementAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const audienceType = String(formData.get("audience_type") ?? "ALL");
    const audienceRef = formData.get("audience_ref") ? String(formData.get("audience_ref")).trim() : null;
    const severity = String(formData.get("severity") ?? "INFO");
    const publishAt = formData.get("publish_at") ? String(formData.get("publish_at")) : new Date().toISOString();
    const expiresAt = formData.get("expires_at") ? String(formData.get("expires_at")) : null;

    if (!title || !body) {
      return { success: false, error: "Tiêu đề và nội dung thông báo là bắt buộc" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Yêu cầu đăng nhập" };
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title,
        body,
        audience_type: audienceType,
        audience_ref: audienceType === "ALL" ? null : audienceRef,
        severity,
        publish_at: publishAt,
        expires_at: expiresAt || null,
        created_by: user.id,
        active: false,
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/admin/announcements");
    return { success: true, data: { id: data.id } };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể tạo thông báo") };
  }
}

export async function publishAnnouncementAction(announcementId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("publish_announcement", {
      target_announcement_id: announcementId,
    });
    if (error) throw error;
    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể phát hành thông báo") };
  }
}

export async function deactivateAnnouncementAction(announcementId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("deactivate_announcement", {
      target_announcement_id: announcementId,
    });
    if (error) throw error;
    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể tắt thông báo") };
  }
}

export async function createIncidentAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();
    const businessDate = String(formData.get("business_date") ?? "").trim();
    const occurredAt = String(formData.get("occurred_at") ?? "").trim();
    const locationId = formData.get("location_id") ? String(formData.get("location_id")).trim() || null : null;
    const assetId = formData.get("asset_id") ? String(formData.get("asset_id")).trim() || null : null;
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const severity = String(formData.get("severity") ?? "MEDIUM").trim();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const immediateAction = formData.get("immediate_action") ? String(formData.get("immediate_action")).trim() : null;
    const linkedRecordId = formData.get("linked_record_id") ? String(formData.get("linked_record_id")).trim() || null : null;

    if (!businessDate || !occurredAt || !categoryId || !severity || !title || !description) {
      return { success: false, error: "Vui lòng điền đầy đủ các thông tin bắt buộc" };
    }

    if (!locationId && !assetId) {
      return { success: false, error: "Cần chọn khu vực hoặc thiết bị xảy ra sự cố" };
    }

    if (description.length > 500) {
      return { success: false, error: "Mô tả sự cố tối đa 500 ký tự" };
    }

    const { data, error } = await supabase.rpc("create_incident", {
      target_business_date: businessDate,
      target_occurred_at: occurredAt,
      target_location_id: locationId,
      target_asset_id: assetId,
      target_category_id: categoryId,
      target_severity: severity,
      target_title: title,
      target_description: description,
      target_immediate_action: immediateAction || null,
      target_linked_record_id: linkedRecordId,
    });

    if (error) throw error;
    revalidatePath("/incidents");
    return { success: true, data: { id: data } };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể tạo báo cáo sự cố") };
  }
}

export async function transitionIncidentAction(
  incidentId: string,
  targetStatus: "IN_REVIEW" | "RESOLVED" | "CLOSED",
  note: string
): Promise<ActionResponse> {
  try {
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      return { success: false, error: "Vui lòng nhập ghi chú chuyển trạng thái" };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("transition_incident", {
      target_incident_id: incidentId,
      target_status: targetStatus,
      target_note: trimmedNote,
    });

    if (error) throw error;
    revalidatePath(`/incidents/${incidentId}`);
    revalidatePath("/incidents");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: errorMessage(err, "Không thể cập nhật trạng thái sự cố") };
  }
}

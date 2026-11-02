// Chỉ dùng phía máy chủ (Server Components / Route Handlers): sử dụng service-role để ký URL.
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { INCIDENT_PHOTO_BUCKET, type IncidentPhoto } from "@/lib/incidents/photo-constants";

export * from "@/lib/incidents/photo-constants";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 giờ

type AttachmentRow = {
  id: string;
  incident_id: string;
  storage_path: string;
  thumb_path: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  created_at: string;
  uploader: { full_name: string } | null;
};

/**
 * Trả về ảnh của các sự cố, nhóm theo incident_id.
 * - Danh sách ảnh được đọc bằng client người dùng → RLS bảo đảm chỉ thấy ảnh của sự cố trong phạm vi.
 * - URL ảnh là signed URL ngắn hạn (bucket private), tạo hàng loạt trong 1 request.
 * - Lỗi (ví dụ chưa có bảng/bucket) KHÔNG làm hỏng trang: trả về rỗng.
 */
export async function getIncidentPhotoMap(incidentIds: string[]): Promise<Record<string, IncidentPhoto[]>> {
  const ids = Array.from(new Set(incidentIds.filter(Boolean)));
  if (!ids.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incident_attachments")
      .select("id,incident_id,storage_path,thumb_path,width,height,caption,created_at,uploader:profiles!incident_attachments_uploaded_by_fkey(full_name)")
      .in("incident_id", ids)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[getIncidentPhotoMap] query error (non-fatal):", error.message);
      return {};
    }
    if (!data?.length) return {};

    const rows = data as unknown as AttachmentRow[];
    const paths = Array.from(new Set(rows.flatMap((row) => [row.storage_path, row.thumb_path].filter(Boolean) as string[])));
    const admin = createAdminClient();
    const { data: signed, error: signError } = await admin.storage
      .from(INCIDENT_PHOTO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed) {
      console.warn("[getIncidentPhotoMap] sign error (non-fatal):", signError?.message);
      return {};
    }

    const urlByPath = new Map<string, string>();
    for (const item of signed) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }

    const map: Record<string, IncidentPhoto[]> = {};
    for (const row of rows) {
      const url = urlByPath.get(row.storage_path);
      if (!url) continue;
      (map[row.incident_id] ??= []).push({
        id: row.id,
        incidentId: row.incident_id,
        url,
        thumbUrl: (row.thumb_path && urlByPath.get(row.thumb_path)) || url,
        width: row.width,
        height: row.height,
        caption: row.caption,
        createdAt: row.created_at,
        uploaderName: row.uploader?.full_name ?? null,
      });
    }
    return map;
  } catch (err) {
    console.error("[getIncidentPhotoMap] non-fatal:", err);
    return {};
  }
}

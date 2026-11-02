import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  INCIDENT_PHOTO_BUCKET,
  INCIDENT_PHOTO_MAX_BYTES,
  INCIDENT_PHOTO_MAX_PER_INCIDENT,
  INCIDENT_THUMB_MAX_BYTES,
  extensionForMime,
  sniffImageMime,
} from "@/lib/incidents/photo-constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function toPositiveInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n < 20000 ? Math.round(n) : null;
}

/**
 * POST /api/incidents/:incidentId/photos  (multipart/form-data)
 *   photo   (File, bắt buộc)  — ảnh đã nén phía client (JPEG/PNG/WEBP ≤ 5MB)
 *   thumb   (File, tuỳ chọn)  — ảnh thu nhỏ cho danh sách (≤ 512KB)
 *   width, height, caption    — siêu dữ liệu tuỳ chọn
 *
 * An toàn:
 *   1. Bắt buộc đăng nhập; kiểm tra quyền xem sự cố bằng client người dùng (RLS).
 *   2. Kiểm tra định dạng thật bằng magic bytes + giới hạn dung lượng.
 *   3. Ghi siêu dữ liệu qua RPC SECURITY DEFINER `add_incident_attachment` (kiểm tra quyền lần 2,
 *      chặn sự cố đã đóng, giới hạn 8 ảnh, ghi audit). Nếu RPC lỗi → xoá file vừa tải lên.
 */
export async function POST(request: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  if (!UUID_RE.test(incidentId)) return json(400, { error: "Mã sự cố không hợp lệ" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { error: "Máy chủ chưa cấu hình lưu trữ ảnh" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json(401, { error: "Vui lòng đăng nhập" });

  // RLS: chỉ trả về sự cố nếu người dùng là người báo cáo hoặc trong phạm vi được xem
  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id,status")
    .eq("id", incidentId)
    .maybeSingle();
  if (incidentError) return json(500, { error: "Không kiểm tra được sự cố" });
  if (!incident) return json(404, { error: "Không tìm thấy sự cố hoặc không có quyền" });
  if (incident.status === "CLOSED") return json(409, { error: "Sự cố đã đóng, không thể bổ sung ảnh" });

  const { count } = await supabase
    .from("incident_attachments")
    .select("id", { count: "exact", head: true })
    .eq("incident_id", incidentId);
  if ((count ?? 0) >= INCIDENT_PHOTO_MAX_PER_INCIDENT) {
    return json(409, { error: `Mỗi sự cố tối đa ${INCIDENT_PHOTO_MAX_PER_INCIDENT} ảnh` });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Dữ liệu tải lên không hợp lệ" });
  }

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return json(400, { error: "Thiếu tệp ảnh" });
  if (photo.size > INCIDENT_PHOTO_MAX_BYTES) return json(413, { error: "Ảnh vượt quá 5MB" });
  const photoBytes = new Uint8Array(await photo.arrayBuffer());
  const photoMime = sniffImageMime(photoBytes);
  if (!photoMime) return json(415, { error: "Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP" });

  let thumbBytes: Uint8Array | null = null;
  let thumbMime: ReturnType<typeof sniffImageMime> = null;
  const thumb = form.get("thumb");
  if (thumb instanceof File && thumb.size > 0) {
    if (thumb.size > INCIDENT_THUMB_MAX_BYTES) return json(413, { error: "Ảnh thu nhỏ quá lớn" });
    thumbBytes = new Uint8Array(await thumb.arrayBuffer());
    thumbMime = sniffImageMime(thumbBytes);
    if (!thumbMime) return json(415, { error: "Ảnh thu nhỏ không hợp lệ" });
  }

  const captionRaw = String(form.get("caption") ?? "").trim().slice(0, 200);
  const width = toPositiveInt(form.get("width"));
  const height = toPositiveInt(form.get("height"));

  const fileId = randomUUID();
  const storagePath = `incidents/${incidentId}/${fileId}.${extensionForMime(photoMime)}`;
  const thumbPath = thumbBytes && thumbMime ? `incidents/${incidentId}/${fileId}_thumb.${extensionForMime(thumbMime)}` : null;

  const admin = createAdminClient();
  const bucket = admin.storage.from(INCIDENT_PHOTO_BUCKET);
  const uploaded: string[] = [];

  const { error: uploadError } = await bucket.upload(storagePath, photoBytes, {
    contentType: photoMime,
    upsert: false,
    cacheControl: "3600",
  });
  if (uploadError) {
    console.error("[incident-photos] upload error:", uploadError.message);
    return json(500, { error: "Không tải được ảnh lên kho lưu trữ" });
  }
  uploaded.push(storagePath);

  if (thumbPath && thumbBytes && thumbMime) {
    const { error: thumbError } = await bucket.upload(thumbPath, thumbBytes, {
      contentType: thumbMime,
      upsert: false,
      cacheControl: "3600",
    });
    if (thumbError) {
      await bucket.remove(uploaded);
      console.error("[incident-photos] thumb upload error:", thumbError.message);
      return json(500, { error: "Không tải được ảnh thu nhỏ" });
    }
    uploaded.push(thumbPath);
  }

  const { data: attachmentId, error: rpcError } = await supabase.rpc("add_incident_attachment", {
    target_incident_id: incidentId,
    target_storage_path: storagePath,
    target_thumb_path: thumbPath,
    target_mime_type: photoMime,
    target_size_bytes: photoBytes.byteLength,
    target_width: width,
    target_height: height,
    target_caption: captionRaw || null,
  });

  if (rpcError) {
    await bucket.remove(uploaded);
    console.error("[incident-photos] rpc error:", rpcError.message);
    const message = rpcError.message.includes("limit")
      ? `Mỗi sự cố tối đa ${INCIDENT_PHOTO_MAX_PER_INCIDENT} ảnh`
      : rpcError.message.includes("closed")
        ? "Sự cố đã đóng, không thể bổ sung ảnh"
        : rpcError.message.includes("denied")
          ? "Không có quyền bổ sung ảnh cho sự cố này"
          : "Không lưu được thông tin ảnh";
    return json(rpcError.code === "42501" ? 403 : 400, { error: message });
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return json(201, { id: attachmentId });
}


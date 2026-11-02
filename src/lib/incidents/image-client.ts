"use client";

// Nén ảnh phía trình duyệt trước khi tải lên:
//  - Giảm dung lượng (ảnh điện thoại 3–8MB → ~200–600KB) để tải nhanh trên 4G và nằm dưới giới hạn body 4.5MB của Vercel.
//  - Xuất JPEG mới qua canvas → loại bỏ toàn bộ EXIF (vị trí GPS, thông tin máy) vì lý do bảo mật.
//  - Tạo thêm ảnh thu nhỏ cho danh sách để màn hình /incidents tải nhẹ.

export interface CompressedIncidentPhoto {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  previewUrl: string;
}

const FULL_MAX_EDGE = 1600;
const THUMB_MAX_EDGE = 360;
export const CLIENT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const CLIENT_MAX_SOURCE_BYTES = 30 * 1024 * 1024;

async function loadBitmap(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // fallback bên dưới (một số trình duyệt cũ không hỗ trợ tuỳ chọn)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function renderJpeg(source: CanvasImageSource, srcW: number, srcH: number, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("encode"))), "image/jpeg", quality);
  });
}

export async function compressIncidentPhoto(file: File): Promise<CompressedIncidentPhoto> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Tệp không phải hình ảnh");
  }
  if (file.size > CLIENT_MAX_SOURCE_BYTES) throw new Error("Ảnh gốc quá lớn (tối đa 30MB)");

  let bitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    throw new Error("Trình duyệt không đọc được định dạng ảnh này (hãy chụp lại hoặc chọn ảnh JPEG/PNG)");
  }
  try {
    let full = await renderJpeg(bitmap.source, bitmap.width, bitmap.height, FULL_MAX_EDGE, 0.82);
    if (full.blob.size > CLIENT_MAX_UPLOAD_BYTES) {
      full = await renderJpeg(bitmap.source, bitmap.width, bitmap.height, 1200, 0.7);
    }
    if (full.blob.size > CLIENT_MAX_UPLOAD_BYTES) throw new Error("Ảnh sau khi nén vẫn quá lớn");
    const thumb = await renderJpeg(bitmap.source, bitmap.width, bitmap.height, THUMB_MAX_EDGE, 0.72);
    return {
      full: full.blob,
      thumb: thumb.blob,
      width: full.width,
      height: full.height,
      previewUrl: URL.createObjectURL(thumb.blob),
    };
  } finally {
    bitmap.release();
  }
}

/** Tải 1 ảnh đã nén lên máy chủ. Trả về thông báo lỗi (tiếng Việt) hoặc null nếu thành công. */
export async function uploadIncidentPhoto(incidentId: string, photo: CompressedIncidentPhoto, caption?: string): Promise<string | null> {
  const body = new FormData();
  body.append("photo", photo.full, "photo.jpg");
  body.append("thumb", photo.thumb, "thumb.jpg");
  body.append("width", String(photo.width));
  body.append("height", String(photo.height));
  if (caption) body.append("caption", caption);
  try {
    const res = await fetch(`/api/incidents/${incidentId}/photos`, { method: "POST", body, credentials: "same-origin" });
    if (res.ok) return null;
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? `Lỗi tải ảnh (HTTP ${res.status})`;
  } catch {
    return "Mất kết nối khi tải ảnh";
  }
}


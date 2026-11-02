// Hằng số & tiện ích thuần (dùng được cả client lẫn server) cho ảnh sự cố.
export const INCIDENT_PHOTO_BUCKET = "incident-photos";
export const INCIDENT_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB (khớp giới hạn bucket)
export const INCIDENT_THUMB_MAX_BYTES = 512 * 1024;
export const INCIDENT_PHOTO_MAX_PER_INCIDENT = 8;
export const INCIDENT_PHOTO_MAX_PER_UPLOAD_BATCH = 6;

export type IncidentImageMime = "image/jpeg" | "image/png" | "image/webp";

/** Nhận diện định dạng thật của ảnh qua magic bytes (không tin Content-Type do client gửi). */
export function sniffImageMime(bytes: Uint8Array): IncidentImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export function extensionForMime(mime: IncidentImageMime): string {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

export interface IncidentPhoto {
  id: string;
  incidentId: string;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  createdAt: string;
  uploaderName: string | null;
}


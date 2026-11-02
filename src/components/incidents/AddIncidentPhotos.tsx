"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { PhotoCaptureField } from "@/components/incidents/PhotoCaptureField";
import { uploadIncidentPhoto, type CompressedIncidentPhoto } from "@/lib/incidents/image-client";
import { INCIDENT_PHOTO_MAX_PER_INCIDENT } from "@/lib/incidents/photo-constants";

/** Bổ sung ảnh cho một sự cố đã tồn tại (dùng trong danh sách mở rộng và trang chi tiết). */
export function AddIncidentPhotos({ incidentId, existingCount }: { incidentId: string; existingCount: number }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<CompressedIncidentPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const max = Math.max(0, INCIDENT_PHOTO_MAX_PER_INCIDENT - existingCount);

  if (max === 0) {
    return <p className="text-xs font-semibold text-slate-500">Đã đạt tối đa {INCIDENT_PHOTO_MAX_PER_INCIDENT} ảnh cho sự cố này.</p>;
  }

  async function submit() {
    if (!photos.length) return;
    setUploading(true);
    setError(null);
    const failed: CompressedIncidentPhoto[] = [];
    let lastError: string | null = null;
    for (let i = 0; i < photos.length; i++) {
      setProgress(`Đang tải ảnh ${i + 1}/${photos.length}…`);
      const err = await uploadIncidentPhoto(incidentId, photos[i]);
      if (err) {
        failed.push(photos[i]);
        lastError = err;
      } else {
        URL.revokeObjectURL(photos[i].previewUrl);
      }
    }
    setPhotos(failed);
    setUploading(false);
    setProgress(failed.length ? null : "Đã lưu ảnh.");
    if (lastError) setError(`${failed.length} ảnh chưa tải được: ${lastError}`);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-3">
      <PhotoCaptureField photos={photos} onChange={setPhotos} max={max} disabled={uploading} label="Bổ sung ảnh" />
      {photos.length ? (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={uploading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal-800 px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? progress : `Lưu ${photos.length} ảnh`}
        </button>
      ) : null}
      {!uploading && progress ? <p role="status" className="text-xs font-semibold text-emerald-700">{progress}</p> : null}
      {error ? <p role="alert" className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}


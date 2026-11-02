"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { compressIncidentPhoto, type CompressedIncidentPhoto } from "@/lib/incidents/image-client";

export interface PhotoCaptureFieldProps {
  photos: CompressedIncidentPhoto[];
  onChange: (photos: CompressedIncidentPhoto[]) => void;
  max: number;
  disabled?: boolean;
  label?: string;
}

/**
 * Chụp ảnh trực tiếp bằng camera (capture="environment" → camera sau trên điện thoại)
 * hoặc chọn ảnh có sẵn trong thư viện. Ảnh được nén ngay khi chọn, hiển thị xem trước, có thể xoá trước khi gửi.
 */
export function PhotoCaptureField({ photos, onChange, max, disabled = false, label = "Ảnh hiện trường" }: PhotoCaptureFieldProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, max - photos.length);

  async function handleFiles(fileList: FileList | null) {
    setError(null);
    if (!fileList?.length) return;
    const files = Array.from(fileList).slice(0, remaining);
    if (fileList.length > remaining) setError(`Chỉ thêm được tối đa ${max} ảnh.`);
    setProcessing(true);
    const next = [...photos];
    for (const file of files) {
      try {
        next.push(await compressIncidentPhoto(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không xử lý được ảnh");
      }
    }
    onChange(next);
    setProcessing(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function removeAt(index: number) {
    const target = photos[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((_, i) => i !== index));
  }

  const blocked = disabled || processing || remaining === 0;

  return (
    <div className="space-y-2" data-testid="incident-photo-capture">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <span className="text-[11px] font-semibold text-slate-500">{photos.length}/{max} ảnh</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={blocked}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-800 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Chụp ảnh
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={blocked}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-3 text-sm font-bold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="size-4" />
          Chọn ảnh có sẵn
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Chụp ảnh sự cố bằng camera"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        multiple
        className="hidden"
        aria-label="Chọn ảnh sự cố từ thư viện"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error ? <p role="alert" className="text-xs font-semibold text-red-700">{error}</p> : null}
      {photos.length ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((photo, index) => (
            <li key={photo.previewUrl} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.previewUrl} alt={`Ảnh chuẩn bị gửi ${index + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Bỏ ảnh ${index + 1}`}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-slate-500">
          Ảnh được nén và xoá thông tin vị trí (EXIF) trước khi gửi. Không chụp khuôn mặt, tên hoặc mã bệnh án người bệnh.
        </p>
      )}
    </div>
  );
}


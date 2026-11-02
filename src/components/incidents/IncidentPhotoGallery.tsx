"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { IncidentPhoto } from "@/lib/incidents/photo-constants";

/** Lưới ảnh thu nhỏ + trình xem ảnh toàn màn hình (lightbox) ngay trong trang. */
export function IncidentPhotoGallery({ photos, size = "md" }: { photos: IncidentPhoto[]; size?: "sm" | "md" }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <ul className={size === "sm" ? "grid grid-cols-4 gap-2 sm:grid-cols-6" : "grid grid-cols-3 gap-2 sm:grid-cols-4"} data-testid="incident-photo-gallery">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              aria-label={`Xem ảnh ${index + 1}/${photos.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumbUrl} alt={photo.caption ?? `Ảnh sự cố ${index + 1}`} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null ? (
        <PhotoLightbox photos={photos} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      ) : null}
    </>
  );
}

function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: IncidentPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + photos.length) % photos.length),
    [index, onIndexChange, photos.length]
  );
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh sự cố"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="font-bold">Ảnh {index + 1}/{photos.length}</span>
        <div className="flex items-center gap-2">
          <a href={photo.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 font-semibold hover:bg-white/20">
            <ExternalLink className="size-4" />Ảnh gốc
          </a>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2"
        onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? `Ảnh sự cố ${index + 1}`}
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {photos.length > 1 ? (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25">
              <ChevronRight className="size-6" />
            </button>
          </>
        ) : null}
      </div>
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-xs text-white/80" onClick={(e) => e.stopPropagation()}>
        {photo.caption ? <p className="mb-1 text-sm font-semibold text-white">{photo.caption}</p> : null}
        <p>{new Date(photo.createdAt).toLocaleString("vi-VN")}{photo.uploaderName ? ` · ${photo.uploaderName}` : ""}</p>
      </div>
    </div>
  );
}


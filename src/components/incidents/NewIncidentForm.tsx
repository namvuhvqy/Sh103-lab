"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Upload } from "lucide-react";
import { PhotoCaptureField } from "@/components/incidents/PhotoCaptureField";
import { createIncidentAction } from "@/lib/p5/actions";
import { uploadIncidentPhoto, type CompressedIncidentPhoto } from "@/lib/incidents/image-client";
import type { IncidentCategory } from "@/lib/p5/queries";

export interface NewIncidentFormProps {
  categories: IncidentCategory[];
  locations: Array<{ id: string; name: string }>;
  assets: Array<{ id: string; source_name: string }>;
  defaultAssetId?: string;
}

export function NewIncidentForm({
  categories,
  locations,
  assets,
  defaultAssetId,
}: NewIncidentFormProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<CompressedIncidentPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSubmitProgress("Đang tạo sự cố...");

    const formData = new FormData(e.currentTarget);
    const result = await createIncidentAction(formData);

    if (!result.success || !result.data?.id) {
      setError(result.error ?? "Không thể tạo báo cáo sự cố");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    const incidentId = result.data.id;

    if (photos.length > 0) {
      setSubmitProgress(`Đang tải lên ${photos.length} ảnh hiện trường...`);
      for (let i = 0; i < photos.length; i++) {
        setSubmitProgress(`Đang tải ảnh ${i + 1}/${photos.length}...`);
        await uploadIncidentPhoto(incidentId, photos[i]);
        URL.revokeObjectURL(photos[i].previewUrl);
      }
    }

    router.push(`/incidents/${incidentId}?saved=created`);
  }

  return (
    <form onSubmit={handleSubmit} className="clinical-card grid gap-3.5 p-5 sm:grid-cols-2">
      {error && (
        <div role="alert" className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Ngày nghiệp vụ *</span>
        <input
          name="business_date"
          type="date"
          required
          defaultValue={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())}
          className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"
        />
      </label>

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Thời điểm xảy ra *</span>
        <input
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={new Date().toISOString().slice(0, 16)}
          className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"
        />
      </label>

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Danh mục *</span>
        <select name="category_id" required className="min-h-11 w-full rounded-2xl border border-slate-200 px-4">
          <option value="">Chọn danh mục</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Mức độ *</span>
        <select name="severity" defaultValue="MEDIUM" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4">
          <option value="LOW">Thấp (Không ảnh hưởng kết quả)</option>
          <option value="MEDIUM">Trung bình (Chậm mẫu/dừng máy ngắn)</option>
          <option value="HIGH">Cao (Hỏng thiết bị/mất an toàn sinh học)</option>
          <option value="CRITICAL">Khẩn cấp (Tràn đổ nguy hại/dừng toàn bộ)</option>
        </select>
      </label>

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Khu vực</span>
        <select name="location_id" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4">
          <option value="">Không chọn khu vực</option>
          {locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">Thiết bị</span>
        <select name="asset_id" defaultValue={defaultAssetId ?? ""} className="min-h-11 w-full rounded-2xl border border-slate-200 px-4">
          <option value="">Không chọn thiết bị</option>
          {assets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.source_name}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1 block text-sm font-bold text-slate-700">Tiêu đề *</span>
        <input
          name="title"
          required
          maxLength={180}
          placeholder="Tóm tắt sự cố..."
          className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1 block text-sm font-bold text-slate-700">Mô tả * (tối đa 500 ký tự)</span>
        <textarea
          name="description"
          required
          maxLength={500}
          rows={4}
          placeholder="Mô tả cụ thể hiện tượng xảy ra..."
          className="w-full rounded-2xl border border-slate-200 p-4"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1 block text-sm font-bold text-slate-700">Xử trí ngay</span>
        <textarea
          name="immediate_action"
          rows={3}
          placeholder="Biện pháp đã xử lý tại chỗ..."
          className="w-full rounded-2xl border border-slate-200 p-4"
        />
      </label>

      {/* CHỤP ẢNH & GHI HÌNH */}
      <div className="sm:col-span-2 rounded-2xl border border-teal-200 bg-teal-50/20 p-4">
        <PhotoCaptureField
          photos={photos}
          onChange={setPhotos}
          max={6}
          disabled={isSubmitting}
          label="Chụp ảnh / Ghi lại hình ảnh hiện trường"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-800 px-5 font-bold text-white sm:col-span-2 shadow-xs hover:bg-teal-900 disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        <span>{submitProgress ?? "Gửi báo cáo sự cố"}</span>
      </button>
    </form>
  );
}

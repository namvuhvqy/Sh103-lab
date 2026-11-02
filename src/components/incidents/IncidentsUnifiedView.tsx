"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CircleAlert,
  Clock,
  Clock3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoCaptureField } from "@/components/incidents/PhotoCaptureField";
import { IncidentPhotoGallery } from "@/components/incidents/IncidentPhotoGallery";
import { AddIncidentPhotos } from "@/components/incidents/AddIncidentPhotos";
import { createIncidentAction, transitionIncidentAction } from "@/lib/p5/actions";
import { uploadIncidentPhoto, type CompressedIncidentPhoto } from "@/lib/incidents/image-client";
import type { IncidentItem, IncidentCategory, IncidentEventItem } from "@/lib/p5/queries";
import type { IncidentPhoto } from "@/lib/incidents/photo-constants";
import { cn } from "@/lib/utils";

export interface IncidentsUnifiedViewProps {
  initialIncidents: IncidentItem[];
  photoMap: Record<string, IncidentPhoto[]>;
  currentStatus: string;
  categories: IncidentCategory[];
  locations: Array<{ id: string; name: string }>;
  assets: Array<{ id: string; source_name: string }>;
  canApprove?: boolean;
}

const statusLabel: Record<string, string> = {
  OPEN: "Mới báo cáo",
  IN_REVIEW: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

const statusTone: Record<string, string> = {
  OPEN: "bg-red-50 text-red-800 border-red-200",
  IN_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  RESOLVED: "bg-sky-50 text-sky-800 border-sky-200",
  CLOSED: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const severityLabel: Record<string, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Khẩn cấp",
};

const severityTone: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700 font-bold",
  CRITICAL: "bg-red-100 text-red-800 font-black animate-pulse",
};

export function IncidentsUnifiedView({
  initialIncidents,
  photoMap: initialPhotoMap,
  currentStatus,
  categories,
  locations,
  assets,
  canApprove = false,
}: IncidentsUnifiedViewProps) {
  const router = useRouter();
  const incidents = initialIncidents;
  const [photoMap, setPhotoMap] = useState<Record<string, IncidentPhoto[]>>(initialPhotoMap);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<IncidentEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Form state
  const [createPhotos, setCreatePhotos] = useState<CompressedIncidentPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Transition state
  const [isTransitioning, startTransition] = useTransition();
  const [transitionNote, setTransitionNote] = useState("");
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Filtered list
  const filtered = incidents.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      item.incident_code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.category?.name ?? "").toLowerCase().includes(q) ||
      (item.location?.name ?? "").toLowerCase().includes(q) ||
      (item.asset?.source_name ?? "").toLowerCase().includes(q)
    );
  });

  // Open detail in the same screen
  const openDetail = async (item: IncidentItem) => {
    setSelectedIncident(item);
    setLoadingEvents(true);
    setSelectedEvents([]);
    try {
      const res = await fetch(`/api/incidents/${item.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSelectedEvents(data.events ?? []);
        if (data.photos && Array.isArray(data.photos)) {
          setPhotoMap((prev) => ({ ...prev, [item.id]: data.photos }));
        }
      }
    } catch (err) {
      console.warn("Không tải được chi tiết sự cố:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Handle new incident creation with photos
  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    setSubmitProgress("Đang tạo sự cố...");

    const formData = new FormData(e.currentTarget);
    const result = await createIncidentAction(formData);

    if (!result.success || !result.data?.id) {
      setFormError(result.error ?? "Không thể tạo báo cáo sự cố");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    const newId = result.data.id;

    // Upload captured photos if any
    if (createPhotos.length > 0) {
      setSubmitProgress(`Đang tải lên ${createPhotos.length} ảnh hiện trường...`);
      for (let i = 0; i < createPhotos.length; i++) {
        setSubmitProgress(`Đang tải ảnh ${i + 1}/${createPhotos.length}...`);
        await uploadIncidentPhoto(newId, createPhotos[i]);
        URL.revokeObjectURL(createPhotos[i].previewUrl);
      }
    }

    setSubmitProgress(null);
    setFormSuccess("Đã tạo báo cáo sự cố thành công!");
    setCreatePhotos([]);
    setIsSubmitting(false);
    setShowCreateForm(false);
    router.refresh();
  }

  // Handle status transition inside the detail modal
  async function handleTransition(targetStatus: "IN_REVIEW" | "RESOLVED" | "CLOSED") {
    if (!selectedIncident) return;
    setTransitionError(null);
    startTransition(async () => {
      const res = await transitionIncidentAction(selectedIncident.id, targetStatus, transitionNote);
      if (!res.success) {
        setTransitionError(res.error ?? "Lỗi cập nhật trạng thái");
      } else {
        setTransitionNote("");
        setSelectedIncident((prev) => (prev ? { ...prev, status: targetStatus } : null));
        router.refresh();
      }
    });
  }

  const nextTransition = selectedIncident?.status === "OPEN"
    ? "IN_REVIEW"
    : selectedIncident?.status === "IN_REVIEW"
      ? "RESOLVED"
      : selectedIncident?.status === "RESOLVED"
        ? "CLOSED"
        : null;

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-teal-100 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-800">
              ISO 15189:2022
            </span>
            <span className="text-xs font-semibold text-slate-500">Giám sát sự cố &amp; An toàn PXN</span>
          </div>
          <h1 className="clinical-page-title mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sự cố vận hành
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Ghi nhận hiện trường · Chụp &amp; lưu hình ảnh sự cố · Tuyệt đối không nhập thông tin người bệnh.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-teal-900"
          >
            {showCreateForm ? <X className="size-4" /> : <Camera className="size-4" />}
            <span>{showCreateForm ? "Đóng biểu mẫu" : "Báo cáo sự cố kèm ảnh"}</span>
          </button>
          <Link
            href="/incidents/new"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            title="Mở màn hình tạo sự cố riêng biệt"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Màn hình tạo mới</span>
          </Link>
        </div>
      </section>

      {/* QUICK FORM: TẠO BÁO CÁO SỰ CỐ KÈM ẢNH NGAY TRÊN MÀN HÌNH */}
      {showCreateForm && (
        <section className="rounded-3xl border-2 border-teal-600/30 bg-teal-50/20 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-teal-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="size-5 text-teal-700" />
              <h2 className="text-base font-black text-slate-900">
                Ghi nhận sự cố &amp; Chụp ảnh hiện trường
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div>

          {formError && (
            <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 border border-red-200">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div role="status" className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="grid gap-3.5 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Ngày nghiệp vụ *</span>
              <input
                name="business_date"
                type="date"
                required
                defaultValue={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Thời điểm xảy ra *</span>
              <input
                name="occurred_at"
                type="datetime-local"
                required
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Danh mục sự cố *</span>
              <select name="category_id" required className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Mức độ nghiêm trọng *</span>
              <select name="severity" defaultValue="MEDIUM" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="LOW">Thấp (Không ảnh hưởng kết quả)</option>
                <option value="MEDIUM">Trung bình (Chậm trả kết quả hoặc dừng máy ngắn)</option>
                <option value="HIGH">Cao (Hỏng hóc thiết bị, hỏng mẫu hoặc dừng quy trình)</option>
                <option value="CRITICAL">Khẩn cấp (Tràn đổ nguy hại, sự cố an toàn sinh học)</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Khu vực xảy ra</span>
              <select name="location_id" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">-- Không chọn khu vực --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-700">Thiết bị liên quan</span>
              <select name="asset_id" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">-- Không chọn thiết bị --</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.source_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-700">Tiêu đề sự cố *</span>
              <input
                name="title"
                required
                maxLength={180}
                placeholder="Ví dụ: Máy Cobas 6000 báo lỗi cánh tay hút mẫu / Tủ đông âm sâu nhảy nhiệt độ -15°C"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-700">Mô tả chi tiết * (tối đa 500 ký tự)</span>
              <textarea
                name="description"
                required
                maxLength={500}
                rows={3}
                placeholder="Mô tả hiện tượng, mã lỗi máy, vị trí hoặc nguyên nhân ban đầu..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-700">Biện pháp xử trí tức thì (nếu có)</span>
              <textarea
                name="immediate_action"
                rows={2}
                placeholder="Đã cô lập thiết bị, chuyển mẫu khẩn sang máy dự phòng, vệ sinh khử trùng bề mặt..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            {/* KHU VỰC CHỤP ẢNH / CHỌN ẢNH HIỆN TRƯỜNG */}
            <div className="sm:col-span-2 rounded-2xl border border-teal-200 bg-white p-4">
              <PhotoCaptureField
                photos={createPhotos}
                onChange={setCreatePhotos}
                max={6}
                disabled={isSubmitting}
                label="Chụp ảnh / Ghi lại hình ảnh hiện trường sự cố"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={isSubmitting}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                <span>{submitProgress ?? "Gửi báo cáo sự cố"}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SegmentedControl
          wrap
          active={currentStatus === "ALL" ? "Tất cả" : statusLabel[currentStatus] ?? "Tất cả"}
          items={[
            { label: "Tất cả", href: "/incidents" },
            { label: "Mới báo cáo", href: "/incidents?status=OPEN" },
            { label: "Đang xem xét", href: "/incidents?status=IN_REVIEW" },
            { label: "Đã xử lý", href: "/incidents?status=RESOLVED" },
            { label: "Đã đóng", href: "/incidents?status=CLOSED" },
          ]}
        />

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã, tiêu đề, máy, khu vực..."
            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs"
          />
        </div>
      </section>

      {/* DANH SÁCH SỰ CỐ PHÍA DƯỚI THEO DÒNG KÈM ẢNH */}
      {filtered.length ? (
        <div className="space-y-2.5" data-testid="incidents-list">
          {filtered.map((item) => {
            const photos = photoMap[item.id] ?? [];
            const isSelected = selectedIncident?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => openDetail(item)}
                className={cn(
                  "group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-2xl border p-4 bg-white transition cursor-pointer shadow-xs",
                  isSelected
                    ? "border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/10"
                    : "border-slate-200 hover:border-teal-300 hover:bg-slate-50/60"
                )}
              >
                {/* CỘT TRÁI: ICON & THÔNG TIN CHÍNH */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700 mt-0.5">
                    <CircleAlert className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-teal-800">
                        {item.incident_code}
                      </span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", statusTone[item.status])}>
                        {statusLabel[item.status]}
                      </span>
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10px]", severityTone[item.severity])}>
                        {severityLabel[item.severity]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.occurred_at).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      <span className="font-semibold text-slate-700">{item.category?.name ?? "Chuyên môn"}</span>
                      {" · "}
                      <span>{item.location?.name ?? item.asset?.source_name ?? "Toàn khoa"}</span>
                      {item.reporter?.full_name && ` · Báo cáo: ${item.reporter.full_name}`}
                    </p>
                  </div>
                </div>

                {/* CỘT PHẢI: HÌNH ẢNH HIỆN TRƯỜNG & NÚT CHI TIẾT */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* THUMBNAILS DÒNG KÈM ẢNH */}
                  <div className="flex items-center gap-1.5">
                    {photos.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {photos.slice(0, 3).map((p, idx) => (
                          <div
                            key={p.id}
                            className="size-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
                            title={p.caption ?? `Ảnh sự cố ${idx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.thumbUrl} alt="Thumbnail" className="size-full object-cover" />
                          </div>
                        ))}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg">
                          <ImageIcon className="size-3.5" />
                          {photos.length}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                        Chưa có ảnh
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(item);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-bold text-teal-900 transition hover:bg-teal-100"
                  >
                    <Eye className="size-3.5" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Không có sự cố nào"
          description={
            searchTerm
              ? "Không có báo cáo nào khớp với từ khóa tìm kiếm."
              : "Không có sự cố nào trong bộ lọc này."
          }
          icon={<CircleAlert />}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL / DRAWER CHI TIẾT SỰ CỐ NGAY TRONG CÙNG MÀN HÌNH                    */}
      {/* ========================================================================= */}
      {selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800">
                  <ShieldAlert className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide text-teal-800">
                      {selectedIncident.incident_code}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-black",
                        statusTone[selectedIncident.status]
                      )}
                    >
                      {statusLabel[selectedIncident.status]}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {selectedIncident.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/incidents/${selectedIncident.id}`}
                  target="_blank"
                  className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                  title="Mở sang tab trang chi tiết riêng"
                >
                  <ExternalLink className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
              {/* THÔNG TIN CHUNG */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mức độ</span>
                  <p className={cn("font-bold text-xs mt-0.5", severityTone[selectedIncident.severity])}>
                    {severityLabel[selectedIncident.severity]}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Thời điểm</span>
                  <p className="font-bold text-xs mt-0.5 text-slate-800">
                    {new Date(selectedIncident.occurred_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Khu vực / Máy</span>
                  <p className="font-bold text-xs mt-0.5 text-slate-800 line-clamp-1">
                    {selectedIncident.location?.name ?? selectedIncident.asset?.source_name ?? "Trong scope"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Người báo cáo</span>
                  <p className="font-bold text-xs mt-0.5 text-slate-800 line-clamp-1">
                    {selectedIncident.reporter?.full_name ?? "Cán bộ trực"}
                  </p>
                </div>
              </div>

              {/* NỘI DUNG MÔ TẢ & XỬ TRÍ */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                    Mô tả sự cố
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3 text-slate-800 text-xs leading-relaxed">
                    {selectedIncident.description}
                  </p>
                </div>

                {selectedIncident.immediate_action && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                      Xử trí tức thì
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3 text-slate-800 text-xs leading-relaxed">
                      {selectedIncident.immediate_action}
                    </p>
                  </div>
                )}

                {selectedIncident.resolution_note && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <h4 className="font-bold text-emerald-950 uppercase text-[11px]">
                      Kết luận &amp; Biện pháp khắc phục
                    </h4>
                    <p className="mt-1 text-emerald-900 text-xs leading-relaxed">
                      {selectedIncident.resolution_note}
                    </p>
                  </div>
                )}
              </div>

              {/* HÌNH ẢNH HIỆN TRƯỜNG CỦA SỰ CỐ */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Camera className="size-4 text-teal-700" />
                    <span>Hình ảnh hiện trường ({(photoMap[selectedIncident.id] ?? []).length} ảnh)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Bấm ảnh để phóng to toàn màn hình</span>
                </div>

                <IncidentPhotoGallery photos={photoMap[selectedIncident.id] ?? []} size="md" />

                {/* BỔ SUNG ẢNH NẾU CHƯA ĐÓNG SỰ CỐ */}
                {selectedIncident.status !== "CLOSED" && (
                  <div className="mt-3">
                    <AddIncidentPhotos
                      incidentId={selectedIncident.id}
                      existingCount={(photoMap[selectedIncident.id] ?? []).length}
                    />
                  </div>
                )}
              </div>

              {/* CHUYỂN TRẠNG THÁI (CHO TRƯỞNG KHOA / QUẢN TRỊ VIÊN) */}
              {canApprove && nextTransition && (
                <div className="border-t border-amber-200/60 bg-amber-50/40 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-700" />
                    <h4 className="font-bold text-amber-950 text-xs">
                      Chuyển trạng thái sang “{statusLabel[nextTransition]}”
                    </h4>
                  </div>
                  <textarea
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    rows={2}
                    placeholder="Ghi chú kết luận hoặc ý kiến chỉ đạo (bắt buộc)..."
                    className="w-full rounded-xl border border-amber-200 bg-white p-2.5 text-xs text-slate-900"
                  />
                  {transitionError && (
                    <p className="text-[11px] font-bold text-red-700">{transitionError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTransition(nextTransition)}
                    disabled={isTransitioning || !transitionNote.trim()}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 disabled:opacity-50"
                  >
                    {isTransitioning ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                    <span>Xác nhận chuyển trạng thái</span>
                  </button>
                </div>
              )}

              {/* LỊCH SỬ XỬ LÝ (TIMELINE) */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-500" />
                  <span>Tiến trình xử lý</span>
                </h4>

                {loadingEvents ? (
                  <div className="flex items-center gap-2 py-3 text-slate-400">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang tải lịch sử...</span>
                  </div>
                ) : selectedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEvents.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                        <span className="grid size-6 place-items-center rounded-full bg-teal-50 text-teal-800 mt-0.5 shrink-0">
                          {ev.to_status === "CLOSED" || ev.to_status === "RESOLVED" ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <Clock3 className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-[11px]">{ev.action}</p>
                          {ev.note && <p className="text-slate-600 text-[11px] mt-0.5">{ev.note}</p>}
                          <time className="text-[10px] text-slate-400 mt-0.5 block">
                            {new Date(ev.created_at).toLocaleString("vi-VN")} · {ev.actor?.full_name ?? "Hệ thống"}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-1">Chưa có sự kiện bổ sung.</p>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="min-h-10 rounded-xl bg-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

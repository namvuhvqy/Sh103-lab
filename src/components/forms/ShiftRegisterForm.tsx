"use client";

import { useMemo, useState, useEffect } from "react";
import { shiftProgress } from "@/lib/forms/domain";
import { RotateCcw, HelpCircle, Users, UserCheck, CheckCircle2, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";

export type ShiftAsset = { id: string; sourceOrder: number; name: string; locationCode: string };

export type StaffCandidate = {
  user_id: string;
  full_name: string;
  business_role: string;
  source_order?: number | null;
};

export function ShiftRegisterForm({
  occurrenceId,
  assets,
  initialStatuses,
  lockVersion,
  areaCode,
  staffCandidates = [],
  initialCoWorkerId = null,
  initialNote = "",
}: {
  occurrenceId: string;
  assets: ShiftAsset[];
  initialStatuses: Record<string, string>;
  lockVersion: number;
  areaCode?: string;
  staffCandidates?: StaffCandidate[];
  initialCoWorkerId?: string | null;
  initialNote?: string;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [coWorkerId, setCoWorkerId] = useState<string>(initialCoWorkerId ?? "");
  const [note, setNote] = useState<string>(initialNote);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<"draft" | "finalize">("draft");

  // Restore unsaved local draft if more complete than initial server data
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`lab103_bm06_draft_${occurrenceId}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.statuses && Object.keys(parsed.statuses).length > Object.keys(initialStatuses).length) {
          setStatuses(parsed.statuses);
          if (parsed.coWorkerId) setCoWorkerId(parsed.coWorkerId);
          if (parsed.note) setNote(parsed.note);
          setSaveStatus("dirty");
        }
      }
    } catch {}
  }, [occurrenceId, initialStatuses]);

  const visible = areaCode ? assets.filter((a) => a.locationCode === areaCode) : assets;
  const progress = shiftProgress(
    Object.keys(statuses).filter((id) => assets.some((a) => a.id === id)).length,
    assets.length
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        Object.entries(statuses)
          .filter(([assetId]) => !areaCode || visible.some((asset) => asset.id === assetId))
          .map(([asset_id, status]) => ({ asset_id, status }))
      ),
    [statuses, areaCode, visible]
  );

  const handleStatusChange = (assetId: string, status: string) => {
    setStatuses((prev) => ({ ...prev, [assetId]: status }));
    setSaveStatus("dirty");
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    const updated = { ...statuses };
    visible.forEach((a) => {
      delete updated[a.id];
    });
    setStatuses(updated);
    setSaveStatus("dirty");
    setErrorMessage(null);
  };

  const handleSubmitIntent = async (e: React.FormEvent, intent: "draft" | "finalize") => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSaveStatus("saving");
    setErrorMessage(null);
    setLastIntent(intent);

    try {
      localStorage.setItem(`lab103_bm06_draft_${occurrenceId}`, JSON.stringify({
        statuses,
        coWorkerId,
        note,
        updatedAt: new Date().toISOString(),
      }));
    } catch {}

    const formData = new FormData();
    formData.append("occurrenceId", occurrenceId);
    formData.append("lockVersion", String(lockVersion));
    formData.append("statuses", payload);
    formData.append("areaCode", areaCode ?? "");
    formData.append("intent", intent);
    formData.append("note", note);
    if (coWorkerId) formData.append("coWorkerUserId", coWorkerId);

    try {
      const res = await fetch("/api/forms/bm06", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || (data && !data.success)) {
        throw new Error(data?.error || `Lỗi lưu (${res.status})`);
      }

      setSaveStatus("saved");
      setErrorMessage(null);
      try { localStorage.removeItem(`lab103_bm06_draft_${occurrenceId}`); } catch {}
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err?.message || "Không thể kết nối đến máy chủ. Dữ liệu đã được giữ nguyên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action="/api/forms/bm06" method="post" className="space-y-4">
      <input type="hidden" name="occurrenceId" value={occurrenceId} />
      <input type="hidden" name="lockVersion" value={lockVersion} />
      <input type="hidden" name="statuses" value={payload} />
      <input type="hidden" name="areaCode" value={areaCode ?? ""} />

      {/* Dynamic Save Status Notification Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold shadow-xs" aria-label="Trạng thái lưu BM.06">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">BM.06 · Nhật ký ca</span>
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-sky-800 border border-sky-200">
                <Loader2 className="size-3.5 animate-spin text-sky-600" />
                Đang lưu lên hệ thống…
              </span>
            ) : saveStatus === "saved" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Đã lưu thành công
              </span>
            ) : saveStatus === "dirty" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 border border-amber-200">
                <Clock className="size-3.5 text-amber-600" />
                Chưa lưu: Có thay đổi chưa gửi
              </span>
            ) : (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-600">Sẵn sàng nhập liệu</span>
            )}
            {progress.canFinalize ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 font-black">Đủ 20/20 máy</span>
            ) : null}
          </div>
        </div>

        {saveStatus === "error" ? (
          <div className="mt-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                <AlertCircle className="size-4 text-rose-600 shrink-0" />
                Lưu thất bại: {errorMessage}. Dữ liệu vừa nhập vẫn được giữ nguyên.
              </div>
              <button
                type="button"
                onClick={(e) => handleSubmitIntent(e, lastIntent)}
                className="inline-flex items-center gap-1 self-start sm:self-auto rounded-xl bg-rose-700 px-3 py-1 text-xs font-black text-white hover:bg-rose-800 transition"
              >
                <RefreshCw className="size-3" />
                Thử lưu lại
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Sticky Progress Header */}
      <div className="sticky top-16 z-20 rounded-2xl border border-teal-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between font-bold text-slate-900">
          <span className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-teal-600 animate-pulse" />
            {progress.completed}/{progress.total} máy đã ghi nhận
          </span>
          <span className="text-teal-800 font-extrabold">{progress.percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Thanh thao tác nhanh tập trung 1 màn hình */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 text-xs font-bold text-slate-600 transition"
              title="Xóa trắng để chọn lại từ đầu"
            >
              <RotateCcw className="size-3" />
              Đặt lại
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTooltip((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-teal-700 transition"
          >
            <HelpCircle className="size-3.5" />
            <span>Chú thích mã máy</span>
          </button>
        </div>

        {/* Hộp chú thích ẩn hiện */}
        {showTooltip ? (
          <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-700 space-y-1 animate-fadeIn">
            <p className="font-bold text-slate-900">Quy ước mã trạng thái vận hành ISO 15189:</p>
            <p>• <b className="text-emerald-700">BT (Bình thường):</b> Máy chạy ổn định, nội kiểm đạt, kết quả chuẩn xác.</p>
            <p>• <b className="text-slate-700">KSD (Không sử dụng):</b> Máy tắt nguồn hoặc không phát sinh mẫu trong ca.</p>
            <p>• <b className="text-rose-700">H (Hỏng / Lỗi):</b> Máy gặp sự cố kỹ thuật, báo động, cần bảo dưỡng khẩn cấp.</p>
          </div>
        ) : null}
      </div>

      {/* Danh sách 20 máy trên 1 màn hình tập trung */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((asset) => {
          const current = statuses[asset.id];
          return (
            <fieldset
              key={asset.id}
              aria-label={`Trạng thái máy ${asset.sourceOrder}`}
              className={`rounded-2xl border p-3 transition shadow-xs ${
                current === "H"
                  ? "border-rose-200 bg-rose-50/50"
                  : current === "KSD"
                  ? "border-slate-300 bg-slate-50/70"
                  : current === "BT"
                  ? "border-teal-200 bg-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <legend className="sr-only">Trạng thái máy {asset.name}</legend>

              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-teal-50 text-[11px] font-black text-teal-800 border border-teal-200">
                    #{asset.sourceOrder}
                  </span>
                  <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                    {asset.name}
                  </span>
                </div>
                {current ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                      current === "H"
                        ? "bg-rose-100 text-rose-800"
                        : current === "KSD"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {current}
                  </span>
                ) : null}
              </div>

              {/* 3 nút chọn trạng thái touch-friendly (>=44px trên mobile) với animation trượt mượt mà */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
                {[
                  ["BT", "Bình thường", "border-teal-700 bg-teal-700 text-white shadow-xs ring-1 ring-teal-500/30"],
                  ["KSD", "Không sử dụng", "border-slate-700 bg-slate-700 text-white shadow-xs ring-1 ring-slate-500/30"],
                  ["H", "Hỏng", "border-rose-700 bg-rose-700 text-white shadow-xs ring-1 ring-rose-500/40"],
                ].map(([code, label, activeStyle]) => {
                  const isSelected = current === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleStatusChange(asset.id, code)}
                      className={`min-h-11 rounded-lg border px-1 text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1 select-none ${
                        isSelected
                          ? activeStyle
                          : "border-transparent bg-white/70 text-slate-700 hover:bg-white"
                      }`}
                      title={`${code} — ${label}`}
                    >
                      {code}
                      <span className="sr-only"> — {label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {/* Menu chọn thêm người cùng kíp từ danh sách nhân sự (Lưu ý 2) */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/40 via-white to-slate-50 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-teal-100/70 text-teal-800">
              <Users className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Người cùng kíp trực
                <span className="rounded-md bg-teal-100/80 px-2 py-0.5 text-[10px] font-bold text-teal-800">Tùy chọn ISO</span>
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Đối với kíp trực 2 người, chọn cán bộ cùng kíp. Có thể chọn bỏ qua khi kíp chỉ 1 người.
              </p>
            </div>
          </div>

          {coWorkerId ? (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
              <UserCheck className="size-3.5" />
              Kíp 2 người
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
              Kíp 1 người (Đơn lẻ)
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-1">
          <label className="sr-only" htmlFor="coWorkerUserId">Chọn thêm người cùng kíp trực</label>
          <select
            id="coWorkerUserId"
            name="coWorkerUserId"
            value={coWorkerId}
            onChange={(e) => setCoWorkerId(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition-all duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
          >
            <option value="">-- Bỏ qua (Kíp chỉ 1 người) --</option>
            {staffCandidates.map((staff) => {
              const roleLabel =
                staff.business_role === "DEPARTMENT_HEAD"
                  ? "Chỉ huy BMK"
                  : staff.business_role === "DOCTOR"
                  ? "Bác sĩ"
                  : "Kỹ thuật viên";
              return (
                <option key={staff.user_id} value={staff.user_id}>
                  {staff.source_order ? `#${staff.source_order} ` : ""}{staff.full_name} · {roleLabel}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Lượng sử dụng được xác định bởi slot/khung giờ của occurrence. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <label className="block text-xs font-bold text-slate-700">
          Ghi chú bàn giao &amp; Sự cố thiết bị
          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-all duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30"
            placeholder="Ghi nhận các lưu ý đặc biệt, lỗi máy hoặc cảnh báo hóa chất nếu có..."
          />
        </label>
      </div>

      {/* Sticky Bottom Actions - Nền kính mờ backdrop-blur-md & active:scale-95 */}
      <div
        className={`sticky bottom-16 md:bottom-4 z-20 grid gap-3 rounded-2xl md:rounded-3xl border border-teal-200/80 bg-white/90 p-3 shadow-[0_-8px_30px_rgba(15,118,110,0.12)] backdrop-blur-md transition-all ${
          areaCode ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        <button
          type="button"
          name="intent"
          value="draft"
          onClick={(e) => handleSubmitIntent(e, "draft")}
          disabled={isSubmitting || Object.keys(statuses).filter((id) => visible.some((asset) => asset.id === id)).length === 0}
          className="min-h-12 rounded-xl border border-teal-700 font-bold text-teal-800 disabled:border-slate-200 disabled:text-slate-400 hover:bg-teal-50 active:scale-95 transition-all select-none shadow-xs"
        >
          {isSubmitting && lastIntent === "draft"
            ? "Đang lưu nháp…"
            : areaCode
            ? "Lưu nháp khu vực"
            : `Lưu nháp (${progress.completed}/${progress.total} máy)`}
        </button>
        {!areaCode ? (
          <button
            type="button"
            name="intent"
            value="finalize"
            onClick={(e) => handleSubmitIntent(e, "finalize")}
            disabled={isSubmitting || !progress.canFinalize}
            className={`min-h-12 rounded-xl font-bold transition-all select-none shadow-xs ${
              progress.canFinalize
                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 active:scale-95 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            title={
              progress.canFinalize
                ? `Đủ ${progress.total}/${progress.total} máy — Hoàn tất và khóa ca trực`
                : `Cần ghi nhận đủ ${progress.total}/${progress.total} máy để hoàn tất ca (Hiện có: ${progress.completed}/${progress.total})`
            }
          >
            {isSubmitting && lastIntent === "finalize"
              ? "Đang hoàn tất…"
              : progress.canFinalize
              ? `Hoàn tất ca (${progress.total}/${progress.total} máy)`
              : `Hoàn tất ca (Thiếu ${Math.max(progress.total - progress.completed, 0)} máy)`}
          </button>
        ) : null}
      </div>
    </form>
  );
}


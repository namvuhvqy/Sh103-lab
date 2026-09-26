"use client";

import { useMemo, useState } from "react";
import { shiftProgress } from "@/lib/forms/domain";
import { Zap, RotateCcw, HelpCircle } from "lucide-react";

export type ShiftAsset = { id: string; sourceOrder: number; name: string; locationCode: string };

export function ShiftRegisterForm({
  occurrenceId,
  assets,
  initialStatuses,
  lockVersion,
  areaCode,
}: {
  occurrenceId: string;
  assets: ShiftAsset[];
  initialStatuses: Record<string, string>;
  lockVersion: number;
  areaCode?: string;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Thao tác nhanh cho kíp trực 25 máy trên 1 màn hình
  const handleSetAll = (code: string) => {
    const updated = { ...statuses };
    visible.forEach((a) => {
      updated[a.id] = code;
    });
    setStatuses(updated);
  };

  const handleSetRemaining = (code: string) => {
    const updated = { ...statuses };
    visible.forEach((a) => {
      if (!updated[a.id]) {
        updated[a.id] = code;
      }
    });
    setStatuses(updated);
  };

  const handleClearAll = () => {
    const updated = { ...statuses };
    visible.forEach((a) => {
      delete updated[a.id];
    });
    setStatuses(updated);
  };

  return (
    <form action="/api/forms/bm06" method="post" className="space-y-4">
      <input type="hidden" name="occurrenceId" value={occurrenceId} />
      <input type="hidden" name="lockVersion" value={lockVersion} />
      <input type="hidden" name="statuses" value={payload} />
      <input type="hidden" name="areaCode" value={areaCode ?? ""} />

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
              onClick={() => handleSetAll("BT")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-3 text-xs font-bold text-white transition shadow-xs"
              title="Đặt nhanh tất cả máy trong danh sách ở trạng thái Bình thường"
            >
              <Zap className="size-3.5" />
              ⚡ Đặt tất cả = BT
            </button>
            <button
              type="button"
              onClick={() => handleSetRemaining("BT")}
              className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100 px-2.5 text-xs font-bold text-teal-800 transition"
              title="Chỉ điền BT cho những máy chưa được chọn"
            >
              Điền còn lại = BT
            </button>
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

      {/* Danh sách 25 máy trên 1 màn hình tập trung */}
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
                      onClick={() => setStatuses((s) => ({ ...s, [asset.id]: code }))}
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

      {/* Thông tin vận hành bổ sung - Tối ưu Input Ergonomics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs font-bold text-slate-700">
            Lượng sử dụng trong ca
            <input
              required
              name="usageValue"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              defaultValue="4.5"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none transition-all duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30"
              placeholder="VD: 4.5"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Đơn vị tính
            <select
              name="usageUnit"
              defaultValue="HOURS"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none transition-all duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30 bg-white"
            >
              <option value="HOURS">Số giờ chạy thực tế</option>
              <option value="SHIFTS">Số ca trực</option>
            </select>
          </label>
        </div>

        <label className="block text-xs font-bold text-slate-700">
          Ghi chú bàn giao &amp; Sự cố thiết bị
          <textarea
            name="note"
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
          name="intent"
          value="draft"
          disabled={Object.keys(statuses).filter((id) => visible.some((asset) => asset.id === id)).length === 0}
          className="min-h-12 rounded-xl border border-teal-700 font-bold text-teal-800 disabled:border-slate-200 disabled:text-slate-400 hover:bg-teal-50 active:scale-95 transition-all select-none shadow-xs"
        >
          {areaCode ? "Lưu nháp khu vực" : "Lưu nháp"}
        </button>
        {!areaCode ? (
          <button
            name="intent"
            value="finalize"
            disabled={!progress.canFinalize}
            className="min-h-12 rounded-xl bg-teal-700 hover:bg-teal-800 font-bold text-white disabled:bg-slate-200 disabled:text-slate-400 active:scale-95 transition-all select-none shadow-xs shadow-teal-700/20"
          >
            Hoàn tất ca
          </button>
        ) : null}
      </div>
    </form>
  );
}


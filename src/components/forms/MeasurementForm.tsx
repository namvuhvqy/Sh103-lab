"use client";

import { saveMeasurementAction, markNaAction } from "@/app/entry/[occurrenceId]/actions";
import { Thermometer, Droplets, Clock, AlertCircle, CheckCircle } from "lucide-react";

export function MeasurementForm({
  occurrenceId,
  code,
}: {
  occurrenceId: string;
  code: string;
}) {
  const isEnv = code === "BM.01/QL.HTAT.01";
  const isFridge = code === "BM.02/QL.HTAT.01";
  const range = isEnv
    ? "21°C – 26°C · Độ ẩm 20% – 80%"
    : isFridge
    ? "2°C – 8°C"
    : "-30°C đến -10°C";

  return (
    <div className="space-y-6">
      <form
        action={saveMeasurementAction}
        className="space-y-4 rounded-3xl border border-teal-100 bg-white p-5 sm:p-6 shadow-sm"
      >
        <input type="hidden" name="occurrenceId" value={occurrenceId} />

        {/* Range banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-teal-50/80 border border-teal-200/80 p-3.5 text-xs text-teal-950">
          <CheckCircle className="size-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-teal-900">Tiêu chuẩn kiểm soát ISO 15189</p>
            <p className="mt-0.5 font-medium text-teal-800">
              Ngưỡng quy định: <span className="font-black">{range}</span>. Số liệu ngoài ngưỡng vẫn được lưu đầy đủ vào hồ sơ ISO và kích hoạt cảnh báo bất thường.
            </p>
          </div>
        </div>

        {/* Giờ đo */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 mb-1.5">
            <Clock className="size-3.5 text-teal-700" />
            Giờ thực tế ghi nhận
          </span>
          <input
            required
            name="performedAt"
            type="datetime-local"
            defaultValue={new Date().toISOString().slice(0, 16)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/30"
          />
        </label>

        {/* Nhiệt độ */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 mb-1.5">
            <Thermometer className="size-3.5 text-teal-700" />
            Nhiệt độ (°C)
          </span>
          <input
            required
            name="temperature"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="VD: 24.5"
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-base font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/30"
          />
        </label>

        {/* Độ ẩm nếu là BM.01 */}
        {isEnv ? (
          <label className="block text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 mb-1.5">
              <Droplets className="size-3.5 text-teal-700" />
              Độ ẩm không khí (%)
            </span>
            <input
              required
              name="humidity"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="VD: 58.0"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-base font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/30"
            />
          </label>
        ) : null}

        {/* Ghi chú */}
        <label className="block text-xs font-bold text-slate-700">
          Ghi chú bất thường (nếu có)
          <textarea
            name="note"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 outline-none transition-all duration-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/30"
            placeholder="Ghi nhận nguyên nhân hoặc biện pháp khắc phục nếu nhiệt độ/độ ẩm vượt ngưỡng..."
          />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-800 px-5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-teal-900 active:scale-95 select-none"
        >
          Lưu &amp; hoàn tất
        </button>
      </form>

      {/* Đánh dấu N/A */}
      <form
        action={markNaAction}
        className="rounded-3xl border border-amber-200/80 bg-amber-50/60 p-5 text-xs"
      >
        <input type="hidden" name="occurrenceId" value={occurrenceId} />
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <AlertCircle className="size-4 text-amber-700" />
          <span>Tác nghiệp không áp dụng (N/A)</span>
        </div>
        <p className="mt-1 text-[11px] text-amber-800">
          Chỉ dùng khi máy bảo dưỡng định kỳ dài ngày hoặc khu vực ngừng hoạt động có phê duyệt.
        </p>
        <label className="mt-3 block font-bold text-amber-900">
          Lý do Không áp dụng
          <input
            required
            name="reason"
            placeholder="VD: Khu vực tạm dừng để phun khử khuẩn định kỳ"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30"
          />
        </label>
        <button
          type="submit"
          className="mt-3 min-h-11 rounded-xl border border-amber-500 bg-white px-4 font-bold text-amber-950 transition-all hover:bg-amber-100 active:scale-95 select-none"
        >
          Đánh dấu N/A
        </button>
      </form>
    </div>
  );
}

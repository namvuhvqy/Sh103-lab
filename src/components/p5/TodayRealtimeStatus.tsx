"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, ArrowRight, ShieldAlert, Sparkles, Thermometer, TestTube2 } from "lucide-react";
import type { TodayOperationalOverview } from "@/lib/p5/today-overview";

export function TodayRealtimeStatus({ data }: { data: TodayOperationalOverview }) {
  const { shifts, areas, missingTasks, currentShiftCode } = data;
  const urgentCount = missingTasks.filter((t) => t.urgency === "urgent").length;

  return (
    <div className="space-y-6 select-none">
      {/* 1. CẢNH BÁO MỤC CHƯA NHẬP ĐỦ (NẾU CÓ) */}
      {urgentCount > 0 && (
        <section aria-label="Cảnh báo mục còn thiếu" className="rounded-3xl border border-red-200 bg-red-50/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                <ShieldAlert className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-red-950">
                  Phát hiện {urgentCount} mục ca/khu vực chưa nhập đủ
                </h3>
                <p className="text-xs text-red-700">
                  Người kiểm tra &amp; Kíp trực vui lòng rà soát các mục quá hạn dưới đây:
                </p>
              </div>
            </div>
            <span className="rounded-full bg-red-200/80 px-2.5 py-1 text-xs font-black text-red-900 shrink-0">
              {urgentCount} mục thiếu
            </span>
          </div>

          <div className="mt-3.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missingTasks
              .filter((t) => t.urgency === "urgent")
              .slice(0, 6)
              .map((task) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-red-200/80 bg-white p-3 hover:border-red-400 hover:shadow-xs transition group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 group-hover:text-red-700 transition truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-red-600 truncate">{task.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-red-700 group-hover:translate-x-0.5 transition">
                    Nhập →
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* 2. MA TRẬN 4 CA TRỰC NHẬT KÝ 20 MÁY (BM.06) HÔM NAY */}
      <section aria-label="Trạng thái 4 ca BM.06" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube2 className="size-5 text-teal-700" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
              Tiến độ 4 Ca trực — Nhật ký 20 thiết bị (BM.06)
            </h2>
          </div>
          <Link href="/equipment" className="text-xs font-bold text-teal-800 hover:underline">
            Xem nhật ký máy →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shifts.map((shift) => {
            const isCompleted = shift.status === "COMPLETED";
            const isCurrent = shift.isCurrent;
            const isPast = shift.isPast;

            return (
              <div
                key={shift.code}
                className={`relative flex flex-col justify-between rounded-3xl border p-4 transition shadow-xs ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/60"
                    : isCurrent
                    ? "border-teal-300 bg-teal-50/80 ring-2 ring-teal-500/20"
                    : isPast
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-black text-slate-900">{shift.label}</span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        <CheckCircle2 className="size-3" />
                        Đã chốt
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-black text-teal-900">
                        <span className="size-1.5 rounded-full bg-teal-600 animate-pulse" />
                        Đang trực
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800">
                        <AlertCircle className="size-3" />
                        Chưa chốt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        <Clock className="size-3" />
                        Chưa đến
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{shift.timeRange}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {isCompleted ? "20/20 máy" : "0/20 máy"}
                  </span>
                  <Link
                    href={`/equipment?shift=${shift.code}#bm06-entry`}
                    className={`rounded-xl px-2.5 py-1 text-xs font-black transition ${
                      isCompleted
                        ? "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                        : isCurrent
                        ? "bg-teal-800 text-white hover:bg-teal-900 shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isCompleted ? "Xem lại" : isCurrent ? "Nhập ngay" : "Vào ca"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TIẾN ĐỘ 5 KHU VỰC CHUYÊN MÔN HÔM NAY */}
      <section aria-label="Tiến độ 5 khu vực" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="size-5 text-teal-700" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
              Trạng thái 5 Khu vực Chuyên môn
            </h2>
          </div>
          <span className="text-xs text-slate-500">Theo dõi Nhiệt ẩm &amp; Khử nhiễm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {areas.map((area) => {
            return (
              <div
                key={area.code}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-teal-200 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-950">Khu {area.name}</h3>
                    <span
                      className={`size-2.5 rounded-full ${
                        area.isFullyDone ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                      }`}
                      title={area.isFullyDone ? "Đã hoàn thành đủ các mục" : "Còn mục chưa hoàn thành"}
                    />
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    {/* Nhiệt độ sáng */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nhiệt độ Sáng:</span>
                      <span
                        className={`font-black text-[11px] ${
                          area.tempMorning === "COMPLETED" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {area.tempMorning === "COMPLETED" ? "✅ Đã đo" : "⚠️ Chưa đo"}
                      </span>
                    </div>

                    {/* Nhiệt độ chiều */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nhiệt độ Chiều:</span>
                      <span
                        className={`font-black text-[11px] ${
                          area.tempAfternoon === "COMPLETED" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {area.tempAfternoon === "COMPLETED" ? "✅ Đã đo" : "⚠️ Chưa đo"}
                      </span>
                    </div>

                    {/* Khử nhiễm bề mặt */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Khử nhiễm:</span>
                      <span
                        className={`font-black text-[11px] ${
                          area.deconDaily === "COMPLETED" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {area.deconDaily === "COMPLETED" ? "✅ Đã làm" : "⚠️ Chưa làm"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/temperature?area=${area.code}`}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900"
                  >
                    Nhiệt độ →
                  </Link>
                  <Link
                    href={`/decontamination?area=${area.code}`}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    Khử nhiễm →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

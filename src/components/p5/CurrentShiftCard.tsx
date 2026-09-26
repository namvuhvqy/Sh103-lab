"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Users, ArrowRight, ShieldCheck, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentShiftCardProps {
  shift: {
    code: string;
    label: string;
    name: string;
    businessDate: string;
    isWeekend?: boolean;
    isHolidayOrWeekend?: boolean;
    dutyType?: "DUTY_24H" | "DUTY_SHIFT" | "REGULAR_SHIFT";
    statusTitle?: string;
    statusSubtitle?: string;
    timeRange?: string;
  };
}

export function CurrentShiftCard({ shift }: CurrentShiftCardProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const is24h = shift.dutyType === "DUTY_24H" || shift.isWeekend;
  const isNightDuty = shift.code === "SHIFT_4";
  const isNoonDuty = shift.code === "SHIFT_2";
  const isDuty = is24h || isNightDuty || isNoonDuty;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 sm:p-5 shadow-sm transition-all",
        is24h
          ? "border-indigo-300 bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 text-white"
          : isDuty
          ? "border-teal-300 bg-gradient-to-br from-teal-900 via-slate-900 to-cyan-950 text-white"
          : "border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/60 text-slate-900"
      )}
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Thông tin ca trực */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black shadow-xs",
                is24h
                  ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40"
                  : isDuty
                  ? "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                  : "bg-teal-100 text-teal-900 border border-teal-200"
              )}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {is24h
                ? "Kíp trực 24/7 (Ngày nghỉ / Lễ)"
                : isDuty
                ? `Đang trong ${shift.name}`
                : `Đang trong ${shift.name}`}
            </span>

            {currentTime ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md",
                  isDuty ? "text-slate-300 bg-white/10" : "text-slate-600 bg-slate-100"
                )}
              >
                <Clock className="size-3" />
                {currentTime} (Asia/Ho_Chi_Minh)
              </span>
            ) : null}
          </div>

          <div className="flex items-baseline gap-2">
            <h3
              className={cn(
                "text-lg sm:text-xl font-black tracking-tight",
                isDuty ? "text-white" : "text-slate-950"
              )}
            >
              {is24h
                ? "Kíp trực 24 giờ liên tục"
                : shift.label}
            </h3>
            <span
              className={cn(
                "text-xs font-bold",
                isDuty ? "text-teal-300" : "text-teal-800"
              )}
            >
              [{shift.timeRange ?? "07:00 – 11:30"}]
            </span>
          </div>

          <p
            className={cn(
              "text-xs leading-relaxed max-w-xl",
              isDuty ? "text-slate-300" : "text-slate-600"
            )}
          >
            {is24h
              ? "Ngày nghỉ / Lễ: Kíp trực thực hiện nhiệm vụ từ 07:00 hôm nay đến 07:00 hôm sau. Ghi nhận 4 biểu mẫu và bàn giao thiết bị."
              : shift.code === "SHIFT_1"
              ? "Ca sáng (07:00 – 11:30): Ghi nhận nhiệt độ PXN BM.01, tủ lạnh BM.02-03 và trạng thái 25 thiết bị BM.06."
              : shift.code === "SHIFT_2"
              ? "Ca trực trưa (11:30 – 13:30): Trực nhận mẫu cấp cứu, theo dõi thiết bị liên tục và kiểm soát sự cố."
              : shift.code === "SHIFT_3"
              ? "Ca chiều (13:30 – 16:40): Đo nhiệt độ ca 2 (14h), vận hành máy xét nghiệm và hoàn thành khử nhiễm."
              : "Ca trực đêm (16:40 – 07:00 hôm sau): Trực đêm cấp cứu viện 103, kiểm soát mẫu và bảo dưỡng theo lịch."}
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="shrink-0 flex items-center gap-2">
          {is24h ? (
            <Link
              href="/quick-duty"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 text-xs font-black shadow-md transition-all active:scale-95"
            >
              <Users className="size-4" />
              <span>Ghi kíp trực 24/7</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <Link
              href="/equipment"
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-black shadow-md transition-all active:scale-95",
                isDuty
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-teal-700 hover:bg-teal-800 text-white"
              )}
            >
              <ShieldCheck className="size-4" />
              <span>Ghi sổ BM.06 ca này</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}

          <Link
            href="/calendar"
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition-all border",
              isDuty
                ? "border-white/20 bg-white/10 hover:bg-white/20 text-white"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            )}
            title="Xem lịch trực toàn khoa"
          >
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">Lịch trực</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

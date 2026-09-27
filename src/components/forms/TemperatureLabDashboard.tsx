"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Filter, Search } from "lucide-react";
import { InlineTemperatureList } from "@/components/forms/InlineTemperatureList";
import type { InlineOccurrence } from "@/components/forms/InlineTemperatureCard";
import { cn } from "@/lib/utils";

export interface TemperaturePoint {
  id: string;
  stt: number;
  name: string;
  area: string;
  temperature: number | null;
  humidity: number | null;
  isAbnormal: boolean;
  updatedAt: string;
  code: string;
  slotCode: string | null;
  minTemp: number;
  maxTemp: number;
}

interface TemperatureLabDashboardProps {
  initialPoints: TemperaturePoint[];
  occurrences: InlineOccurrence[];
  activeDate?: string;
}

export function TemperatureLabDashboard({
  initialPoints,
  occurrences,
  activeDate = "25/09/2026",
}: TemperatureLabDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("MORNING");

  const areaOptions = useMemo(
    () => Array.from(new Set(initialPoints.map((point) => point.area))).filter(Boolean),
    [initialPoints]
  );

  const filteredPoints = useMemo(() => {
    return initialPoints.filter((point) => {
      if (point.slotCode !== selectedShift) return false;
      if (selectedArea !== "ALL" && point.area !== selectedArea) return false;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return point.name.toLowerCase().includes(query) || point.area.toLowerCase().includes(query);
    });
  }, [initialPoints, searchQuery, selectedArea, selectedShift]);

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occurrence) => {
      if (occurrence.slot_code !== selectedShift) return false;
      if (selectedArea === "ALL") return true;
      const locationName = occurrence.register_periods.locations?.name ?? "";
      const assetName = occurrence.register_periods.assets?.source_name ?? "";
      return locationName === selectedArea || assetName === selectedArea;
    });
  }, [occurrences, selectedArea, selectedShift]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-teal-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-teal-700">BM.01 · BM.02 · BM.03</p>
            <h1 className="mt-1 text-xl font-black text-slate-950">Nhập nhanh nhiệt độ & độ ẩm</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {activeDate} · Chọn ca và khu vực rồi nhập trực tiếp bằng thẻ bên dưới.
            </p>
          </div>
          <Link
            href="/reports/export"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <Download className="size-4" />
            Xuất báo cáo
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm điểm đo hoặc khu vực..."
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:bg-white"
            />
          </div>

          <select
            value={selectedShift}
            onChange={(event) => setSelectedShift(event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-600"
          >
            <option value="MORNING">Sáng (08:00–09:00)</option>
            <option value="AFTERNOON">Chiều (14:30–15:30)</option>
          </select>

          <select
            value={selectedArea}
            onChange={(event) => setSelectedArea(event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-600"
          >
            <option value="ALL">Tất cả khu vực / tủ</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedArea("ALL");
              setSelectedShift("MORNING");
            }}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Filter className="size-4" />
            Xóa lọc
          </button>
        </div>
      </section>

      <InlineTemperatureList initialOccurrences={filteredOccurrences} />

      <section className="rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Danh sách điểm đo đã lọc</h2>
            <p className="text-xs font-medium text-slate-500">Chỉ để đối chiếu trạng thái; nhập số liệu ở thẻ phía trên.</p>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">{filteredPoints.length} điểm</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredPoints.map((point) => (
            <div key={point.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black text-slate-900">#{point.stt} · {point.name}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{point.area} · {point.slotCode}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("text-xs font-black", point.isAbnormal ? "text-rose-700" : "text-emerald-700")}>
                  {point.temperature != null ? `${point.temperature}°C` : "Chưa ghi"}
                </p>
                <p className="text-[11px] font-semibold text-slate-400">{point.humidity != null ? `${point.humidity}%` : "—"}</p>
              </div>
            </div>
          ))}
          {filteredPoints.length === 0 ? (
            <p className="p-6 text-center text-sm font-semibold text-slate-500">Không có điểm đo phù hợp với bộ lọc.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

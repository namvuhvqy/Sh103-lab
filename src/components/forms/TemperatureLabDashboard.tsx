"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Download, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock3, 
  Filter,
  Thermometer
} from "lucide-react";
import { QCTrendChart, type QCTrendPoint } from "@/components/p5/QCTrendChart";
import { InlineTemperatureList } from "@/components/forms/InlineTemperatureList";
import { MobileActionSheet } from "@/components/ui/MobileActionSheet";
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
  minTemp: number;
  maxTemp: number;
}

interface TemperatureLabDashboardProps {
  initialPoints: TemperaturePoint[];
  occurrences: InlineOccurrence[];
  chartPoints: QCTrendPoint[];
  activeDate?: string;

}

export function TemperatureLabDashboard({
  initialPoints,
  occurrences,
  chartPoints,
  activeDate = "25/09/2026",

}: TemperatureLabDashboardProps) {
  // Tab chính chuẩn Mockup: [Tổng quan] [Nhập số liệu] [Biểu đồ] [Báo cáo] [Cấu hình]
  const [activeTab, setActiveTab] = useState<"overview" | "input" | "chart" | "report" | "config">("overview");

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("SHIFT_1");
  const [points, setPoints] = useState<TemperaturePoint[]>(initialPoints);

  // Thống kê 4 KPI Cards chuẩn Image 2:
  const totalPoints = points.length;
  const recordedCount = points.filter((p) => p.temperature !== null).length;
  const recordedPercent = totalPoints > 0 ? Math.round((recordedCount / totalPoints) * 100) : 0;
  const abnormalCount = points.filter((p) => p.isAbnormal).length;
  const abnormalPercent = totalPoints > 0 ? ((abnormalCount / totalPoints) * 100).toFixed(1) : "0.0";
  const unrecordedCount = totalPoints - recordedCount;
  const unrecordedPercent = totalPoints > 0 ? Math.round((unrecordedCount / totalPoints) * 100) : 0;

  // Lọc theo tìm kiếm và khu vực
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedArea !== "ALL" && p.area !== selectedArea) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
      }
      return true;
    });
  }, [points, selectedArea, searchQuery]);

  // Sửa nhanh giá trị trên bảng
  const handleInlineCellChange = (id: string, newTemp: string) => {
    const val = newTemp.trim() !== "" ? parseFloat(newTemp) : null;
    setPoints((prev) =>
      prev.map((pt) => {
        if (pt.id === id) {
          const isAbn = val !== null && (val < pt.minTemp || val > pt.maxTemp);
          return {
            ...pt,
            temperature: val,
            isAbnormal: isAbn,
            updatedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          };
        }
        return pt;
      })
    );

    // Gửi lưu API ngầm
    fetch("/api/measurements/quick-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occurrenceId: id,
        temperature: val,
      }),
    }).catch(console.warn);
  };

  return (
    <div className="space-y-5">
      {/* 1. Thanh Tabs Chuẩn Mockup Ảnh 2: [Tổng quan] [Nhập số liệu] [Biểu đồ] [Báo cáo] [Cấu hình] */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all shrink-0",
            activeTab === "overview"
              ? "bg-teal-700 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Tổng quan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("input")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all shrink-0",
            activeTab === "input"
              ? "bg-teal-700 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Nhập số liệu
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chart")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all shrink-0",
            activeTab === "chart"
              ? "bg-teal-700 text-white shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Biểu đồ
        </button>
        <Link
          href="/reports"
          className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all shrink-0"
        >
          Báo cáo
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all shrink-0"
        >
          Cấu hình
        </Link>
      </div>

      {/* 2. Thanh Bộ Lọc Ngang Chuẩn Mockup Ảnh 2 */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-2xl border border-cyan-100 shadow-xs text-xs font-bold">
        {/* Bộ chọn Ngày */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
          <span>📅</span>
          <span>Hôm nay, {activeDate}</span>
        </div>

        {/* Bộ chọn Khu vực */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none hover:border-teal-400"
        >
          <option value="ALL">Tất cả khu vực</option>
          <option value="Sinh hóa">Sinh hóa</option>
          <option value="Miễn dịch">Miễn dịch</option>
          <option value="Nước tiểu">Nước tiểu</option>
          <option value="Ly tâm">Ly tâm</option>
          <option value="Nhận bệnh phẩm">Nhận bệnh phẩm</option>
        </select>

        {/* Bộ chọn Ca */}
        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none hover:border-teal-400"
        >
          <option value="SHIFT_1">Ca 1 - Sáng (07:00–11:30)</option>
          <option value="SHIFT_2">Ca 2 - Trực trưa (11:30–13:30)</option>
          <option value="SHIFT_3">Ca 3 - Chiều (13:30–16:40)</option>
          <option value="SHIFT_4">Ca 4 - Trực đêm (16:40–07:00)</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSelectedArea("ALL");
            setSearchQuery("");
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
        >
          <Filter className="size-3.5" />
          <span>Lọc</span>
        </button>
      </div>

      {/* Nếu chọn tab Nhập số liệu: Hiển thị Thẻ Inline Click-to-Edit tốc độ cao */}
      {activeTab === "input" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">
              Ghi nhận tức thì điểm đo phòng xét nghiệm (ISO 15189)
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="text-xs font-bold text-teal-800 hover:underline"
            >
              ← Về bảng tổng quan
            </button>
          </div>
          <InlineTemperatureList initialOccurrences={occurrences} />
        </div>
      ) : (
        <>
          {/* 3. Bốn Khối KPI Tổng Quan Chuẩn 100% Mockup Ảnh 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Tổng số điểm */}
            <div className="rounded-2xl border border-cyan-100 bg-white p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Thermometer className="size-4 text-teal-600" />
                <span>Tổng số điểm</span>
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{totalPoints}</p>
              <p className="text-[11px] font-semibold text-slate-500">5 khu vực</p>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: `${recordedPercent}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-bold text-teal-700">{recordedPercent}% đã ghi</p>
            </div>

            {/* Card 2: Đã ghi */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Đã ghi</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{recordedCount}</p>
                <span className="text-xs font-bold text-slate-500">{recordedPercent}%</span>
              </div>
              <p className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>↑</span> +2 so với hôm qua
              </p>
            </div>

            {/* Card 3: Bất thường */}
            <div className="rounded-2xl border border-rose-100 bg-white p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <AlertTriangle className="size-4 text-rose-600" />
                <span>Bất thường</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black text-rose-800">{abnormalCount}</p>
                <span className="text-xs font-bold text-slate-500">{abnormalPercent}%</span>
              </div>
              <p className="mt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                <span>↑</span> +1 so với hôm qua
              </p>
            </div>

            {/* Card 4: Chưa ghi */}
            <div className="rounded-2xl border border-cyan-100 bg-white p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Clock3 className="size-4 text-amber-600" />
                <span>Chưa ghi</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{unrecordedCount}</p>
                <span className="text-xs font-bold text-slate-500">{unrecordedPercent}%</span>
              </div>
              <p className="mt-2 text-[11px] font-bold text-slate-500 truncate">
                Cần hoàn thành ca này
              </p>
            </div>
          </div>

          {/* 4. Biểu Đồ Xu Hướng 24 Giờ Gần Nhất (Chuẩn Mockup Ảnh 2) */}
          <QCTrendChart points={chartPoints} />

          {/* 5. Danh Sách Điểm Đo (16 Điểm) Khớp Mockup Ảnh 2 */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-900">
                Danh sách điểm đo ({filteredPoints.length} điểm)
              </h2>

              <div className="flex items-center gap-2">
                {/* Thanh tìm kiếm điểm đo */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm điểm đo, khu vực…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-500"
                  />
                </div>

                {/* Nút Xuất báo cáo */}
                <Link
                  href="/reports/export"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  <Download className="size-3.5 text-slate-700" />
                  <span>Xuất</span>
                </Link>
              </div>
            </div>

            {/* Bảng Dữ Liệu Điểm Đo (Table View với Click-to-Edit trực tiếp) */}
            <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">STT</th>
                      <th className="py-3 px-3">Tên điểm đo</th>
                      <th className="py-3 px-3">Khu vực</th>
                      <th className="py-3 px-3 text-center">Nhiệt độ (°C)</th>
                      <th className="py-3 px-3 text-center">Độ ẩm (%)</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                      <th className="py-3 px-3 text-center">Cập nhật</th>
                      <th className="py-3 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredPoints.map((pt) => {
                      const isAbnormal = pt.isAbnormal;
                      return (
                        <tr
                          key={pt.id}
                          className={cn(
                            "hover:bg-teal-50/30 transition-colors",
                            isAbnormal && "bg-rose-50/20"
                          )}
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {pt.stt}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {pt.name}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {pt.area}
                          </td>

                          {/* Ô nhập nhiệt độ tương tác trực tiếp (Inline Click-to-Edit) */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              defaultValue={pt.temperature != null ? pt.temperature : ""}
                              onBlur={(e) => handleInlineCellChange(pt.id, e.target.value)}
                              className={cn(
                                "w-16 py-1 px-2 text-center rounded-lg border text-xs font-black transition-all",
                                pt.temperature != null
                                  ? isAbnormal
                                    ? "border-rose-400 bg-rose-50 text-rose-800 focus:ring-1 focus:ring-rose-500"
                                    : "border-emerald-300 bg-emerald-50/40 text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                                  : "border-slate-200 bg-slate-50 text-slate-500 placeholder:text-slate-300"
                              )}
                              placeholder="—"
                              title={`Ngưỡng chuẩn: ${pt.minTemp}°C – ${pt.maxTemp}°C`}
                            />
                          </td>

                          {/* Ô độ ẩm */}
                          <td className="py-3 px-3 text-center text-slate-600 font-bold">
                            {pt.humidity != null ? `${pt.humidity}%` : "—"}
                          </td>

                          {/* Badge trạng thái */}
                          <td className="py-3 px-3 text-center">
                            {pt.temperature != null ? (
                              isAbnormal ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
                                  Vượt ngưỡng
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                                  Bình thường
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                                Chưa ghi
                              </span>
                            )}
                          </td>

                          {/* Thời gian cập nhật */}
                          <td className="py-3 px-3 text-center text-slate-500 text-[11px] font-semibold">
                            {pt.updatedAt || "—"}
                          </td>

                          {/* Nút mũi tên chuyển chi tiết */}
                          <td className="py-3 px-2 text-center text-slate-400">
                            <ChevronRight className="size-4" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Floating Action Menu trên Mobile (Xuất, Nhập, In, Đóng) */}
      <MobileActionSheet
        onQuickInput={() => setActiveTab("input")}
        exportHref="/reports/export"
      />
    </div>
  );
}

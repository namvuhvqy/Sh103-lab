"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Thermometer,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ArrowRight,
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
  slotCode: string | null;
  minTemp: number;
  maxTemp: number;
}

interface TemperatureLabDashboardProps {
  initialPoints: TemperaturePoint[];
  occurrences: InlineOccurrence[];
  chartPoints: QCTrendPoint[];
  activeDate?: string;
  selectedDateIso?: string;
  selectedRangeDays?: number;
  initialFilterMode?: "daily" | "range";
  initialFromDateIso?: string;
  initialToDateIso?: string;
}

export function TemperatureLabDashboard({
  initialPoints,
  occurrences,
  chartPoints,
  activeDate = "25/10/2026",
  selectedDateIso = "2026-10-25",
  selectedRangeDays = 7,
  initialFilterMode = "daily",
  initialFromDateIso,
  initialToDateIso,
}: TemperatureLabDashboardProps) {
  const router = useRouter();
  const inputSectionRef = useRef<HTMLDivElement | null>(null);

  // Gộp màn Nhập số liệu và màn Biểu đồ trên cùng 1 màn hình thống nhất
  const [showQuickEntryCards, setShowQuickEntryCards] = useState(true);

  // Chế độ lọc ngày QC: "daily" (Theo ngày) hoặc "range" (Từ ngày A -> Đến ngày B)
  const [filterMode, setFilterMode] = useState<"daily" | "range">(initialFilterMode);
  const [dailyDate, setDailyDate] = useState<string>(selectedDateIso);
  const [fromDate, setFromDate] = useState<string>(
    initialFromDateIso ?? selectedDateIso
  );
  const [toDate, setToDate] = useState<string>(
    initialToDateIso ?? selectedDateIso
  );

  // Bộ lọc phụ (lưu nhanh vào sessionStorage để giữ nguyên khi chuyển qua lại giữa các màn hình trên mobile)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("MORNING");
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, { temperature: number | null; humidity: number | null; isAbnormal: boolean; updatedAt: string }>
  >({});

  useEffect(() => {
    setDailyDate(selectedDateIso);
  }, [selectedDateIso]);

  useEffect(() => {
    if (initialFromDateIso) setFromDate(initialFromDateIso);
    if (initialToDateIso) setToDate(initialToDateIso);
    if (initialFilterMode) setFilterMode(initialFilterMode);
  }, [initialFromDateIso, initialToDateIso, initialFilterMode]);

  useEffect(() => {
    try {
      const savedArea = sessionStorage.getItem("lab103_temp_filter_area");
      const savedShift = sessionStorage.getItem("lab103_temp_filter_shift");
      if (savedArea) setSelectedArea(savedArea);
      if (savedShift === "MORNING" || savedShift === "AFTERNOON") setSelectedShift(savedShift);
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("lab103_temp_filter_area", selectedArea);
      sessionStorage.setItem("lab103_temp_filter_shift", selectedShift);
    } catch {
      // Safe fallback
    }
  }, [selectedArea, selectedShift]);

  // Điều hướng bộ lọc Theo Ngày (Daily)
  const applyDailyFilter = (targetDate: string) => {
    setDailyDate(targetDate);
    router.push(`/temperature?mode=daily&date=${encodeURIComponent(targetDate)}`);
  };

  // Điều hướng bộ lọc Khoảng Ngày (Từ Ngày A -> Đến Ngày B)
  const applyRangeFilter = (fromVal: string, toVal: string) => {
    setFromDate(fromVal);
    setToDate(toVal);
    router.push(`/temperature?mode=range&from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}`);
  };

  // Nút nhanh preset ngày theo chuỗi QC (7 ngày, 14 ngày, 30 ngày)
  const applyRangePreset = (days: number) => {
    const endTarget = toDate || selectedDateIso;
    const endObj = new Date(`${endTarget}T00:00:00Z`);
    const startObj = new Date(endObj);
    startObj.setUTCDate(startObj.getUTCDate() - (days - 1));
    const startVal = startObj.toISOString().slice(0, 10);
    applyRangeFilter(startVal, endTarget);
  };

  const scrollToQuickInput = () => {
    setShowQuickEntryCards(true);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const points = useMemo(() => {
    if (Object.keys(localOverrides).length === 0) return initialPoints;
    return initialPoints.map((pt) => {
      const override = localOverrides[pt.id];
      return override ? { ...pt, ...override } : pt;
    });
  }, [initialPoints, localOverrides]);

  const handleMeasurementSaved = (occId: string, temp: number | null, hum: number | null) => {
    const targetPoint = initialPoints.find((p) => p.id === occId);
    const minTemp = targetPoint?.minTemp ?? 21;
    const maxTemp = targetPoint?.maxTemp ?? 26;
    const isAbnormal = Boolean(
      (temp !== null && (temp < minTemp || temp > maxTemp)) || (hum !== null && (hum < 20 || hum > 80))
    );
    setLocalOverrides((prev) => ({
      ...prev,
      [occId]: {
        temperature: temp,
        humidity: hum,
        isAbnormal,
        updatedAt: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }),
      },
    }));
    try {
      router.refresh();
    } catch {
      // Safe fallback
    }
  };

  // Lọc theo tìm kiếm, khu vực và slot đo thực tế.
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (p.slotCode !== selectedShift) return false;
      if (selectedArea !== "ALL" && !p.area.toLowerCase().includes(selectedArea.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
      }
      return true;
    });
  }, [points, selectedArea, selectedShift, searchQuery]);

  const filteredOccurrences = useMemo(
    () =>
      occurrences.filter((occurrence) => {
        if (occurrence.slot_code !== selectedShift) return false;
        if (selectedArea !== "ALL") {
          const locName = occurrence.register_periods.locations?.name ?? "";
          if (!locName.toLowerCase().includes(selectedArea.toLowerCase())) return false;
        }
        return true;
      }),
    [occurrences, selectedShift, selectedArea]
  );

  const activeChartPoints: QCTrendPoint[] = useMemo(() => {
    const baseSeries =
      chartPoints.length > 0
        ? chartPoints
        : points
            .filter((p) => p.temperature !== null || p.humidity !== null)
            .map((p) => ({
              areaName: p.name,
              locationName: p.area,
              slotCode: p.slotCode,
              time: p.updatedAt,
              temperature: p.temperature,
              humidity: p.humidity,
              category: p.code.includes("BM.01")
                ? ("ROOM" as const)
                : p.code.includes("BM.03")
                ? ("FREEZER" as const)
                : ("COOLER" as const),
            }));

    return baseSeries.filter((pt) => {
      if (selectedArea !== "ALL") {
        const loc = `${pt.locationName ?? ""} ${pt.areaName}`.toLowerCase();
        if (!loc.includes(selectedArea.toLowerCase())) return false;
      }
      return true;
    });
  }, [chartPoints, points, selectedArea]);

  const totalPoints = filteredPoints.length;
  const recordedCount = filteredPoints.filter((p) => p.temperature !== null).length;
  const recordedPercent = totalPoints > 0 ? Math.round((recordedCount / totalPoints) * 100) : 0;
  const abnormalCount = filteredPoints.filter((p) => p.isAbnormal).length;
  const abnormalPercent = totalPoints > 0 ? ((abnormalCount / totalPoints) * 100).toFixed(1) : "0.0";
  const unrecordedCount = totalPoints - recordedCount;
  const unrecordedPercent = totalPoints > 0 ? Math.round((unrecordedCount / totalPoints) * 100) : 0;

  return (
    <div className="space-y-5 pb-20 sm:pb-6">
      {/* 1. Thanh Điều Hướng Gọn: Đã gộp màn Nhập số liệu & Biểu đồ và bỏ tab Cấu hình */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToQuickInput}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-black text-white shadow-xs transition hover:bg-teal-800 active:scale-95"
          >
            <Thermometer className="size-3.5" />
            <span>Nhập số liệu</span>
          </button>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
            Màn hình hợp nhất: Vừa nhập số liệu trực tiếp vừa theo dõi biểu đồ QC Nhiệt độ &amp; Độ ẩm
          </span>
        </div>

        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
        >
          <Download className="size-3.5 text-teal-700" />
          <span>Báo cáo &amp; Xuất sổ</span>
        </Link>
      </div>

      {/* 2. BỘ LỌC NGÀY CHUẨN QC: THEO NGÀY (DAILY) & TỪ NGÀY A ĐẾN NGÀY B (RANGE) */}
      <div className="rounded-3xl border border-cyan-100 bg-white p-3.5 shadow-xs space-y-3 text-xs font-bold">
        {/* Hàng 1: Chuyển đổi 2 chế độ lọc như phần mềm QC Lab */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Chế độ lọc:</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilterMode("daily")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  filterMode === "daily"
                    ? "bg-teal-700 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Calendar className="size-3.5" />
                <span>Theo ngày (Daily)</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("range")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  filterMode === "range"
                    ? "bg-teal-700 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <CalendarDays className="size-3.5" />
                <span>Từ ngày A → Đến ngày B (Chuỗi QC)</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {filterMode === "daily" ? (
              <span>Đang xem: {activeDate}</span>
            ) : (
              <span>
                Khoảng QC: {fromDate.split("-").reverse().join("/")} → {toDate.split("-").reverse().join("/")} ({selectedRangeDays} ngày)
              </span>
            )}
          </div>
        </div>

        {/* Hàng 2: Điều khiển thời gian theo chế độ đang chọn */}
        {filterMode === "daily" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">Chọn ngày:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => {
                  setDailyDate(e.target.value);
                  if (e.target.value) applyDailyFilter(e.target.value);
                }}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const nowIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
                applyDailyFilter(nowIso);
              }}
              className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800 font-bold hover:bg-teal-100 transition"
            >
              Hôm nay
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">Ngày bắt đầu:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              />
            </label>

            <ArrowRight className="size-3.5 text-slate-400 shrink-0" />

            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">Ngày kết thúc:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={() => applyRangeFilter(fromDate, toDate)}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3.5 py-1.5 text-white font-black shadow-2xs hover:bg-teal-800 transition"
            >
              <span>Xem biểu đồ</span>
            </button>

            {/* Các preset nhanh */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => applyRangePreset(7)}
                className={cn(
                  "rounded-lg px-2 py-1 text-xs font-bold transition",
                  selectedRangeDays === 7 ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                7 ngày
              </button>
              <button
                type="button"
                onClick={() => applyRangePreset(14)}
                className={cn(
                  "rounded-lg px-2 py-1 text-xs font-bold transition",
                  selectedRangeDays === 14 ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                14 ngày
              </button>
              <button
                type="button"
                onClick={() => applyRangePreset(30)}
                className={cn(
                  "rounded-lg px-2 py-1 text-xs font-bold transition",
                  selectedRangeDays >= 30 ? "bg-white text-teal-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                30 ngày
              </button>
            </div>
          </div>
        )}

        {/* Hàng 3: Bộ lọc phụ (Khu vực & Ca & Đặt lại) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-bold">Phạm vi đo:</span>
          {/* Bộ chọn Khu vực */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none hover:border-teal-400"
          >
            <option value="ALL">Tất cả 5 khu vực</option>
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
            <option value="MORNING">Sáng (08:00–09:00)</option>
            <option value="AFTERNOON">Chiều (14:30–15:30)</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSelectedArea("ALL");
              setSelectedShift("MORNING");
              setSearchQuery("");
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
          >
            <Filter className="size-3.5" />
            <span>Đặt lại lọc</span>
          </button>
        </div>
      </div>

      {/* 3. Bốn Khối KPI Tổng Quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-cyan-100 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Thermometer className="size-4 text-teal-600" />
            <span>Tổng số điểm</span>
          </div>
          <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{totalPoints}</p>
          <p className="text-xs font-semibold text-slate-500">5 khu vực</p>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${recordedPercent}%` }} />
          </div>
          <p className="mt-1 text-xs font-bold text-teal-700">{recordedPercent}% đã ghi</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Đã ghi</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{recordedCount}</p>
            <span className="text-xs font-bold text-slate-500">{recordedPercent}%</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Theo bộ lọc hiện tại</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <AlertTriangle className="size-4 text-rose-600" />
            <span>Bất thường</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-rose-800">{abnormalCount}</p>
            <span className="text-xs font-bold text-slate-500">{abnormalPercent}%</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Theo bộ lọc hiện tại</p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Clock3 className="size-4 text-amber-600" />
            <span>Chưa ghi</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{unrecordedCount}</p>
            <span className="text-xs font-bold text-slate-500">{unrecordedPercent}%</span>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500 truncate">Cần hoàn thành ca này</p>
        </div>
      </div>

      {/* 4. BIỂU ĐỒ QC NHIỆT ĐỘ (°C) & BIỂU ĐỒ ĐỘ ẨM (%) NẰM NGAY DƯỚI NHAU */}
      <QCTrendChart
        title={
          filterMode === "range"
            ? `Biểu đồ xu hướng QC (${fromDate.split("-").reverse().join("/")} → ${toDate.split("-").reverse().join("/")})`
            : `Biểu đồ xu hướng QC ngày ${dailyDate.split("-").reverse().join("/")}`
        }
        points={activeChartPoints.length ? activeChartPoints : chartPoints}
      />

      {/* 5. Khu Vực Nhập Số Liệu Trực Tiếp (Đã gộp chung vào cùng màn hình với Biểu đồ) */}
      <section
        id="nhap-so-lieu-nhiet-do"
        ref={inputSectionRef}
        className="rounded-3xl border border-teal-200 bg-white p-4 shadow-xs space-y-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-teal-800">
              Ghi nhận trực tiếp · {selectedShift === "MORNING" ? "Ca Sáng (08:00–09:00)" : "Ca Chiều (14:30–15:30)"}
            </span>
            <h2 className="text-base font-black text-slate-900">
              Nhập số liệu điểm đo phòng xét nghiệm &amp; tủ bảo quản ({filteredOccurrences.length} điểm)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickEntryCards((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <span>{showQuickEntryCards ? "Thu gọn thẻ nhập" : "Mở thẻ nhập số liệu"}</span>
            {showQuickEntryCards ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {showQuickEntryCards ? (
          <InlineTemperatureList
            initialOccurrences={filteredOccurrences}
            onMeasurementSaved={handleMeasurementSaved}
          />
        ) : null}
      </section>

      {/* 6. Bảng Tổng Hợp Điểm Đo Trong Ngày */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 className="text-base font-black text-slate-900">
            Bảng tổng hợp điểm đo trong ca ({filteredPoints.length} điểm)
          </h2>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3">Tên điểm đo</th>
                  <th className="hidden sm:table-cell py-3 px-3">Khu vực</th>
                  <th className="py-3 px-3 text-center">Nhiệt độ (°C)</th>
                  <th className="py-3 px-3 text-center">Độ ẩm (%)</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="hidden sm:table-cell py-3 px-3 text-center">Cập nhật</th>
                  <th className="py-3 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPoints.map((pt) => {
                  const isAbnormal = pt.isAbnormal;
                  return (
                    <tr
                      key={pt.id}
                      onClick={scrollToQuickInput}
                      className={cn(
                        "hover:bg-teal-50/50 transition-colors cursor-pointer group",
                        isAbnormal && "bg-rose-50/20"
                      )}
                      title="Bấm vào dòng này để cuộn tới thẻ nhập số liệu"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{pt.stt}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                        <div>{pt.name}</div>
                        <div className="text-xs font-medium text-slate-500 sm:hidden">{pt.area}</div>
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 text-slate-600">{pt.area}</td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-16 justify-center rounded-lg border px-2 py-1 text-xs font-black transition-all group-hover:ring-2 group-hover:ring-teal-500/30",
                            pt.temperature != null
                              ? isAbnormal
                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                : "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:border-teal-500 hover:text-teal-800"
                          )}
                          title={`Ngưỡng chuẩn: ${pt.minTemp}°C – ${pt.maxTemp}°C · Bấm để nhập`}
                        >
                          {pt.temperature != null ? pt.temperature : "+ Nhập"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-bold">
                        {pt.humidity != null ? `${pt.humidity}%` : "—"}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {pt.temperature != null ? (
                          isAbnormal ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-800 border border-rose-300">
                              Vượt ngưỡng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 border border-emerald-300">
                              Bình thường
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-800 transition-colors">
                            Chưa ghi
                          </span>
                        )}
                      </td>

                      <td className="hidden sm:table-cell py-3 px-3 text-center text-slate-500 text-xs font-semibold">
                        {pt.updatedAt || "—"}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-400 group-hover:text-teal-700 transition-colors">
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

      {/* Floating Action Menu trên Mobile */}
      <MobileActionSheet onQuickInput={scrollToQuickInput} exportHref="/reports/export" />
    </div>
  );
}

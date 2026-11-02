"use client";

import { useMemo, useState } from "react";
import { LineChart, Droplets, Thermometer, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QCTrendPoint {
  areaName: string;
  locationName?: string;
  date?: string;
  slotCode?: string | null;
  time: string;
  temperature: number | null;
  humidity: number | null;
  category?: "ROOM" | "COOLER" | "FREEZER";
}

interface QCTrendChartProps {
  title?: string;
  className?: string;
  points?: QCTrendPoint[];
}

const COLORS = ["#0f766e", "#7e22ce", "#1d4ed8", "#c2410c", "#be123c"];

const CATEGORY_META = {
  ROOM: { label: "Phòng XN", rangeLabel: "21–26°C", lower: 21, upper: 26, min: 15, max: 32 },
  COOLER: { label: "Tủ mát", rangeLabel: "2–8°C", lower: 2, upper: 8, min: 0, max: 12 },
  FREEZER: { label: "Tủ đông", rangeLabel: "-30..-10°C", lower: -30, upper: -10, min: -35, max: -5 },
} as const;

export function QCTrendChart({
  title = "Biểu đồ xu hướng Nhiệt độ & Độ ẩm thực tế (QC)",
  className,
  points = [],
}: QCTrendChartProps) {
  const [category, setCategory] = useState<"ALL" | "ROOM" | "COOLER" | "FREEZER">("ROOM");
  const [selectedDevice, setSelectedDevice] = useState<string>("ALL");
  const [selectedHumDevice, setSelectedHumDevice] = useState<string>("ALL");
  const [selectedTempIdx, setSelectedTempIdx] = useState<number>(0);
  const [selectedHumIdx, setSelectedHumIdx] = useState<number>(0);
  const [showAllTempBadges, setShowAllTempBadges] = useState(false);
  const [showValueLabels, setShowValueLabels] = useState(true);

  // 1. Thống kê theo 3 nhóm thiết bị
  const categorySummaries = useMemo(() => {
    return (["ROOM", "COOLER", "FREEZER"] as const).map((cat) => {
      const meta = CATEGORY_META[cat];
      const items = points.filter(
        (p) => (p.category ?? "ROOM") === cat && p.temperature !== null && Number.isFinite(p.temperature)
      );
      const temps = items.map((p) => p.temperature as number);
      const avg = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;
      const inRange = temps.filter((t) => t >= meta.lower && t <= meta.upper).length;
      return {
        key: cat,
        ...meta,
        total: items.length,
        inRange,
        outOfRange: items.length - inRange,
        avg,
      };
    });
  }, [points]);

  // Danh sách các thiết bị/khu vực đo khả dụng trong category hiện tại
  const availableDevices = useMemo(() => {
    const list = points
      .filter((p) => (category === "ALL" ? true : (p.category ?? "ROOM") === category))
      .map((p) => p.areaName);
    return Array.from(new Set(list)).filter(Boolean);
  }, [category, points]);

  // 2. Dữ liệu Biểu đồ Nhiệt độ (°C) theo chuẩn QC Levey-Jennings
  const tempFiltered = useMemo(() => {
    let base = points;
    if (category !== "ALL") {
      const matched = points.filter((p) => (p.category ?? "ROOM") === category);
      if (matched.length > 0) base = matched;
    }
    if (selectedDevice !== "ALL") {
      base = base.filter((p) => p.areaName === selectedDevice);
    }
    return base;
  }, [category, selectedDevice, points]);

  const usableTemp = useMemo(
    () => tempFiltered.filter((point) => point.temperature !== null && Number.isFinite(point.temperature)),
    [tempFiltered]
  );
  const tempValues = usableTemp.map((point) => point.temperature as number);

  const tempBounds = useMemo(() => {
    if (category === "COOLER") {
      return { min: 0, max: 12, lower: 2, upper: 8, unit: "°C" };
    }
    if (category === "FREEZER") {
      return { min: -35, max: -5, lower: -30, upper: -10, unit: "°C" };
    }
    if (category === "ROOM") {
      return { min: 15, max: 32, lower: 21, upper: 26, unit: "°C" };
    }
    const valMin = tempValues.length ? Math.min(...tempValues) : 2;
    const valMax = tempValues.length ? Math.max(...tempValues) : 26;
    return { min: Math.min(-10, valMin - 2), max: Math.max(30, valMax + 2), lower: 21, upper: 26, unit: "°C" };
  }, [category, tempValues]);

  // Đường trung bình mục tiêu CL (Center Line)
  const tempCL = useMemo(() => {
    return Number(((tempBounds.upper + tempBounds.lower) / 2).toFixed(1));
  }, [tempBounds]);

  const tempMin = tempValues.length ? Math.min(tempBounds.min, ...tempValues) : tempBounds.min;
  const tempMax = tempValues.length ? Math.max(tempBounds.max, ...tempValues) : tempBounds.max;
  const xTemp = (index: number) => 40 + (index / Math.max(usableTemp.length - 1, 1)) * 420;
  const yTemp = (value: number) => 165 - ((value - tempMin) / Math.max(tempMax - tempMin, 1)) * 135;

  const activeTempIndex = Math.min(selectedTempIdx, Math.max(usableTemp.length - 1, 0));
  const activeTempPoint = usableTemp[activeTempIndex] ?? null;

  // 3. Dữ liệu Biểu đồ Độ ẩm (%) theo chuẩn QC Levey-Jennings
  const availableHumDevices = useMemo(() => {
    const list = points
      .filter((p) => p.humidity !== null && Number.isFinite(p.humidity))
      .map((p) => p.areaName);
    return Array.from(new Set(list)).filter(Boolean);
  }, [points]);

  const humFiltered = useMemo(() => {
    let base = points;
    if (selectedHumDevice !== "ALL") {
      base = base.filter((p) => p.areaName === selectedHumDevice);
    }
    return base;
  }, [selectedHumDevice, points]);

  const usableHum = useMemo(
    () => humFiltered.filter((point) => point.humidity !== null && Number.isFinite(point.humidity)),
    [humFiltered]
  );
  const humValues = usableHum.map((point) => point.humidity as number);
  const humBounds = { min: 15, max: 90, lower: 20, upper: 80, unit: "%" };
  const humCL = 50; // Đường trung bình mục tiêu CL độ ẩm = 50%
  const humMin = humValues.length ? Math.min(humBounds.min, ...humValues) : humBounds.min;
  const humMax = humValues.length ? Math.max(humBounds.max, ...humValues) : humBounds.max;
  const xHum = (index: number) => 40 + (index / Math.max(usableHum.length - 1, 1)) * 420;
  const yHum = (value: number) => 165 - ((value - humMin) / Math.max(humMax - humMin, 1)) * 135;
  const humAvg = humValues.length
    ? (humValues.reduce((sum, v) => sum + v, 0) / humValues.length).toFixed(1)
    : null;
  const humInRange = humValues.filter((v) => v >= humBounds.lower && v <= humBounds.upper).length;

  const activeHumIndex = Math.min(selectedHumIdx, Math.max(usableHum.length - 1, 0));
  const activeHumPoint = usableHum[activeHumIndex] ?? null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* ======================================================== */}
      {/* KHỐI 1: BIỂU ĐỒ NHIỆT ĐỘ (°C) CHUẨN QC (ĐIỂM + ĐƯỜNG NỐI) */}
      {/* ======================================================== */}
      <section className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Thermometer className="size-4" />
              </span>
              <h2 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
                {title} · Nhiệt độ (°C)
              </h2>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Đồ thị QC Levey-Jennings: Điểm đo (<span className="text-teal-700 font-bold">●</span>) + Đường nối xu hướng + Giới hạn UCL / CL / LCL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bộ chọn nhóm thiết bị */}
            <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold [scrollbar-width:none]">
              {(
                [
                  ["ROOM", "Phòng (21-26°C)"],
                  ["COOLER", "Tủ mát (2-8°C)"],
                  ["FREEZER", "Tủ đông (-30..-10°C)"],
                  ["ALL", "Tất cả"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setCategory(val);
                    setSelectedDevice("ALL");
                    setSelectedTempIdx(0);
                  }}
                  className={cn(
                    "min-h-8 shrink-0 rounded-xl px-2.5 transition-all",
                    category === val ? "bg-teal-700 text-white font-black shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Bộ lọc riêng từng thiết bị/điểm đo để soi chuỗi QC theo thời gian */}
            {availableDevices.length > 1 ? (
              <select
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value);
                  setSelectedTempIdx(0);
                }}
                className="h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 outline-none hover:border-teal-500"
                title="Lọc riêng thiết bị để theo dõi đường cong QC độc lập"
              >
                <option value="ALL">Tất cả {availableDevices.length} điểm đo</option>
                {availableDevices.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
            ) : null}

            {/* Nút bật/tắt hiển thị nhãn giá trị trực tiếp trên các điểm đo */}
            <button
              type="button"
              onClick={() => setShowValueLabels((v) => !v)}
              className={cn(
                "h-8 rounded-xl border px-2 text-xs font-bold transition-all",
                showValueLabels
                  ? "border-teal-300 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
              title="Bật/tắt hiện số nhiệt độ trên từng điểm đo"
            >
              12.3°C
            </button>
          </div>
        </div>

        {/* 3 Thẻ tổng quan theo nhóm nhiệt độ */}
        {points.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {categorySummaries.map((group) => {
              const isSelected = category === group.key;
              const hasAlert = group.outOfRange > 0;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => {
                    setCategory(isSelected ? "ALL" : group.key);
                    setSelectedDevice("ALL");
                    setSelectedTempIdx(0);
                  }}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-2.5 text-left transition-all",
                    isSelected
                      ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-500/30"
                      : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-black text-slate-900">{group.label}</span>
                    {hasAlert ? (
                      <AlertTriangle className="size-3.5 shrink-0 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="text-sm font-black text-teal-800">
                      {group.avg !== null ? `${group.avg}°C` : "—"}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {group.inRange}/{group.total} đạt
                    </span>
                  </div>
                  <span className="mt-0.5 text-xs font-semibold text-slate-400">
                    Chuẩn {group.rangeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {usableTemp.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center text-slate-500">
            <span className="grid size-12 place-items-center rounded-2xl bg-slate-100"><LineChart className="size-6" /></span>
            <div>
              <p className="font-bold text-slate-700">Chưa có dữ liệu lịch sử</p>
              <p className="text-xs">Biểu đồ sẽ xuất hiện sau khi số đo được lưu chính thức.</p>
            </div>
          </div>
        ) : (
          <div className="pt-3">
            {/* Chú giải QC Levey-Jennings */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-rose-600" />
                  <span className="text-rose-700 font-bold">UCL: {tempBounds.upper}°C</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-teal-600" />
                  <span className="text-teal-700 font-bold">CL (Mean): {tempCL}°C</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-blue-600" />
                  <span className="text-blue-700 font-bold">LCL: {tempBounds.lower}°C</span>
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {usableTemp.length} điểm đo · Chạm vào điểm để soi chi tiết
              </span>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5">
              <svg
                viewBox="0 0 500 195"
                className="h-48 w-full sm:h-56"
                role="img"
                aria-label="Biểu đồ nhiệt độ QC Levey-Jennings"
              >
                {/* Dải kiểm soát đạt chuẩn (In-Control Shading) */}
                <rect
                  x="40"
                  y={yTemp(tempBounds.upper)}
                  width="420"
                  height={Math.max(0, yTemp(tempBounds.lower) - yTemp(tempBounds.upper))}
                  fill="#ccfbf1"
                  opacity="0.5"
                  rx="4"
                />

                {/* Đường UCL (Upper Control Limit) */}
                <line
                  x1="40"
                  x2="465"
                  y1={yTemp(tempBounds.upper)}
                  y2={yTemp(tempBounds.upper)}
                  stroke="#dc2626"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <text x="468" y={yTemp(tempBounds.upper) + 3} fontSize="8.5" fontWeight="800" fill="#dc2626">
                  {tempBounds.upper}°
                </text>

                {/* Đường CL (Center Line / Target Mean) */}
                <line
                  x1="40"
                  x2="465"
                  y1={yTemp(tempCL)}
                  y2={yTemp(tempCL)}
                  stroke="#0d9488"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.8"
                />
                <text x="468" y={yTemp(tempCL) + 3} fontSize="8" fontWeight="700" fill="#0d9488">
                  CL {tempCL}°
                </text>

                {/* Đường LCL (Lower Control Limit) */}
                <line
                  x1="40"
                  x2="465"
                  y1={yTemp(tempBounds.lower)}
                  y2={yTemp(tempBounds.lower)}
                  stroke="#2563eb"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <text x="468" y={yTemp(tempBounds.lower) + 3} fontSize="8.5" fontWeight="800" fill="#2563eb">
                  {tempBounds.lower}°
                </text>

                {/* Đường nối xu hướng (Connecting Polyline) */}
                <polyline
                  points={usableTemp.map((point, index) => `${xTemp(index)},${yTemp(point.temperature as number)}`).join(" ")}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Các điểm đo (QC Points Circles) & Nhãn số liệu */}
                {usableTemp.map((point, index) => {
                  const val = point.temperature as number;
                  const isOut = val < tempBounds.lower || val > tempBounds.upper;
                  const isSelected = index === activeTempIndex;
                  const showTick =
                    usableTemp.length <= 8 ||
                    index === 0 ||
                    index === usableTemp.length - 1 ||
                    index === activeTempIndex ||
                    index % Math.ceil(usableTemp.length / 5) === 0;

                  const px = xTemp(index);
                  const py = yTemp(val);

                  return (
                    <g
                      key={`${point.areaName}-${point.time}-${index}`}
                      onClick={() => setSelectedTempIdx(index)}
                      className="cursor-pointer group"
                    >
                      {/* Trục dóng dọc khi điểm được chọn */}
                      {isSelected ? (
                        <line
                          x1={px}
                          x2={px}
                          y1="16"
                          y2="170"
                          stroke="#0f766e"
                          strokeDasharray="2 2"
                          strokeWidth="1.2"
                          opacity="0.7"
                        />
                      ) : null}

                      {/* Điểm đo QC (QC Circle Point) */}
                      <circle
                        cx={px}
                        cy={py}
                        r={isSelected ? "6.5" : "4.5"}
                        fill={isOut ? "#e11d48" : COLORS[index % COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? "2" : "1.5"}
                        className="transition-all"
                      >
                        <title>{`${point.areaName} · ${point.time}: ${val}°C ${isOut ? "(VƯỢT NGƯỠNG QC!)" : "(Đạt chuẩn)"}`}</title>
                      </circle>

                      {/* Vòng hào quang khi điểm bất thường / out of control */}
                      {isOut ? (
                        <circle
                          cx={px}
                          cy={py}
                          r="8"
                          fill="none"
                          stroke="#e11d48"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                      ) : null}

                      {/* Nhãn giá trị trực tiếp trên điểm đo nếu bật toggle hoặc là điểm được chọn */}
                      {(showValueLabels && (usableTemp.length <= 15 || isSelected)) ? (
                        <text
                          x={px}
                          y={py - (isSelected ? 9 : 7)}
                          textAnchor="middle"
                          fontSize={isSelected ? "9" : "8"}
                          fontWeight={isSelected ? "900" : "700"}
                          fill={isOut ? "#e11d48" : isSelected ? "#0f766e" : "#334155"}
                        >
                          {val}°
                        </text>
                      ) : null}

                      {/* Nhãn thời gian trục hoành */}
                      {showTick ? (
                        <text
                          x={px}
                          y="185"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight={isSelected ? "800" : "600"}
                          fill={isSelected ? "#0f766e" : "#64748b"}
                        >
                          {point.time}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chi tiết điểm đo đang được chọn */}
            {activeTempPoint ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[activeTempIndex % COLORS.length] }}
                  />
                  <span className="font-black text-slate-900 truncate">
                    #{activeTempIndex + 1} {activeTempPoint.areaName}
                  </span>
                  <span
                    className={cn(
                      "rounded-lg px-2 py-0.5 font-black border shrink-0",
                      (activeTempPoint.temperature as number) < tempBounds.lower ||
                        (activeTempPoint.temperature as number) > tempBounds.upper
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-white text-teal-800 border-teal-200"
                    )}
                  >
                    {activeTempPoint.temperature}°C
                  </span>
                  {activeTempPoint.time ? (
                    <span className="text-xs font-semibold text-slate-500 shrink-0">
                      ({activeTempPoint.time})
                    </span>
                  ) : null}
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    (Mục tiêu CL: {tempCL}°C · Dải {tempBounds.lower}–{tempBounds.upper}°C)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllTempBadges((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline shrink-0"
                >
                  <span>{showAllTempBadges ? "Thu gọn" : `Xem cả ${usableTemp.length} điểm`}</span>
                  {showAllTempBadges ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
              </div>
            ) : null}

            {showAllTempBadges ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {usableTemp.map((point, index) => (
                  <button
                    key={`${point.areaName}-${index}`}
                    type="button"
                    onClick={() => setSelectedTempIdx(index)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition",
                      index === activeTempIndex
                        ? "border-teal-600 bg-teal-50 text-teal-900 font-black"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <i className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {point.areaName}: {point.temperature}°C
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* KHỐI 2: BIỂU ĐỒ ĐỘ ẨM (%) NẰM NGAY BÊN DƯỚI (KHÔNG CẦN CHUYỂN TAB) */}
      {/* ======================================================== */}
      <section className="rounded-3xl border border-sky-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                <Droplets className="size-4" />
              </span>
              <h2 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
                Biểu đồ xu hướng Độ ẩm phòng xét nghiệm (%)
              </h2>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Đồ thị QC Levey-Jennings: Điểm đo (<span className="text-sky-700 font-bold">●</span>) + Đường nối xu hướng + Giới hạn UCL 80% / CL 50% / LCL 20%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {availableHumDevices.length > 1 ? (
              <select
                value={selectedHumDevice}
                onChange={(e) => {
                  setSelectedHumDevice(e.target.value);
                  setSelectedHumIdx(0);
                }}
                className="h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 outline-none hover:border-sky-500"
                title="Lọc riêng phòng để xem xu hướng độ ẩm"
              >
                <option value="ALL">Tất cả {availableHumDevices.length} phòng đo</option>
                {availableHumDevices.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
            ) : null}

            {humAvg !== null ? (
              <span className="rounded-xl bg-sky-50 border border-sky-200 px-2.5 py-1 text-sky-800">
                Độ ẩm TB: {humAvg}%
              </span>
            ) : null}
            <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800">
              {humInRange}/{usableHum.length} đạt chuẩn
            </span>
          </div>
        </div>

        {usableHum.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-slate-500">
            <p className="font-bold text-slate-700">Chưa có dữ liệu độ ẩm trong phạm vi lọc</p>
            <p className="text-xs">Độ ẩm được áp dụng cho 5 khu vực phòng xét nghiệm (BM.01/QL.HTAT.01).</p>
          </div>
        ) : (
          <div className="pt-3">
            {/* Chú giải QC Độ ẩm */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-rose-600" />
                  <span className="text-rose-700 font-bold">UCL: 80%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-sky-600" />
                  <span className="text-sky-700 font-bold">CL (Mean): 50%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-blue-600" />
                  <span className="text-blue-700 font-bold">LCL: 20%</span>
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {usableHum.length} điểm đo độ ẩm
              </span>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-sky-50/30 p-1.5">
              <svg
                viewBox="0 0 500 195"
                className="h-44 w-full sm:h-52"
                role="img"
                aria-label="Biểu đồ độ ẩm QC Levey-Jennings"
              >
                {/* Dải kiểm soát độ ẩm đạt chuẩn */}
                <rect
                  x="40"
                  y={yHum(humBounds.upper)}
                  width="420"
                  height={Math.max(0, yHum(humBounds.lower) - yHum(humBounds.upper))}
                  fill="#e0f2fe"
                  opacity="0.6"
                  rx="4"
                />

                {/* Đường UCL */}
                <line
                  x1="40"
                  x2="465"
                  y1={yHum(humBounds.upper)}
                  y2={yHum(humBounds.upper)}
                  stroke="#dc2626"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <text x="468" y={yHum(humBounds.upper) + 3} fontSize="8.5" fontWeight="800" fill="#dc2626">
                  80%
                </text>

                {/* Đường CL */}
                <line
                  x1="40"
                  x2="465"
                  y1={yHum(humCL)}
                  y2={yHum(humCL)}
                  stroke="#0284c7"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.8"
                />
                <text x="468" y={yHum(humCL) + 3} fontSize="8" fontWeight="700" fill="#0284c7">
                  CL 50%
                </text>

                {/* Đường LCL */}
                <line
                  x1="40"
                  x2="465"
                  y1={yHum(humBounds.lower)}
                  y2={yHum(humBounds.lower)}
                  stroke="#0284c7"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <text x="468" y={yHum(humBounds.lower) + 3} fontSize="8.5" fontWeight="800" fill="#0284c7">
                  20%
                </text>

                {/* Đường nối xu hướng độ ẩm */}
                <polyline
                  points={usableHum.map((point, index) => `${xHum(index)},${yHum(point.humidity as number)}`).join(" ")}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Các điểm đo độ ẩm QC Circles & Nhãn giá trị */}
                {usableHum.map((point, index) => {
                  const val = point.humidity as number;
                  const isOut = val < humBounds.lower || val > humBounds.upper;
                  const isSelected = index === activeHumIndex;
                  const showTick =
                    usableHum.length <= 8 ||
                    index === 0 ||
                    index === usableHum.length - 1 ||
                    index === activeHumIndex ||
                    index % Math.ceil(usableHum.length / 5) === 0;

                  const px = xHum(index);
                  const py = yHum(val);

                  return (
                    <g
                      key={`hum-${point.areaName}-${point.time}-${index}`}
                      onClick={() => setSelectedHumIdx(index)}
                      className="cursor-pointer group"
                    >
                      {isSelected ? (
                        <line
                          x1={px}
                          x2={px}
                          y1="16"
                          y2="170"
                          stroke="#0284c7"
                          strokeDasharray="2 2"
                          strokeWidth="1.2"
                          opacity="0.7"
                        />
                      ) : null}

                      <circle
                        cx={px}
                        cy={py}
                        r={isSelected ? "6.5" : "4.5"}
                        fill={isOut ? "#e11d48" : "#0284c7"}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? "2" : "1.5"}
                        className="transition-all"
                      >
                        <title>{`${point.areaName} · ${point.time}: ${val}%`}</title>
                      </circle>

                      {isOut ? (
                        <circle
                          cx={px}
                          cy={py}
                          r="8"
                          fill="none"
                          stroke="#e11d48"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                      ) : null}

                      {(showValueLabels && (usableHum.length <= 15 || isSelected)) ? (
                        <text
                          x={px}
                          y={py - (isSelected ? 9 : 7)}
                          textAnchor="middle"
                          fontSize={isSelected ? "9" : "8"}
                          fontWeight={isSelected ? "900" : "700"}
                          fill={isOut ? "#e11d48" : isSelected ? "#0369a1" : "#334155"}
                        >
                          {val}%
                        </text>
                      ) : null}

                      {showTick ? (
                        <text
                          x={px}
                          y="185"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight={isSelected ? "800" : "600"}
                          fill={isSelected ? "#0369a1" : "#64748b"}
                        >
                          {point.time}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>

            {activeHumPoint ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-3 shrink-0 rounded-full bg-sky-600" />
                  <span className="font-black text-slate-900 truncate">
                    #{activeHumIndex + 1} {activeHumPoint.areaName}
                  </span>
                  <span className="rounded-lg bg-white px-2 py-0.5 font-black text-sky-800 border border-sky-200 shrink-0">
                    {activeHumPoint.humidity}%
                  </span>
                  {activeHumPoint.time ? (
                    <span className="text-xs font-semibold text-slate-500 shrink-0">
                      ({activeHumPoint.time})
                    </span>
                  ) : null}
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    (Mục tiêu CL: 50% · Dải chuẩn BM.01: 20% – 80%)
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Chạm điểm trên đồ thị để soi chi tiết
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

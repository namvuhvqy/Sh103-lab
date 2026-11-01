"use client";

import { useMemo, useState } from "react";
import { LineChart, Droplets, Thermometer, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
  title = "Biểu đồ xu hướng Nhiệt độ & Độ ẩm thực tế",
  className,
  points = [],
}: QCTrendChartProps) {
  const [category, setCategory] = useState<"ALL" | "ROOM" | "COOLER" | "FREEZER">("ROOM");
  const [selectedTempIdx, setSelectedTempIdx] = useState<number>(0);
  const [selectedHumIdx, setSelectedHumIdx] = useState<number>(0);
  const [showAllTempBadges, setShowAllTempBadges] = useState(false);

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

  // 1. Dữ liệu Biểu đồ Nhiệt độ (°C)
  const tempFiltered = useMemo(() => {
    if (category === "ALL") return points;
    const matched = points.filter((p) => (p.category ?? "ROOM") === category);
    return matched.length > 0 ? matched : points;
  }, [category, points]);

  const usableTemp = useMemo(
    () => tempFiltered.filter((point) => point.temperature !== null && Number.isFinite(point.temperature)),
    [tempFiltered],
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

  const tempMin = tempValues.length ? Math.min(tempBounds.min, ...tempValues) : tempBounds.min;
  const tempMax = tempValues.length ? Math.max(tempBounds.max, ...tempValues) : tempBounds.max;
  const xTemp = (index: number) => 36 + (index / Math.max(usableTemp.length - 1, 1)) * 424;
  const yTemp = (value: number) => 165 - ((value - tempMin) / Math.max(tempMax - tempMin, 1)) * 135;

  const activeTempIndex = Math.min(selectedTempIdx, Math.max(usableTemp.length - 1, 0));
  const activeTempPoint = usableTemp[activeTempIndex] ?? null;

  // 2. Dữ liệu Biểu đồ Độ ẩm (%) - Hiển thị trực tiếp ngay dưới biểu đồ nhiệt độ, không cần chuyển tab
  const usableHum = useMemo(
    () => points.filter((point) => point.humidity !== null && Number.isFinite(point.humidity)),
    [points],
  );
  const humValues = usableHum.map((point) => point.humidity as number);
  const humBounds = { min: 15, max: 90, lower: 20, upper: 80, unit: "%" };
  const humMin = humValues.length ? Math.min(humBounds.min, ...humValues) : humBounds.min;
  const humMax = humValues.length ? Math.max(humBounds.max, ...humValues) : humBounds.max;
  const xHum = (index: number) => 36 + (index / Math.max(usableHum.length - 1, 1)) * 424;
  const yHum = (value: number) => 165 - ((value - humMin) / Math.max(humMax - humMin, 1)) * 135;
  const humAvg = humValues.length
    ? (humValues.reduce((sum, v) => sum + v, 0) / humValues.length).toFixed(1)
    : null;
  const humInRange = humValues.filter((v) => v >= humBounds.lower && v <= humBounds.upper).length;

  const activeHumIndex = Math.min(selectedHumIdx, Math.max(usableHum.length - 1, 0));
  const activeHumPoint = usableHum[activeHumIndex] ?? null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* KHỐI 1: BIỂU ĐỒ NHIỆT ĐỘ (°C) */}
      <section className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Thermometer className="size-4" />
              </span>
              <h2 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">{title} · Nhiệt độ (°C)</h2>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Chỉ hiển thị bản ghi đã đồng bộ từ Supabase; UCL/LCL là dải tham chiếu chuẩn ISO 15189.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
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
                    setSelectedTempIdx(0);
                  }}
                  className={cn(
                    "min-h-8 shrink-0 rounded-xl px-2.5 transition-all",
                    category === val ? "bg-teal-700 text-white font-black shadow-2xs" : "text-slate-600"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
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
            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5">
              <svg
                viewBox="0 0 500 190"
                className="h-44 w-full sm:h-52"
                role="img"
                aria-label="Biểu đồ nhiệt độ từ dữ liệu thực"
              >
                <rect
                  x="36"
                  y={yTemp(tempBounds.upper)}
                  width="424"
                  height={Math.max(0, yTemp(tempBounds.lower) - yTemp(tempBounds.upper))}
                  fill="#ccfbf1"
                  opacity="0.6"
                  rx="4"
                />
                {[tempBounds.lower, tempBounds.upper].map((limit, index) => (
                  <g key={limit}>
                    <line
                      x1="36"
                      x2="460"
                      y1={yTemp(limit)}
                      y2={yTemp(limit)}
                      stroke={index ? "#dc2626" : "#2563eb"}
                      strokeDasharray="4 3"
                      strokeWidth="1.2"
                    />
                    <text x="464" y={yTemp(limit) + 3} fontSize="9" fontWeight="700" fill={index ? "#dc2626" : "#2563eb"}>
                      {limit}°C
                    </text>
                  </g>
                ))}
                <polyline
                  points={usableTemp.map((point, index) => `${xTemp(index)},${yTemp(point.temperature as number)}`).join(" ")}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
                  return (
                    <g
                      key={`${point.areaName}-${point.time}-${index}`}
                      onClick={() => setSelectedTempIdx(index)}
                      className="cursor-pointer"
                    >
                      {isSelected ? (
                        <line
                          x1={xTemp(index)}
                          x2={xTemp(index)}
                          y1="18"
                          y2="168"
                          stroke="#0f766e"
                          strokeDasharray="2 2"
                          strokeWidth="1"
                          opacity="0.5"
                        />
                      ) : null}
                      <circle
                        cx={xTemp(index)}
                        cy={yTemp(val)}
                        r={isSelected ? "6" : "4"}
                        fill={isOut ? "#e11d48" : COLORS[index % COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      >
                        <title>{`${point.areaName} · ${point.time}: ${val}°C`}</title>
                      </circle>
                      {showTick ? (
                        <text
                          x={xTemp(index)}
                          y="183"
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

            {activeTempPoint ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[activeTempIndex % COLORS.length] }}
                  />
                  <span className="font-black text-slate-900 truncate">
                    #{activeTempIndex + 1} {activeTempPoint.areaName}
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 font-black text-teal-800 border border-teal-200 shrink-0">
                    {activeTempPoint.temperature}°C
                  </span>
                  {activeTempPoint.time ? (
                    <span className="text-xs font-semibold text-slate-500 shrink-0">
                      ({activeTempPoint.time})
                    </span>
                  ) : null}
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

      {/* KHỐI 2: BIỂU ĐỒ ĐỘ ẨM (%) NẰM NGAY BÊN DƯỚI BIỂU ĐỒ NHIỆT ĐỘ (KHÔNG CẦN CHUYỂN TAB) */}
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
              Hiển thị trực tiếp ngay dưới biểu đồ nhiệt độ · Dải chuẩn BM.01: 20% – 80% (Khuyến nghị 40% – 70%).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
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
            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-sky-50/30 p-1.5">
              <svg
                viewBox="0 0 500 190"
                className="h-40 w-full sm:h-48"
                role="img"
                aria-label="Biểu đồ độ ẩm từ dữ liệu thực"
              >
                <rect
                  x="36"
                  y={yHum(humBounds.upper)}
                  width="424"
                  height={Math.max(0, yHum(humBounds.lower) - yHum(humBounds.upper))}
                  fill="#e0f2fe"
                  opacity="0.7"
                  rx="4"
                />
                {[humBounds.lower, humBounds.upper].map((limit, index) => (
                  <g key={limit}>
                    <line
                      x1="36"
                      x2="460"
                      y1={yHum(limit)}
                      y2={yHum(limit)}
                      stroke={index ? "#dc2626" : "#0284c7"}
                      strokeDasharray="4 3"
                      strokeWidth="1.2"
                    />
                    <text x="464" y={yHum(limit) + 3} fontSize="9" fontWeight="700" fill={index ? "#dc2626" : "#0284c7"}>
                      {limit}%
                    </text>
                  </g>
                ))}
                <polyline
                  points={usableHum.map((point, index) => `${xHum(index)},${yHum(point.humidity as number)}`).join(" ")}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
                  return (
                    <g
                      key={`hum-${point.areaName}-${point.time}-${index}`}
                      onClick={() => setSelectedHumIdx(index)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={xHum(index)}
                        cy={yHum(val)}
                        r={isSelected ? "6" : "4"}
                        fill={isOut ? "#e11d48" : "#0284c7"}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      >
                        <title>{`${point.areaName} · ${point.time}: ${val}%`}</title>
                      </circle>
                      {showTick ? (
                        <text
                          x={xHum(index)}
                          y="183"
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
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2.5 shrink-0 rounded-full bg-sky-600" />
                  <span className="font-black text-slate-900 truncate">
                    #{activeHumIndex + 1} {activeHumPoint.areaName}
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 font-black text-sky-800 border border-sky-200 shrink-0">
                    {activeHumPoint.humidity}%
                  </span>
                  {activeHumPoint.time ? (
                    <span className="text-xs font-semibold text-slate-500 shrink-0">
                      ({activeHumPoint.time})
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Chạm điểm trên đồ thị để xem chi tiết
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

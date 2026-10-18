"use client";

import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QCTrendPoint {
  areaName: string;
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

export function QCTrendChart({
  title = "Biểu đồ xu hướng số đo thực tế",
  className,
  points = [],
}: QCTrendChartProps) {
  const [metric, setMetric] = useState<"temperature" | "humidity">("temperature");
  const [category, setCategory] = useState<"ALL" | "ROOM" | "COOLER" | "FREEZER">("ALL");

  const categoryFiltered = useMemo(() => {
    if (category === "ALL") return points;
    return points.filter((p) => (p.category ?? "ROOM") === category);
  }, [category, points]);

  const usable = useMemo(
    () => categoryFiltered.filter((point) => point[metric] !== null && Number.isFinite(point[metric])),
    [categoryFiltered, metric],
  );
  const values = usable.map((point) => point[metric] as number);

  const bounds = useMemo(() => {
    if (metric === "humidity") {
      return { min: 20, max: 90, lower: 20, upper: 80, unit: "%" };
    }
    if (category === "COOLER") {
      return { min: 0, max: 12, lower: 2, upper: 8, unit: "°C" };
    }
    if (category === "FREEZER") {
      return { min: -35, max: -5, lower: -30, upper: -10, unit: "°C" };
    }
    if (category === "ROOM") {
      return { min: 15, max: 32, lower: 21, upper: 26, unit: "°C" };
    }
    const valMin = values.length ? Math.min(...values) : 2;
    const valMax = values.length ? Math.max(...values) : 26;
    return { min: Math.min(-10, valMin - 2), max: Math.max(30, valMax + 2), lower: 21, upper: 26, unit: "°C" };
  }, [category, metric, values]);

  const min = values.length ? Math.min(bounds.min, ...values) : bounds.min;
  const max = values.length ? Math.max(bounds.max, ...values) : bounds.max;
  const x = (index: number) => 48 + (index / Math.max(usable.length - 1, 1)) * 422;
  const y = (value: number) => 190 - ((value - min) / Math.max(max - min, 1)) * 160;

  return (
    <section className={cn("rounded-3xl border border-cyan-100 bg-white p-4 shadow-xs sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">{title}</h2>
          <p className="text-xs font-medium text-slate-500">Chỉ hiển thị bản ghi đã đồng bộ từ Supabase; UCL/LCL là dải tham chiếu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {metric === "temperature" ? (
            <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1 text-[11px] font-bold">
              {(
                [
                  ["ALL", "Tất cả"],
                  ["ROOM", "Phòng (21-26°C)"],
                  ["COOLER", "Tủ mát (2-8°C)"],
                  ["FREEZER", "Tủ đông"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCategory(val)}
                  className={cn("min-h-8 rounded-xl px-2.5", category === val ? "bg-teal-700 text-white font-black" : "text-slate-600")}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {(["temperature", "humidity"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setMetric(value)} className={cn("min-h-8 rounded-xl px-3 text-xs font-black", metric === value ? "bg-teal-700 text-white" : "text-slate-600")}>
                {value === "temperature" ? "Nhiệt độ" : "Độ ẩm"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {usable.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-slate-500">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100"><LineChart className="size-6" /></span>
          <div><p className="font-bold text-slate-700">Chưa có dữ liệu lịch sử</p><p className="text-xs">Biểu đồ sẽ xuất hiện sau khi số đo được lưu chính thức.</p></div>
        </div>
      ) : (
        <div className="overflow-x-auto pt-4">
          <svg viewBox="0 0 500 235" className="min-w-[500px]" role="img" aria-label={`Biểu đồ ${metric === "temperature" ? "nhiệt độ" : "độ ẩm"} từ dữ liệu thực`}>
            <rect x="48" y={y(bounds.upper)} width="422" height={Math.max(0, y(bounds.lower) - y(bounds.upper))} fill="#ccfbf1" opacity="0.55" />
            {[bounds.lower, bounds.upper].map((limit, index) => <g key={limit}><line x1="48" x2="470" y1={y(limit)} y2={y(limit)} stroke={index ? "#dc2626" : "#2563eb"} strokeDasharray="5 4" /><text x="474" y={y(limit) + 4} fontSize="9" fill="#475569">{index ? "UCL" : "LCL"}</text></g>)}
            <polyline points={usable.map((point, index) => `${x(index)},${y(point[metric] as number)}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="2.5" />
            {usable.map((point, index) => (
              <g key={`${point.areaName}-${point.time}-${index}`}>
                <circle cx={x(index)} cy={y(point[metric] as number)} r="5" fill={COLORS[index % COLORS.length]}><title>{`${point.areaName} · ${point.time}: ${point[metric]}${bounds.unit}`}</title></circle>
                <text x={x(index)} y="215" textAnchor="middle" fontSize="9" fill="#64748b">{point.time}</text>
              </g>
            ))}
          </svg>
          <div className="mt-2 flex flex-wrap gap-2">{usable.map((point, index) => <span key={`${point.areaName}-${index}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600"><i className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{point.areaName}: {point[metric]}{bounds.unit}</span>)}</div>
        </div>
      )}
    </section>
  );
}

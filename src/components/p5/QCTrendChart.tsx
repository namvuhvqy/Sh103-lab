"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface AreaDataSeries {
  areaName: string;
  color: string;
  dotColor: string;
  data: number[]; // Giá trị tại các mốc thời gian [00:00, 04:00, 08:00, 12:00, 16:00, 20:00]
}

interface QCTrendChartProps {
  title?: string;
  type?: "environment" | "storage";
  className?: string;
}

const TIME_POINTS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

export function QCTrendChart({
  title = "Biểu đồ xu hướng 24 giờ gần nhất",
  type = "environment",
  className,
}: QCTrendChartProps) {
  const [metric, setMetric] = useState<"temperature" | "humidity">("temperature");
  const [activePointIndex, setActivePointIndex] = useState<number>(2); // Mặc định điểm 08:00 như ảnh

  // Dữ liệu 5 khu vực cho Nhiệt độ
  const tempSeries: AreaDataSeries[] = [
    {
      areaName: "Sinh hóa",
      color: "#059669", // emerald
      dotColor: "#10b981",
      data: [23.1, 23.6, 22.1, 22.8, 23.2, 23.9],
    },
    {
      areaName: "Miễn dịch",
      color: "#9333ea", // purple
      dotColor: "#a855f7",
      data: [21.4, 22.0, 20.5, 21.6, 21.9, 22.4],
    },
    {
      areaName: "Nước tiểu",
      color: "#2563eb", // blue
      dotColor: "#3b82f6",
      data: [22.0, 22.5, 21.8, 22.2, 22.4, 22.9],
    },
    {
      areaName: "Ly tâm",
      color: "#ea580c", // orange
      dotColor: "#f97316",
      data: [19.2, 20.1, 20.1, 20.5, 20.3, 20.8],
    },
    {
      areaName: "Nhận bệnh phẩm",
      color: "#e11d48", // rose
      dotColor: "#f43f5e",
      data: [16.0, 17.2, 18.9, 17.5, 16.8, 17.1],
    },
  ];

  // Dữ liệu 5 khu vực cho Độ ẩm
  const humSeries: AreaDataSeries[] = [
    {
      areaName: "Sinh hóa",
      color: "#059669",
      dotColor: "#10b981",
      data: [56, 58, 58, 60, 62, 59],
    },
    {
      areaName: "Miễn dịch",
      color: "#9333ea",
      dotColor: "#a855f7",
      data: [52, 54, 55, 56, 55, 53],
    },
    {
      areaName: "Nước tiểu",
      color: "#2563eb",
      dotColor: "#3b82f6",
      data: [54, 55, 56, 57, 58, 55],
    },
    {
      areaName: "Ly tâm",
      color: "#ea580c",
      dotColor: "#f97316",
      data: [50, 52, 53, 54, 53, 51],
    },
    {
      areaName: "Nhận bệnh phẩm",
      color: "#e11d48",
      dotColor: "#f43f5e",
      data: [60, 62, 65, 63, 61, 62],
    },
  ];

  const series = metric === "temperature" ? tempSeries : humSeries;
  const unit = metric === "temperature" ? "°C" : "%";

  // Thang đo trục Y
  const yTicks = metric === "temperature" ? [10, 15, 20, 25, 30] : [30, 40, 50, 60, 70];
  const minY = yTicks[0];
  const maxY = yTicks[yTicks.length - 1];

  // Tọa độ tính toán SVG
  // Khung SVG: viewBox="0 0 500 240", vùng đồ thị: x: 45 -> 475, y: 20 -> 200
  const graphWidth = 430;
  const graphHeight = 170;
  const originX = 45;
  const originY = 20;

  const getX = (index: number) => originX + (index / (TIME_POINTS.length - 1)) * graphWidth;
  const getY = (val: number) => originY + graphHeight - ((val - minY) / (maxY - minY)) * graphHeight;

  // Ngưỡng chuẩn ISO 15189
  const upperLimit = metric === "temperature" ? 26 : 70;
  const lowerLimit = metric === "temperature" ? 21 : 30;
  const targetVal = metric === "temperature" ? 23.5 : 50;

  const uclY = getY(upperLimit);
  const lclY = getY(lowerLimit);
  const targetY = getY(targetVal);

  return (
    <section className={cn("rounded-3xl border border-cyan-100 bg-white p-4 sm:p-6 shadow-xs", className)}>
      {/* Header Biểu Đồ & Chuyển đổi Nhiệt độ / Độ ẩm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Biểu đồ kiểm soát chất lượng QC theo dõi biến thiên 5 khu vực phòng xét nghiệm
          </p>
        </div>

        {/* Tab chuyển đổi Metric (Nhiệt độ / Độ ẩm) chuẩn Mockup */}
        <div className="flex items-center gap-1 self-start sm:self-auto rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setMetric("temperature")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all",
              metric === "temperature"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Nhiệt độ (°C)
          </button>
          <button
            type="button"
            onClick={() => setMetric("humidity")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all",
              metric === "humidity"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Độ ẩm (%)
          </button>
        </div>
      </div>

      {/* Vùng Vẽ Biểu Đồ SVG Responsive */}
      <div className="relative mt-4 overflow-x-auto">
        <div className="min-w-[500px] relative">
          <svg viewBox="0 0 520 240" className="w-full h-56 sm:h-64 overflow-visible" aria-label="Biểu đồ xu hướng QC">
            {/* Vùng dải chuẩn an toàn ISO (Shaded Range) */}
            <rect
              x={originX}
              y={uclY}
              width={graphWidth}
              height={Math.abs(lclY - uclY)}
              fill="#10b981"
              fillOpacity="0.04"
            />

            {/* Các đường gióng ngang và nhãn trục Y */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={originX}
                    y1={y}
                    x2={originX + graphWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={originX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-bold fill-slate-400"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Đường ngưỡng trên UCL (Upper Control Limit) */}
            <line
              x1={originX}
              y1={uclY}
              x2={originX + graphWidth}
              y2={uclY}
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text
              x={originX + graphWidth + 6}
              y={uclY + 3}
              className="text-[9px] font-black fill-red-500"
            >
              Max {upperLimit}{unit}
            </text>

            {/* Đường ngưỡng dưới LCL (Lower Control Limit) */}
            <line
              x1={originX}
              y1={lclY}
              x2={originX + graphWidth}
              y2={lclY}
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text
              x={originX + graphWidth + 6}
              y={lclY + 3}
              className="text-[9px] font-black fill-sky-600"
            >
              Min {lowerLimit}{unit}
            </text>

            {/* Đường gióng dọc tại mốc thời gian được chọn */}
            {activePointIndex !== null ? (
              <line
                x1={getX(activePointIndex)}
                y1={originY}
                x2={getX(activePointIndex)}
                y2={originY + graphHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            ) : null}

            {/* Vẽ 5 đường dữ liệu nối các điểm (Smooth Lines) */}
            {series.map((s) => {
              const points = s.data.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
              // Tạo path mềm mại
              const pathD = points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                .join(" ");

              return (
                <g key={s.areaName}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, idx) => {
                    const isSelected = idx === activePointIndex;
                    return (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? "5" : "3.5"}
                        fill="#ffffff"
                        stroke={s.color}
                        strokeWidth={isSelected ? "3" : "2"}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => setActivePointIndex(idx)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Trục X: Nhãn thời gian */}
            {TIME_POINTS.map((t, idx) => {
              const x = getX(idx);
              const isSelected = idx === activePointIndex;
              return (
                <g key={t} onClick={() => setActivePointIndex(idx)} className="cursor-pointer">
                  <text
                    x={x}
                    y={originY + graphHeight + 20}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] transition-colors",
                      isSelected ? "font-black fill-teal-800 font-sans" : "font-semibold fill-slate-500"
                    )}
                  >
                    {t}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip hiển thị số liệu chi tiết tại mốc được chọn (Khớp 100% Mockup tại 08:00) */}
          {activePointIndex !== null ? (
            <div
              className="absolute pointer-events-none rounded-2xl bg-white/95 p-3 shadow-xl border border-slate-200 backdrop-blur-md transition-all text-xs z-20 w-44"
              style={{
                left: `${(getX(activePointIndex) / 520) * 100}%`,
                top: "10px",
                transform: "translateX(-50%)",
              }}
            >
              <p className="font-black text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span>{TIME_POINTS[activePointIndex]}</span>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">
                  QC Point
                </span>
              </p>
              <div className="space-y-1">
                {series.map((s) => (
                  <div key={s.areaName} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 truncate">{s.areaName}</span>
                    </div>
                    <b className="text-slate-900 font-black ml-2">
                      {s.data[activePointIndex]}
                      {unit}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Chú giải Màu Sắc (Legend) phía dưới biểu đồ */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
        {series.map((s) => (
          <div key={s.areaName} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-700">{s.areaName}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

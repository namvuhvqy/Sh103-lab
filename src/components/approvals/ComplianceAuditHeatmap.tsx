"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Calendar } from "lucide-react";

export interface AuditAreaStatus {
  areaCode: string;
  areaName: string;
  forms: {
    formCode: string;
    formName: string;
    dayStatuses: {
      date: string;
      dayLabel: string;
      status: "FULL" | "PARTIAL" | "EMPTY";
      detail: string;
    }[];
  }[];
}

export function ComplianceAuditHeatmap() {
  const [selectedCell, setSelectedCell] = useState<{
    area: string;
    form: string;
    date: string;
    detail: string;
    status: string;
  } | null>(null);

  // Tạo dữ liệu 7 ngày gần nhất
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
    const weekday = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
    return { dateStr, dayLabel, weekday };
  });

  const AUDIT_DATA = [
    {
      areaCode: "NUOC_TIEU",
      areaName: "Khu vực Nước tiểu",
      formCode: "BM.01",
      formName: "Nhiệt độ - Độ ẩm",
      statuses: ["FULL", "FULL", "FULL", "FULL", "PARTIAL", "FULL", "FULL"],
    },
    {
      areaCode: "SINH_HOA",
      areaName: "Khu vực Sinh hóa",
      formCode: "BM.01",
      formName: "Nhiệt độ - Độ ẩm",
      statuses: ["FULL", "FULL", "FULL", "FULL", "FULL", "FULL", "FULL"],
    },
    {
      areaCode: "MIEN_DICH",
      areaName: "Khu vực Miễn dịch",
      formCode: "BM.01",
      formName: "Nhiệt độ - Độ ẩm",
      statuses: ["FULL", "FULL", "FULL", "PARTIAL", "FULL", "FULL", "PARTIAL"],
    },
    {
      areaCode: "AUTOMATION",
      areaName: "Hệ Automation",
      formCode: "BM.06",
      formName: "Nhật ký TTB 4 ca",
      statuses: ["FULL", "FULL", "FULL", "FULL", "FULL", "FULL", "FULL"],
    },
    {
      areaCode: "LOC_NUOC_RO",
      areaName: "Lọc nước RO",
      formCode: "BM.01",
      formName: "Nhiệt độ phòng RO",
      statuses: ["FULL", "FULL", "EMPTY", "FULL", "FULL", "FULL", "FULL"],
    },
    {
      areaCode: "TU_LANH",
      areaName: "Tủ lạnh mát & Tủ đá",
      formCode: "BM.02/03",
      formName: "Theo dõi nhiệt độ tủ",
      statuses: ["FULL", "FULL", "FULL", "FULL", "FULL", "FULL", "FULL"],
    },
    {
      areaCode: "KHU_NHIEM",
      areaName: "Toàn khoa",
      formCode: "BM.01_KNBM",
      formName: "Khử nhiễm bề mặt",
      statuses: ["FULL", "FULL", "FULL", "FULL", "PARTIAL", "FULL", "FULL"],
    },
  ];

  return (
    <section className="rounded-2xl border border-teal-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-teal-700" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Bảng kiểm soát vùng trống biểu mẫu (Audit Heatmap)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Tổng quan 7 ngày qua · Giúp Trưởng khoa nhận diện ngay ca/khu vực bị thiếu bản ghi trước khi phê duyệt
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Đầy đủ
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-amber-500" /> Còn trống ca
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-rose-500" /> Chưa ghi
          </span>
        </div>
      </div>

      {/* Ma trận Heatmap */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="border border-slate-200 p-2 text-left font-bold min-w-[140px]">
                Khu vực / Biểu mẫu
              </th>
              {dates.map((d) => (
                <th key={d.dateStr} className="border border-slate-200 p-2 text-center font-bold">
                  <span className="block text-[10px] text-slate-500">{d.weekday}</span>
                  <span>{d.dayLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition">
                <td className="border border-slate-200 p-2 font-semibold text-slate-800">
                  <span className="block text-slate-900 font-bold">{row.areaName}</span>
                  <span className="text-[10px] text-teal-700 font-extrabold">{row.formCode} · {row.formName}</span>
                </td>
                {row.statuses.map((status, i) => {
                  const d = dates[i];
                  const isFull = status === "FULL";
                  const isPartial = status === "PARTIAL";
                  const cellColor = isFull
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : isPartial
                    ? "bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold";

                  const detailText = isFull
                    ? "100% bản ghi đã ký đạt chuẩn"
                    : isPartial
                    ? "Còn 1 ca trực chưa hoàn tất nhập liệu"
                    : "Chưa phát sinh bản ghi ngày này";

                  return (
                    <td
                      key={i}
                      onClick={() =>
                        setSelectedCell({
                          area: row.areaName,
                          form: `${row.formCode} — ${row.formName}`,
                          date: `${d.weekday} (${d.dayLabel})`,
                          detail: detailText,
                          status,
                        })
                      }
                      className={`border border-slate-200 p-2 text-center cursor-pointer transition ${cellColor}`}
                      title={`${row.areaName} · ${d.dayLabel}: ${detailText}`}
                    >
                      {isFull ? (
                        <CheckCircle2 className="mx-auto size-4 text-emerald-600" />
                      ) : isPartial ? (
                        <AlertTriangle className="mx-auto size-4 text-amber-600 animate-pulse" />
                      ) : (
                        <XCircle className="mx-auto size-4 text-rose-600" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chi tiết ô được chọn */}
      {selectedCell ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-teal-700 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">
                {selectedCell.area} · {selectedCell.form} · Ngày {selectedCell.date}
              </p>
              <p className="text-slate-600 mt-0.5">Tình trạng: <b>{selectedCell.detail}</b></p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCell(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      ) : null}
    </section>
  );
}

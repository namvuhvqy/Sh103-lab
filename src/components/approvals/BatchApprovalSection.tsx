"use client";

import { useState } from "react";
import Link from "next/link";
import { ApprovalPeriod } from "@/lib/forms/workflow";
import { batchApprovePeriodsAction } from "@/app/periods/actions";
import { Check, CheckSquare, Square, CheckCircle2, Filter, AlertCircle } from "lucide-react";

export function BatchApprovalSection({
  periods,
  canApprove,
}: {
  periods: ApprovalPeriod[];
  canApprove: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const isPending = false;

  // Bộ lọc theo thời gian (Ngày, Tuần, Tháng)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredPeriods = periods.filter((p) => {
    if (timeFilter === "ALL") return true;
    if (timeFilter === "TODAY") {
      return p.period_start <= todayStr && p.period_end >= todayStr;
    }
    if (timeFilter === "WEEK") {
      // Trong vòng 7 ngày qua
      const pEnd = new Date(p.period_end);
      const diffDays = (now.getTime() - pEnd.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7 && diffDays >= -7;
    }
    if (timeFilter === "MONTH") {
      const pMonth = p.period_start.slice(0, 7);
      const curMonth = todayStr.slice(0, 7);
      return pMonth === curMonth;
    }
    return true;
  });

  const filteredActionable = filteredPeriods.filter((p) => p.status === "READY_FOR_REVIEW");

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredActionable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredActionable.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Bộ lọc theo Ngày / Tuần / Tháng */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
          <Filter className="size-3.5 text-teal-700" />
          <span>Lọc kỳ:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "TODAY", label: "📅 Hôm nay" },
            { id: "WEEK", label: "Tuần này" },
            { id: "MONTH", label: "Tháng này" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeFilter(tab.id as typeof timeFilter)}
              className={`min-h-9 px-3 rounded-xl text-xs font-bold transition ${
                timeFilter === tab.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thanh công cụ phê duyệt hàng loạt */}
      {canApprove && filteredActionable.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white border border-teal-300 px-3.5 text-xs font-bold text-teal-900 hover:bg-teal-50 transition"
          >
            {selectedIds.length === filteredActionable.length && filteredActionable.length > 0 ? (
              <CheckSquare className="size-4 text-teal-700" />
            ) : (
              <Square className="size-4 text-slate-400" />
            )}
            <span>
              {selectedIds.length === filteredActionable.length && filteredActionable.length > 0
                ? "Bỏ chọn tất cả"
                : `Chọn tất cả (${filteredActionable.length})`}
            </span>
          </button>

          <form action={batchApprovePeriodsAction} className="inline-flex items-center gap-2">
            <input type="hidden" name="periodIds" value={selectedIds.join(",")} />
            <button
              type="submit"
              disabled={selectedIds.length === 0 || isPending}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 px-4 text-xs font-bold text-white transition shadow-xs"
            >
              <CheckCircle2 className="size-4" />
              <span>
                {selectedIds.length > 0
                  ? `Phê duyệt ${selectedIds.length} kỳ đã chọn`
                  : "Chọn kỳ để duyệt hàng loạt"}
              </span>
            </button>
          </form>
        </div>
      ) : null}

      {/* Danh sách các kỳ hiển thị */}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filteredPeriods.map((period) => {
          const template = period.form_template_versions.form_templates;
          const isActionable = period.status === "READY_FOR_REVIEW";
          const isSelected = selectedIds.includes(period.id);

          return (
            <article
              key={period.id}
              className={`p-4 transition ${
                isSelected ? "bg-teal-50/40" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {canApprove && isActionable ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(period.id)}
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-teal-400 bg-white text-teal-800 hover:bg-teal-50 transition"
                      aria-label={`Chọn kỳ ${template.name}`}
                    >
                      {isSelected ? <Check className="size-4 stroke-[3]" /> : null}
                    </button>
                  ) : null}

                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-teal-700">
                      {template.code} · {period.status}
                    </p>
                    <h3 className="mt-0.5 text-sm font-black text-slate-950">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} ·{" "}
                      {period.period_label ?? `${period.period_start} – ${period.period_end}`}
                    </p>
                    {period.returned_reason ? (
                      <p className="mt-2 rounded-xl bg-red-50 p-2 text-xs font-semibold text-red-800">
                        Lý do trả lại: {period.returned_reason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                      period.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : period.status === "RETURNED"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {period.status === "APPROVED"
                      ? "Đã phê duyệt"
                      : period.status === "RETURNED"
                      ? "Bị trả lại"
                      : "Chờ duyệt"}
                  </span>

                  <Link
                    href={
                      period.status === "READY_FOR_REVIEW"
                        ? `/periods/${period.id}/review`
                        : `/periods/${period.id}`
                    }
                    className="inline-flex min-h-9 items-center rounded-xl bg-slate-100 hover:bg-slate-200 px-3 text-xs font-bold text-slate-800 transition"
                  >
                    {period.status === "READY_FOR_REVIEW" ? "Rà soát & Duyệt lẻ" : "Xem chi tiết"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {filteredPeriods.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <AlertCircle className="mx-auto size-6 text-slate-400 mb-2" />
            <p>Không có kỳ nào phù hợp với bộ lọc thời gian này.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, CircleAlert, LucideIcon } from "lucide-react";

export interface OccurrenceItem {
  id: string;
  formCode: string;
  locationCode?: string;
  locationName?: string;
  assetName?: string;
  status: string;
  fulfilledByRecordId?: string | null;
}

interface Props {
  code: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  occurrences: OccurrenceItem[];
}

export function WorkSessionSectionCard({
  code,
  title,
  description,
  href,
  icon: Icon,
  occurrences,
}: Props) {
  const total = occurrences.length;
  const fulfilledCount = occurrences.filter(
    (o) => o.status === "COMPLETED" || o.status === "FULFILLED" || !!o.fulfilledByRecordId
  ).length;
  const isComplete = total > 0 && fulfilledCount === total;
  const isDraft = total > 0 && fulfilledCount > 0 && fulfilledCount < total;

  const cardBorder = isComplete
    ? "border-emerald-200 bg-white hover:border-emerald-400"
    : isDraft
    ? "border-amber-200 bg-white hover:border-amber-400"
    : "border-slate-200 bg-white hover:border-teal-300";

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-3xl border p-4 sm:p-5 shadow-xs transition hover:bg-teal-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 min-h-36 ${cardBorder}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ring-1 transition ${
            isComplete
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : isDraft
              ? "bg-amber-50 text-amber-800 ring-amber-200"
              : "bg-teal-50 text-teal-800 ring-teal-200"
          }`}
        >
          <Icon className="size-5.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              {code}
            </span>
            {total > 0 ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  isComplete
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : isDraft
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-3" />
                ) : isDraft ? (
                  <Clock className="size-3" />
                ) : (
                  <CircleAlert className="size-3" />
                )}
                {isComplete
                  ? `Đã hoàn tất (${fulfilledCount}/${total})`
                  : isDraft
                  ? `Đang nháp (${fulfilledCount}/${total})`
                  : `Chưa ghi (0/${total})`}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Không có trong ca này</span>
            )}
          </div>
          <span className="mt-1.5 block text-base font-black text-slate-900 leading-snug">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500 font-medium">{description}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-teal-800 group-hover:text-teal-950">
        <span className="text-slate-500 font-semibold">
          {isComplete ? "Xem lại dữ liệu đã lưu" : "Thực hiện biểu mẫu"}
        </span>
        <span className="flex items-center gap-1">
          <span>Mở mục</span>
          <ArrowRight className="size-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, LucideIcon } from "lucide-react";

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
  const fulfilledCount = occurrences.filter((o) => o.status === "FULFILLED" || !!o.fulfilledByRecordId).length;
  const isComplete = total > 0 && fulfilledCount === total;

  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-300 hover:bg-teal-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 min-h-32"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-200">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">{code}</span>
            {total > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isComplete
                    ? "bg-emerald-50 text-emerald-700"
                    : fulfilledCount > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <Clock className="size-3" />
                )}
                {fulfilledCount}/{total} hoàn thành
              </span>
            )}
          </div>
          <span className="mt-0.5 block font-bold text-slate-950">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-2 text-xs font-semibold text-teal-700 group-hover:text-teal-800">
        <span>Thực hiện biểu mẫu</span>
        <ArrowRight className="ml-1 size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}

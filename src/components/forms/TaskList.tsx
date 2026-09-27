import Link from "next/link";
import { occurrenceState } from "@/lib/forms/presenters";
import { markOccurrenceNaAction } from "@/app/tasks/actions";
import { ArrowRight, CheckCircle2, Clock, Ban, AlertCircle } from "lucide-react";

const labels = {
  PENDING: "Cần làm",
  COMPLETED: "Đã hoàn thành",
  N_A: "Không áp dụng",
  OVERDUE: "Còn thiếu / Nhập bù",
} as const;

export interface TaskView {
  id: string;
  slot_code: string | null;
  status: string;
  window_end: string;
  register_periods: {
    locations: { code: string; name: string } | null;
    assets: { source_name: string; locations: { code: string; name: string } | null } | null;
    form_template_versions: { form_templates: { code: string; name: string } };
  };
}

function resolveTaskActionHref(formCode: string, slotCode: string | null, locationCode?: string): { href: string; label: string } {
  if (formCode.includes("BM.01/QL.HTAT.01")) {
    return { href: `/temperature?shift=${slotCode ?? "MORNING"}&area=${locationCode ?? ""}`, label: "Mở theo dõi nhiệt ẩm" };
  }
  if (formCode.includes("BM.02/QL.HTAT.01")) {
    return { href: `/temperature?tab=cool&shift=${slotCode ?? "MORNING"}`, label: "Mở theo dõi tủ mát" };
  }
  if (formCode.includes("BM.03/QL.HTAT.01")) {
    return { href: `/temperature?tab=freezer&shift=${slotCode ?? "MORNING"}`, label: "Mở theo dõi tủ đông" };
  }
  if (formCode.includes("BM.06")) {
    return { href: `/bm06?shift=${slotCode ?? "SHIFT_1"}`, label: "Mở nhật ký thiết bị" };
  }
  if (formCode.includes("BM.01_KNBM")) {
    return { href: `/decontamination?area=${locationCode ?? ""}`, label: "Mở khử nhiễm bề mặt" };
  }
  if (formCode.includes("BM.02/QL.TRTB.01")) {
    return { href: `/quick-duty`, label: "Vào phiên làm việc" };
  }
  return { href: `/quick-duty`, label: "Vào phiên làm việc" };
}

export function TaskList({ tasks, area }: { tasks: TaskView[]; area?: string }) {
  const filtered = tasks.filter((task) => {
    if (!area || area === "ALL") return true;
    const period = task.register_periods;
    return (period.locations?.code ?? period.assets?.locations?.code ?? "GENERAL") === area;
  });

  return (
    <div className="space-y-3">
      {filtered.map((task) => {
        const period = task.register_periods;
        const template = period.form_template_versions.form_templates;
        const state = occurrenceState({ status: task.status, windowEnd: task.window_end });
        const writable = state === "PENDING" || state === "OVERDUE";
        const locCode = period.locations?.code ?? period.assets?.locations?.code;
        const action = resolveTaskActionHref(template.code, task.slot_code, locCode);

        const statusBadge =
          state === "COMPLETED"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : state === "N_A"
            ? "bg-slate-100 text-slate-600 border-slate-200"
            : state === "OVERDUE"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

        const StatusIcon =
          state === "COMPLETED"
            ? CheckCircle2
            : state === "N_A"
            ? Ban
            : state === "OVERDUE"
            ? AlertCircle
            : Clock;

        return (
          <article
            key={task.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-200 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-black text-teal-800 border border-teal-200">
                    {template.code}
                  </span>
                  {task.slot_code && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {task.slot_code}
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 text-base font-black text-slate-900 leading-snug">
                  {template.name}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {period.locations?.name ?? period.assets?.source_name ?? "Chung toàn khoa"}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-bold ${statusBadge}`}
              >
                <StatusIcon className="size-3.5" />
                <span>{labels[state]}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {writable ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={action.href}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-800 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-teal-900 active:scale-95"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <Link
                    href={`/quick-duty?slot=${task.slot_code ?? "SHIFT_1"}`}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-teal-200 bg-white px-3.5 text-xs font-bold text-teal-800 hover:bg-teal-50 transition"
                  >
                    Vào phiên làm việc
                  </Link>

                  {template.code !== "BM.06/QL.TRTB.01" && (
                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                      <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-900 select-none">
                        Tùy chọn N/A
                      </summary>
                      <form action={markOccurrenceNaAction} className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="occurrenceId" value={task.id} />
                        <input type="hidden" name="area" value={area ?? "ALL"} />
                        <label className="flex-1 font-semibold text-slate-700">
                          Lý do không áp dụng
                          <input
                            required
                            name="reason"
                            placeholder="Nhập lý do N/A..."
                            className="mt-1 min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-teal-600"
                          />
                        </label>
                        <button
                          type="submit"
                          className="min-h-9 self-end rounded-lg border border-amber-500 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                        >
                          Xác nhận N/A
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Nghĩa vụ đã hoàn thành theo phiên làm việc.</span>
                  <Link href="/quick-duty" className="font-bold text-teal-800 hover:underline">
                    Xem lại phiên →
                  </Link>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="font-bold">Không có nghĩa vụ nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      )}
    </div>
  );
}

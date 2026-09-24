import Link from "next/link";
import { entryHref, occurrenceState } from "@/lib/forms/presenters";
import { markOccurrenceNaAction } from "@/app/tasks/actions";

const labels = { PENDING: "Cần làm", COMPLETED: "Đã hoàn thành", N_A: "Không áp dụng", OVERDUE: "Còn thiếu / Nhập bù" } as const;
export interface TaskView {
  id: string; slot_code: string | null; status: string; window_end: string;
  register_periods: {
    locations: { code: string; name: string } | null;
    assets: { source_name: string; locations: { code: string; name: string } | null } | null;
    form_template_versions: { form_templates: { code: string; name: string } };
  };
}
export function TaskList({ tasks, area }: { tasks: TaskView[]; area?: string }) {
  const filtered = tasks.filter((task) => {
    if (!area || area === "ALL") return true;
    const period = task.register_periods;
    return (period.locations?.code ?? period.assets?.locations?.code ?? "GENERAL") === area;
  });
  return <div className="space-y-3">{filtered.map((task) => {
    const period = task.register_periods;
    const template = period.form_template_versions.form_templates;
    const state = occurrenceState({ status: task.status, windowEnd: task.window_end });
    const writable = state === "PENDING" || state === "OVERDUE";
    return <article key={task.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue-800">{template.code} · {task.slot_code}</p><h2 className="font-bold text-slate-950">{template.name}</h2><p className="mt-1 text-sm text-slate-600">{period.locations?.name ?? period.assets?.source_name ?? "Chung toàn khoa"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{labels[state]}</span></div>{writable ? <div className="mt-4 flex flex-wrap gap-3"><Link href={entryHref(template.code, task.id, period.locations?.code ?? period.assets?.locations?.code)} className="inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-4 font-bold text-white">{state === "OVERDUE" ? "Nhập bù" : "Nhập ngay"}</Link>{template.code !== "BM.06/QL.TRTB.01" ? <details className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3"><summary className="cursor-pointer font-bold text-amber-950">Không áp dụng</summary><form action={markOccurrenceNaAction} className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="occurrenceId" value={task.id}/><label className="flex-1 font-semibold">Lý do<input required name="reason" className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/></label><button className="min-h-11 self-end rounded-xl border border-amber-500 px-4 font-bold">Xác nhận N/A</button></form></details> : null}</div> : null}</article>;
  })}{filtered.length === 0 ? <p className="rounded-2xl border border-dashed p-8 text-center text-slate-600">Không có công việc phù hợp.</p> : null}</div>;
}

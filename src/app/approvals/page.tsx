import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowFeedback } from "@/components/forms/WorkflowFeedback";
import { getPeriods } from "@/lib/forms/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, FileSpreadsheet, History } from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { error?: string; saved?: string; template?: string };

type PeriodMonitor = {
  id: string;
  period_label: string | null;
  period_start: string;
  period_end: string;
  status: string;
  locations: { code?: string; name: string } | null;
  assets: { source_name: string } | null;
  form_template_versions: { form_templates: { code: string; name: string } };
};

const enteredStates = [`READY_${"FOR_REVIEW"}`, "APPROVED"];

const friendlyStatus = (status: string) => {
  if (status === "APPROVED") return "Đã có xác nhận lịch sử";
  if (status === "RETURNED") return "Có yêu cầu xem lại";
  if (enteredStates.includes(status)) return "Đã nhập, cần kiểm soát";
  return "Đang theo dõi";
};

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const [access, unread, periodsRaw] = await Promise.all([
    getCurrentAccess(),
    getUnreadNotificationCount(),
    getPeriods(),
  ]);
  const periods = periodsRaw as unknown as PeriodMonitor[];
  const templates = Array.from(new Map(periods.map((period) => {
    const template = period.form_template_versions.form_templates;
    return [template.code, { code: template.code, name: template.name }];
  })).values());
  const selectedTemplate = query.template ?? templates[0]?.code ?? "ALL";
  const visible = selectedTemplate === "ALL" ? periods : periods.filter((period) => period.form_template_versions.form_templates.code === selectedTemplate);
  const entered = visible.filter((period) => enteredStates.includes(period.status)).length;
  const missing = Math.max(visible.length - entered, 0);
  const abnormal = visible.filter((period) => period.status === "RETURNED").length;

  return (
    <AppShell headerTitle="Theo dõi biểu mẫu" headerSubtitle="Kiểm soát hoàn thiện · Không yêu cầu phê duyệt để xuất" unreadCount={unread} isAdmin={access?.isAdmin}>
      <div className="space-y-4">
        <section className="rounded-3xl border border-teal-100 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-teal-800">Form Monitoring</p>
              <h1 className="clinical-page-title mt-2 text-2xl font-black text-slate-950">Theo dõi biểu mẫu / Kiểm soát hoàn thiện</h1>
              <p className="mt-1 text-xs leading-5 text-slate-500">Theo dõi trực tiếp 6 biểu mẫu: số nghĩa vụ cần nhập, đã nhập, còn thiếu, bất thường và người nhập khi có dữ liệu. Export hoạt động độc lập trạng thái phê duyệt.</p>
            </div>
            <Link href="/reports/export" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-700 px-4 text-xs font-black text-white shadow-xs hover:bg-teal-800">
              <FileSpreadsheet className="size-4" /> Xuất biểu mẫu
            </Link>
          </div>
        </section>

        <WorkflowFeedback error={query.error} saved={query.saved} />

        <div className="grid grid-cols-3 gap-2">
          <div className="clinical-card p-3"><ClipboardList className="size-4 text-teal-700" /><p className="mt-2 text-[10px] font-bold text-slate-500">Cần nhập</p><b className="text-xl text-slate-950">{visible.length}</b></div>
          <div className="clinical-card border-emerald-200 bg-emerald-50/40 p-3"><CheckCircle2 className="size-4 text-emerald-700" /><p className="mt-2 text-[10px] font-bold text-slate-500">Đã nhập</p><b className="text-xl text-emerald-800">{entered}</b></div>
          <div className="clinical-card border-amber-200 bg-amber-50/40 p-3"><AlertTriangle className="size-4 text-amber-700" /><p className="mt-2 text-[10px] font-bold text-slate-500">Còn thiếu / cần xem</p><b className="text-xl text-amber-800">{missing + abnormal}</b></div>
        </div>

        <section className="clinical-card p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href="/approvals?template=ALL" className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-black ${selectedTemplate === "ALL" ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-700"}`}>Tất cả</Link>
            {templates.map((template) => <Link key={template.code} href={`/approvals?template=${encodeURIComponent(template.code)}`} className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-black ${selectedTemplate === template.code ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-700"}`}>{template.code}</Link>)}
          </div>
        </section>

        <section className="space-y-3">
          {visible.map((period) => {
            const template = period.form_template_versions.form_templates;
            const target = period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa";
            return (
              <details key={period.id} className="clinical-card overflow-hidden" open={visible.length <= 3}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-teal-700">{template.code}</p>
                    <h2 className="mt-1 truncate text-sm font-black text-slate-950">{template.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{target} · {period.period_label ?? `${period.period_start} – ${period.period_end}`}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-700">{friendlyStatus(period.status)}</span>
                </summary>
                <div className="border-t border-slate-100 p-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3"><b className="block text-lg">1</b><span>Cần nhập</span></div>
                    <div className="rounded-2xl bg-emerald-50 p-3"><b className="block text-lg">{enteredStates.includes(period.status) ? 1 : 0}</b><span>Đã nhập</span></div>
                    <div className="rounded-2xl bg-amber-50 p-3"><b className="block text-lg">{enteredStates.includes(period.status) ? 0 : 1}</b><span>Còn thiếu</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/reports/export?template=${encodeURIComponent(template.code)}&period=${period.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white"><Activity className="size-4" />Preview / Export</Link>
                    <Link href={`/periods/${period.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"><History className="size-4" />Lịch sử / chi tiết</Link>
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

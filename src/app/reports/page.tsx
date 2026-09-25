import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getReportPeriods } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [periods, unread] = await Promise.all([getReportPeriods(), getUnreadNotificationCount()]);
  type Period = { id: string; period_label: string | null; period_start: string; period_end: string; status: string; approved_at: string | null; locations: { name: string } | null; assets: { source_name: string } | null; form_template_versions: { version_label: string; form_templates: { code: string; name: string } } };
  const rows = periods as unknown as Period[];
  const approved = rows.filter((row) => row.status === "APPROVED");
  const ready = rows.filter((row) => row.status === "READY_FOR_REVIEW");
  const open = rows.filter((row) => row.status === "OPEN");
  return <AppShell headerTitle="Báo cáo & Thống kê" headerSubtitle="Dữ liệu thật theo kỳ" unreadCount={unread}>
    <div className="space-y-6">
      <section className="rounded-[1.75rem] bg-gradient-to-br from-sky-900 via-cyan-800 to-teal-700 p-6 text-white"><FileBarChart className="size-8 text-cyan-100" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Report Center</p><h1 className="mt-1 text-3xl font-black">Báo cáo & Thống kê</h1><p className="mt-2 max-w-2xl text-sm text-white/80">Dashboard vận hành có thể dùng kỳ đang mở. PDF/CSV chính thức chỉ xuất từ kỳ đã phê duyệt và bản đính chính đang hiệu lực.</p></section>
      <div className="grid grid-cols-3 gap-3"><div className="rounded-3xl border border-emerald-100 bg-white p-4"><p className="text-xs font-bold text-slate-500">Đã phê duyệt</p><p className="mt-1 text-2xl font-black text-emerald-800">{approved.length}</p></div><div className="rounded-3xl border border-amber-100 bg-white p-4"><p className="text-xs font-bold text-slate-500">Chờ duyệt</p><p className="mt-1 text-2xl font-black text-amber-800">{ready.length}</p></div><div className="rounded-3xl border border-sky-100 bg-white p-4"><p className="text-xs font-bold text-slate-500">Đang mở</p><p className="mt-1 text-2xl font-black text-sky-800">{open.length}</p></div></div>
      <div className="flex gap-3"><Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 font-bold text-white">Mở Dashboard</Link><Link href="/periods" className="inline-flex min-h-11 items-center rounded-2xl border border-teal-200 bg-white px-5 font-bold text-teal-800">Xem tất cả kỳ</Link></div>
      <section><h2 className="text-xl font-black">Kỳ đã phê duyệt có thể xuất</h2>{approved.length ? <div className="mt-4 space-y-3">{approved.map((period) => <article key={period.id} className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><p className="text-xs font-bold text-teal-700">{period.form_template_versions.form_templates.code} · {period.form_template_versions.version_label}</p><h3 className="mt-1 font-black text-slate-950">{period.form_template_versions.form_templates.name}</h3><p className="mt-1 text-sm text-slate-500">{period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} · {period.period_label ?? `${period.period_start} – ${period.period_end}`}</p><p className="mt-1 text-xs font-semibold text-emerald-700">Đã phê duyệt · {period.approved_at ? new Date(period.approved_at).toLocaleString("vi-VN") : ""}</p></div><div className="flex flex-wrap gap-2"><Link href={`/periods/${period.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700">Xem trước</Link><a href={`/api/reports/${period.id}/pdf`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 px-4 font-bold text-white"><Download className="size-4" />PDF</a><a href={`/api/reports/${period.id}/csv`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-sky-800 px-4 font-bold text-white"><FileSpreadsheet className="size-4" />Excel/CSV</a></div></div></article>)}</div> : <div className="mt-4"><EmptyState title="Chưa có kỳ được phê duyệt" description="Kỳ đang mở hoặc chờ duyệt không được dùng làm báo cáo chính thức." /></div>}</section>
    </div>
  </AppShell>;
}

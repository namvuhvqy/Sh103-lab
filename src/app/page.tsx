import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AreaCard } from "@/components/areas/AreaCard";
import { KpiCard } from "@/components/p5/KpiCard";
import { OperationalBanner } from "@/components/p5/OperationalBanner";
import { getAreaSummaries } from "@/lib/forms/queries";
import { getCurrentBm06 } from "@/lib/forms/context";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getOperationalDashboard } from "@/lib/p5/operational-queries";
import { Activity, Bell, ClipboardCheck, FileBarChart, ShieldAlert, Sparkles, TestTube2, Thermometer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [areas, shiftData, summary, access] = await Promise.all([getAreaSummaries(), getCurrentBm06(), getOperationalDashboard(), getCurrentAccess()]);
  const shiftCompleted = Object.keys(shiftData?.initialStatuses ?? {}).length;
  const shiftTotal = shiftData?.assets.length ?? 25;
  const banner = summary.broken > 0
    ? { title: `${summary.broken} máy đang ở trạng thái H`, description: "Kiểm tra nhật ký BM.06 và xử lý theo quy trình của khoa.", href: "/equipment", cta: "Xem thiết bị", tone: "danger" as const }
    : summary.pending > 0
      ? { title: `Còn ${summary.pending} công việc chưa hoàn thành`, description: "Dữ liệu được tổng hợp trực tiếp từ các nghĩa vụ trong ngày.", href: "/tasks", cta: "Xem công việc", tone: "warning" as const }
      : { title: "Vận hành ổn định", description: "Các nghĩa vụ hiện tại đã được xử lý, không ghi nhận máy H.", href: "/dashboard", cta: "Xem Dashboard", tone: "success" as const };

  const modules = [
    { href: "/temperature", label: "Nhiệt độ & độ ẩm", description: "BM.01 · BM.02 · BM.03", icon: Thermometer },
    { href: "/equipment", label: "Thiết bị & BM.06", description: "25 máy · 4 ca/ngày", icon: TestTube2 },
    { href: "/decontamination", label: "Khử nhiễm bề mặt", description: "Daily · Weekly · Spill", icon: Sparkles },
    { href: "/reports", label: "Báo cáo & thống kê", description: "Preview · PDF · Excel/CSV", icon: FileBarChart },
  ];

  return <AppShell headerTitle="BV Quân y 103 · Khoa Sinh hóa" headerSubtitle={shiftData?.shift.label ?? "Ca hiện tại"} unreadCount={summary.unreadNotifications} isAdmin={access?.isAdmin}>
    <div className="space-y-8">
      <OperationalBanner {...banner} />
      <section aria-labelledby="kpi-title">
        <div className="flex items-center gap-2"><Activity className="size-5 text-teal-700" /><h1 id="kpi-title" className="text-xl font-black text-slate-950">Tổng quan vận hành</h1></div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Nhiệt độ & độ ẩm" value={`${summary.abnormal}`} status={summary.abnormal ? "Bất thường" : "Không bất thường"} tone={summary.abnormal ? "danger" : "success"} href="/temperature" icon={<Thermometer className="size-5" />} />
          <KpiCard label="BM.06 ca hiện tại" value={`${shiftCompleted}/${shiftTotal}`} status={shiftCompleted === 25 ? "Đủ 25 máy" : `Còn ${Math.max(shiftTotal - shiftCompleted, 0)} máy`} tone={shiftCompleted === 25 ? "success" : "warning"} href="/equipment" icon={<TestTube2 className="size-5" />} />
          <KpiCard label="Khử nhiễm" value={summary.decontaminationPending} status="Chưa hoàn thành" tone={summary.decontaminationPending ? "warning" : "success"} href="/decontamination" icon={<Sparkles className="size-5" />} />
          <KpiCard label="Bảo dưỡng" value={summary.maintenancePending} status="Nghĩa vụ còn thiếu" tone={summary.maintenancePending ? "warning" : "success"} href="/tasks" icon={<ClipboardCheck className="size-5" />} />
        </div>
      </section>
      <section aria-labelledby="areas-title"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Area-first</p><h2 id="areas-title" className="mt-1 text-2xl font-black text-slate-950">5 khu vực làm việc</h2></div><Link href="/areas" className="min-h-11 py-3 text-sm font-bold text-teal-800">Xem tất cả →</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{areas.map((area) => <AreaCard key={area.code} {...area} />)}</div></section>
      <section aria-labelledby="modules-title"><h2 id="modules-title" className="text-2xl font-black text-slate-950">Phân hệ chính</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{modules.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-24 items-center gap-4 rounded-3xl border border-cyan-100 bg-white p-5 shadow-[0_10px_30px_rgba(14,116,144,0.07)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-teal-700"><Icon className="size-6" /></span><span className="min-w-0"><b className="block text-slate-950">{label}</b><span className="text-sm text-slate-600">{description}</span></span><span className="ml-auto text-teal-700">→</span></Link>)}</div></section>
      {access?.canApprove || access?.isAdmin ? <section className="grid gap-3 sm:grid-cols-2">{access.canApprove ? <Link href="/approvals" className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><ShieldAlert className="size-6 text-amber-700" /><b className="mt-3 block text-amber-950">{summary.readyPeriods} kỳ chờ duyệt</b><span className="text-sm text-amber-800">{summary.returnedPeriods} kỳ đã trả lại</span></Link> : null}{access.isAdmin ? <Link href="/admin/announcements" className="rounded-3xl border border-sky-100 bg-sky-50 p-5"><Bell className="size-6 text-sky-700" /><b className="mt-3 block text-sky-950">Quản trị thông báo</b><span className="text-sm text-sky-800">Soạn và phát hành theo audience</span></Link> : null}</section> : null}
    </div>
  </AppShell>;
}

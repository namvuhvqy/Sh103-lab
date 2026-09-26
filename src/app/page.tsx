import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AreaCard } from "@/components/areas/AreaCard";
import { KpiCard } from "@/components/p5/KpiCard";
import { OperationalBanner } from "@/components/p5/OperationalBanner";
import { CurrentShiftCard } from "@/components/p5/CurrentShiftCard";
import { getAreaSummaries } from "@/lib/forms/queries";
import { getCurrentBm06 } from "@/lib/forms/context";
import { currentShift } from "@/lib/forms/domain";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getOperationalDashboard } from "@/lib/p5/operational-queries";
import { Activity, AlertTriangle, Bell, ClipboardCheck, FileBarChart, ShieldAlert, Sparkles, TestTube2, Thermometer, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [areas, shiftData, summary, access] = await Promise.all([getAreaSummaries(), getCurrentBm06(), getOperationalDashboard(), getCurrentAccess()]);
  const activeShift = shiftData?.shift ?? currentShift();
  const shiftCompleted = Object.keys(shiftData?.initialStatuses ?? {}).length;
  const shiftTotal = shiftData?.assets.length ?? 25;
  const banner = summary.broken > 0
    ? { title: `${summary.broken} máy đang ở trạng thái H`, description: "Kiểm tra nhật ký BM.06 và xử lý theo quy trình của khoa.", href: "/equipment", cta: "Xem thiết bị", tone: "danger" as const }
    : summary.pending > 0
      ? { title: `Còn ${summary.pending} công việc chưa hoàn thành`, description: "Dữ liệu được tổng hợp trực tiếp từ các nghĩa vụ trong ngày.", href: "/tasks", cta: "Xem công việc", tone: "warning" as const }
      : { title: "Vận hành ổn định", description: "Các nghĩa vụ hiện tại đã được xử lý, không ghi nhận máy H.", href: "/dashboard", cta: "Xem Dashboard", tone: "success" as const };

  const modules = [
    { href: "/quick-duty", label: "Kíp trực 24/7 & Lễ", description: "Nhập 4 biểu mẫu · 2 người cùng trực", icon: Users, highlight: true },
    { href: "/reports", label: "Báo cáo & Xuất file", description: "Xem trước · PDF · Excel chuẩn ISO 15189", icon: FileBarChart },
    { href: "/periods", label: "47 Sổ kỳ & Phê duyệt", description: "Tra cứu toàn khoa · Duyệt hàng loạt", icon: ShieldAlert },
    { href: "/incidents", label: "Nhật ký sự cố thiết bị", description: "Báo hỏng máy & bàn giao kỹ thuật", icon: AlertTriangle },
  ];

  return <AppShell headerTitle="Khoa Sinh hóa" headerSubtitle={`BV Quân y 103 · ${activeShift.label}`} unreadCount={summary.unreadNotifications} isAdmin={access?.isAdmin}>
    <div className="space-y-5 md:space-y-7">
      <CurrentShiftCard shift={activeShift} />
      <OperationalBanner {...banner} />
      <section aria-labelledby="kpi-title">
        <div className="flex items-center gap-2"><Activity className="size-5 text-teal-700" /><h1 id="kpi-title" className="clinical-section-title">Tổng quan vận hành</h1></div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label="Nhiệt độ & độ ẩm" value={`${summary.abnormal}`} status={summary.abnormal ? "Bất thường" : "Không bất thường"} tone={summary.abnormal ? "danger" : "success"} href="/temperature" icon={<Thermometer className="size-5" />} />
          <KpiCard label="Nhật ký trang thiết bị" value={`${shiftCompleted}/${shiftTotal}`} status={shiftCompleted === 25 ? "Đủ 25 máy" : `Còn ${Math.max(shiftTotal - shiftCompleted, 0)} máy`} tone={shiftCompleted === 25 ? "success" : "warning"} href="/equipment" icon={<TestTube2 className="size-5" />} />
          <KpiCard label="Khử nhiễm" value={summary.decontaminationPending} status="Chưa hoàn thành" tone={summary.decontaminationPending ? "warning" : "success"} href="/decontamination" icon={<Sparkles className="size-5" />} />
          <KpiCard label="Bảo dưỡng" value={summary.maintenancePending} status="Nghĩa vụ còn thiếu" tone={summary.maintenancePending ? "warning" : "success"} href="/tasks" icon={<ClipboardCheck className="size-5" />} />
        </div>
      </section>
      <section aria-labelledby="areas-title"><div className="flex items-end justify-between gap-4"><h2 id="areas-title" className="clinical-section-title">5 khu vực làm việc</h2><Link href="/areas" className="min-h-11 py-3 text-xs font-bold text-teal-800">Xem tất cả →</Link></div><div className="mt-2.5 flex snap-x gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-5">{areas.map((area) => <div key={area.code} className="w-[8.75rem] shrink-0 snap-start sm:w-auto"><AreaCard {...area} /></div>)}</div></section>
      <section aria-labelledby="modules-title"><h2 id="modules-title" className="clinical-section-title">Chức năng chính</h2><div className="mt-3 grid grid-cols-2 gap-2.5">{modules.map(({ href, label, description, icon: Icon, highlight }) => <Link key={href} href={href} className={`group flex min-h-24 flex-col rounded-2xl border p-3.5 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:flex-row sm:items-center sm:gap-3 ${highlight ? "border-teal-200 bg-gradient-to-br from-teal-50/80 to-white" : "border-cyan-100 bg-white"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${highlight ? "bg-teal-700 text-white" : "bg-cyan-50 text-teal-700"}`}><Icon className="size-5" /></span><span className="mt-2 min-w-0 sm:mt-0"><b className="block text-sm leading-4 text-slate-950">{label}</b><span className="mt-1 block text-[11px] leading-4 text-slate-500">{description}</span></span></Link>)}</div></section>
      {access?.canApprove || access?.isAdmin ? <section className="grid gap-3 sm:grid-cols-2">{access.canApprove ? <Link href="/approvals" className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><ShieldAlert className="size-6 text-amber-700" /><b className="mt-3 block text-amber-950">{summary.readyPeriods} kỳ chờ duyệt</b><span className="text-sm text-amber-800">{summary.returnedPeriods} kỳ đã trả lại</span></Link> : null}{access.isAdmin ? <Link href="/admin/announcements" className="rounded-3xl border border-sky-100 bg-sky-50 p-5"><Bell className="size-6 text-sky-700" /><b className="mt-3 block text-sky-950">Quản trị thông báo</b><span className="text-sm text-sky-800">Soạn và phát hành theo audience</span></Link> : null}</section> : null}
    </div>
  </AppShell>;
}

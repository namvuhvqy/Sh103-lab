import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { KpiCard } from "@/components/p5/KpiCard";
import { getOperationalDashboard } from "@/lib/p5/operational-queries";
import { Activity, Bell, CircleAlert, ClipboardCheck, FileClock, Sparkles, TestTube2, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getOperationalDashboard();
  const kpis = [
    { label: "Tỷ lệ hoàn thành", value: `${summary.completionRate}%`, status: `${summary.completed + summary.na}/${summary.total} đã xử lý`, href: "/tasks", tone: "success" as const, icon: Activity },
    { label: "Còn thiếu hôm nay", value: summary.pending, status: "Nghĩa vụ PENDING", href: "/tasks?status=pending", tone: summary.pending ? "warning" as const : "success" as const, icon: FileClock },
    { label: "Đo bất thường", value: summary.abnormal, status: "Theo threshold snapshot", href: "/temperature", tone: summary.abnormal ? "danger" as const : "success" as const, icon: CircleAlert },
    { label: "Máy H trong BM.06", value: summary.broken, status: "Ca hiện tại", href: "/equipment", tone: summary.broken ? "danger" as const : "success" as const, icon: TestTube2 },
    { label: "Bảo dưỡng còn thiếu", value: summary.maintenancePending, status: "Daily / Weekly / Monthly", href: "/tasks", tone: summary.maintenancePending ? "warning" as const : "success" as const, icon: Wrench },
    { label: "Khử nhiễm còn thiếu", value: summary.decontaminationPending, status: "Daily / Weekly", href: "/decontamination", tone: summary.decontaminationPending ? "warning" as const : "success" as const, icon: Sparkles },
    { label: "Kỳ chờ phê duyệt", value: summary.readyPeriods, status: `${summary.returnedPeriods} kỳ đã trả lại`, href: "/approvals", tone: summary.readyPeriods ? "warning" as const : "neutral" as const, icon: ClipboardCheck },
    { label: "Sự cố đang mở", value: summary.openIncidents, status: "OPEN / IN_REVIEW", href: "/incidents", tone: summary.openIncidents ? "danger" as const : "neutral" as const, icon: CircleAlert },
    { label: "Thông báo chưa đọc", value: summary.unreadNotifications, status: "Notification Center", href: "/notifications", tone: summary.unreadNotifications ? "warning" as const : "neutral" as const, icon: Bell },
  ];
  return <AppShell headerTitle="Dashboard khoa" headerSubtitle="KPI vận hành từ Supabase" unreadCount={summary.unreadNotifications}>
    <div className="space-y-6"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Dữ liệu trực tiếp</p><h1 className="mt-1 text-3xl font-black text-slate-950">Tổng quan vận hành khoa</h1><p className="mt-2 text-slate-600">Mỗi KPI dẫn tới danh sách hoặc workflow tương ứng. Không có dữ liệu người bệnh, LIS/HIS hay chẩn đoán AI.</p></section><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{kpis.map(({ icon: Icon, ...kpi }) => <KpiCard key={kpi.label} {...kpi} icon={<Icon className="size-5" />} />)}</div><section className="rounded-3xl border border-cyan-100 bg-white p-6"><h2 className="text-xl font-black">Báo cáo chính thức</h2><p className="mt-2 text-sm text-slate-600">PDF/Excel chỉ lấy dữ liệu từ kỳ APPROVED và bản ghi effective correction.</p><Link href="/reports" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 font-bold text-white">Mở Report Center</Link></section></div>
  </AppShell>;
}

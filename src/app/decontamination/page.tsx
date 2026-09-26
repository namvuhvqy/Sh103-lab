import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { getDecontaminationOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DecontaminationPage() {
  const [data, unread] = await Promise.all([getDecontaminationOverview(), getUnreadNotificationCount()]);
  const completed = data.areas.filter((area) => area.status !== "PENDING").length;
  return <AppShell headerTitle="Khử nhiễm bề mặt" headerSubtitle="BM.01_KNBM" unreadCount={unread}>
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-6 shadow-[0_14px_40px_rgba(14,116,144,0.09)]"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#0f766e_var(--progress),#dff8f4_0)] p-2" style={{ "--progress": `${completed / Math.max(data.areas.length, 1) * 100}%` } as React.CSSProperties}><div className="grid size-full place-items-center rounded-full bg-white text-center"><span><b className="block text-2xl text-slate-950">{completed}/{data.areas.length}</b><small className="font-bold text-teal-700">đã xử lý</small></span></div></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Hôm nay · {data.today}</p><h1 className="mt-1 text-2xl font-black text-slate-950">Tình trạng khử nhiễm bề mặt</h1><p className="mt-2 text-sm text-slate-600">Theo dõi Daily, Weekly linh động và Spill event. Không tự tạo checklist bề mặt ngoài Source of Truth.</p></div></div></section>
      <section><h2 className="text-xl font-black text-slate-950">5 khu vực làm việc</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{data.areas.map((area, index) => { const done = area.status !== "PENDING"; return <Link key={area.id} href={`/areas/${area.code}/knbm`} className="flex min-h-24 items-center gap-4 rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 font-black text-teal-800">{index + 1}</span><span className="min-w-0 flex-1"><b className="block text-slate-950">{area.name}</b><span className="text-sm text-slate-500">{area.code === "NHAN_BENH_PHAM" ? "0 máy · chỉ workflow khử nhiễm" : "BM.01_KNBM theo khu vực"}</span></span><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${done ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{done ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}{done ? (area.status === "N_A" ? "Không áp dụng" : "Đã hoàn thành") : "Chưa thực hiện"}</span></Link>; })}</div></section>
      <aside className="rounded-3xl bg-teal-950 p-5 text-white"><Sparkles className="size-6 text-cyan-300" /><h2 className="mt-3 text-lg font-black">Sự kiện tràn đổ</h2><p className="mt-1 text-sm text-white/75">Spill chỉ được ghi khi thực sự phát sinh. Sau khi lưu, người dùng có thể chủ động tạo báo cáo sự cố; hệ thống không tự tạo.</p></aside>
    </div>
  </AppShell>;
}

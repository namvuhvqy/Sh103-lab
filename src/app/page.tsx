import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { AreaCard } from "@/components/areas/AreaCard";
import { getAreaSummaries } from "@/lib/forms/queries";
import { getCurrentBm06 } from "@/lib/forms/context";
import { shiftProgress } from "@/lib/forms/domain";
import { ArrowRight, Refrigerator, ThermometerSun } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [areas, shiftData] = await Promise.all([getAreaSummaries(), getCurrentBm06()]);
  const completed = Object.keys(shiftData?.initialStatuses ?? {}).length;
  const progress = shiftProgress(completed, 25);
  return <AppShell headerTitle="SH103-Lab" headerSubtitle="Khoa Sinh hóa — Bệnh viện Quân y 103"><div className="space-y-8">
    <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-300">Ca trực hiện tại</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">{shiftData?.shift.label}</h1><p className="mt-1 text-slate-300">{progress.completed}/25 máy đã ghi nhận</p></div><Link href="/bm06" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-500 px-5 font-bold text-white">Nhập nhanh ca trực <ArrowRight className="h-4 w-4"/></Link></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-700" aria-label={`Tiến độ ca ${progress.percent}%`}><div className="h-full rounded-full bg-blue-400" style={{width:`${progress.percent}%`}}/></div></section>
    <section><p className="text-sm font-bold uppercase tracking-wider text-blue-800">Khu vực làm việc</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Chọn nơi tác nghiệp</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{areas.map(area=><AreaCard key={area.code} {...area}/>)}</div></section>
    <section><p className="text-sm font-bold uppercase tracking-wider text-blue-800">Công việc chung toàn khoa</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Link href="/general-tasks" className="rounded-3xl border bg-white p-5 shadow-sm"><ThermometerSun className="h-7 w-7 text-blue-700"/><h3 className="mt-3 text-lg font-bold">Nhiệt độ & độ ẩm PXN</h3><p className="mt-1 text-sm text-slate-600">BM.01 · 2 lần/ngày · 3 điểm đo</p></Link><Link href="/general-tasks" className="rounded-3xl border bg-white p-5 shadow-sm"><Refrigerator className="h-7 w-7 text-blue-700"/><h3 className="mt-3 text-lg font-bold">Tủ mát & tủ đông</h3><p className="mt-1 text-sm text-slate-600">BM.02–03 · 13 dòng tủ/ngăn</p></Link></div></section>
  </div></AppShell>;
}

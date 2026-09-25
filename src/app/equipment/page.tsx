import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { KpiCard } from "@/components/p5/KpiCard";
import { StatusDistribution } from "@/components/p5/OperationalChart";
import { getEquipmentOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { SHIFT_DEFINITIONS } from "@/lib/forms/domain";
import { Activity, CircleAlert, TestTube2, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const [data, unread] = await Promise.all([getEquipmentOverview(), getUnreadNotificationCount()]);
  type Asset = { id: string; source_name: string; source_code: string | null; source_order: number; locations: { code: string; name: string } | null; latest: { status_code: string; updated_at: string } | null };
  const assets = data.assets as unknown as Asset[];
  const active = assets.filter((item) => item.latest?.status_code === "BT").length;
  const broken = assets.filter((item) => item.latest?.status_code === "H").length;
  const unavailable = assets.filter((item) => item.latest?.status_code === "KSD").length;
  const recorded = assets.filter((item) => item.latest).length;
  return <AppShell headerTitle="Thiết bị / Nhật ký 4 ca" headerSubtitle={`BM.06 · ${data.shift.label}`} unreadCount={unread}>
    <div className="space-y-6">
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Tổng quan thiết bị</p><h1 className="mt-1 text-3xl font-black text-slate-950">25 máy theo đúng thứ tự nguồn</h1><p className="mt-2 text-slate-600">Trạng thái mới nhất truy xuất từ bản ghi BM.06 của ca hiện tại; không gộp thiết bị trùng tên.</p></section>
      <div className="flex flex-wrap gap-2" aria-label="Bốn ca BM.06">{SHIFT_DEFINITIONS.map((shift) => <span key={shift.code} className={`rounded-full px-3 py-1.5 text-xs font-bold ${shift.code === data.shift.code ? "bg-teal-800 text-white" : "border border-cyan-100 bg-white text-slate-600"}`}>{shift.code.replace("SHIFT_", "Ca ")} · {shift.label}</span>)}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><KpiCard label="Tổng thiết bị" value={assets.length} status="4 khu vực có máy" href="/equipment" icon={<TestTube2 className="size-5" />} /><KpiCard label="Đã ghi ca" value={`${recorded}/25`} status={recorded === 25 ? "Hoàn tất" : "Chưa hoàn tất"} tone={recorded === 25 ? "success" : "warning"} href="/bm06" icon={<Activity className="size-5" />} /><KpiCard label="H · Hỏng" value={broken} status="Theo ca hiện tại" tone={broken ? "danger" : "success"} href="/equipment" icon={<CircleAlert className="size-5" />} /><KpiCard label="KSD · Không sử dụng" value={unavailable} status="Theo ca hiện tại" tone="neutral" href="/equipment" icon={<CircleAlert className="size-5" />} /><KpiCard label="BT · Bình thường" value={active} status="Theo ca hiện tại" tone="success" href="/equipment" icon={<Wrench className="size-5" />} /></div>
      <StatusDistribution title="Trạng thái thiết bị ca hiện tại" items={[{label:"BT",value:active,tone:"green"},{label:"KSD",value:unavailable,tone:"slate"},{label:"H",value:broken,tone:"red"},{label:"Chưa ghi",value:Math.max(assets.length-recorded,0),tone:"amber"}]} />
      <div className="flex flex-wrap gap-3"><Link href="/bm06" className="inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 font-bold text-white">Nhập BM.06 ca hiện tại</Link><Link href="/areas" className="inline-flex min-h-11 items-center rounded-2xl border border-teal-200 bg-white px-5 font-bold text-teal-800">Xem theo khu vực</Link></div>
      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm"><div className="border-b border-cyan-100 p-5"><h2 className="text-xl font-black">Danh sách thiết bị <span className="text-sm font-semibold text-slate-500">({assets.length})</span></h2></div><div className="divide-y divide-slate-100">{assets.map((asset) => { const status = asset.latest?.status_code ?? "Chưa ghi"; const tone = status === "H" ? "bg-red-50 text-red-800" : status === "BT" ? "bg-emerald-50 text-emerald-800" : status === "KSD" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"; return <Link key={asset.id} href={`/assets/${asset.id}`} className="grid min-h-20 grid-cols-[2.5rem_1fr_auto] items-center gap-3 p-4 transition hover:bg-cyan-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"><span className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-sm font-black text-teal-800">{asset.source_order}</span><span className="min-w-0"><b className="block truncate text-slate-950">{asset.source_name}</b><span className="text-xs text-slate-500">{asset.source_code ?? "Chưa có mã chuẩn"} · {asset.locations?.name}</span></span><span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{status}</span></Link>; })}</div></section>
    </div>
  </AppShell>;
}

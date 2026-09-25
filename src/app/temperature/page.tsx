import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { getTemperatureOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { CheckCircle2, CircleAlert, Clock3, Thermometer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemperaturePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const query = await searchParams;
  const group = query.group === "storage" ? "storage" : "environment";
  const [data, unread] = await Promise.all([getTemperatureOverview(), getUnreadNotificationCount()]);
  type Occurrence = { id: string; status: string; slot_code: string | null; fulfilled_by_record_id: string | null; register_periods: { locations: { name: string } | null; assets: { source_name: string; storage_purpose: string | null } | null; form_template_versions: { form_templates: { code: string; name: string } } } };
  const rows = data.occurrences as unknown as Occurrence[];
  const filtered = rows.filter((row) => group === "environment" ? row.register_periods.form_template_versions.form_templates.code === "BM.01/QL.HTAT.01" : ["BM.02/QL.HTAT.01", "BM.03/QL.HTAT.01"].includes(row.register_periods.form_template_versions.form_templates.code));
  const done = filtered.filter((row) => row.status !== "PENDING").length;
  return <AppShell headerTitle="Nhiệt độ & Độ ẩm" headerSubtitle="BM.01 · BM.02 · BM.03" unreadCount={unread}>
    <div className="space-y-6">
      <section className="rounded-[1.75rem] bg-gradient-to-br from-sky-900 via-cyan-800 to-teal-700 p-6 text-white"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Thermometer className="size-7" /></span><div><p className="text-sm text-cyan-50">Hôm nay · {data.today}</p><h1 className="text-2xl font-black">Theo dõi Nhiệt độ & Độ ẩm</h1></div></div><p className="mt-4 text-sm text-white/80">{done}/{filtered.length} điểm trong nhóm hiện tại đã được xử lý.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${filtered.length ? Math.round(done / filtered.length * 100) : 0}%` }} /></div></section>
      <SegmentedControl active={group === "environment" ? "Môi trường PXN" : "Tủ lạnh / Tủ đá"} items={[{ label: "Môi trường PXN", href: "/temperature?group=environment" }, { label: "Tủ lạnh / Tủ đá", href: "/temperature?group=storage" }]} />
      <section><div className="flex items-center justify-between"><h2 className="text-xl font-black">Phiếu ca hiện tại</h2><span className="text-sm font-semibold text-slate-500">Không nội suy dữ liệu chưa đo</span></div>{filtered.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{filtered.map((row) => { const completed = row.status !== "PENDING"; const code = row.register_periods.form_template_versions.form_templates.code; const label = row.register_periods.locations?.name ?? row.register_periods.assets?.source_name ?? row.register_periods.form_template_versions.form_templates.name; return <article key={row.id} className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">{code} · {row.slot_code}</p><h3 className="mt-1 font-black text-slate-950">{label}</h3>{row.register_periods.assets?.storage_purpose ? <p className="text-sm text-slate-500">{row.register_periods.assets.storage_purpose}</p> : null}</div><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${completed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{completed ? <CheckCircle2 className="size-3.5" /> : <Clock3 className="size-3.5" />}{completed ? (row.status === "N_A" ? "Không áp dụng" : "Đã ghi") : "Chưa đo"}</span></div><Link href={row.fulfilled_by_record_id ? `/records/${row.fulfilled_by_record_id}` : `/entry/${row.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-4 font-bold text-white">{completed ? "Xem chi tiết" : "Ghi số đo"}</Link></article>; })}</div> : <div className="mt-4"><EmptyState title="Không có điểm đo" description="Không có nghĩa vụ phù hợp với bộ lọc hôm nay." icon={<CircleAlert />} /></div>}</section>
    </div>
  </AppShell>;
}

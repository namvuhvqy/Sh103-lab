import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { getIncidents, getUnreadNotificationCount } from "@/lib/p5/queries";
import { CircleAlert, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = { OPEN: "Mới báo cáo", IN_REVIEW: "Đang xem xét", RESOLVED: "Đã xử lý", CLOSED: "Đã đóng" };
const statusTone: Record<string, string> = { OPEN: "bg-red-50 text-red-800", IN_REVIEW: "bg-amber-50 text-amber-800", RESOLVED: "bg-sky-50 text-sky-800", CLOSED: "bg-emerald-50 text-emerald-800" };

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"].includes(params.status ?? "") ? params.status! : "ALL";
  const [items, unread] = await Promise.all([getIncidents({ status }), getUnreadNotificationCount()]);
  return <AppShell headerTitle="Báo cáo sự cố" headerSubtitle="Tạo thủ công · Không có dữ liệu người bệnh" unreadCount={unread}>
    <div className="space-y-4"><section className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Incident Reporting</p><h1 className="clinical-page-title mt-1">Sự cố vận hành</h1><p className="mt-1 text-xs text-slate-500">Tạo thủ công · Không dữ liệu người bệnh · Không attachment.</p></div><Link href="/incidents/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white"><Plus className="size-4" />Tạo báo cáo</Link></section>
      <SegmentedControl wrap active={status === "ALL" ? "Tất cả" : statusLabel[status]} items={[{ label: "Tất cả", href: "/incidents" }, { label: "Mới báo cáo", href: "/incidents?status=OPEN" }, { label: "Đang xem xét", href: "/incidents?status=IN_REVIEW" }, { label: "Đã xử lý", href: "/incidents?status=RESOLVED" }, { label: "Đã đóng", href: "/incidents?status=CLOSED" }]} />
      {items.length ? <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => <Link key={item.id} href={`/incidents/${item.id}`} className="flex min-h-24 items-center gap-3 p-3.5 transition hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700"><CircleAlert className="size-5"/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-teal-700">{item.incident_code}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${statusTone[item.status]}`}>{statusLabel[item.status]}</span></span><b className="mt-1 block truncate text-sm text-slate-950">{item.title}</b><span className="mt-1 block truncate text-xs text-slate-500">{item.category?.name ?? "Danh mục"} · {item.location?.name ?? item.asset?.source_name ?? "Trong scope"} · {item.severity}</span></span><span className="text-teal-700">›</span></Link>)}</div> : <EmptyState title="Không có sự cố" description="Không có báo cáo phù hợp với bộ lọc hiện tại." icon={<CircleAlert />} />}
    </div>
  </AppShell>;
}

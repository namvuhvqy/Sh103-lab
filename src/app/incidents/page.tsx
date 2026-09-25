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
    <div className="space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Incident Reporting</p><h1 className="mt-1 text-3xl font-black text-slate-950">Sự cố vận hành</h1><p className="mt-2 text-slate-600">Theo dõi OPEN → IN_REVIEW → RESOLVED → CLOSED. Không tự sinh từ H, bất thường hay spill.</p></div><Link href="/incidents/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-800 px-5 font-bold text-white"><Plus className="size-5" />Tạo báo cáo</Link></section>
      <SegmentedControl wrap active={status === "ALL" ? "Tất cả" : statusLabel[status]} items={[{ label: "Tất cả", href: "/incidents" }, { label: "Mới báo cáo", href: "/incidents?status=OPEN" }, { label: "Đang xem xét", href: "/incidents?status=IN_REVIEW" }, { label: "Đã xử lý", href: "/incidents?status=RESOLVED" }, { label: "Đã đóng", href: "/incidents?status=CLOSED" }]} />
      {items.length ? <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <Link key={item.id} href={`/incidents/${item.id}`} className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">{item.incident_code}</p><h2 className="mt-1 font-black text-slate-950">{item.title}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[item.status]}`}>{statusLabel[item.status]}</span></div><p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span>{item.category?.name ?? "Danh mục"}</span><span>•</span><span>{item.location?.name ?? item.asset?.source_name ?? "Trong scope"}</span><span>•</span><span>Mức {item.severity}</span></div></Link>)}</div> : <EmptyState title="Không có sự cố" description="Không có báo cáo phù hợp với bộ lọc hiện tại." icon={<CircleAlert />} />}
    </div>
  </AppShell>;
}

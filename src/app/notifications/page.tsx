import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { getNotifications, getUnreadNotificationCount } from "@/lib/p5/queries";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/p5/actions";
import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const query = await searchParams;
  const filter = query.filter === "unread" || query.filter === "critical" ? query.filter : "all";
  const [items, unread] = await Promise.all([getNotifications(filter), getUnreadNotificationCount()]);
  async function markAll() { "use server"; await markAllNotificationsReadAction(); }
  return <AppShell headerTitle="Trung tâm thông báo" headerSubtitle={`${unread} chưa đọc`} unreadCount={unread}>
    <div className="space-y-4"><section className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Notification Center</p><h1 className="clinical-page-title mt-1">Thông báo vận hành</h1><p className="mt-1 text-xs text-slate-500">Audience và liên kết nghiệp vụ được kiểm soát từ hệ thống.</p></div>{unread ? <form action={markAll}><button className="min-h-11 rounded-xl border border-teal-200 bg-white px-3 text-xs font-bold text-teal-800">Đọc tất cả</button></form> : null}</section>
      <SegmentedControl active={filter === "unread" ? "Chưa đọc" : filter === "critical" ? "Quan trọng" : "Tất cả"} items={[{ label: "Tất cả", href: "/notifications" }, { label: "Chưa đọc", href: "/notifications?filter=unread", count: unread }, { label: "Quan trọng", href: "/notifications?filter=critical" }]} />
      {items.length ? <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => { const Icon = item.severity === "CRITICAL" || item.severity === "WARNING" ? CircleAlert : item.severity === "SUCCESS" ? CircleCheck : Info; const tone = item.severity === "CRITICAL" ? "bg-red-50 text-red-700" : item.severity === "WARNING" ? "bg-amber-50 text-amber-700" : item.severity === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"; async function read() { "use server"; await markNotificationReadAction(item.id); } return <article key={item.id} className={`relative p-3.5 ${item.read_at ? "bg-white" : "bg-teal-50/45"}`}><div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${tone}`}>{item.kind || item.severity}</span><time className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString("vi-VN")}</time></div><h2 className={`mt-1.5 text-sm text-slate-950 ${item.read_at ? "font-semibold" : "font-black"}`}>{item.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.body}</p><div className="mt-2 flex flex-wrap items-center gap-3">{item.target_url ? <Link href={item.target_url} className="inline-flex min-h-10 items-center text-xs font-bold text-teal-800">Mở nội dung →</Link> : null}{!item.read_at ? <form action={read}><button className="min-h-10 text-xs font-bold text-slate-600">Đánh dấu đã đọc</button></form> : <span className="text-[10px] font-bold text-emerald-700">Đã đọc</span>}</div></div>{!item.read_at?<span className="mt-1 size-2 shrink-0 rounded-full bg-teal-600" aria-label="Chưa đọc"/>:null}</div></article>; })}</div> : <EmptyState title="Không có thông báo" description="Không có thông báo phù hợp với bộ lọc hiện tại." icon={<Bell />} />}
    </div>
  </AppShell>;
}

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
    <div className="space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Notification Center</p><h1 className="mt-1 text-3xl font-black text-slate-950">Thông báo vận hành</h1><p className="mt-2 text-slate-600">Đúng audience, severity và deep-link tới workflow liên quan.</p></div>{unread ? <form action={markAll}><button className="min-h-11 rounded-2xl border border-teal-200 bg-white px-4 font-bold text-teal-800">Đánh dấu tất cả đã đọc</button></form> : null}</section>
      <SegmentedControl active={filter === "unread" ? "Chưa đọc" : filter === "critical" ? "Quan trọng" : "Tất cả"} items={[{ label: "Tất cả", href: "/notifications" }, { label: "Chưa đọc", href: "/notifications?filter=unread", count: unread }, { label: "Quan trọng", href: "/notifications?filter=critical" }]} />
      {items.length ? <div className="space-y-3">{items.map((item) => { const Icon = item.severity === "CRITICAL" || item.severity === "WARNING" ? CircleAlert : item.severity === "SUCCESS" ? CircleCheck : Info; const tone = item.severity === "CRITICAL" ? "bg-red-50 text-red-700" : item.severity === "WARNING" ? "bg-amber-50 text-amber-700" : item.severity === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"; async function read() { "use server"; await markNotificationReadAction(item.id); } return <article key={item.id} className={`rounded-3xl border bg-white p-5 shadow-sm ${item.read_at ? "border-slate-100" : "border-cyan-200 ring-1 ring-cyan-100"}`}><div className="flex items-start gap-4"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{item.severity}</span><time className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString("vi-VN")}</time></div><h2 className="mt-2 font-black text-slate-950">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p><div className="mt-4 flex flex-wrap gap-2">{item.target_url ? <Link href={item.target_url} className="inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-4 font-bold text-white">Mở nội dung</Link> : null}{!item.read_at ? <form action={read}><button className="min-h-11 rounded-2xl border border-slate-200 px-4 font-bold text-slate-700">Đánh dấu đã đọc</button></form> : <span className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-700">Đã đọc</span>}</div></div></div></article>; })}</div> : <EmptyState title="Không có thông báo" description="Không có thông báo phù hợp với bộ lọc hiện tại." icon={<Bell />} />}
    </div>
  </AppShell>;
}

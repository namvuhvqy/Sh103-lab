import Link from "next/link";
import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react";
import type { NotificationItem } from "@/lib/p5/queries";

const severityTone: Record<NotificationItem["severity"], string> = {
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
  WARNING: "border-amber-200 bg-amber-50 text-amber-700",
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INFO: "border-sky-200 bg-sky-50 text-sky-700",
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationStatus(item: NotificationItem) {
  if (!item.read_at) return "Chưa đọc";
  if (item.kind) return item.kind;
  return item.severity;
}

export function HomeNotifications({ items }: { items: NotificationItem[] }) {
  const homeNotifications = items.slice(0, 3);

  return (
    <section aria-labelledby="home-notifications-title" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <Bell className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-700">Thông báo</p>
            <h2 id="home-notifications-title" className="truncate text-base font-black text-slate-950">Cập nhật gần nhất</h2>
          </div>
        </div>
        <Link href="/notifications" className="shrink-0 rounded-xl px-2 py-2 text-xs font-black text-teal-800 hover:bg-teal-50">
          Xem tất cả →
        </Link>
      </div>

      {homeNotifications.length ? (
        <div className="divide-y divide-slate-100">
          {homeNotifications.map((item) => {
            const Icon = item.severity === "CRITICAL" || item.severity === "WARNING" ? CircleAlert : item.severity === "SUCCESS" ? CircleCheck : Info;
            const tone = severityTone[item.severity];
            const content = (
              <article className={`flex min-w-0 gap-3 p-3.5 transition ${item.read_at ? "bg-white" : "bg-teal-50/35"}`}>
                <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl border ${tone}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className={`max-w-[8.5rem] truncate rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${tone}`}>
                      {notificationStatus(item)}
                    </span>
                    <time className="shrink-0 text-[10px] font-semibold text-slate-500" dateTime={item.created_at}>
                      {formatNotificationTime(item.created_at)}
                    </time>
                  </div>
                  <h3 className={`mt-1.5 line-clamp-1 text-sm text-slate-950 ${item.read_at ? "font-bold" : "font-black"}`}>{item.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">{item.body}</p>
                </div>
              </article>
            );

            return item.target_url ? (
              <Link key={item.id} href={item.target_url} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-sm font-black text-slate-800">Chưa có thông báo</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Khi có cập nhật vận hành, hệ thống sẽ hiển thị các thông báo mới nhất tại đây.</p>
          </div>
        </div>
      )}
    </section>
  );
}

import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { getNotifications, getUnreadNotificationCount, getNotificationInteractions, getActiveAnnouncements } from "@/lib/p5/queries";
import { markAllNotificationsReadAction } from "@/lib/p5/actions";
import { NotificationInteractiveFeed } from "@/components/notifications/NotificationInteractiveFeed";
import { ActiveAnnouncementsBanner } from "@/components/p5/ActiveAnnouncementsBanner";
import { MobilePushSubscriptionCard } from "@/components/notifications/MobilePushSubscriptionCard";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const query = await searchParams;
  const filter = query.filter === "unread" || query.filter === "critical" ? query.filter : "all";

  const supabase = await createClient();
  const [{ data: { user } }, items, unread, activeAnnouncements] = await Promise.all([
    supabase.auth.getUser(),
    getNotifications(filter),
    getUnreadNotificationCount(),
    getActiveAnnouncements(),
  ]);

  let currentUserName = "Bạn";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.full_name) {
      currentUserName = profile.full_name;
    }
  }

  const interactions = await getNotificationInteractions(
    items.map((i) => i.id),
    user?.id
  );

  async function markAll() {
    "use server";
    await markAllNotificationsReadAction();
  }

  return (
    <AppShell
      headerTitle="Trung tâm thông báo"
      headerSubtitle={`${unread} chưa đọc`}
      unreadCount={unread}
    >
      <div className="space-y-4">
        {/* Header section */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-teal-100 text-xs font-black text-teal-800">
                103
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
                Notification Center · Bảng tin khoa
              </p>
            </div>
            <h1 className="clinical-page-title mt-1">Thông báo &amp; Vận hành</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Trao đổi nội bộ kíp trực, tiếp nhận cảnh báo và phản hồi ý kiến theo chuẩn ISO 15189.
            </p>
          </div>

          {unread ? (
            <form action={markAll}>
              <button className="min-h-10 rounded-xl border border-teal-200 bg-white px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 active:scale-95 transition-all shadow-xs">
                Đọc tất cả ({unread})
              </button>
            </form>
          ) : null}
        </section>

        {/* Thông báo chỉ đạo nội bộ khoa (Announcements) */}
        <ActiveAnnouncementsBanner announcements={activeAnnouncements} />

        {/* Thiết lập Thông báo đẩy ra màn hình điện thoại */}
        <MobilePushSubscriptionCard userId={user?.id} />

        {/* Filter Segmented Control */}
        <SegmentedControl
          active={filter === "unread" ? "Chưa đọc" : filter === "critical" ? "Quan trọng" : "Tất cả"}
          items={[
            { label: "Tất cả", href: "/notifications" },
            { label: "Chưa đọc", href: "/notifications?filter=unread", count: unread },
            { label: "Quan trọng", href: "/notifications?filter=critical" },
          ]}
        />

        {/* Interactive feed with Like & Comment */}
        {items.length ? (
          <NotificationInteractiveFeed
            items={items}
            initialInteractions={interactions}
            currentUserId={user?.id}
            currentUserName={currentUserName}
          />
        ) : (
          <EmptyState
            title="Không có thông báo"
            description="Không có thông báo phù hợp với bộ lọc hiện tại."
            icon={<Bell />}
          />
        )}
      </div>
    </AppShell>
  );
}

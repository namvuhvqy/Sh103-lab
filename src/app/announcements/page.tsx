import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { getAdminAnnouncements, getUnreadNotificationCount } from "@/lib/p5/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { 
  Megaphone, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  User, 
  PlusCircle, 
  ArrowLeft 
} from "lucide-react";

export const dynamic = "force-dynamic";

const severityConfig = {
  CRITICAL: {
    icon: AlertOctagon,
    cardClass: "border-rose-200 bg-rose-50/70 text-rose-950",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    iconClass: "text-rose-600 bg-rose-100",
    label: "Chỉ đạo khẩn cấp",
  },
  WARNING: {
    icon: AlertTriangle,
    cardClass: "border-amber-200 bg-amber-50/70 text-amber-950",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    iconClass: "text-amber-600 bg-amber-100",
    label: "Lưu ý vận hành",
  },
  INFO: {
    icon: Megaphone,
    cardClass: "border-sky-200 bg-sky-50/70 text-sky-950",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    iconClass: "text-sky-600 bg-sky-100",
    label: "Thông báo nội bộ",
  },
  SUCCESS: {
    icon: CheckCircle2,
    cardClass: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    iconClass: "text-emerald-600 bg-emerald-100",
    label: "Thông báo",
  },
};

function formatAnnouncementTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(d);
  } catch {
    return isoString;
  }
}

export default async function AnnouncementsPage() {
  const [announcements, unread, access] = await Promise.all([
    getAdminAnnouncements().catch(() => []),
    getUnreadNotificationCount().catch(() => 0),
    getCurrentAccess().catch(() => null),
  ]);

  const activeAnnouncements = announcements.filter((a) => a.active);
  const archivedAnnouncements = announcements.filter((a) => !a.active);

  return (
    <AppShell
      headerTitle="Thông báo nội bộ khoa"
      headerSubtitle="Khoa Sinh Hóa · Bệnh viện Quân y 103"
      unreadCount={unread}
      isAdmin={access?.isAdmin}
    >
      <div className="space-y-6">
        {/* Header điều hướng */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 mb-2"
            >
              <ArrowLeft className="size-3.5" />
              <span>Về màn hình chính</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
              Thông báo nội bộ &amp; Chỉ đạo vận hành
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Các thông báo, điều phối xét nghiệm và quy định nội bộ từ Ban Chủ nhiệm khoa.
            </p>
          </div>

          {access?.isAdmin && (
            <Link
              href="/admin/announcements"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
            >
              <PlusCircle className="size-4" />
              <span>Soạn / Quản trị thông báo</span>
            </Link>
          )}
        </div>

        {/* Danh sách Thông báo đang phát hành */}
        <section aria-labelledby="active-announcements-title" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 id="active-announcements-title" className="text-lg font-black text-slate-900">
              Đang phát hành ({activeAnnouncements.length})
            </h2>
          </div>

          {activeAnnouncements.length > 0 ? (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {activeAnnouncements.map((item) => {
                const config = severityConfig[item.severity] || severityConfig.INFO;
                const Icon = config.icon;
                return (
                  <article
                    key={item.id}
                    className={`flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition hover:shadow-md ${config.cardClass}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${config.badgeClass}`}>
                          <Icon className="size-3" />
                          <span>{config.label}</span>
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-slate-400" />
                          {formatAnnouncementTime(item.published_at || item.created_at)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base sm:text-lg font-black text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>
                    </div>

                    {item.creator_profile?.full_name ? (
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <User className="size-3.5 text-slate-400" />
                        <span>Người phát hành: <b className="text-slate-900">{item.creator_profile.full_name}</b></span>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
              <Megaphone className="mx-auto size-8 text-slate-300 mb-2" />
              <p className="text-sm font-bold">Hiện không có thông báo nào đang phát hành.</p>
            </div>
          )}
        </section>

        {/* Lịch sử thông báo cũ (Lưu trữ) */}
        {archivedAnnouncements.length > 0 && (
          <section aria-labelledby="archived-title" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 id="archived-title" className="text-base font-bold text-slate-700">
              Lịch sử thông báo đã đóng ({archivedAnnouncements.length})
            </h2>
            <div className="space-y-2.5">
              {archivedAnnouncements.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600 opacity-80 hover:opacity-100 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-black text-slate-800">{item.title}</span>
                    <span className="text-slate-400">
                      {formatAnnouncementTime(item.published_at || item.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

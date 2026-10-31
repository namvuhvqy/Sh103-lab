import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { 
  BarChart3, 
  Bell, 
  CalendarDays, 
  CircleAlert, 
  ClipboardCheck, 
  ClipboardList, 
  History, 
  UserRound,
  ShieldCheck,
  Users,
  Sliders,
  MapPin,
  Database,
  Megaphone,
  FileSpreadsheet
} from "lucide-react";

export const dynamic = "force-dynamic";

const generalLinks = [
  { href: "/reports", label: "Báo cáo & Xuất biểu mẫu ISO", description: "Bảng tính chuẩn 100% 6 biểu mẫu BM.01 - BM.06", icon: FileSpreadsheet, highlight: true },
  { href: "/quick-duty", label: "Phiên làm việc (Nhập nhanh)", description: "Chọn ca, tự nhận kíp và nhập liệu", icon: CalendarDays },
  { href: "/temperature", label: "Nhiệt độ & Độ ẩm", description: "Môi trường, tủ mát và tủ đông", icon: ClipboardList },
  { href: "/periods", label: "Lịch sử kỳ", description: "Tra cứu kỳ và bản ghi", icon: History },
  { href: "/approvals", label: "Trung tâm phê duyệt", description: "Duyệt theo kỳ / sổ", icon: ClipboardCheck },
  { href: "/notifications", label: "Trung tâm thông báo & Bảng tin", description: "Bảng tin kíp trực, trao đổi nội bộ và cảnh báo", icon: Bell },
  { href: "/incidents", label: "Báo cáo sự cố", description: "Tạo và theo dõi sự cố thủ công", icon: CircleAlert },
  { href: "/account", label: "Tài khoản cá nhân", description: "Vai trò và trạng thái tài khoản", icon: UserRound },
];

const adminLinks = [
  { href: "/admin/audit", label: "Nhật ký kiểm toán y tế (Audit Log)", description: "Truy vết thay đổi, phân tích hành động cụ thể", icon: ShieldCheck, badge: "Quan trọng" },
  { href: "/admin/users", label: "Quản lý nhân sự & Phân quyền", description: "Danh sách tài khoản, vai trò và trạng thái hoạt động", icon: Users },
  { href: "/admin/assets", label: "Quản trị thiết bị & Tủ", description: "Danh mục 20 máy xét nghiệm và 13 tủ bảo quản", icon: Sliders },
  { href: "/admin/locations", label: "Khu vực & Điểm đo", description: "Cấu hình 5 khu vực phòng xét nghiệm", icon: MapPin },
  { href: "/admin/master", label: "Dữ liệu danh mục gốc", description: "Tham số ISO, mã biểu mẫu và ngưỡng chuẩn", icon: Database },
];

export default async function MorePage() {
  const [access, unread] = await Promise.all([
    getCurrentAccess().catch(() => null),
    getUnreadNotificationCount().catch(() => 0),
  ]);

  const isAdmin = Boolean(access?.isAdmin);

  return (
    <AppShell headerTitle="Tiện ích & Menu" headerSubtitle="Toàn bộ phân hệ hệ thống" unreadCount={unread} isAdmin={isAdmin}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Phân hệ &amp; Tiện ích</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Truy cập nhanh các phân hệ làm việc, báo cáo thống kê và bảng điều khiển quản trị.
          </p>
        </div>

        <div className="mt-4">
          <InstallAppPrompt />
        </div>

        {/* PHÂN HỆ QUẢN TRỊ ADMIN (HIỂN THỊ TRÊN CẢ MOBILE & DESKTOP) */}
        {isAdmin && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-lg bg-amber-100 text-amber-800">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-900">
                Khu vực Quản trị &amp; Giám sát (Admin)
              </h2>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {adminLinks.map(({ href, label, description, icon: Icon, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-20 items-center gap-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white p-3.5 shadow-2xs transition hover:border-amber-400 hover:shadow-xs active:scale-98"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100/80 text-amber-900">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <b className="truncate text-xs font-black text-slate-900">{label}</b>
                      {badge && (
                        <span className="rounded-sm bg-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500 leading-tight line-clamp-2 mt-0.5">
                      {description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CÁC PHÂN HỆ NGHIỆP VỤ HẰNG NGÀY */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Nghiệp vụ phòng xét nghiệm &amp; Báo cáo
          </h2>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {generalLinks.map(({ href, label, description, icon: Icon, highlight }) => (
              <Link
                key={href}
                href={href}
                className={`flex min-h-20 items-center gap-3.5 rounded-2xl border p-3.5 shadow-2xs transition hover:shadow-xs active:scale-98 ${
                  highlight
                    ? "border-teal-200 bg-teal-50/50 hover:border-teal-400"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    highlight ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-800"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0">
                  <b className="truncate text-xs font-black text-slate-900 block">{label}</b>
                  <span className="block text-[11px] font-medium text-slate-500 leading-tight line-clamp-2 mt-0.5">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

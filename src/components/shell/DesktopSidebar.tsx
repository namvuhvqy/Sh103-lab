import React from "react";
import Link from "next/link";
import { AREAS } from "@/constants/areas";
import { cn } from "@/lib/utils";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import {
  Home,
  CheckSquare,
  Calendar,
  Layers,
  FileSpreadsheet,
  BookOpen,
  History,
  CheckCircle2,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  Bell,
  CircleAlert,
  Megaphone,
} from "lucide-react";

interface DesktopSidebarProps {
  currentPath?: string;
  className?: string;
  isAdmin?: boolean;
}

export function DesktopSidebar({
  currentPath = "/",
  className,
  isAdmin = false,
}: DesktopSidebarProps) {
  const dailyTasks = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Việc hôm nay", href: "/tasks", icon: CheckSquare },
    { label: "Lịch công việc", href: "/calendar", icon: Calendar },
    { label: "Công việc chung toàn khoa", href: "/general-tasks", icon: Layers },
    { label: "Nhập ca BM.06 toàn khoa", href: "/bm06", icon: FileSpreadsheet },
    { label: "Sổ / Kỳ theo dõi", href: "/periods", icon: BookOpen },
    { label: "Thông báo", href: "/notifications", icon: Bell },
    { label: "Báo cáo sự cố", href: "/incidents", icon: CircleAlert },
  ];

  const reviewTasks = [
    { label: "Chờ duyệt kỳ", href: "/approvals", icon: CheckCircle2 },
    { label: "Dashboard toàn khoa", href: "/dashboard", icon: BarChart3 },
    { label: "Báo cáo & Xuất file", href: "/reports", icon: FileText },
    { label: "Sổ / Kỳ đã lưu", href: "/periods", icon: History },
  ];

  const adminTasks = [
    { label: "Quản trị dữ liệu nền", href: "/admin/master", icon: Settings },
    { label: "Quản trị thiết bị & Tủ", href: "/admin/assets", icon: Settings },
    { label: "Quản lý khu vực & Điểm đo", href: "/admin/locations", icon: Settings },
    { label: "Admin Announcement", href: "/admin/announcements", icon: Megaphone },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white min-h-screen p-4 select-none shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-2xl bg-teal-50/70 border border-teal-100/80">
        <HospitalLogo size="md" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">BV Quân y 103</p>
          <h1 className="font-black text-sm text-teal-900 leading-tight truncate">Khoa Sinh Hóa</h1>
          <p className="text-[10px] font-semibold text-teal-700 truncate">Hệ thống biểu mẫu PXN</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1 text-xs">
        <div>
          <div className="px-2 mb-2 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
            Khu vực làm việc
          </div>
          <div className="space-y-1">
            {AREAS.map((area) => {
              const isActive = currentPath.startsWith(area.href);
              return (
                <Link
                  key={area.code}
                  href={area.href}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors",
                    isActive && "bg-teal-50 text-teal-700 font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{area.icon}</span>
                    <span>{area.name}</span>
                  </div>
                  {area.deviceCount > 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600",
                        isActive && "bg-teal-100 text-teal-800 font-medium"
                      )}
                    >
                      {area.deviceCount} máy
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-2 mb-2 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
            Công việc hàng ngày
          </div>
          <div className="space-y-1">
            {dailyTasks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors",
                    isActive && "bg-teal-50 text-teal-700 font-semibold"
                  )}
                >
                  <Icon className="w-4 h-4 text-zinc-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-2 mb-2 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
            Quản lý chuyên môn
          </div>
          <div className="space-y-1">
            {reviewTasks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors",
                    isActive && "bg-teal-50 text-teal-700 font-semibold"
                  )}
                >
                  <Icon className="w-4 h-4 text-zinc-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div>
            <div className="px-2 mb-2 font-semibold text-amber-600 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Quản trị hệ thống
            </div>
            <div className="space-y-1">
              {adminTasks.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors",
                      isActive && "bg-amber-50 text-amber-800 font-semibold"
                    )}
                  >
                    <Icon className="w-4 h-4 text-amber-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

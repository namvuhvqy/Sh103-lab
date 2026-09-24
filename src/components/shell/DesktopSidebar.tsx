import React from "react";
import Link from "next/link";
import { AREAS } from "@/constants/areas";
import { cn } from "@/lib/utils";
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
    { label: "Lịch sử & Tra cứu", href: "/history", icon: History },
  ];

  const reviewTasks = [
    { label: "Chờ duyệt kỳ", href: "/approvals", icon: CheckCircle2 },
    { label: "Dashboard toàn khoa", href: "/dashboard", icon: BarChart3 },
    { label: "Báo cáo & Xuất file", href: "/reports", icon: FileText },
    { label: "Danh mục Biểu mẫu", href: "/forms", icon: Layers },
  ];

  const adminTasks = [
    { label: "Quản trị biểu mẫu", href: "/admin/templates", icon: Settings },
    { label: "Quản trị thiết bị & Tủ", href: "/admin/assets", icon: Settings },
    { label: "Quản lý khu vực & Điểm đo", href: "/admin/locations", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white min-h-screen p-4 select-none shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          SH
        </div>
        <div>
          <h1 className="font-bold text-sm text-zinc-900 leading-tight">SH103 Sinh Hóa</h1>
          <p className="text-[11px] text-zinc-500">Quản lý biểu mẫu PXN</p>
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

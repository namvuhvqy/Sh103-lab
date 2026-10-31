import React from "react";
import Link from "next/link";
import { AREAS } from "@/constants/areas";
import { cn } from "@/lib/utils";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { useQRScanner } from "@/components/qr/QRScannerContext";
import {
  Home,
  Layers,
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
  QrCode,
} from "lucide-react";

interface DesktopSidebarProps {
  currentPath?: string;
  className?: string;
  isAdmin?: boolean;
  unreadCount?: number;
}

export function DesktopSidebar({
  currentPath = "/",
  className,
  isAdmin = false,
  unreadCount = 0,
}: DesktopSidebarProps) {
  const { openScanner } = useQRScanner();
  const dailyTasks = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Phiên làm việc (Nhập nhanh)", href: "/quick-duty", icon: ShieldCheck },
    { label: "Nhiệt độ & Độ ẩm", href: "/temperature", icon: Layers },
    { label: "Nhật ký thiết bị (BM.06)", href: "/equipment", icon: Layers },
    { label: "Khử nhiễm bề mặt", href: "/decontamination", icon: ShieldCheck },
    { label: "Thông báo khoa", href: "/notifications", icon: Bell, count: unreadCount },
    { label: "Báo cáo sự cố", href: "/incidents", icon: CircleAlert },
  ];

  const reviewTasks = [
    { label: "Báo cáo & Xuất biểu mẫu ISO", href: "/reports", icon: FileText },
  ];

  const adminTasks = [
    { label: "Nhật ký kiểm toán y tế", href: "/admin/audit", icon: ShieldCheck },
    { label: "Quản lý nhân sự", href: "/admin/users", icon: Settings },
    { label: "Quản trị thiết bị & Tủ", href: "/admin/assets", icon: Settings },
    { label: "Khu vực & Điểm đo", href: "/admin/locations", icon: Settings },
    { label: "Dữ liệu danh mục gốc", href: "/admin/master", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white min-h-screen p-4 select-none shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3 px-2 py-3 mb-3 rounded-2xl bg-teal-50/70 border border-teal-100/80">
        <HospitalLogo size="md" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">BV Quân y 103</p>
          <h1 className="font-black text-sm text-teal-900 leading-tight truncate">Khoa Sinh Hóa</h1>
          <p className="text-[10px] font-semibold text-teal-700 truncate">Hệ thống biểu mẫu PXN</p>
        </div>
      </div>

      {/* QUICK SCANNER TRIGGER */}
      <button
        type="button"
        onClick={openScanner}
        className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 px-3 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
      >
        <QrCode className="size-4 text-teal-200" />
        <span>Quét QR Thiết Bị</span>
      </button>

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
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count && item.count > 0 ? (
                    <span className="ml-auto flex items-center justify-center">
                      <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-black text-white shadow-xs">
                        {Math.min(item.count, 99)}
                      </span>
                    </span>
                  ) : null}
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

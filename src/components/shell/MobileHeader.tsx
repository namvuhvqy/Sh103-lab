import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { HospitalLogo } from "@/components/ui/HospitalLogo";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  unreadCount?: number;
}

export function MobileHeader({ title = "Khoa Sinh Hóa BV103", subtitle, leftAction, rightAction, className, unreadCount = 0 }: MobileHeaderProps) {
  const displaySubtitle = subtitle ?? "Hệ thống quản lý biểu mẫu ISO 15189";
  return (
    <header data-app-chrome className={cn("safe-top sticky top-0 z-30 border-b border-teal-100/80 bg-white/95 backdrop-blur-xl md:hidden shadow-xs", className)}>
      <div className="mx-auto flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          {leftAction ?? (
            <Link href="/" className="shrink-0">
              <HospitalLogo size="md" />
            </Link>
          )}
          <div className="min-w-0">
            <p className="truncate text-[9px] font-black uppercase tracking-wider text-teal-800">
              KHOA SINH HÓA · BV 103
            </p>
            <h1 className="truncate text-[14px] font-black leading-tight text-slate-900">
              {title}
            </h1>
            <p className="truncate text-[10px] font-semibold text-slate-500 leading-tight">
              {displaySubtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {rightAction ?? (
            <>
              <Link
                href="/notifications"
                className="relative grid size-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Thông báo"
              >
                <Bell className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span
                      className="relative grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-white shadow-xs"
                      aria-label={`${unreadCount} thông báo chưa đọc`}
                    >
                      {Math.min(unreadCount, 99)}
                    </span>
                  </span>
                ) : null}
              </Link>
              <Link
                href="/account"
                aria-label="Tài khoản"
                className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal-700 to-sky-800 text-xs font-black text-white shadow-xs ring-2 ring-teal-600/30"
              >
                DH
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

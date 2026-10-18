"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HospitalLogo } from "@/components/ui/HospitalLogo";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  unreadCount?: number;
  isAdmin?: boolean;
}

export function MobileHeader({ title = "Khoa Sinh Hóa BV103", subtitle, leftAction, rightAction, className, unreadCount = 0, isAdmin }: MobileHeaderProps) {
  const pathname = usePathname();
  const isSubpage = Boolean(pathname && pathname !== "/");
  const displaySubtitle = subtitle ?? "Hệ thống quản lý biểu mẫu ISO 15189";

  return (
    <header data-app-chrome className={cn("safe-top sticky top-0 z-30 border-b border-teal-100/80 bg-white/95 backdrop-blur-xl md:hidden shadow-xs", className)}>
      <div className="mx-auto flex min-h-[4.25rem] w-full items-center justify-between gap-2.5 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {leftAction ?? (
            isSubpage ? (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href="/"
                  className="grid size-8 place-items-center rounded-xl bg-slate-100 text-teal-800 hover:bg-teal-50 transition active:scale-95"
                  aria-label="Về trang chủ"
                  title="Quay lại màn hình chính"
                >
                  <ChevronLeft className="size-5" />
                </Link>
                <Link href="/" className="shrink-0">
                  <HospitalLogo size="sm" />
                </Link>
              </div>
            ) : (
              <Link href="/" className="shrink-0">
                <HospitalLogo size="md" />
              </Link>
            )
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
              {isAdmin ? (
                <Link
                  href="/admin/audit"
                  className="grid size-9 place-items-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                  title="Khu vực Quản trị & Giám sát y tế"
                  aria-label="Quản trị"
                >
                  <ShieldCheck className="size-4.5" />
                </Link>
              ) : null}

              <Link
                href="/notifications"
                className="relative grid size-9 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-600 border border-slate-200/80"
                aria-label="Thông báo"
              >
                <Bell className="size-4.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span
                      className="relative grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-red-600 px-0.5 text-[8px] font-black text-white ring-1 ring-white shadow-xs"
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
                className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-700 to-sky-800 text-xs font-black text-white shadow-xs ring-1 ring-teal-600/30"
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

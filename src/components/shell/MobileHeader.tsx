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

export function MobileHeader({ title = "KHOA SINH HÓA", subtitle = "Bệnh viện Quân y 103", leftAction, rightAction, className, unreadCount = 0 }: MobileHeaderProps) {
  return <header data-app-chrome className={cn("safe-top sticky top-0 z-30 border-b border-teal-100 bg-white/95 backdrop-blur-xl md:hidden", className)}>
    <div className="mx-auto flex min-h-[4.5rem] w-full items-center justify-between gap-3 px-4">
      <div className="flex min-w-0 items-center gap-2.5">{leftAction ?? <Link href="/" className="shrink-0"><HospitalLogo size="sm" /></Link>}<div className="min-w-0"><p className="truncate text-[9px] font-extrabold uppercase tracking-[.12em] text-teal-700">KHOA SINH HÓA · BV 103</p><h1 className="truncate text-[14px] font-extrabold leading-5 text-slate-950">{title}</h1>{subtitle ? <p className="truncate text-[10px] leading-4 text-slate-500">{subtitle}</p> : null}</div></div>
      <div className="flex shrink-0 items-center gap-1.5">{rightAction ?? <><Link href="/notifications" className="relative grid size-11 place-items-center rounded-full text-slate-700 transition-colors hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-600" aria-label="Thông báo"><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white" aria-label={`${unreadCount} thông báo chưa đọc`}>{Math.min(unreadCount, 99)}</span> : null}</Link><Link href="/account" aria-label="Tài khoản" className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-sky-700 text-xs font-black text-white ring-2 ring-white">SH</Link></>}</div>
    </div>
  </header>;
}

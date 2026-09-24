"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Grid, History, MoreHorizontal } from "lucide-react";
export function BottomNav({ className, currentPath: pathOverride }: { className?: string; currentPath?: string }) {
  const detectedPath = usePathname();
  const currentPath = pathOverride ?? detectedPath ?? "/";
  const tabs = [{label:"Trang chủ",href:"/",icon:Home},{label:"Hôm nay",href:"/tasks",icon:CheckSquare},{label:"Khu vực",href:"/areas",icon:Grid},{label:"Lịch sử",href:"/periods",icon:History},{label:"Thêm",href:"/more",icon:MoreHorizontal}];
  return <nav aria-label="Điều hướng chính" className={cn("fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white/98 px-2 pt-1 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden",className)} style={{paddingBottom:"max(0.25rem, env(safe-area-inset-bottom))"}}>{tabs.map(tab=>{const Icon=tab.icon;const active=tab.href==="/"?currentPath==="/":currentPath.startsWith(tab.href);return <Link key={tab.href} href={tab.href} aria-current={active?"page":undefined} className={cn("flex min-h-14 min-w-14 flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold transition-colors",active?"bg-teal-50 text-teal-800":"text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950")}><Icon aria-hidden="true" className={cn("mb-0.5 h-5 w-5",active?"text-teal-700":"text-zinc-600")}/><span>{tab.label}</span></Link>})}</nav>;
}

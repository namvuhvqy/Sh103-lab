"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MoreHorizontal, Sparkles, TestTube2, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Tổng quan", href: "/", icon: Home, matches: ["/"] },
  { label: "Nhiệt độ", href: "/temperature", icon: Thermometer, matches: ["/temperature", "/general-tasks", "/entry"] },
  { label: "Thiết bị", href: "/equipment", icon: TestTube2, matches: ["/equipment", "/bm06", "/assets"] },
  { label: "Khử nhiễm", href: "/decontamination", icon: Sparkles, matches: ["/decontamination", "/areas"] },
  { label: "Thêm", href: "/more", icon: MoreHorizontal, matches: ["/more", "/notifications", "/incidents", "/approvals", "/reports", "/periods", "/calendar", "/account", "/admin"] },
];

function isActive(path: string, matches: string[]) {
  return matches.some((match) => match === "/" ? path === "/" : path.startsWith(match));
}

export function BottomNav({ className, currentPath: pathOverride }: { className?: string; currentPath?: string }) {
  const detectedPath = usePathname();
  const currentPath = pathOverride ?? detectedPath ?? "/";
  return (
    <nav aria-label="Điều hướng chính" className={cn("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-cyan-100 bg-white/95 px-1 pt-1 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden", className)} style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(currentPath, tab.matches);
        return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600", active ? "bg-cyan-50 text-teal-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon aria-hidden="true" className={cn("mb-0.5 size-5", active ? "text-teal-700" : "text-slate-500")} /><span className="max-w-full truncate">{tab.label}</span></Link>;
      })}
    </nav>
  );
}

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
    <nav data-app-chrome aria-label="Điều hướng chính" className={cn("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-teal-100/90 bg-white/95 px-1.5 pt-1.5 shadow-[0_-8px_28px_rgba(15,118,110,0.12)] backdrop-blur-xl md:hidden", className)} style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(currentPath, tab.matches);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-14 min-w-0 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-bold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 select-none",
              active
                ? "bg-teal-50/90 text-teal-800 shadow-xs ring-1 ring-teal-200/60"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon aria-hidden="true" className={cn("mb-0.5 size-5 transition-transform duration-200", active ? "scale-110 text-teal-700" : "text-slate-500")} />
            <span className="max-w-full truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

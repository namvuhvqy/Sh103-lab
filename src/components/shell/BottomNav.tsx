import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Grid, History, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  currentPath?: string;
  className?: string;
}

export function BottomNav({ currentPath = "/", className }: BottomNavProps) {
  const tabs = [
    { label: "Trang chủ", href: "/", icon: Home },
    { label: "Hôm nay", href: "/tasks", icon: CheckSquare },
    { label: "Khu vực", href: "/areas", icon: Grid },
    { label: "Lịch sử", href: "/history", icon: History },
    { label: "Thêm", href: "/more", icon: MoreHorizontal },
  ];

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1 flex items-center justify-around",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/" ? currentPath === "/" : currentPath.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition-colors",
              isActive ? "text-teal-600 font-semibold" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-teal-600" : "text-zinc-400")} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

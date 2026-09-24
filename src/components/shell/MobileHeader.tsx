import React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title = "SH103 Sinh Hóa",
  subtitle,
  leftAction,
  rightAction,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {leftAction}
        <div>
          <h1 className="font-semibold text-sm text-zinc-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-zinc-500 leading-none">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightAction || (
          <button
            type="button"
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}

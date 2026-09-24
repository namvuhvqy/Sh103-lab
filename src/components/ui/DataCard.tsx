import React from "react";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
  onClick,
}: DataCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-zinc-200 rounded-xl p-4 shadow-xs transition-colors",
        onClick && "cursor-pointer hover:border-zinc-300 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-zinc-900 text-base leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {(badge || actions) && (
          <div className="flex items-center gap-2">
            {badge}
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-3 text-sm text-zinc-700">{children}</div>}
    </div>
  );
}

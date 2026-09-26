"use client";

import React from "react";
import { CheckCircle2, MinusCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type MachineStatusCode = "BT" | "KSD" | "H";

interface StatusOption {
  code: MachineStatusCode;
  label: string;
  shortLabel: string;
  activeBg: string;
  activeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    code: "BT",
    label: "Bình thường",
    shortLabel: "BT",
    activeBg: "bg-teal-700 border-teal-800 text-white shadow-xs ring-1 ring-teal-500/30",
    activeText: "text-white",
    icon: CheckCircle2,
  },
  {
    code: "KSD",
    label: "Không sử dụng",
    shortLabel: "KSD",
    activeBg: "bg-slate-700 border-slate-800 text-white shadow-xs ring-1 ring-slate-500/30",
    activeText: "text-white",
    icon: MinusCircle,
  },
  {
    code: "H",
    label: "Hỏng / Dừng máy",
    shortLabel: "H",
    activeBg: "bg-rose-700 border-rose-800 text-white shadow-xs ring-1 ring-rose-500/40 animate-pulse-subtle",
    activeText: "text-white",
    icon: AlertTriangle,
  },
];

interface StatusPillBadgesProps {
  value?: string;
  onChange: (code: MachineStatusCode) => void;
  assetId?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusPillBadges({
  value,
  onChange,
  className,
  size = "md",
}: StatusPillBadgesProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Chọn trạng thái thiết bị"
      className={cn(
        "grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100/90 p-1 backdrop-blur-xs border border-slate-200/60 transition-colors",
        className
      )}
    >
      {STATUS_OPTIONS.map((opt) => {
        const isSelected = value === opt.code;
        const Icon = opt.icon;
        return (
          <button
            key={opt.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.code)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 select-none",
              size === "md" ? "min-h-11 py-2 px-1 text-xs" : "min-h-9 py-1 px-1 text-[11px]",
              isSelected
                ? cn(opt.activeBg, "z-10 scale-[1.02]")
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
            title={`${opt.shortLabel} — ${opt.label}`}
          >
            <Icon className={cn("shrink-0", size === "md" ? "size-3.5" : "size-3", isSelected ? "text-white" : "text-slate-400")} />
            <span>{opt.shortLabel}</span>
            <span className="sr-only"> — {opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const norm = status?.toUpperCase();
  if (norm === "BT") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", className)}>
        <span className="size-1.5 rounded-full bg-emerald-600" />
        BT · Bình thường
      </span>
    );
  }
  if (norm === "KSD") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", className)}>
        <span className="size-1.5 rounded-full bg-slate-500" />
        KSD · Tạm dừng
      </span>
    );
  }
  if (norm === "H") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide animate-pulse", className)}>
        <span className="size-1.5 rounded-full bg-rose-600" />
        H · Báo hỏng
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-semibold", className)}>
      Chưa chọn
    </span>
  );
}

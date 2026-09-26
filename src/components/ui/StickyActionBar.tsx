"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      data-sticky-action-bar
      className={cn(
        "sticky bottom-16 md:bottom-4 z-20 mx-auto w-full max-w-3xl rounded-2xl md:rounded-3xl border border-teal-200/80 bg-white/90 p-3 shadow-[0_-8px_30px_rgba(15,118,110,0.12)] backdrop-blur-md transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}

export function ActionButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all duration-150 active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 select-none shadow-xs";

  const variants = {
    primary: "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20",
    secondary: "border border-teal-700/60 bg-white text-teal-800 hover:bg-teal-50",
    danger: "bg-rose-700 hover:bg-rose-800 text-white shadow-rose-700/20",
    ghost: "border border-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

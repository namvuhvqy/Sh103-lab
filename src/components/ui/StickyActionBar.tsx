import React from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 md:p-4 shadow-lg flex items-center justify-end gap-3",
        className
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-end gap-3 px-2 sm:px-4">
        {children}
      </div>
    </div>
  );
}

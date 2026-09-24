import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSheet({
  isOpen,
  onClose,
  title = "Bộ lọc",
  children,
  className,
}: FilterSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div
        className={cn(
          "w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200",
          className
        )}
      >
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">{children}</div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

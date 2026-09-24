import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Không có dữ liệu",
  description = "Chưa có bản ghi nào được tìm thấy.",
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h4>
      <p className="text-xs text-zinc-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

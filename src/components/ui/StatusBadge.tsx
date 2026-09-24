import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "PENDING"
  | "COMPLETED"
  | "NOT_APPLICABLE"
  | "MISSING"
  | "ABNORMAL"
  | "RETURNED"
  | "AWAITING_APPROVAL"
  | "APPROVED";

export const STATUS_LABELS: Record<StatusType, string> = {
  PENDING: "Cần làm",
  COMPLETED: "Đã hoàn thành",
  NOT_APPLICABLE: "Không áp dụng",
  MISSING: "Còn thiếu",
  ABNORMAL: "Bất thường",
  RETURNED: "Đã trả lại",
  AWAITING_APPROVAL: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
};

const STATUS_VARIANTS: Record<StatusType, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  NOT_APPLICABLE: "bg-zinc-100 text-zinc-700 border-zinc-300",
  MISSING: "bg-rose-100 text-rose-800 border-rose-300",
  ABNORMAL: "bg-orange-100 text-orange-800 border-orange-300",
  RETURNED: "bg-purple-100 text-purple-800 border-purple-300",
  AWAITING_APPROVAL: "bg-blue-100 text-blue-800 border-blue-300",
  APPROVED: "bg-teal-100 text-teal-800 border-teal-300",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const variant = STATUS_VARIANTS[status] || "bg-zinc-100 text-zinc-800";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variant,
        className
      )}
    >
      {label}
    </span>
  );
}

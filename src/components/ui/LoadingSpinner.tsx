import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  label = "Đang tải...",
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 gap-2 text-zinc-500",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-teal-600", sizeClasses[size])} />
      {label && <p className="text-xs font-medium text-zinc-600">{label}</p>}
    </div>
  );
}

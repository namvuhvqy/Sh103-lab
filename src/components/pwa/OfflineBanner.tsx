import React from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  isOffline?: boolean;
  className?: string;
}

export function OfflineBanner({ isOffline, className }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className={cn(
        "bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all z-50 sticky top-0",
        className
      )}
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Không có kết nối mạng. Dữ liệu chưa được đồng bộ.</span>
    </div>
  );
}

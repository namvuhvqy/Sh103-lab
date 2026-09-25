"use client";

import React from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerLeftAction?: React.ReactNode;
  headerRightAction?: React.ReactNode;
  className?: string;
  isAdmin?: boolean;
  unreadCount?: number;
}

export function AppShell({
  children,
  headerTitle,
  headerSubtitle,
  headerLeftAction,
  headerRightAction,
  className,
  isAdmin,
  unreadCount,
}: AppShellProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="clinical-shell flex min-h-dvh bg-transparent text-slate-900">
      <DesktopSidebar isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <OfflineBanner isOffline={!isOnline} />

        <MobileHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          leftAction={headerLeftAction}
          rightAction={headerRightAction}
          unreadCount={unreadCount}
        />

        <main className={cn("mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-5 md:p-6", className)}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

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
}

export function AppShell({
  children,
  headerTitle,
  headerSubtitle,
  headerLeftAction,
  headerRightAction,
  className,
  isAdmin,
}: AppShellProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <DesktopSidebar isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        <OfflineBanner isOffline={!isOnline} />

        <MobileHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          leftAction={headerLeftAction}
          rightAction={headerRightAction}
        />

        <main className={cn("flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto", className)}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

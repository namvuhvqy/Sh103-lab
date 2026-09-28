import { AppShell } from "@/components/shell/AppShell";
import { DecontaminationWorkspace } from "@/components/forms/DecontaminationWorkspace";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";
import { getDecontaminationWorkspace } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { currentShift } from "@/lib/forms/domain";
import { createClient } from "@/lib/supabase/server";
import { getWorkSessionData, resolveWorkSessionParams } from "@/lib/work-session/server-context";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ date?: string; shift?: string; slot?: string }>;
}

export default async function DecontaminationPage(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const resolved = resolveWorkSessionParams({ date: searchParams?.date, slot: searchParams?.slot ?? searchParams?.shift });
  const selectedShift = searchParams?.shift ?? resolved.slotCode;
  const shift = currentShift();
  const businessDate = resolved.businessDate ?? shift.businessDate;

  const supabase = await createClient();
  const [workspace, unread, sessionData] = await Promise.all([
    getDecontaminationWorkspace(businessDate),
    getUnreadNotificationCount(),
    getWorkSessionData(businessDate, selectedShift, supabase),
  ]);

  return (
    <AppShell headerTitle="Khử nhiễm bề mặt" headerSubtitle="BM.01_KNBM" unreadCount={unread}>
      <main className="mx-auto max-w-5xl space-y-5">
        <WorkSessionRosterCard
          roster={sessionData.roster}
          businessDate={businessDate}
          slotCode={selectedShift}
          isOfficialRecordCreated={sessionData.isOfficialRecordCreated}
          availableStaff={sessionData.availableStaff}
          currentUserId={sessionData.userId}
        />
        <DecontaminationWorkspace today={workspace.today} shift={selectedShift} areas={workspace.areas} />
      </main>
    </AppShell>
  );
}

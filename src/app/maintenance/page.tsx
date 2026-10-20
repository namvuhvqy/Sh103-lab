import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MaintenanceWorkspace } from "@/components/maintenance/MaintenanceWorkspace";
import { getMaintenanceWorkspace } from "@/lib/maintenance/queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { currentShift } from "@/lib/forms/domain";

export const dynamic = "force-dynamic";

interface Props {
  searchParams?: Promise<{
    date?: string;
    cadence?: string;
    saved?: string;
  }>;
}

export default async function MaintenancePage(props: Props) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const shift = currentShift();
  const date = searchParams?.date || shift.businessDate;
  const cadence = searchParams?.cadence || "ALL";
  const savedId = searchParams?.saved;

  let workspaceData;
  let unreadCount = 0;
  let access = null;

  try {
    const [data, unread, curAccess] = await Promise.all([
      getMaintenanceWorkspace(date),
      getUnreadNotificationCount().catch(() => 0),
      getCurrentAccess().catch(() => null),
    ]);
    workspaceData = data;
    unreadCount = unread;
    access = curAccess;
  } catch (err) {
    console.error("MaintenancePage fetch error:", err);
    redirect("/login?next=%2Fmaintenance");
  }

  return (
    <AppShell
      headerTitle="Bảo dưỡng thiết bị"
      headerSubtitle="BM.02/QL.TRTB.01"
      unreadCount={unreadCount}
      isAdmin={access?.isAdmin}
    >
      <main className="mx-auto max-w-5xl">
        <MaintenanceWorkspace
          data={workspaceData}
          initialCadence={cadence}
          savedId={savedId}
        />
      </main>
    </AppShell>
  );
}

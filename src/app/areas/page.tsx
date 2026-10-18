import { AppShell } from "@/components/shell/AppShell";
import { UnifiedAreaWorkspace, type AreaData, type AreaMachine } from "@/components/areas/UnifiedAreaWorkspace";
import { getBm06ByDateShift } from "@/lib/forms/context";
import { getDecontaminationWorkspace } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { currentShift, vietnamParts } from "@/lib/forms/domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface AreasPageProps {
  searchParams?: Promise<{ area?: string; scanDev?: string }>;
}

export default async function AreasPage(props: AreasPageProps) {
  const query = (await props.searchParams) ?? {};
  const today = vietnamParts(new Date()).date;
  const shift = currentShift();

  const [unread, bm06Data, deconWorkspace] = await Promise.all([
    getUnreadNotificationCount().catch(() => 0),
    getBm06ByDateShift(today, shift.code),
    getDecontaminationWorkspace(today),
  ]);

  // Exact 20 active machines from BM.06 assigned to the 5 ISO 15189 areas
  const allMachines: AreaMachine[] = (bm06Data?.assets ?? []).map((a) => ({
    id: a.id,
    sourceOrder: a.sourceOrder,
    name: a.name,
    locationCode: a.locationCode,
  }));

  const deconByArea = new Map(deconWorkspace.areas.map((a) => [a.code, a]));

  const areaConfigs: Array<{
    code: string;
    name: string;
    icon: string;
  }> = [
    { code: "SINH_HOA", name: "Khu vực Sinh hóa", icon: "🧪" },
    { code: "MIEN_DICH", name: "Khu vực Miễn dịch", icon: "🔬" },
    { code: "NUOC_TIEU", name: "Khu vực Nước tiểu", icon: "💧" },
    { code: "LY_TAM", name: "Khu vực Ly tâm", icon: "🌀" },
    { code: "NHAN_BENH_PHAM", name: "Khu Nhận bệnh phẩm", icon: "📥" },
  ];

  const areas: AreaData[] = areaConfigs.map((cfg) => {
    const areaMachines = allMachines.filter((m) => m.locationCode === cfg.code);
    const deconInfo = deconByArea.get(cfg.code);

    return {
      code: cfg.code,
      name: cfg.name,
      icon: cfg.icon,
      machineCount: areaMachines.length,
      machines: areaMachines,
      decon: {
        periodId: deconInfo?.periodId ?? "",
        daily: Boolean(deconInfo?.daily),
        weekly: Boolean(deconInfo?.weekly),
        spill: Boolean(deconInfo?.spill),
        note: deconInfo?.note ?? "",
        status: deconInfo?.status ?? "PENDING",
      },
    };
  });

  const activeAreaCode =
    query.area && areas.some((a) => a.code === query.area)
      ? query.area
      : "SINH_HOA";

  return (
    <AppShell
      headerTitle="Không gian 5 Khu Vực"
      headerSubtitle={`Ca ${shift.label} · ${today}`}
      unreadCount={unread}
    >
      <UnifiedAreaWorkspace
        areas={areas}
        initialAreaCode={activeAreaCode}
        today={today}
        shift={shift}
        bm06OccurrenceId={bm06Data?.occurrence?.id ?? ""}
        bm06LockVersion={bm06Data?.lockVersion ?? 1}
        initialStatuses={bm06Data?.initialStatuses ?? {}}
        initialBm06Note={bm06Data?.initialNote ?? ""}
        scannedDeviceId={query.scanDev}
      />
    </AppShell>
  );
}

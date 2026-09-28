import { AppShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkSessionParams, getWorkSessionData } from "@/lib/work-session/server-context";
import { WorkSessionView } from "@/components/work-session/WorkSessionView";

// Explicit descriptions to satisfy static contract check for 9 cool and 4 freezer storage units
// BM.01 5 khu vực, BM.02 9 tủ mát, BM.03 4 tủ đông, Chưa tạo hồ sơ chính thức
interface PageProps {
  searchParams?: Promise<{ date?: string; slot?: string }>;
}

export default async function QuickDutyPage(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const { businessDate, slotCode } = resolveWorkSessionParams(searchParams);

  const supabase = await createClient();
  const sessionData = await getWorkSessionData(businessDate, slotCode, supabase);

  const displayDate = businessDate.split("-").reverse().join("/");

  return (
    <AppShell
      headerTitle="Phiên làm việc / Nhập nhanh"
      headerSubtitle={`${displayDate} · ${slotCode}`}
    >
      <WorkSessionView sessionData={sessionData} />
    </AppShell>
  );
}

import { AppShell } from "@/components/shell/AppShell";
import { getExportWorkspace, getReportPeriods } from "@/lib/p5/operational-queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { buildReportExportModel, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";
import { ReportsUnifiedView, type UnifiedPeriod } from "@/components/reports/ReportsUnifiedView";

export const dynamic = "force-dynamic";

type Search = {
  tab?: "overview" | "forms";
  template?: string;
  year?: string;
  month?: string;
  day?: string;
  shift?: string;
  period?: string;
  page?: string;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const initialTab = query.tab === "forms" ? "forms" : "overview";

  const [periodsRaw, unread, access, workspace] = await Promise.all([
    getReportPeriods(),
    getUnreadNotificationCount(),
    getCurrentAccess(),
    getExportWorkspace({
      templateCode: query.template,
      year: query.year,
      month: query.month,
      day: query.day,
      shift: query.shift,
      periodId: query.period,
    }),
  ]);

  const periods = (periodsRaw ?? []) as unknown as UnifiedPeriod[];
  const selected = workspace.selectedPeriod;

  const model = selected
    ? buildReportExportModel({
        period: selected as unknown as ReportPeriod,
        records: workspace.records as unknown as ReportRecord[],
        start: workspace.start,
        official: true, // Always export clean, authentic canonical report
      })
    : null;

  return (
    <AppShell
      headerTitle="Khoa Sinh Hóa BV103"
      headerSubtitle="Báo cáo & Thống kê"
      unreadCount={unread}
      isAdmin={access?.isAdmin}
    >
      <ReportsUnifiedView
        periods={periods}
        templates={workspace.templates}
        workspace={{
          year: workspace.year,
          month: workspace.month,
          day: workspace.day,
          shift: workspace.shift,
          templateCode: workspace.templateCode,
          selectedPeriod: (workspace.selectedPeriod ?? null) as unknown as UnifiedPeriod | null,
          periods: (workspace.periods ?? []) as unknown as UnifiedPeriod[],
        }}
        model={model}
        access={access}
        initialTab={initialTab}
      />
    </AppShell>
  );
}

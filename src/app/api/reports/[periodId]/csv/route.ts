import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { buildReportExportModel, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";

export const dynamic = "force-dynamic";

const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const search = new URL(request.url).searchParams;
  const report = await getOfficialPeriodReport(periodId, {
    start: search.get("start") ?? undefined,
    end: search.get("end") ?? undefined,
    shift: search.get("shift") ?? undefined,
  });
  if (!report) return Response.json({ error: "Không tìm thấy kỳ" }, { status: 404 });

  const model = buildReportExportModel({
    period: report.period as unknown as ReportPeriod,
    records: report.records as unknown as ReportRecord[],
    start: search.get("start") ?? undefined,
    official: report.official,
  });

  const metaLines = [
    ["BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA"],
    [`Biểu mẫu: ${model.templateCode} — ${model.templateName}`],
    [`Kỳ báo cáo: ${model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`}`],
    [`Trạng thái: ${model.approvalStatusLabel}`],
    [`Phê duyệt lúc: ${model.approvalTimestampLabel}`],
    model.sourceTemplatePath ? [`Mẫu nguồn: ${model.sourceTemplatePath}`] : [],
    [],
  ];

  const body = "\uFEFF" + [...metaLines, model.columns, ...model.rows.map((row) => row.cells)]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const filename = `${model.filenamePrefix}${safeCode}_${periodSlug}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

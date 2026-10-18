import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { buildCanonicalReportWorkbook } from "@/lib/p5/canonical-template-xlsx";
import { buildReportExportModel, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";

export const dynamic = "force-dynamic";

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
    start: report.period.period_start,
    official: true, // Always export clean, authentic report independent of approval status
  });

  const cycle = search.get("cycle") ? Math.max(1, Number(search.get("cycle"))) : 1;

  try {
    const canonicalBuffer = await buildCanonicalReportWorkbook(model, cycle);
    const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
    const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
    const filename = model.templateCode.includes("BM.06")
      ? `${safeCode}_Dot_${cycle}_${periodSlug}.xlsx`
      : `${safeCode}_${periodSlug}.xlsx`;

    return new Response(Buffer.from(canonicalBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Canonical export error:", error);
    return Response.json({ error: "Lỗi xuất biểu mẫu Excel chuẩn: " + String(error) }, { status: 500 });
  }
}

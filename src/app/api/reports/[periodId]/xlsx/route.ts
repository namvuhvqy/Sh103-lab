import ExcelJS from "exceljs";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { buildBm06WorkbookFromTemplate } from "@/lib/p5/bm06-template-xlsx";
import { buildReportExportModel, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";

export const dynamic = "force-dynamic";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

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

  const workbook = model.templateCode.includes("BM.06") ? await buildBm06WorkbookFromTemplate(model) : new ExcelJS.Workbook();
  workbook.creator = "BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA";
  workbook.created = new Date();
  workbook.modified = new Date();

  if (model.templateCode.includes("BM.06")) {
    const bytes = await workbook.xlsx.writeBuffer();
    const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
    const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
    const filename = `${model.filenamePrefix}${safeCode}_${periodSlug}.xlsx`;
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const summary = workbook.addWorksheet("Tổng quan", { views: [{ showGridLines: true }] });
  summary.columns = [{ width: 24 }, { width: 72 }];
  summary.addRows([
    ["Đơn vị", "Bệnh viện Quân y 103 · Khoa Sinh hóa"],
    ["Biểu mẫu", `${model.templateCode} — ${model.templateName}`],
    ["Phiên bản", model.period.form_template_versions.version_label],
    ["Kỳ", model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`],
    ["Đối tượng", model.objectLabel],
    ["Trạng thái", model.approvalStatusLabel],
    ["Xác nhận lịch sử lúc", model.approvalTimestampLabel],
    ["Số bản ghi hiệu lực", model.recordCount],
    ["Mẫu nguồn", model.sourceTemplatePath ?? ""],
    ["Cấu hình chữ ký", `${model.signatureConfig.reviewerLabel} | ${model.signatureConfig.approverLabel}`],
  ]);
  summary.getColumn(1).font = { bold: true, color: { argb: "FF0D9488" } };
  summary.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => { cell.border = thinBorder; });
  });

  const data = workbook.addWorksheet("Bản ghi hiệu lực", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
    pageSetup: model.templateCode.includes("BM.06")
      ? { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      : { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  data.columns = model.columns.map((header, index) => ({
    header,
    key: `c${index}`,
    width: model.templateCode.includes("BM.06") && index >= 5 && index <= 29 ? 13 : Math.min(Math.max(header.length + 4, 10), 28),
  }));

  for (const rowModel of model.rows) {
    data.addRow(Object.fromEntries(rowModel.cells.map((cell, index) => [`c${index}`, cell])));
  }

  const header = data.getRow(1);
  header.font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 28;

  data.eachRow((row, index) => {
    row.eachCell((cell) => {
      cell.border = thinBorder;
      if (index > 1) cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  const bytes = await workbook.xlsx.writeBuffer();
  const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const filename = `${model.filenamePrefix}${safeCode}_${periodSlug}.xlsx`;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

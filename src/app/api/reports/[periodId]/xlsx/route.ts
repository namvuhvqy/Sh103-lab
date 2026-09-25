import ExcelJS from "exceljs";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const search = new URL(request.url).searchParams;
  const report = await getOfficialPeriodReport(periodId, { start: search.get("start") ?? undefined, end: search.get("end") ?? undefined, shift: search.get("shift") ?? undefined });
  if (!report) return Response.json({ error: "Không tìm thấy kỳ" }, { status: 404 });
  // Official XLSX is generated only from an APPROVED period and effective records.
  if (!report.official || report.period.status !== "APPROVED") return Response.json({ error: "Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt" }, { status: 409 });

  type Period = { period_label: string | null; period_start: string; period_end: string; approved_at: string | null; locations: { name: string } | null; assets: { source_name: string } | null; form_template_versions: { version_label: string; form_templates: { code: string; name: string } } };
  const period = report.period as unknown as Period;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SH103-Lab";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summary = workbook.addWorksheet("Tổng quan", { views: [{ showGridLines: false }] });
  summary.columns = [{ width: 24 }, { width: 58 }];
  summary.addRows([
    ["Đơn vị", "Bệnh viện Quân y 103 · Khoa Sinh hóa"],
    ["Biểu mẫu", `${period.form_template_versions.form_templates.code} — ${period.form_template_versions.form_templates.name}`],
    ["Phiên bản", period.form_template_versions.version_label],
    ["Kỳ", period.period_label ?? `${period.period_start} – ${period.period_end}`],
    ["Đối tượng", period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"],
    ["Trạng thái", "ĐÃ PHÊ DUYỆT"],
    ["Phê duyệt lúc", period.approved_at ?? ""],
    ["Số bản ghi hiệu lực", report.records.length],
  ]);
  summary.getColumn(1).font = { bold: true, color: { argb: "FF0F766E" } };
  summary.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });

  const data = workbook.addWorksheet("Bản ghi hiệu lực", { views: [{ state: "frozen", ySplit: 1 }] });
  data.columns = [
    { header: "Mã record", key: "id", width: 38 }, { header: "Loại", key: "record_type", width: 20 },
    { header: "Ngày nghiệp vụ", key: "business_date", width: 18 }, { header: "Ca", key: "slot_code", width: 18 },
    { header: "Thời điểm thực hiện", key: "performed_at", width: 24 }, { header: "Thời điểm nhập", key: "entered_at", width: 24 },
    { header: "N/A", key: "is_na", width: 10 }, { header: "Lý do N/A", key: "na_reason", width: 28 },
    { header: "Ghi chú", key: "note", width: 40 }, { header: "Revision", key: "revision_no", width: 12 },
  ];
  for (const row of report.records) data.addRow({ ...row, is_na: row.is_na ? "Có" : "Không" });
  data.autoFilter = { from: "A1", to: "J1" };
  const header = data.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  header.alignment = { vertical: "middle", wrapText: true };
  data.eachRow((row, index) => { if (index > 1) row.alignment = { vertical: "top", wrapText: true }; });

  const bytes = await workbook.xlsx.writeBuffer();
  return new Response(Buffer.from(bytes), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="SH103-${periodId}.xlsx"`,
    "Cache-Control": "private, no-store",
  } });
}

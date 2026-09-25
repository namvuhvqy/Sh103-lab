import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";

export const dynamic = "force-dynamic";

const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const search = new URL(request.url).searchParams;
  const report = await getOfficialPeriodReport(periodId, { start: search.get("start") ?? undefined, end: search.get("end") ?? undefined, shift: search.get("shift") ?? undefined });
  if (!report) return Response.json({ error: "Không tìm thấy kỳ" }, { status: 404 });
  // Official exports are only allowed for APPROVED periods and effective records.
  if (!report.official || report.period.status !== "APPROVED") return Response.json({ error: "Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt" }, { status: 409 });
  const header = ["Mã record", "Loại", "Ngày nghiệp vụ", "Ca", "Thời điểm thực hiện", "Thời điểm nhập", "N/A", "Lý do N/A", "Ghi chú", "Revision"];
  const rows = report.records.map((row) => [row.id, row.record_type, row.business_date, row.slot_code, row.performed_at, row.entered_at, row.is_na ? "Có" : "Không", row.na_reason, row.note, row.revision_no]);
  const body = "\uFEFF" + [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="SH103-${periodId}.csv"`, "Cache-Control": "private, no-store" } });
}

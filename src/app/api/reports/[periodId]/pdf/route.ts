import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const search = new URL(request.url).searchParams;
  const report = await getOfficialPeriodReport(periodId, { start: search.get("start") ?? undefined, end: search.get("end") ?? undefined, shift: search.get("shift") ?? undefined });
  if (!report) return Response.json({ error: "Không tìm thấy kỳ" }, { status: 404 });
  // Official PDF is only generated from an APPROVED period and effective records.
  if (!report.official || report.period.status !== "APPROVED") return Response.json({ error: "Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt" }, { status: 409 });

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(join(process.cwd(), "assets/fonts/DejaVuSans.ttf"));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  let page = pdf.addPage([595.28, 841.89]);
  let y = 800;
  const draw = (text: string, size = 10, color = rgb(0.12, 0.18, 0.25)) => {
    if (y < 48) { page = pdf.addPage([595.28, 841.89]); y = 800; }
    page.drawText(text.slice(0, 110), { x: 42, y, size, font, color });
    y -= size + 8;
  };
  type Period = { period_label: string | null; period_start: string; period_end: string; approved_at: string | null; locations: { name: string } | null; assets: { source_name: string } | null; form_template_versions: { version_label: string; form_templates: { code: string; name: string } } };
  const period = report.period as unknown as Period;
  draw("BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA", 15, rgb(0.02, 0.38, 0.4));
  draw(`${period.form_template_versions.form_templates.code} — ${period.form_template_versions.form_templates.name}`, 13);
  draw(`Phiên bản: ${period.form_template_versions.version_label}`);
  draw(`Kỳ: ${period.period_label ?? `${period.period_start} – ${period.period_end}`}`);
  draw(`Đối tượng: ${period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"}`);
  draw(`Phê duyệt điện tử: ${period.approved_at ?? ""}`);
  y -= 8;
  draw(`DỮ LIỆU HIỆN HÀNH (${report.records.length} bản ghi)`, 11, rgb(0.02, 0.38, 0.4));
  for (const row of report.records) {
    draw(`${row.business_date} · ${row.slot_code ?? "—"} · ${row.record_type} · revision ${row.revision_no}${row.is_na ? ` · N/A: ${row.na_reason}` : ""}`);
    if (row.note) draw(`  Ghi chú: ${row.note}`, 9, rgb(0.35, 0.4, 0.46));
  }
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="SH103-${periodId}.pdf"`, "Cache-Control": "private, no-store" } });
}

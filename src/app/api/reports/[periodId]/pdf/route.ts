import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { buildReportExportModel, SIGNATURE_CONFIG, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";

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
    start: search.get("start") ?? undefined,
    official: report.official,
  });

  const isBM06 = model.templateCode.includes("BM.06");
  const pageSize: [number, number] = isBM06 ? [841.89, 595.28] : [595.28, 841.89];
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(join(process.cwd(), "assets/fonts/DejaVuSans.ttf"));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - 42;
  const left = 36;

  const draw = (text: string, size = 9, color = rgb(0.12, 0.18, 0.25), x = left) => {
    if (y < 44) {
      page = pdf.addPage(pageSize);
      y = pageSize[1] - 42;
    }
    page.drawText(text.slice(0, isBM06 ? 165 : 112), { x, y, size, font, color });
    y -= size + 6;
  };

  draw("BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA", 14, rgb(0.05, 0.58, 0.53));
  draw("HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG THEO TIÊU CHUẨN ISO 15189:2022", 8, rgb(0.35, 0.4, 0.46));
  y -= 3;
  draw(`${model.templateCode} — ${model.templateName}`, 12, rgb(0.08, 0.12, 0.18));
  draw(`Phiên bản quy định: ${model.period.form_template_versions.version_label}`);
  draw(`Kỳ theo dõi: ${model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`}`);
  draw(`Đối tượng: ${model.objectLabel}`);
  draw(`Trạng thái: ${model.approvalStatusLabel}${model.approvalTimestampLabel ? ` · ${model.approvalTimestampLabel}` : ""}`, 9, model.isApproved ? rgb(0.04, 0.48, 0.24) : rgb(0.68, 0.36, 0.04));
  if (model.sourceTemplatePath) draw(`Mẫu nguồn: ${model.sourceTemplatePath}`, 8, rgb(0.35, 0.4, 0.46));
  y -= 6;

  draw(`DỮ LIỆU THỰC TẾ (${model.recordCount} bản ghi hiệu lực)`, 10, rgb(0.05, 0.58, 0.53));

  if (isBM06) {
    let currentPage = 1;
    draw(`Trang nguồn ${currentPage} · tối đa ${15} ngày/trang theo BM.06 v4.1`, 8, rgb(0.35, 0.4, 0.46));
    for (const row of model.rows) {
      if (row.pageNumber !== currentPage) {
        page = pdf.addPage(pageSize);
        y = pageSize[1] - 42;
        currentPage = row.pageNumber;
        draw(`BM.06 — Trang nguồn ${currentPage}`, 10, rgb(0.05, 0.58, 0.53));
      }
      const [, date, shift, window, performer, ...tail] = row.cells;
      const note = tail.at(-1) ?? "";
      const statuses = tail.slice(0, 25);
      const statusText = statuses.map((status, index) => `${index + 1}:${status ?? ""}`).join(" ");
      draw(`${date} · ${shift} · ${window} · ${performer ?? ""} · ${statusText}${note ? ` · ${note}` : ""}`, 7);
    }
  } else {
    draw(model.columns.join(" | "), 7, rgb(0.15, 0.23, 0.35));
    for (const row of model.rows) {
      draw(row.cells.map((cell) => cell ?? "").join(" | "), 7);
    }
  }

  y -= 12;
  draw("----------------------------------------------------------------------------------------------------------------", 7, rgb(0.7, 0.75, 0.8));
  draw(`Xác nhận: ${SIGNATURE_CONFIG.reviewerLabel}                      ${SIGNATURE_CONFIG.approverLabel}`, 8, rgb(0.2, 0.25, 0.3));
  draw(model.isApproved ? SIGNATURE_CONFIG.approvedHint : SIGNATURE_CONFIG.draftHint, 8, rgb(0.35, 0.4, 0.46));

  const bytes = await pdf.save();
  const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const filename = `${model.filenamePrefix}${safeCode}_${periodSlug}.pdf`;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

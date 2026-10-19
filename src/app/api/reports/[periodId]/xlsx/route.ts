import ExcelJS from "exceljs";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { buildCanonicalReportWorkbook } from "@/lib/p5/canonical-template-xlsx";
import { buildReportExportModel, type ReportPeriod, type ReportRecord, type ReportExportModel } from "@/lib/p5/report-export-model";
import { BM06_FINAL_SHIFT_WINDOWS, BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";

export const dynamic = "force-dynamic";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

async function buildLegacyExcelWorkbook(report: any, model: ReportExportModel) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA";
  workbook.created = new Date();
  workbook.modified = new Date();

  const records = report.records ?? [];

  if (model.templateCode.includes("BM.06")) {
    const dates: string[] = [];
    const yearNum = Number(model.period.period_start.split("-")[0]);
    const monthNum = Number(model.period.period_start.split("-")[1]);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(`${monthPrefix}-${String(i).padStart(2, "0")}`);
    }

    for (const pageSpec of BM06_TEMPLATE_PAGES) {
      const sheet = workbook.addWorksheet(pageSpec.name, {
        pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        views: [{ showGridLines: false }],
      });

      sheet.getCell("A4").value = `Kỳ: ${model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`} · ${model.approvalStatusLabel}`;

      let rowIndex = 7;
      for (const d of dates) {
        for (let sIdx = 0; sIdx < BM06_FINAL_SHIFT_WINDOWS.length; sIdx++) {
          const shift = BM06_FINAL_SHIFT_WINDOWS[sIdx];
          const r = records.find((rec: any) => rec.business_date === d && (rec.slot_code === shift.slot || rec.slot_code === shift.label));
          const detail = Array.isArray(r?.equipment_shift_details) ? r.equipment_shift_details[0] : r?.equipment_shift_details;
          const statuses = detail?.equipment_shift_statuses ?? [];
          const statusList = Array.isArray(statuses) ? statuses : [statuses];
          const byOrder = new Map(statusList.map((st: any) => [st.asset_display_order_snapshot, st.status_code]));

          const primaryName = r?.profiles?.full_name ? r.profiles.full_name.split(" ").slice(-2).join(" ") : null;
          const coWorkerName = detail?.co_worker_name ? detail.co_worker_name.split(" ").slice(-2).join(" ") : null;
          const userName = primaryName && coWorkerName ? `${primaryName} - ${coWorkerName}` : (primaryName || coWorkerName || null);

          const row = sheet.getRow(rowIndex);
          row.height = row.height || 27;

          sheet.getCell(`A${rowIndex}`).value = sIdx === 0 ? d : null;
          sheet.getCell(`B${rowIndex}`).value = sIdx === 0 ? userName : null;
          sheet.getCell(`C${rowIndex}`).value = shift.time;

          pageSpec.devices.forEach((device) => {
            const val = byOrder.get(device.order) ?? byOrder.get(device.sourceAssetOrder) ?? null;
            sheet.getCell(`${device.column}${rowIndex}`).value = val;
          });

          sheet.getCell(`${pageSpec.noteCell}${rowIndex}`).value = r?.note ?? null;
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = cell.border ?? thinBorder;
            cell.alignment = cell.alignment ?? { vertical: "middle", horizontal: "center", wrapText: true };
          });
          rowIndex++;
        }
      }
    }

    const summary = workbook.addWorksheet("Tổng quan");
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
    summary.state = "hidden";

    return workbook;
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
    pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  if (model.templateCode.includes("BM.01/QL.HTAT")) {
    const dates: string[] = [];
    const yearNum = Number(model.period.period_start.split("-")[0]);
    const monthNum = Number(model.period.period_start.split("-")[1]);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(`${monthPrefix}-${String(i).padStart(2, "0")}`);
    }

    const columns = ["Mã bản ghi", "Ngày", "Ca / Lần đo", "Giờ đo", "Nhiệt độ (°C)", "Độ ẩm (%)", "Đánh giá ISO", "Người thực hiện", "Ghi chú", "Lỗi nhiệt độ", "Lỗi độ ẩm"];
    data.columns = columns.map((header, index) => ({ header, key: `c${index}`, width: 16 }));

    const slots = [{ slot: "MORNING", label: "Sáng", time: "08:30" }, { slot: "AFTERNOON", label: "Chiều", time: "14:30" }];
    for (const dateStr of dates) {
      for (const slot of slots) {
        const r = records.find((rec: any) => rec.business_date === dateStr && (rec.slot_code === slot.slot || rec.slot_code === slot.label));
        const m = Array.isArray(r?.measurement_details) ? r.measurement_details[0] : r?.measurement_details;
        const rowData = [
          r?.id ?? null,
          dateStr,
          slot.label,
          r?.performed_at ? new Date(r.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
          m?.temperature_c ?? null,
          m?.humidity_pct ?? null,
          r ? (r.is_na ? `N/A: ${r.na_reason ?? ""}` : (m?.temperature_abnormal || m?.humidity_abnormal ? "Ngoài ngưỡng" : null)) : null,
          r?.profiles?.full_name ?? null,
          r?.note ?? null,
          m?.temperature_abnormal ?? null,
          m?.humidity_abnormal ?? null,
        ];
        data.addRow(rowData);
      }
    }
  } else if (!model.templateCode.includes("BM.02") && !model.templateCode.includes("BM.03") && !model.templateCode.includes("KNBM")) {
    // Generic fallback (e.g. templateCode: "BM.01")
    data.columns = ["Mã bản ghi", "STT", "Ngày", "Ca / Thời gian", "Loại bản ghi", "Thời điểm đo", "Người thực hiện", "Ghi chú"].map((header, index) => ({ header, key: `c${index}`, width: 16 }));
    records.forEach((r: any, idx: number) => {
      data.addRow([r.id, idx + 1, r.business_date, r.slot_code ?? null, r.record_type, r.performed_at ?? null, r.profiles?.full_name ?? null, r.note ?? null]);
    });
  } else {
    data.columns = model.columns.map((header, index) => ({
      header,
      key: `c${index}`,
      width: Math.min(Math.max(header.length + 4, 10), 28),
    }));

    for (const rowModel of model.rows) {
      data.addRow(Object.fromEntries(rowModel.cells.map((cell, index) => [`c${index}`, cell])));
    }
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

  return workbook;
}

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

  const isLegacy = search.get("legacy") === "1" || search.get("format") === "raw";
  const safeCode = model.templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (model.period.period_label ?? `${model.period.period_start}_${model.period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");

  if (isLegacy) {
    const legacyWb = await buildLegacyExcelWorkbook(report, model);
    const bytes = await legacyWb.xlsx.writeBuffer();
    const filename = `${model.filenamePrefix}${safeCode}_${periodSlug}.xlsx`;
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const cycle = search.get("cycle") ? Math.max(1, Number(search.get("cycle"))) : 1;

  try {
    const canonicalBuffer = await buildCanonicalReportWorkbook(model, cycle);
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

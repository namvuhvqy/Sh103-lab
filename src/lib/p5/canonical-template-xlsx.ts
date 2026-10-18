import { existsSync } from "node:fs";
import { join } from "node:path";
import XlsxPopulate from "xlsx-populate";
import { buildBm06WorkbookFromTemplate } from "@/lib/p5/bm06-template-xlsx";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

function parseMonthYear(startDateStr: string) {
  const parts = startDateStr.split("-");
  return {
    year: parts[0] || "2026",
    month: parts[1] || "10",
  };
}

function resolveTemplatePath(filename: string): string {
  const p1 = join(process.cwd(), "docs", "danh mục biểu mẫu", filename);
  if (existsSync(p1)) return p1;
  const p2 = join(process.cwd(), "public", "templates", filename);
  if (existsSync(p2)) return p2;
  return p1;
}

export async function buildCanonicalReportWorkbook(model: ReportExportModel, cycle = 1): Promise<Buffer> {
  const code = model.templateCode;

  // 1. BM.06: Nhật ký hoạt động TTB (3 ngày/đợt)
  if (code.includes("BM.06")) {
    return buildBm06WorkbookFromTemplate(model, cycle);
  }

  const { year, month } = parseMonthYear(model.period.period_start);

  // 2. BM.01/QL.HTAT: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
  if (code.includes("BM.01/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.01_QL.HTAT_TD nhiệt độ PXN.xlsx");
    const wb = await XlsxPopulate.fromFileAsync(templatePath);
    const ws = wb.sheet(0);

    const locName = model.period.locations?.name || "Khu vực Xét nghiệm";
    ws.cell("A4").value(`Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}`);

    // Populate day rows (Day 1 starts at Row 9)
    for (const rowModel of model.rows) {
      const [dayVal, timeM, timeA, tempM, tempA, humM, humA, noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;
      const r = 8 + day;

      ws.cell(`B${r}`).value(timeM ? String(timeM) : "");
      ws.cell(`C${r}`).value(timeA ? String(timeA) : "");
      ws.cell(`D${r}`).value(tempM !== null && tempM !== undefined ? Number(tempM) : "");
      ws.cell(`E${r}`).value(tempA !== null && tempA !== undefined ? Number(tempA) : "");
      ws.cell(`F${r}`).value(humM !== null && humM !== undefined ? Number(humM) : "");
      ws.cell(`G${r}`).value(humA !== null && humA !== undefined ? Number(humA) : "");
      ws.cell(`H${r}`).value(noteVal ? String(noteVal) : "");
      ws.cell(`I${r}`).value(performerName ? String(performerName) : "");
    }

    // Ensure full crisp borders and fonts on the entire data range
    ws.range("A9:I39").style({
      border: true,
      fontFamily: "Times New Roman",
      fontSize: 10,
      verticalAlignment: "center",
      horizontalAlignment: "center",
    });

    const buffer = await wb.outputAsync();
    return Buffer.from(buffer);
  }

  // 3. BM.02/QL.HTAT.01: Theo dõi tủ lạnh mát (2-8°C)
  if (code.includes("BM.02/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.02.QL.HTAT.01_TD tủ lạnh mát.xlsx");
    const wb = await XlsxPopulate.fromFileAsync(templatePath);
    const ws = wb.sheet("Mat") || wb.sheet(0);

    const assetName = model.period.assets?.source_name || "Tủ lạnh mát 2-8°C";
    ws.cell("A5").value(`Tên thiết bị: ${assetName} - Tháng ${month} Năm ${year}`);
    if (model.period.assets?.source_code) {
      ws.cell("A7").value(`Mã thiết bị theo dõi: ${model.period.assets.source_code}`);
    }

    // Fill daily temperatures (Day 1: S=Col B (2), C=Col C (3))
    for (const rowModel of model.rows) {
      const [dayVal, tempM, tempA, , , performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;

      const colS = 2 * day;     // Day 1 => col 2 (B)
      const colC = 2 * day + 1; // Day 1 => col 3 (C)

      ws.cell(9, colS).value(tempM !== null && tempM !== undefined ? Number(tempM) : "");
      ws.cell(9, colC).value(tempA !== null && tempA !== undefined ? Number(tempA) : "");

      if (performerName) {
        ws.cell(26, colS).value(String(performerName));
      } else {
        ws.cell(26, colS).value("");
      }
    }

    const buffer = await wb.outputAsync();
    return Buffer.from(buffer);
  }

  // 4. BM.03/QL.HTAT.01: Theo dõi tủ lạnh đá (-20°C)
  if (code.includes("BM.03/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.03.QL.HTAT.01_TD tủ lạnh đá.xlsx");
    const wb = await XlsxPopulate.fromFileAsync(templatePath);
    const ws = wb.sheet("NganDa") || wb.sheet(0);

    const assetName = model.period.assets?.source_name || "Tủ lạnh đá -20°C";
    const assetCodePart = model.period.assets?.source_code ? ` (Mã: ${model.period.assets.source_code})` : "";
    ws.cell("A4").value(`Tên thiết bị: ${assetName}${assetCodePart} - Tháng ${month} Năm ${year}`);

    for (const rowModel of model.rows) {
      const [dayVal, tempM, tempA, , , performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;

      const colS = 2 * day;     // Day 1 => col 2 (B)
      const colC = 2 * day + 1; // Day 1 => col 3 (C)

      ws.cell(8, colS).value(tempM !== null && tempM !== undefined ? Number(tempM) : "");
      ws.cell(8, colC).value(tempA !== null && tempA !== undefined ? Number(tempA) : "");

      if (performerName) {
        ws.cell(30, colS).value(String(performerName));
      } else {
        ws.cell(30, colS).value("");
      }
    }

    const buffer = await wb.outputAsync();
    return Buffer.from(buffer);
  }

  // 5. BM.01_KNBM: Theo dõi khử nhiễm bề mặt
  if (code.includes("BM.01_KNBM") || code.includes("KNBM")) {
    const templatePath = resolveTemplatePath("BM.01_KNBM.xlsx");
    const wb = await XlsxPopulate.fromFileAsync(templatePath);
    const ws = wb.sheet(0);

    const locName = model.period.locations?.name || "Khu vực xét nghiệm";
    ws.cell("A4").value(`Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}`);

    for (const rowModel of model.rows) {
      const [dayVal, dailyVal, weeklyVal, spillVal, noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;
      const r = 7 + day; // Day 1 = Row 8

      ws.cell(`B${r}`).value(dailyVal ? "X" : "");
      ws.cell(`C${r}`).value(weeklyVal ? "X" : "");
      ws.cell(`D${r}`).value(spillVal ? "X" : "");
      ws.cell(`E${r}`).value(noteVal ? String(noteVal) : "");
      ws.cell(`F${r}`).value(performerName ? String(performerName) : "");
    }

    ws.range("A8:F38").style({
      border: true,
      fontFamily: "Times New Roman",
      fontSize: 10,
      verticalAlignment: "center",
      horizontalAlignment: "center",
    });

    const buffer = await wb.outputAsync();
    return Buffer.from(buffer);
  }

  // 6. BM.02/QL.TRTB: Bảng theo dõi - bảo dưỡng TTB
  const templatePath = resolveTemplatePath("BM.02.Bảng theo dõi - bảo dưỡng TTB.xlsx");
  const wb = await XlsxPopulate.fromFileAsync(templatePath);
  const ws = wb.sheet(0);

  const assetName = model.period.assets?.source_name || "Thiết bị xét nghiệm";
  ws.cell("A5").value(`Tháng ${month}                             Năm ${year}`);
  ws.cell("H4").value(`MÁY: ${assetName}`);

  for (const rowModel of model.rows) {
    const [dayVal, , resultVal, performerName] = rowModel.cells;
    const day = Number(dayVal);
    if (!day || day < 1 || day > 31) continue;

    // Col C is Day 1 (col index 3)
    const colIdx = 2 + day;

    ws.cell(9, colIdx).value(resultVal ? String(resultVal) : "");
    if (performerName) {
      ws.cell(22, colIdx).value(String(performerName));
    } else {
      ws.cell(22, colIdx).value("");
    }
  }

  const buffer = await wb.outputAsync();
  return Buffer.from(buffer);
}

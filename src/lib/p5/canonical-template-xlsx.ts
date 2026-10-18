import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
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

export async function buildCanonicalReportWorkbook(model: ReportExportModel): Promise<Buffer> {
  const code = model.templateCode;

  // 1. BM.06: Delegate to dedicated 3-day cycle SheetJS builder
  if (code.includes("BM.06")) {
    return buildBm06WorkbookFromTemplate(model);
  }

  const { year, month } = parseMonthYear(model.period.period_start);

  // 2. BM.01/QL.HTAT: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
  if (code.includes("BM.01/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.01_QL.HTAT_TD nhiệt độ PXN.xlsx");
    const raw = readFileSync(templatePath);
    const wb = XLSX.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets[wb.SheetNames[0]];

    const locName = model.period.locations?.name || "Khu vực Xét nghiệm";
    ws["A4"] = { t: "s", v: `Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}` };

    // Populate day rows (Day 1 starts at Row 9)
    for (const rowModel of model.rows) {
      const [dayVal, timeM, timeA, tempM, tempA, humM, humA, noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;
      const r = 8 + day;

      if (timeM) ws[`B${r}`] = { t: "s", v: String(timeM) }; else delete ws[`B${r}`];
      if (timeA) ws[`C${r}`] = { t: "s", v: String(timeA) }; else delete ws[`C${r}`];
      if (tempM !== null && tempM !== undefined) ws[`D${r}`] = { t: "n", v: Number(tempM) }; else delete ws[`D${r}`];
      if (tempA !== null && tempA !== undefined) ws[`E${r}`] = { t: "n", v: Number(tempA) }; else delete ws[`E${r}`];
      if (humM !== null && humM !== undefined) ws[`F${r}`] = { t: "n", v: Number(humM) }; else delete ws[`F${r}`];
      if (humA !== null && humA !== undefined) ws[`G${r}`] = { t: "n", v: Number(humA) }; else delete ws[`G${r}`];
      if (noteVal) ws[`H${r}`] = { t: "s", v: String(noteVal) }; else delete ws[`H${r}`];
      if (performerName) ws[`I${r}`] = { t: "s", v: String(performerName) }; else delete ws[`I${r}`];
    }

    const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(bytes);
  }

  // 3. BM.02/QL.HTAT.01: Theo dõi tủ lạnh mát
  if (code.includes("BM.02/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.02.QL.HTAT.01_TD tủ lạnh mát.xlsx");
    const raw = readFileSync(templatePath);
    const wb = XLSX.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["Mat"] || wb.Sheets[wb.SheetNames[0]];

    const assetName = model.period.assets?.source_name || "Tủ lạnh mát 2-8°C";
    ws["A5"] = { t: "s", v: `Tên thiết bị: ${assetName} - Tháng ${month} Năm ${year}` };
    if (model.period.assets?.source_code) {
      ws["A7"] = { t: "s", v: `Mã thiết bị theo dõi: ${model.period.assets.source_code}` };
    }

    // Fill daily temperatures (Day 1: S=Col B, C=Col C)
    for (const rowModel of model.rows) {
      const [dayVal, tempM, tempA, , noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;

      const colSIdx = 1 + (day - 1) * 2; // B=1 (0-indexed)
      const colCIdx = 1 + (day - 1) * 2 + 1; // C=2
      const colS = XLSX.utils.encode_col(colSIdx);
      const colC = XLSX.utils.encode_col(colCIdx);

      if (tempM !== null && tempM !== undefined) {
        ws[`${colS}9`] = { t: "n", v: Number(tempM) };
      } else {
        delete ws[`${colS}9`];
      }

      if (tempA !== null && tempA !== undefined) {
        ws[`${colC}9`] = { t: "n", v: Number(tempA) };
      } else {
        delete ws[`${colC}9`];
      }

      if (performerName) {
        ws[`${colS}26`] = { t: "s", v: String(performerName) };
      } else {
        delete ws[`${colS}26`];
      }
    }

    const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(bytes);
  }

  // 4. BM.03/QL.HTAT.01: Theo dõi tủ lạnh đá (-20°C)
  if (code.includes("BM.03/QL.HTAT")) {
    const templatePath = resolveTemplatePath("BM.03.QL.HTAT.01_TD tủ lạnh đá.xlsx");
    const raw = readFileSync(templatePath);
    const wb = XLSX.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["NganDa"] || wb.Sheets[wb.SheetNames[0]];

    const assetName = model.period.assets?.source_name || "Tủ lạnh đá -20°C";
    const assetCodePart = model.period.assets?.source_code ? ` (Mã: ${model.period.assets.source_code})` : "";
    ws["A4"] = { t: "s", v: `Tên thiết bị: ${assetName}${assetCodePart} - Tháng ${month} Năm ${year}` };

    for (const rowModel of model.rows) {
      const [dayVal, tempM, tempA, , noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;

      const colSIdx = 1 + (day - 1) * 2;
      const colCIdx = 1 + (day - 1) * 2 + 1;
      const colS = XLSX.utils.encode_col(colSIdx);
      const colC = XLSX.utils.encode_col(colCIdx);

      if (tempM !== null && tempM !== undefined) {
        ws[`${colS}8`] = { t: "n", v: Number(tempM) };
      } else {
        delete ws[`${colS}8`];
      }

      if (tempA !== null && tempA !== undefined) {
        ws[`${colC}8`] = { t: "n", v: Number(tempA) };
      } else {
        delete ws[`${colC}8`];
      }

      if (performerName) {
        ws[`${colS}30`] = { t: "s", v: String(performerName) };
      } else {
        delete ws[`${colS}30`];
      }
    }

    const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(bytes);
  }

  // 5. BM.01_KNBM: Theo dõi khử nhiễm bề mặt
  if (code.includes("BM.01_KNBM") || code.includes("KNBM")) {
    const templatePath = resolveTemplatePath("BM.01_KNBM.xlsx");
    const raw = readFileSync(templatePath);
    const wb = XLSX.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets[wb.SheetNames[0]];

    const locName = model.period.locations?.name || "Khu vực xét nghiệm";
    ws["A4"] = { t: "s", v: `Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}` };

    for (const rowModel of model.rows) {
      const [dayVal, dailyVal, weeklyVal, spillVal, noteVal, performerName] = rowModel.cells;
      const day = Number(dayVal);
      if (!day || day < 1 || day > 31) continue;
      const r = 7 + day; // Day 1 = Row 8

      if (dailyVal) ws[`B${r}`] = { t: "s", v: "X" }; else delete ws[`B${r}`];
      if (weeklyVal) ws[`C${r}`] = { t: "s", v: "X" }; else delete ws[`C${r}`];
      if (spillVal) ws[`D${r}`] = { t: "s", v: "X" }; else delete ws[`D${r}`];
      if (noteVal) ws[`E${r}`] = { t: "s", v: String(noteVal) }; else delete ws[`E${r}`];
      if (performerName) ws[`F${r}`] = { t: "s", v: String(performerName) }; else delete ws[`F${r}`];
    }

    const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(bytes);
  }

  // 6. BM.02/QL.TRTB: Bảng theo dõi - bảo dưỡng TTB
  const templatePath = resolveTemplatePath("BM.02.Bảng theo dõi - bảo dưỡng TTB.xlsx");
  const raw = readFileSync(templatePath);
  const wb = XLSX.read(raw, { type: "buffer", cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];

  const assetName = model.period.assets?.source_name || "Thiết bị xét nghiệm";
  ws["A5"] = { t: "s", v: `Tháng ${month}                             Năm ${year}` };
  ws["H4"] = { t: "s", v: `MÁY: ${assetName}` };

  for (const rowModel of model.rows) {
    const [dayVal, cadenceVal, resultVal, performerName] = rowModel.cells;
    const day = Number(dayVal);
    if (!day || day < 1 || day > 31) continue;

    // Col C is Day 1 (index 2)
    const colIdx = 1 + day;
    const colLetter = XLSX.utils.encode_col(colIdx);

    if (resultVal) {
      ws[`${colLetter}9`] = { t: "s", v: String(resultVal) };
    }
    if (performerName) {
      ws[`${colLetter}22`] = { t: "s", v: String(performerName) };
    }
  }

  const bytes = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(bytes);
}

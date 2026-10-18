import { join } from "node:path";
import ExcelJS from "exceljs";
import { buildBm06WorkbookFromTemplate } from "@/lib/p5/bm06-template-xlsx";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

const centerAlign: Partial<ExcelJS.Alignment> = {
  vertical: "middle",
  horizontal: "center",
  wrapText: true,
};

const leftAlign: Partial<ExcelJS.Alignment> = {
  vertical: "middle",
  horizontal: "left",
  wrapText: true,
};

function parseMonthYear(startDateStr: string) {
  const parts = startDateStr.split("-");
  return {
    year: parts[0] || "2026",
    month: parts[1] || "10",
  };
}

function getDayFromDate(dateStr: string) {
  const parts = dateStr.split("-");
  return Number.parseInt(parts[2] || "1", 10);
}

function applyCellFormat(cell: ExcelJS.Cell, value: unknown, align = centerAlign) {
  if (value !== undefined && value !== null) {
    cell.value = value as ExcelJS.CellValue;
  }
  cell.border = thinBorder;
  cell.alignment = align;
  if (!cell.font) {
    cell.font = { name: "Times New Roman", size: 10 };
  }
}

export async function buildCanonicalReportWorkbook(model: ReportExportModel): Promise<Buffer> {
  const code = model.templateCode;

  // 1. BM.06: Delegate to dedicated 3-day cycle canonical builder
  if (code.includes("BM.06")) {
    const wb = await buildBm06WorkbookFromTemplate(model);
    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  const templateDir = join(process.cwd(), "docs", "danh mục biểu mẫu");
  const { year, month } = parseMonthYear(model.period.period_start);

  // 2. BM.01/QL.HTAT: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
  if (code.includes("BM.01/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.01_QL.HTAT_TD nhiệt độ PXN.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    const locName = model.period.locations?.name || "Khu Vực Xét Nghiệm";
    ws.getCell("A4").value = `Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}`;
    ws.getCell("A5").value = `Mã thiết bị theo dõi: BM103-NK    (Số hiệu nhiệt ẩm kế: NAK-01)`;

    // Populate day rows (Day 1 starts at Row 9)
    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, timeStr, tempVal, humVal, , performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const r = 8 + day;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      if (isMorning) {
        applyCellFormat(ws.getCell(`B${r}`), timeStr || "08:30");
        applyCellFormat(ws.getCell(`D${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
        applyCellFormat(ws.getCell(`F${r}`), humVal !== null && humVal !== undefined ? Number(humVal) : null);
      } else {
        applyCellFormat(ws.getCell(`C${r}`), timeStr || "14:30");
        applyCellFormat(ws.getCell(`E${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
        applyCellFormat(ws.getCell(`G${r}`), humVal !== null && humVal !== undefined ? Number(humVal) : null);
      }

      if (noteVal) applyCellFormat(ws.getCell(`H${r}`), String(noteVal), leftAlign);
      if (performerName) applyCellFormat(ws.getCell(`I${r}`), String(performerName), leftAlign);
    }

    // Ensure all 31 rows are fully bordered
    for (let d = 1; d <= 31; d++) {
      const r = 8 + d;
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 3. BM.02/QL.HTAT.01: Theo dõi tủ lạnh mát
  if (code.includes("BM.02/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.02.QL.HTAT.01_TD tủ lạnh mát.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("Mat") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    const assetName = model.period.assets?.source_name || "Tủ lạnh mát 2-8°C";
    const assetCode = model.period.assets?.source_code || "TLM-103";
    ws.getCell("A5").value = `Tên thiết bị: ${assetName} - Tháng ${month} Năm ${year}`;
    ws.getCell("A6").value = `Người quản lý : Cán bộ trực Lab`;
    ws.getCell("A7").value = `Mã thiết bị theo dõi: ${assetCode}`;

    // Fill daily temperatures
    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, , tempVal, , performerName] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const colIdx = 1 + (day - 1) * 2 + (isMorning ? 1 : 2); // Day 1: S=Col B (2), C=Col C (3)

      if (tempVal !== null && tempVal !== undefined) {
        // Place value in Row 9 or closest temp row
        const cell = ws.getRow(9).getCell(colIdx);
        cell.value = Number(tempVal);
        cell.alignment = centerAlign;
      }
      if (performerName) {
        const signCell = ws.getRow(27).getCell(colIdx);
        signCell.value = String(performerName);
        signCell.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 4. BM.03/QL.HTAT.01: Theo dõi tủ lạnh đá (-20°C)
  if (code.includes("BM.03/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.03.QL.HTAT.01_TD tủ lạnh đá.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("NganDa") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    const assetName = model.period.assets?.source_name || "Tủ lạnh đá -20°C";
    const assetCode = model.period.assets?.source_code || "TLD-103";
    ws.getCell("A4").value = `Tên thiết bị: ${assetName} (Mã: ${assetCode}) - Tháng ${month} Năm ${year}`;
    ws.getCell("A5").value = `Người quản lý : Cán bộ trực Lab`;

    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, , tempVal, , performerName] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const colIdx = 1 + (day - 1) * 2 + (isMorning ? 1 : 2);

      if (tempVal !== null && tempVal !== undefined) {
        const cell = ws.getRow(8).getCell(colIdx);
        cell.value = Number(tempVal);
        cell.alignment = centerAlign;
      }
      if (performerName) {
        const signCell = ws.getRow(27).getCell(colIdx);
        signCell.value = String(performerName);
        signCell.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 5. BM.01_KNBM: Theo dõi khử nhiễm bề mặt
  if (code.includes("BM.01_KNBM") || code.includes("KNBM")) {
    const templatePath = join(templateDir, "BM.01_KNBM.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };

    const locName = model.period.locations?.name || "Khu vực xét nghiệm";
    ws.getCell("A4").value = `Khu vực: ${locName} - Thời gian: tháng ${month} năm ${year}`;

    for (const rowModel of model.rows) {
      const [, dateStr, , dailyVal, weeklyVal, spillVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const r = 7 + day; // Day 1 = Row 8

      applyCellFormat(ws.getCell(`B${r}`), dailyVal ? "X" : null);
      applyCellFormat(ws.getCell(`C${r}`), weeklyVal ? "X" : null);
      applyCellFormat(ws.getCell(`D${r}`), spillVal ? "X" : null);
      applyCellFormat(ws.getCell(`E${r}`), noteVal || null, leftAlign);
      applyCellFormat(ws.getCell(`F${r}`), performerName || null, leftAlign);
    }

    for (let r = 8; r <= 38; r++) {
      for (const col of ["A", "B", "C", "D", "E", "F"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 6. BM.02/QL.TRTB: Bảng theo dõi - bảo dưỡng TTB
  const templatePath = join(templateDir, "BM.02.Bảng theo dõi - bảo dưỡng TTB.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  const assetName = model.period.assets?.source_name || "Máy xét nghiệm";
  ws.getCell("H4").value = `MÁY: ${assetName}`;
  ws.getCell("A5").value = `Tháng ${month} Năm ${year}`;

  for (const rowModel of model.rows) {
    const [, dateStr, , cadenceVal, resultVal, performerName] = rowModel.cells;
    if (!dateStr) continue;
    const day = getDayFromDate(String(dateStr));
    if (day < 1 || day > 31) continue;
    const colIdx = 2 + day; // Day 1 = Col C (3)

    const cadence = String(cadenceVal || "DAILY").toUpperCase();
    const isFail = resultVal === "FAIL";
    const mark = isFail ? "KĐ" : "✓";

    if (cadence.includes("MONTH") || cadence.includes("THÁNG")) {
      applyCellFormat(ws.getRow(10).getCell(colIdx), mark);
    } else if (cadence.includes("WEEK") || cadence.includes("TUẦN")) {
      applyCellFormat(ws.getRow(9).getCell(colIdx), mark);
    } else {
      applyCellFormat(ws.getRow(8).getCell(colIdx), mark);
    }

    if (performerName) {
      applyCellFormat(ws.getRow(11).getCell(colIdx), String(performerName), centerAlign);
    }
  }

  const bytes = await wb.xlsx.writeBuffer();
  return Buffer.from(bytes);
}

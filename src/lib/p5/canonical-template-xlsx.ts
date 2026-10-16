import { join } from "node:path";
import ExcelJS from "exceljs";
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
  const templateDir = join(process.cwd(), "docs", "danh mục biểu mẫu");
  const { year, month } = parseMonthYear(model.period.period_start);
  const code = model.templateCode;

  // 1. BM.01/QL.HTAT.01: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
  if (code.includes("BM.01/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.01_QL.HTAT.01_Nhiet_Do_PXN.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);

    // Map location to primary sheet
    const locName = (model.period.locations?.name || "").toLowerCase();
    let primarySheetName = "SINH_HOA";
    if (locName.includes("nước tiểu") || locName.includes("nuoc tieu")) primarySheetName = "NUOC_TIEU";
    else if (locName.includes("sinh hóa") || locName.includes("sinh hoa")) primarySheetName = "SINH_HOA";
    else if (locName.includes("miễn dịch") || locName.includes("mien dich")) primarySheetName = "MIEN_DICH";
    else if (locName.includes("automation")) primarySheetName = "AUTOMATION";
    else if (locName.includes("ro") || locName.includes("lọc nước") || locName.includes("loc nuoc") || locName.includes("ly tâm")) primarySheetName = "LOC_NUOC_RO";

    // Setup all sheets
    for (const ws of wb.worksheets) {
      ws.pageSetup = {
        paperSize: 9, // A4
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      };
      const d4 = ws.getCell("D4");
      d4.value = `Thời gian: Tháng ${month} Năm ${year}`;
      d4.font = { name: "Times New Roman", size: 11, italic: true };
    }

    const ws = wb.getWorksheet(primarySheetName) || wb.worksheets[0];
    const primaryIdx = wb.worksheets.findIndex((w) => w.name === ws.name);
    if (primaryIdx >= 0) {
      wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: primaryIdx, visibility: "visible" }];
    }

    // Populate 31 days data
    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, timeStr, tempVal, humVal, evalVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const r = 7 + day;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      if (isMorning) {
        applyCellFormat(ws.getCell(`B${r}`), timeStr || "08:30");
        applyCellFormat(ws.getCell(`C${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
        applyCellFormat(ws.getCell(`D${r}`), humVal !== null && humVal !== undefined ? Number(humVal) : null);
      } else {
        applyCellFormat(ws.getCell(`E${r}`), timeStr || "14:30");
        applyCellFormat(ws.getCell(`F${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
        applyCellFormat(ws.getCell(`G${r}`), humVal !== null && humVal !== undefined ? Number(humVal) : null);
      }

      const evalText = evalVal === "Ngoài ngưỡng" ? "KĐ" : tempVal !== null && tempVal !== undefined ? "Đạt" : null;
      applyCellFormat(ws.getCell(`H${r}`), evalText);
      applyCellFormat(ws.getCell(`I${r}`), noteVal || null, leftAlign);
      applyCellFormat(ws.getCell(`J${r}`), performerName || null, leftAlign);
    }

    // Ensure all 31 rows are fully bordered
    for (let d = 1; d <= 31; d++) {
      const r = 7 + d;
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 2. BM.02/QL.HTAT.01: Theo dõi tủ lạnh mát (2°C – 8°C)
  if (code.includes("BM.02/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.02_QL.HTAT.01_Tu_Lanh_Mat.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("Tu_Lanh_Mat") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    ws.getCell("A4").value = `Tên thiết bị: ${model.period.assets?.source_name || "Tủ lạnh mát"}`;
    ws.getCell("D4").value = `Mã thiết bị: ${model.period.assets?.source_code || "TLM-103"}`;
    ws.getCell("D5").value = `Thời gian: Tháng ${month} Năm ${year}`;

    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, , tempVal, evalVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const r = isMorning ? 9 + (day - 1) * 2 : 10 + (day - 1) * 2;

      applyCellFormat(ws.getCell(`C${r}`), isMorning ? "08:30" : "14:30");
      applyCellFormat(ws.getCell(`D${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
      applyCellFormat(ws.getCell(`E${r}`), "2 – 8°C");
      applyCellFormat(ws.getCell(`F${r}`), evalVal === "Ngoài dải an toàn" ? "KĐ" : tempVal !== null && tempVal !== undefined ? "Đạt" : null);
      applyCellFormat(ws.getCell(`G${r}`), performerName || null, leftAlign);
      applyCellFormat(ws.getCell(`H${r}`), noteVal || null, leftAlign);
    }

    // Border all cells from row 9 to 70
    for (let r = 9; r <= 70; r++) {
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 3. BM.03/QL.HTAT.01: Theo dõi tủ đông / tủ đá (-10°C đến -30°C)
  if (code.includes("BM.03/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.03_QL.HTAT.01_Tu_Lanh_Da.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("Tu_Lanh_Da") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    ws.getCell("A4").value = `Tên thiết bị: ${model.period.assets?.source_name || "Tủ đông / tủ đá"}`;
    ws.getCell("D4").value = `Mã thiết bị: ${model.period.assets?.source_code || "TD-103"}`;
    ws.getCell("D5").value = `Thời gian: Tháng ${month} Năm ${year}`;

    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, , tempVal, evalVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const r = isMorning ? 9 + (day - 1) * 2 : 10 + (day - 1) * 2;

      applyCellFormat(ws.getCell(`C${r}`), isMorning ? "08:30" : "14:30");
      applyCellFormat(ws.getCell(`D${r}`), tempVal !== null && tempVal !== undefined ? Number(tempVal) : null);
      applyCellFormat(ws.getCell(`E${r}`), "-30 đến -10°C");
      applyCellFormat(ws.getCell(`F${r}`), evalVal === "Ngoài dải an toàn" ? "KĐ" : tempVal !== null && tempVal !== undefined ? "Đạt" : null);
      applyCellFormat(ws.getCell(`G${r}`), performerName || null, leftAlign);
      applyCellFormat(ws.getCell(`H${r}`), noteVal || null, leftAlign);
    }

    for (let r = 9; r <= 70; r++) {
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 4. BM.01_KNBM: Phiếu theo dõi khử nhiễm bề mặt khu vực làm việc
  if (code.includes("BM.01_KNBM") || code.includes("KNBM")) {
    const templatePath = join(templateDir, "BM.01_KNBM_Khu_Nhiem_Be_Mat.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("Khu_Nhiem") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };

    ws.getCell("A3").value = `Khu vực: ${model.period.locations?.name || "Khu vực xét nghiệm"}`;
    ws.getCell("C3").value = `Thời gian: Tháng ${month} Năm ${year}`;

    for (const rowModel of model.rows) {
      const [, dateStr, , dailyVal, weeklyVal, spillVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const r = 5 + day;

      applyCellFormat(ws.getCell(`B${r}`), dailyVal ? "✓" : null);
      applyCellFormat(ws.getCell(`C${r}`), weeklyVal ? "✓" : null);
      applyCellFormat(ws.getCell(`D${r}`), spillVal ? "✓" : null);
      applyCellFormat(ws.getCell(`E${r}`), noteVal || null, leftAlign);
      applyCellFormat(ws.getCell(`F${r}`), performerName || null, leftAlign);
    }

    for (let r = 6; r <= 36; r++) {
      for (const col of ["A", "B", "C", "D", "E", "F"]) {
        const c = ws.getCell(`${col}${r}`);
        c.border = thinBorder;
        if (!c.alignment) c.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 5. BM.02/QL.TRTB.01: Bảng theo dõi – bảo dưỡng trang thiết bị
  if (code.includes("BM.02/QL.TRTB")) {
    const templatePath = join(templateDir, "BM.02_QL.TRTB.01_Bao_Duong_TTB.xlsx");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.getWorksheet("Bao_Duong") || wb.worksheets[0];

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    ws.getCell("A3").value = `Tên máy: ${model.period.assets?.source_name || "Máy xét nghiệm"}`;
    ws.getCell("D3").value = `Tháng ${month} Năm ${year}`;

    for (const rowModel of model.rows) {
      const [, dateStr, , cadenceVal, resultVal, performerName] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const colIdx = 1 + day; // Day 1 = Col B (index 2 in 1-based ExcelJS)

      const cadence = String(cadenceVal || "DAILY").toUpperCase();
      if (cadence.includes("MONTH") || cadence.includes("THÁNG")) {
        applyCellFormat(ws.getRow(13).getCell(colIdx), resultVal === "FAIL" ? "KĐ" : "Đạt");
        applyCellFormat(ws.getRow(14).getCell(colIdx), performerName || null, leftAlign);
      } else if (cadence.includes("WEEK") || cadence.includes("TUẦN")) {
        applyCellFormat(ws.getRow(10).getCell(colIdx), resultVal === "FAIL" ? "KĐ" : "Đạt");
        applyCellFormat(ws.getRow(11).getCell(colIdx), performerName || null, leftAlign);
      } else {
        applyCellFormat(ws.getRow(7).getCell(colIdx), resultVal === "FAIL" ? "KĐ" : "Đạt");
        applyCellFormat(ws.getRow(8).getCell(colIdx), performerName || null, leftAlign);
      }
    }

    // Border table from row 5 to 14, columns 1 to 32
    for (let r = 5; r <= 14; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 32; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        if (!cell.alignment) cell.alignment = centerAlign;
      }
    }

    const bytes = await wb.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  // 6. BM.06/QL.TRTB.01: Nhật ký hoạt động trang thiết bị (Phiên bản v4.1 - 25 máy x 4 ca)
  const templatePath = join(templateDir, "BM.06_QL.TRTB.01_Nhat_Ky_25_TTB_4_Ca_v4.1.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet("BM.06 v4.1") || wb.worksheets[0];

  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 },
  };

  ws.getCell("A4").value = `Quyển số: ..................    Từ ngày: ${model.period.period_start}    Đến ngày: ${model.period.period_end}`;

  for (const rowModel of model.rows) {
    const [, dateStr, performerName, , ...rest] = rowModel.cells;
    if (!dateStr) continue;
    const day = getDayFromDate(String(dateStr));
    if (day < 1 || day > 31) continue;

    const key = rowModel.key;
    let shiftIdx = 0;
    if (key.includes("SHIFT_2")) shiftIdx = 1;
    else if (key.includes("SHIFT_3")) shiftIdx = 2;
    else if (key.includes("SHIFT_4")) shiftIdx = 3;

    const r = 8 + (day - 1) * 4 + shiftIdx;

    if (performerName) {
      applyCellFormat(ws.getCell(`E${r}`), String(performerName), leftAlign);
    }

    const deviceStatuses = rest.slice(0, 25);
    deviceStatuses.forEach((status, devIdx) => {
      const colIdx = 6 + devIdx; // F = 6
      if (status !== null && status !== undefined && status !== "") {
        applyCellFormat(ws.getRow(r).getCell(colIdx), String(status), centerAlign);
      }
    });

    const note = rest[25];
    if (note) {
      applyCellFormat(ws.getCell(`AE${r}`), String(note), leftAlign);
    }
  }

  // Border all rows from 7 to 131, columns 1 to 31
  for (let r = 7; r <= 131; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 31; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      if (!cell.alignment) cell.alignment = centerAlign;
    }
  }

  const bytes = await wb.xlsx.writeBuffer();
  return Buffer.from(bytes);
}

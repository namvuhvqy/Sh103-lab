import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as xlsx from "xlsx";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

function setCell(ws: xlsx.WorkSheet, cellRef: string, value: string | number | null | undefined, type?: "s" | "n") {
  if (value === null || value === undefined || value === "") return;
  const t = type ?? (typeof value === "number" ? "n" : "s");
  const existing = ws[cellRef];
  if (existing) {
    existing.v = value;
    existing.t = t;
  } else {
    ws[cellRef] = { t, v: value };
  }
}

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

export async function buildCanonicalReportWorkbook(model: ReportExportModel): Promise<Buffer> {
  const templateDir = join(process.cwd(), "docs", "danh mục biểu mẫu");
  const { year, month } = parseMonthYear(model.period.period_start);
  const code = model.templateCode;

  // 1. BM.01/QL.HTAT.01: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
  if (code.includes("BM.01/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.01_QL.HTAT.01_Nhiet_Do_PXN.xlsx");
    const raw = await readFile(templatePath);
    const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });

    // Always update date on all sheets
    for (const sheetName of wb.SheetNames) {
      const s = wb.Sheets[sheetName];
      if (s) setCell(s, "D4", `Thời gian: Tháng ${month} Năm ${year}`);
    }

    // Map location to primary sheet
    const locName = (model.period.locations?.name || "").toLowerCase();
    let primarySheet = "SINH_HOA";
    if (locName.includes("nước tiểu") || locName.includes("nuoc tieu")) primarySheet = "NUOC_TIEU";
    else if (locName.includes("sinh hóa") || locName.includes("sinh hoa")) primarySheet = "SINH_HOA";
    else if (locName.includes("miễn dịch") || locName.includes("mien dich")) primarySheet = "MIEN_DICH";
    else if (locName.includes("automation")) primarySheet = "AUTOMATION";
    else if (locName.includes("ro") || locName.includes("lọc nước") || locName.includes("loc nuoc") || locName.includes("ly tâm")) primarySheet = "LOC_NUOC_RO";

    // Reorder sheet names so the active location is the first visible tab
    if (wb.SheetNames.includes(primarySheet)) {
      wb.SheetNames = [primarySheet, ...wb.SheetNames.filter((s) => s !== primarySheet)];
    }

    const ws = wb.Sheets[primarySheet];
    if (ws) {
      for (const rowModel of model.rows) {
        // rowModel.cells: [id, date, slot, time, temp, hum, evaluation, performer, note]
        const [, dateStr, slotLabel, timeStr, tempVal, humVal, evalVal, performerName, noteVal] = rowModel.cells;
        if (!dateStr) continue;
        const day = getDayFromDate(String(dateStr));
        if (day < 1 || day > 31) continue;
        const r = 7 + day; // Day 1 = Row 8

        const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
        if (isMorning) {
          if (timeStr) setCell(ws, `B${r}`, String(timeStr));
          if (tempVal !== null && tempVal !== undefined && tempVal !== "") setCell(ws, `C${r}`, Number(tempVal), "n");
          if (humVal !== null && humVal !== undefined && humVal !== "") setCell(ws, `D${r}`, Number(humVal), "n");
        } else {
          if (timeStr) setCell(ws, `E${r}`, String(timeStr));
          if (tempVal !== null && tempVal !== undefined && tempVal !== "") setCell(ws, `F${r}`, Number(tempVal), "n");
          if (humVal !== null && humVal !== undefined && humVal !== "") setCell(ws, `G${r}`, Number(humVal), "n");
        }

        if (evalVal) setCell(ws, `H${r}`, String(evalVal) === "Ngoài ngưỡng" ? "KĐ" : "Đạt");
        else if (tempVal !== null && tempVal !== undefined && tempVal !== "") setCell(ws, `H${r}`, "Đạt");

        if (noteVal) setCell(ws, `I${r}`, String(noteVal));
        if (performerName) setCell(ws, `J${r}`, String(performerName));
      }
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // 2. BM.02/QL.HTAT.01: Theo dõi tủ lạnh mát (2°C – 8°C)
  if (code.includes("BM.02/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.02_QL.HTAT.01_Tu_Lanh_Mat.xlsx");
    const raw = await readFile(templatePath);
    const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["Tu_Lanh_Mat"] || wb.Sheets[wb.SheetNames[0]];

    setCell(ws, "A4", `Tên thiết bị: ${model.period.assets?.source_name || "Tủ lạnh mát"}`);
    setCell(ws, "D4", `Mã thiết bị: ${model.period.assets?.source_code || "TLM-103"}`);
    setCell(ws, "D5", `Thời gian: Tháng ${month} Năm ${year}`);

    for (const rowModel of model.rows) {
      // rowModel.cells: [stt, date, slot, asset, temp, eval, performer, note]
      const [, dateStr, slotLabel, , tempVal, evalVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const r = isMorning ? 9 + (day - 1) * 2 : 10 + (day - 1) * 2;

      setCell(ws, `C${r}`, isMorning ? "08:30" : "14:30");
      if (tempVal !== null && tempVal !== undefined) setCell(ws, `D${r}`, Number(tempVal), "n");
      setCell(ws, `E${r}`, "2 – 8°C");
      setCell(ws, `F${r}`, evalVal ? "KĐ" : "Đạt");
      if (performerName) setCell(ws, `G${r}`, String(performerName));
      if (noteVal) setCell(ws, `H${r}`, String(noteVal));
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // 3. BM.03/QL.HTAT.01: Theo dõi tủ đông/tủ đá (-10°C đến -30°C)
  if (code.includes("BM.03/QL.HTAT")) {
    const templatePath = join(templateDir, "BM.03_QL.HTAT.01_Tu_Lanh_Da.xlsx");
    const raw = await readFile(templatePath);
    const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["Tu_Lanh_Da"] || wb.Sheets[wb.SheetNames[0]];

    setCell(ws, "A4", `Tên thiết bị: ${model.period.assets?.source_name || "Tủ đông / tủ đá"}`);
    setCell(ws, "D4", `Mã thiết bị: ${model.period.assets?.source_code || "TD-103"}`);
    setCell(ws, "D5", `Thời gian: Tháng ${month} Năm ${year}`);

    for (const rowModel of model.rows) {
      const [, dateStr, slotLabel, , tempVal, evalVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;

      const isMorning = String(slotLabel).toLowerCase().includes("sáng") || String(slotLabel).includes("MORNING");
      const r = isMorning ? 9 + (day - 1) * 2 : 10 + (day - 1) * 2;

      setCell(ws, `C${r}`, isMorning ? "08:30" : "14:30");
      if (tempVal !== null && tempVal !== undefined) setCell(ws, `D${r}`, Number(tempVal), "n");
      setCell(ws, `E${r}`, "-30 đến -10°C");
      setCell(ws, `F${r}`, evalVal ? "KĐ" : "Đạt");
      if (performerName) setCell(ws, `G${r}`, String(performerName));
      if (noteVal) setCell(ws, `H${r}`, String(noteVal));
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // 4. BM.01_KNBM: Phiếu theo dõi khử nhiễm bề mặt khu vực làm việc
  if (code.includes("BM.01_KNBM") || code.includes("KNBM")) {
    const templatePath = join(templateDir, "BM.01_KNBM_Khu_Nhiem_Be_Mat.xlsx");
    const raw = await readFile(templatePath);
    const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["Khu_Nhiem"] || wb.Sheets[wb.SheetNames[0]];

    setCell(ws, "A3", `Khu vực: ${model.period.locations?.name || "Khu vực xét nghiệm"}`);
    setCell(ws, "C3", `Thời gian: Tháng ${month} Năm ${year}`);

    for (const rowModel of model.rows) {
      // rowModel.cells: [stt, date, location, daily, weekly, spill, performer, note]
      const [, dateStr, , dailyVal, weeklyVal, spillVal, performerName, noteVal] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const r = 5 + day; // Day 1 = Row 6

      if (dailyVal) setCell(ws, `B${r}`, "✓");
      if (weeklyVal) setCell(ws, `C${r}`, "✓");
      if (spillVal) setCell(ws, `D${r}`, "✓");
      if (noteVal) setCell(ws, `E${r}`, String(noteVal));
      if (performerName) setCell(ws, `F${r}`, String(performerName));
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // 5. BM.02/QL.TRTB.01: Bảng theo dõi – bảo dưỡng trang thiết bị
  if (code.includes("BM.02/QL.TRTB")) {
    const templatePath = join(templateDir, "BM.02_QL.TRTB.01_Bao_Duong_TTB.xlsx");
    const raw = await readFile(templatePath);
    const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });
    const ws = wb.Sheets["Bao_Duong"] || wb.Sheets[wb.SheetNames[0]];

    setCell(ws, "A3", `Tên máy: ${model.period.assets?.source_name || "Máy xét nghiệm"}`);
    setCell(ws, "D3", `Tháng ${month} Năm ${year}`);

    for (const rowModel of model.rows) {
      // rowModel.cells: [stt, date, asset, cadence, result, performer, note]
      const [, dateStr, , cadenceVal, resultVal, performerName] = rowModel.cells;
      if (!dateStr) continue;
      const day = getDayFromDate(String(dateStr));
      if (day < 1 || day > 31) continue;
      const colLetter = xlsx.utils.encode_col(day); // Day 1 = Col B (index 1)

      const cadence = String(cadenceVal || "DAILY").toUpperCase();
      if (cadence.includes("MONTH") || cadence.includes("THÁNG")) {
        setCell(ws, `${colLetter}13`, resultVal === "FAIL" ? "KĐ" : "Đạt");
        if (performerName) setCell(ws, `${colLetter}14`, String(performerName));
      } else if (cadence.includes("WEEK") || cadence.includes("TUẦN")) {
        setCell(ws, `${colLetter}10`, resultVal === "FAIL" ? "KĐ" : "Đạt");
        if (performerName) setCell(ws, `${colLetter}11`, String(performerName));
      } else {
        setCell(ws, `${colLetter}7`, resultVal === "FAIL" ? "KĐ" : "Đạt");
        if (performerName) setCell(ws, `${colLetter}8`, String(performerName));
      }
    }

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // 6. BM.06/QL.TRTB.01: Nhật ký hoạt động trang thiết bị (Phiên bản v4.1 hiện hành - 25 máy x 4 ca)
  const templatePath = join(templateDir, "BM.06_QL.TRTB.01_Nhat_Ky_25_TTB_4_Ca_v4.1.xlsx");
  const raw = await readFile(templatePath);
  const wb = xlsx.read(raw, { type: "buffer", cellStyles: true });
  const ws = wb.Sheets["BM.06 v4.1"] || wb.Sheets[wb.SheetNames[0]];

  setCell(ws, "A4", `Quyển số: ..................    Từ ngày: ${model.period.period_start}    Đến ngày: ${model.period.period_end}`);

  // Model rows for BM06 contain: [id, date, performer, shiftLabel/time, ...deviceStatuses(25), note]
  for (const rowModel of model.rows) {
    const [, dateStr, performerName, , ...rest] = rowModel.cells;
    if (!dateStr) continue;
    const day = getDayFromDate(String(dateStr));
    if (day < 1 || day > 31) continue;

    // Detect shift index 0..3
    const key = rowModel.key; // e.g. "Trang 1-2026-09-01-SHIFT_1" or similar
    let shiftIdx = 0;
    if (key.includes("SHIFT_2")) shiftIdx = 1;
    else if (key.includes("SHIFT_3")) shiftIdx = 2;
    else if (key.includes("SHIFT_4")) shiftIdx = 3;

    const r = 8 + (day - 1) * 4 + shiftIdx;

    if (performerName) setCell(ws, `E${r}`, String(performerName));

    // Devices are in columns F (index 5) to AD (index 29)
    const deviceStatuses = rest.slice(0, 25);
    deviceStatuses.forEach((status, devIdx) => {
      if (status !== null && status !== undefined && status !== "") {
        const colLetter = xlsx.utils.encode_col(5 + devIdx);
        setCell(ws, `${colLetter}${r}`, String(status));
      }
    });

    const note = rest[25];
    if (note) setCell(ws, `AE${r}`, String(note));
  }

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

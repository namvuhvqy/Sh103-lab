import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { BM06_CANONICAL_TEMPLATE_PATH } from "@/lib/p5/bm06-template";
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

function resolveTemplatePath(filename: string): string {
  const p1 = join(process.cwd(), "docs", "danh mục biểu mẫu", filename);
  if (existsSync(p1)) return p1;
  const p2 = join(process.cwd(), "public", "templates", filename);
  if (existsSync(p2)) return p2;
  return p1;
}

export async function buildBm06WorkbookFromTemplate(model: ReportExportModel): Promise<ExcelJS.Workbook> {
  const templatePath = resolveTemplatePath("BM.06. Nhật kí hoạt động TTB.xlsx");
  const raw = await readFile(templatePath);
  const xlsxWb = XLSX.read(raw, { type: "buffer" });
  const sanitized = XLSX.write(xlsxWb, { type: "buffer", bookType: "xlsx" });

  const templateWb = new ExcelJS.Workbook();
  await templateWb.xlsx.load(sanitized);

  const tCover = templateWb.getWorksheet("Trang bìa");
  const tWs1 = templateWb.getWorksheet("Trang 1");
  const tWs2 = templateWb.getWorksheet("Trang 2");

  if (!tWs1 || !tWs2) {
    throw new Error("Không tìm thấy Trang 1 hoặc Trang 2 trong biểu mẫu gốc BM.06");
  }

  const outWb = new ExcelJS.Workbook();
  outWb.creator = "BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA";
  outWb.created = new Date();
  outWb.modified = new Date();

  // 1. Cover Sheet
  if (tCover) {
    const wsCover = outWb.addWorksheet("Trang bìa", {
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ showGridLines: false }],
    });
    for (let r = 1; r <= tCover.rowCount; r++) {
      const srcRow = tCover.getRow(r);
      const dstRow = wsCover.getRow(r);
      dstRow.height = srcRow.height;
      for (let c = 1; c <= tCover.columnCount; c++) {
        dstRow.getCell(c).value = srcRow.getCell(c).value;
        dstRow.getCell(c).style = srcRow.getCell(c).style;
      }
    }
    for (const m of ["C3:K3", "C4:K4", "C5:K5", "C12:K12", "B2:B5"]) {
      try { wsCover.mergeCells(m); } catch {}
    }
    wsCover.getCell("D15").value = "Quyển số: 01/2026";
    wsCover.getCell("D19").value = `Từ ngày: ${model.period.period_start}      Đến ngày: ${model.period.period_end}`;
  }

  // 2. 10 Cycles (3 days / pair page)
  const shiftHeights = [72.0, 18.0, 18.0, 18.0];
  const shiftTimes = ["7h-12h", "12h-13h30", "13h30-16h", "16h-7h hôm sau"];
  const maxPage = Math.max(...model.rows.map((r) => r.pageNumber), 1);

  for (let c = 1; c <= maxPage; c++) {
    const cycleRows = model.rows.filter((r) => r.pageNumber === c);
    const ws1Name = `Đợt ${c} (T1)`;
    const ws2Name = `Đợt ${c} (T2)`;

    const ws1 = outWb.addWorksheet(ws1Name, {
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ showGridLines: false }],
    });
    const ws2 = outWb.addWorksheet(ws2Name, {
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ showGridLines: false }],
    });

    // Copy headers from tWs1 (rows 1-5)
    for (let r = 1; r <= 5; r++) {
      const srcRow = tWs1.getRow(r);
      const dstRow = ws1.getRow(r);
      dstRow.height = srcRow.height;
      for (let col = 1; col <= 13; col++) {
        dstRow.getCell(col).value = srcRow.getCell(col).value;
        dstRow.getCell(col).style = srcRow.getCell(col).style;
      }
    }
    // Merges for T1
    for (const m of ["B4:B5", "D4:M4", "C4:C5", "A4:A5"]) {
      try { ws1.mergeCells(m); } catch {}
    }

    // Column widths for T1 (narrow others to widen col B to 23.0)
    ws1.getColumn("A").width = 9.5;
    ws1.getColumn("B").width = 23.0;
    ws1.getColumn("C").width = 13.5;
    for (const col of ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]) {
      ws1.getColumn(col).width = 8.5;
    }

    // Copy headers from tWs2 (rows 1-5)
    for (let r = 1; r <= 5; r++) {
      const srcRow = tWs2.getRow(r);
      const dstRow = ws2.getRow(r);
      dstRow.height = srcRow.height;
      for (let col = 1; col <= 11; col++) {
        dstRow.getCell(col).value = srcRow.getCell(col).value;
        dstRow.getCell(col).style = srcRow.getCell(col).style;
      }
    }
    try { ws2.mergeCells("A4:K4"); } catch {}

    // Column widths for T2
    for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
      ws2.getColumn(col).width = 11.2;
    }
    ws2.getColumn("K").width = 17.0;

    // Populate 3 days (12 rows: 6 to 17)
    for (let dIdx = 0; dIdx < 3; dIdx++) {
      const dayStart = 6 + dIdx * 4;
      const dayRows = cycleRows.slice(dIdx * 4, dIdx * 4 + 4);
      const dateStr = dayRows[0]?.cells[0] ? String(dayRows[0].cells[0]) : "";
      const formattedDate = dateStr ? dateStr.split("-").reverse().join("/") : "";

      // Merge Date in Col A
      if (formattedDate) {
        ws1.getCell(`A${dayStart}`).value = formattedDate;
        ws1.getCell(`A${dayStart}`).font = { name: "Times New Roman", size: 10, bold: true };
        ws1.getCell(`A${dayStart}`).alignment = centerAlign;
        try {
          ws1.mergeCells(`A${dayStart}:A${dayStart + 3}`);
        } catch {}
      }

      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const currRow = dayStart + sIdx;
        const h = shiftHeights[sIdx];
        ws1.getRow(currRow).height = h;
        ws2.getRow(currRow).height = h;

        const rowData = dayRows[sIdx];
        const userName = rowData ? rowData.cells[2] : null;
        const note = rowData ? rowData.cells[23] : null;

        // T1 Col C: Shift time
        ws1.getCell(`C${currRow}`).value = shiftTimes[sIdx];
        ws1.getCell(`C${currRow}`).font = { name: "Times New Roman", size: 9 };
        ws1.getCell(`C${currRow}`).alignment = centerAlign;
        ws1.getCell(`C${currRow}`).border = thinBorder;

        // T1 Col B: Performer / Crew
        ws1.getCell(`B${currRow}`).value = userName ? String(userName) : null;
        ws1.getCell(`B${currRow}`).font = { name: "Times New Roman", size: sIdx === 0 ? 8.5 : 9.5 };
        ws1.getCell(`B${currRow}`).alignment = centerAlign;
        ws1.getCell(`B${currRow}`).border = thinBorder;

        // Ensure Col A borders
        ws1.getCell(`A${currRow}`).border = thinBorder;

        // T1 Columns D..M: Machines 1 to 10
        for (let mIdx = 0; mIdx < 10; mIdx++) {
          const colLetter = String.fromCharCode(68 + mIdx); // D = 68
          const stVal = rowData?.cells[3 + mIdx];
          const cell = ws1.getCell(`${colLetter}${currRow}`);
          cell.value = stVal ? String(stVal) : null;
          cell.font = { name: "Times New Roman", size: 10 };
          cell.alignment = centerAlign;
          cell.border = thinBorder;
        }

        // T2 Columns A..J: Machines 11 to 20
        for (let mIdx = 0; mIdx < 10; mIdx++) {
          const colLetter = String.fromCharCode(65 + mIdx); // A = 65
          const stVal = rowData?.cells[13 + mIdx];
          const cell = ws2.getCell(`${colLetter}${currRow}`);
          cell.value = stVal ? String(stVal) : null;
          cell.font = { name: "Times New Roman", size: 10 };
          cell.alignment = centerAlign;
          cell.border = thinBorder;
        }

        // T2 Column K: Note
        const noteCell = ws2.getCell(`K${currRow}`);
        noteCell.value = note ? String(note) : null;
        noteCell.font = { name: "Times New Roman", size: 9 };
        noteCell.alignment = centerAlign;
        noteCell.border = thinBorder;
      }
    }
  }

  return outWb;
}

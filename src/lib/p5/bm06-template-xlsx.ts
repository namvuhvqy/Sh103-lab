import { existsSync } from "node:fs";
import { join } from "node:path";
import XlsxPopulate from "xlsx-populate";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

function resolveTemplatePath(filename: string): string {
  const p1 = join(process.cwd(), "docs", "danh mục biểu mẫu", filename);
  if (existsSync(p1)) return p1;
  const p2 = join(process.cwd(), "public", "templates", filename);
  if (existsSync(p2)) return p2;
  return p1;
}

export async function buildBm06WorkbookFromTemplate(model: ReportExportModel, cycle = 1): Promise<Buffer> {
  const templatePath = resolveTemplatePath("BM.06. Nhật kí hoạt động TTB.xlsx");
  const wb = await XlsxPopulate.fromFileAsync(templatePath);

  const cycleRows = model.rows.filter((r) => r.pageNumber === cycle);
  const firstDate = cycleRows[0]?.cells[0] ? String(cycleRows[0].cells[0]) : model.period.period_start;
  const lastDate = cycleRows[cycleRows.length - 1]?.cells[0] ? String(cycleRows[cycleRows.length - 1].cells[0]) : model.period.period_end;

  // 1. Trang bìa
  if (wb.sheet("Trang bìa")) {
    wb.sheet("Trang bìa").cell("D19").value(`Từ ngày: ${firstDate}      Đến ngày: ${lastDate}`);
  }

  // 2. Trang 1 & Trang 2
  const ws1 = wb.sheet("Trang 1");
  const ws2 = wb.sheet("Trang 2");

  if (!ws1 || !ws2) {
    throw new Error("Không tìm thấy Trang 1 hoặc Trang 2 trong mẫu BM.06");
  }

  // Set column widths to prevent text clipping
  ws1.column("A").width(10.5);
  ws1.column("B").width(24.0);
  ws1.column("C").width(14.0);
  for (let c = 4; c <= 13; c++) ws1.column(c).width(8.5);
  for (let c = 1; c <= 10; c++) ws2.column(c).width(11.2);
  ws2.column("K").width(18.0);

  // Apply full crisp borders and fonts on tables
  ws1.range("A6:M17").style({
    border: true,
    fontFamily: "Times New Roman",
    fontSize: 10,
    verticalAlignment: "center",
    horizontalAlignment: "center"
  });
  ws2.range("A6:K17").style({
    border: true,
    fontFamily: "Times New Roman",
    fontSize: 10,
    verticalAlignment: "center",
    horizontalAlignment: "center"
  });

  const shiftTimes = ["7h-12h", "12h-13h30", "13h30-16h", "16h-7h hôm sau"];

  for (let dIdx = 0; dIdx < 3; dIdx++) {
    const dayStart = 6 + dIdx * 4;
    const dayRows = cycleRows.slice(dIdx * 4, dIdx * 4 + 4);
    const dateStr = dayRows[0]?.cells[0] ? String(dayRows[0].cells[0]) : "";
    const formattedDate = dateStr ? dateStr.split("-").reverse().join("/") : "";

    // Set merged date in Col A
    if (formattedDate) {
      ws1.range(`A${dayStart}:A${dayStart + 3}`).merged(true).value(formattedDate).style({
        fontFamily: "Times New Roman",
        fontSize: 10,
        bold: true,
        horizontalAlignment: "center",
        verticalAlignment: "center",
        border: true
      });
    }

    // Row heights: Ca 1 = 38pt (comfortable for crew), Ca 2..4 = 24pt
    ws1.row(dayStart).height(38);
    ws2.row(dayStart).height(38);
    for (let s = 1; s <= 3; s++) {
      ws1.row(dayStart + s).height(24);
      ws2.row(dayStart + s).height(24);
    }

    for (let sIdx = 0; sIdx < 4; sIdx++) {
      const currRow = dayStart + sIdx;
      const rowData = dayRows[sIdx];
      const userName = rowData?.cells[2];
      const note = rowData?.cells[23];

      // Shift time
      ws1.cell(`C${currRow}`).value(shiftTimes[sIdx]).style({
        fontSize: 9,
        border: true
      });

      // Performer / Crew
      ws1.cell(`B${currRow}`).value(userName ? String(userName) : "").style({
        fontSize: sIdx === 0 ? 8.5 : 9.5,
        wrapText: true,
        border: true
      });

      // Machines 1..10 (Cols D..M)
      for (let m = 0; m < 10; m++) {
        const colLetter = String.fromCharCode(68 + m);
        const stVal = rowData?.cells[3 + m];
        ws1.cell(`${colLetter}${currRow}`).value(stVal ? String(stVal) : "").style({
          border: true
        });
      }

      // Machines 11..20 (Cols A..J on Trang 2)
      for (let m = 0; m < 10; m++) {
        const colLetter = String.fromCharCode(65 + m);
        const stVal = rowData?.cells[13 + m];
        ws2.cell(`${colLetter}${currRow}`).value(stVal ? String(stVal) : "").style({
          border: true
        });
      }

      // Note (Col K on Trang 2)
      ws2.cell(`K${currRow}`).value(note ? String(note) : "").style({
        fontSize: 9,
        border: true
      });
    }
  }

  const buffer = await wb.outputAsync();
  return Buffer.from(buffer);
}

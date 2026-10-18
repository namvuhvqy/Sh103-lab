import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

function resolveTemplatePath(filename: string): string {
  const p1 = join(process.cwd(), "docs", "danh mục biểu mẫu", filename);
  if (existsSync(p1)) return p1;
  const p2 = join(process.cwd(), "public", "templates", filename);
  if (existsSync(p2)) return p2;
  return p1;
}

export async function buildBm06WorkbookFromTemplate(model: ReportExportModel): Promise<Buffer> {
  const templatePath = resolveTemplatePath("BM.06. Nhật kí hoạt động TTB.xlsx");
  const raw = readFileSync(templatePath);
  const tplWb = XLSX.read(raw, { type: "buffer", cellStyles: true });

  const outWb = XLSX.utils.book_new();

  // 1. Cover Sheet
  if (tplWb.Sheets["Trang bìa"]) {
    const cover = JSON.parse(JSON.stringify(tplWb.Sheets["Trang bìa"]));
    cover["D19"] = { t: "s", v: `Từ ngày: ${model.period.period_start}      Đến ngày: ${model.period.period_end}` };
    XLSX.utils.book_append_sheet(outWb, cover, "Trang bìa");
  }

  // 2. 10 Cycles (3 days / pair page)
  const shiftTimes = ["7h-12h", "12h-13h30", "13h30-16h", "16h-7h hôm sau"];
  const maxPage = Math.max(...model.rows.map((r) => r.pageNumber), 1);

  for (let c = 1; c <= maxPage; c++) {
    const cycleRows = model.rows.filter((r) => r.pageNumber === c);
    const ws1 = JSON.parse(JSON.stringify(tplWb.Sheets["Trang 1"]));
    const ws2 = JSON.parse(JSON.stringify(tplWb.Sheets["Trang 2"]));

    for (let dIdx = 0; dIdx < 3; dIdx++) {
      const dayStart = 6 + dIdx * 4;
      const dayRows = cycleRows.slice(dIdx * 4, dIdx * 4 + 4);
      const dateStr = dayRows[0]?.cells[0] ? String(dayRows[0].cells[0]) : "";
      const formattedDate = dateStr ? dateStr.split("-").reverse().join("/") : "";

      if (formattedDate) {
        ws1[`A${dayStart}`] = { t: "s", v: formattedDate };
      }

      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const currRow = dayStart + sIdx;
        const rowData = dayRows[sIdx];
        const userName = rowData?.cells[2];
        const note = rowData?.cells[23];

        ws1[`C${currRow}`] = { t: "s", v: shiftTimes[sIdx] };

        if (userName) {
          ws1[`B${currRow}`] = { t: "s", v: String(userName) };
        } else {
          delete ws1[`B${currRow}`];
        }

        // Machines 1..10 (D..M)
        for (let mIdx = 0; mIdx < 10; mIdx++) {
          const colLetter = String.fromCharCode(68 + mIdx);
          const stVal = rowData?.cells[3 + mIdx];
          if (stVal) {
            ws1[`${colLetter}${currRow}`] = { t: "s", v: String(stVal) };
          } else {
            delete ws1[`${colLetter}${currRow}`];
          }
        }

        // Machines 11..20 (A..J on T2)
        for (let mIdx = 0; mIdx < 10; mIdx++) {
          const colLetter = String.fromCharCode(65 + mIdx);
          const stVal = rowData?.cells[13 + mIdx];
          if (stVal) {
            ws2[`${colLetter}${currRow}`] = { t: "s", v: String(stVal) };
          } else {
            delete ws2[`${colLetter}${currRow}`];
          }
        }

        // Note on T2 (K)
        if (note) {
          ws2[`K${currRow}`] = { t: "s", v: String(note) };
        } else {
          delete ws2[`K${currRow}`];
        }
      }
    }

    XLSX.utils.book_append_sheet(outWb, ws1, `Đợt ${c} - T1`);
    XLSX.utils.book_append_sheet(outWb, ws2, `Đợt ${c} - T2`);
  }

  const outBytes = XLSX.write(outWb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(outBytes);
}

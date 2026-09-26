import fs from "fs";
import ExcelJS from "exceljs";

async function testExport() {
  const periodId = "59125806-84b1-4a43-8e7d-21e5e51a4e6e"; // BM.06 period
  const url = `http://localhost:3000/api/reports/${periodId}/xlsx?draft=true`;
  console.log("Fetching:", url);
  const res = await fetch(url);
  console.log("Status:", res.status, "Disposition:", res.headers.get("content-disposition"));

  if (res.status !== 200) {
    const err = await res.text();
    console.error("Export error:", err);
    return;
  }

  const buf = await res.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(buf));
  console.log("Worksheet names:", wb.worksheets.map((w) => w.name));

  const dataSheet = wb.getWorksheet("Bản ghi hiệu lực");
  console.log("Data Sheet Gridlines:", dataSheet.views[0]?.showGridLines);
  console.log("Row count:", dataSheet.rowCount, "(Expected ~125 rows for 31 days x 4 shifts + header)");
  console.log("Header (Row 1):", dataSheet.getRow(1).values.slice(1, 8));
  console.log("Row 2 (Day 1 Ca 1):", dataSheet.getRow(2).values.slice(1, 8));
  console.log("Row 3 (Day 1 Ca 2):", dataSheet.getRow(3).values.slice(1, 8));
  console.log("Cell B2 border:", dataSheet.getCell("B2").border);

  // Also check BM.02 / BM.03 fridge export
  const fridgePeriodId = "6edc7092-e9b9-4feb-916e-a6e934d15bb6"; // TU-01 Overmed
  const fRes = await fetch(`http://localhost:3000/api/reports/${fridgePeriodId}/xlsx?draft=true`);
  console.log("\nFridge Export Status:", fRes.status, fRes.headers.get("content-disposition"));
  const fBuf = await fRes.arrayBuffer();
  const fWb = new ExcelJS.Workbook();
  await fWb.xlsx.load(Buffer.from(fBuf));
  const fSheet = fWb.getWorksheet("Bản ghi hiệu lực");
  console.log("Fridge Row count:", fSheet.rowCount);
  console.log("Fridge Header (Row 1):", fSheet.getRow(1).values.slice(1, 8));
  console.log("Fridge Row 2 (Day 1 Sáng):", fSheet.getRow(2).values.slice(1, 8));
}

testExport().catch(console.error);

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const DIR = "/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu";
const file = fs.readdirSync(DIR).find(f => f.includes("bao") || f.includes("bảo") || f.includes("TTB.xls"));
console.log("Found file:", file);
if (file) {
  const wb = XLSX.readFile(path.join(DIR, file));
  console.log("Sheets:", wb.SheetNames);
  for (const s of wb.SheetNames) {
    console.log(`\n=== SHEET: ${s} ===`);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1, raw: false });
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      if (rows[i] && rows[i].some(c => c)) console.log(`R${i + 1}:`, JSON.stringify(rows[i]));
    }
  }
}

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const mammoth = require("mammoth");

const DIR = "/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu";

async function run() {
  const files = fs.readdirSync(DIR);
  console.log("FILES IN DIR:", files);

  for (const f of files) {
    const fullPath = path.join(DIR, f);
    console.log("\n==================================================================");
    console.log("FILE:", f);
    console.log("==================================================================");

    if (f.endsWith(".xls") || f.endsWith(".xlsx")) {
      const wb = XLSX.readFile(fullPath);
      console.log("Sheets:", wb.SheetNames);
      for (const sName of wb.SheetNames) {
        console.log(`\n--- Sheet: ${sName} ---`);
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1, raw: false });
        console.log(`Row count: ${rows.length}`);
        for (let i = 0; i < Math.min(rows.length, 35); i++) {
          const row = rows[i];
          if (row && row.some(cell => cell !== undefined && cell !== "")) {
            console.log(`R${i + 1}:`, JSON.stringify(row));
          }
        }
      }
    } else if (f.endsWith(".docx")) {
      const text = await mammoth.extractRawText({ path: fullPath });
      console.log("Text preview:\n" + text.value.slice(0, 2000));
    } else if (f.endsWith(".doc")) {
      console.log(".doc binary file, size:", fs.statSync(fullPath).size);
    }
  }
}

run().catch(console.error);

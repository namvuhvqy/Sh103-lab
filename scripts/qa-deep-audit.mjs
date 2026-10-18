import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const exportDir = "/mnt/c/Users/Admin/Desktop/SH103_Lab_Exports";
const files = fs.readdirSync(exportDir).filter(f => f.endsWith(".xlsx"));

console.log("================ QA DEEP AUDIT OF EXPORTED FILES ================");

for (const file of files) {
  const filePath = `${exportDir}/${file}`;
  const wb = xlsx.readFile(filePath);
  const size = fs.statSync(filePath).size;
  console.log(`\n📄 [FILE] ${file} (${size} bytes)`);
  console.log(`   Sheets: ${wb.SheetNames.join(", ")}`);

  const primarySheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(primarySheet, { header: 1 });

  // Print title / header rows
  console.log("   --- Header & Title ---");
  for (let r = 0; r < Math.min(6, data.length); r++) {
    const row = data[r] || [];
    const nonEmpties = row.filter(v => v !== undefined && v !== "");
    if (nonEmpties.length > 0) {
      console.log(`     Row ${r + 1}: ${nonEmpties.slice(0, 3).map(String).join(" | ")}`);
    }
  }

  // Print sample data rows
  console.log("   --- Sample Data Rows ---");
  let printed = 0;
  for (let r = 6; r < data.length && printed < 5; r++) {
    const row = data[r] || [];
    const nonEmpties = row.filter(v => v !== undefined && v !== "");
    if (nonEmpties.length > 1) {
      console.log(`     Row ${r + 1}: ${row.slice(0, 8).map(v => v === undefined || v === "" ? "-" : String(v)).join(" | ")}`);
      printed++;
    }
  }
}

console.log("\n================ QA AUDIT COMPLETED ================");

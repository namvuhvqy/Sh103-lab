import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const dir = "/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu";
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith(".xls") || file.endsWith(".xlsx")) {
    const fullPath = path.join(dir, file);
    console.log("\n" + "=".repeat(60));
    console.log("FILE:", file);
    const wb = xlsx.readFile(fullPath);
    for (const sheetName of wb.SheetNames) {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const sheet = wb.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      for (let r = 0; r < Math.min(35, data.length); r++) {
        const row = data[r];
        if (row.some((cell) => cell !== "")) {
          const cells = row.slice(0, 15).map((c) => String(c).trim().replace(/\n/g, " "));
          console.log(`R${r + 1}:`, cells.join(" | "));
        }
      }
    }
  }
}

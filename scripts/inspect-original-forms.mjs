import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

const DIR = "/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu";

async function main() {
  const files = fs.readdirSync(DIR);
  console.log("Files found:", files);

  for (const file of files) {
    const fullPath = path.join(DIR, file);
    console.log(`\n======================================================`);
    console.log(`FILE: ${file}`);
    console.log(`======================================================`);

    if (file.endsWith(".xls") || file.endsWith(".xlsx")) {
      const workbook = XLSX.readFile(fullPath);
      console.log("Sheet names:", workbook.SheetNames);
      for (const name of workbook.SheetNames) {
        console.log(`--- Sheet: ${name} ---`);
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Total rows: ${data.length}`);
        // print first 25 rows
        for (let i = 0; i < Math.min(data.length, 30); i++) {
          console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
        }
      }
    } else if (file.endsWith(".docx")) {
      const result = await mammoth.convertToHtml({ path: fullPath });
      console.log("HTML length:", result.value.length);
      // Let's print raw text or snippet
      const raw = await mammoth.extractRawText({ path: fullPath });
      console.log("Raw text snippet:\n", raw.value.slice(0, 3000));
    } else if (file.endsWith(".doc")) {
      console.log("Legacy .doc file:", file);
    }
  }
}

main().catch(console.error);

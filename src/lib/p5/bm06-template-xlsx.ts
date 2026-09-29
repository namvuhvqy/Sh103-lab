import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import ExcelJS from "exceljs";
import { BM06_FINAL_SHIFT_WINDOWS, BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";
import type { ReportExportModel } from "@/lib/p5/report-export-model";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

function normalizeOpenXmlNamespaces(bytes: Buffer) {
  // The Owner-approved workbook uses prefixed x: worksheet XML that SheetJS can
  // read, but ExcelJS 4.4 cannot. Normalize prefixes only in a copy loaded at
  // runtime; the canonical raw XLSX is preserved byte-for-byte in docs/.
  const normalized = Buffer.from(bytes);
  let cursor = 0;
  while (cursor < normalized.length - 30) {
    if (normalized.readUInt32LE(cursor) !== 0x04034b50) { cursor++; continue; }
    const flags = normalized.readUInt16LE(cursor + 6);
    const method = normalized.readUInt16LE(cursor + 8);
    const compressedSize = normalized.readUInt32LE(cursor + 18);
    const uncompressedSize = normalized.readUInt32LE(cursor + 22);
    const nameLength = normalized.readUInt16LE(cursor + 26);
    const extraLength = normalized.readUInt16LE(cursor + 28);
    const name = normalized.subarray(cursor + 30, cursor + 30 + nameLength).toString("utf8");
    const dataStart = cursor + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if ((flags & 0x08) !== 0 || dataEnd > normalized.length) break;
    if ((name.endsWith(".xml") || name.endsWith(".rels")) && method === 8) {
      const inflated = inflateRawSync(normalized.subarray(dataStart, dataEnd));
      if (inflated.length === uncompressedSize) {
        const text = inflated.toString("utf8").replace(/^\uFEFF/, "");
        const next = text
          .replaceAll('xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')
          .replaceAll("<x:", "<")
          .replaceAll("</x:", "</")
          .replaceAll(" x:", " ");
        if (next.length === text.length) Buffer.from(next, "utf8").copy(normalized, dataStart, 0, compressedSize);
      }
    }
    cursor = dataEnd;
  }
  return normalized;
}

function normalizeXmlText(text: string) {
  return text.replace(/^\uFEFF/, "")
    .replaceAll('xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')
    .replaceAll("<x:", "<")
    .replaceAll("</x:", "</")
    .replaceAll(" x:", " ");
}


function readZipTextEntries(bytes: Buffer) {
  const entries = new Map<string, string>();
  let cursor = 0;
  while (cursor < bytes.length - 30) {
    if (bytes.readUInt32LE(cursor) !== 0x04034b50) { cursor++; continue; }
    const flags = bytes.readUInt16LE(cursor + 6);
    const method = bytes.readUInt16LE(cursor + 8);
    const compressedSize = bytes.readUInt32LE(cursor + 18);
    const nameLength = bytes.readUInt16LE(cursor + 26);
    const extraLength = bytes.readUInt16LE(cursor + 28);
    const name = bytes.subarray(cursor + 30, cursor + 30 + nameLength).toString("utf8");
    const dataStart = cursor + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if ((flags & 0x08) !== 0 || dataEnd > bytes.length) break;
    if ((name.endsWith(".xml") || name.endsWith(".rels")) && method === 8) entries.set(name, normalizeXmlText(inflateRawSync(bytes.subarray(dataStart, dataEnd)).toString("utf8")));
    cursor = dataEnd;
  }
  return entries;
}

function populateFallbackSheet(sourceXml: string, sheet: ExcelJS.Worksheet) {
  const rows = Array.from(sourceXml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g));
  for (const rowMatch of rows) {
    const rowNumber = Number(rowMatch[1]);
    for (const cellMatch of rowMatch[2].matchAll(/<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g)) {
      const ref = `${cellMatch[1]}${cellMatch[2]}`;
      const body = cellMatch[4];
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const rawValue = inlineMatch?.[1] ?? valueMatch?.[1] ?? "";
      sheet.getCell(ref).value = rawValue;
    }
    sheet.getRow(rowNumber).commit?.();
  }
}

function addFallbackTemplateWorkbook(raw: Buffer) {
  const entries = readZipTextEntries(raw);
  const workbookXml = entries.get("xl/workbook.xml") ?? "";
  const relsXml = entries.get("xl/_rels/workbook.xml.rels") ?? "";
  const workbook = new ExcelJS.Workbook();
  const relTargets = new Map(Array.from(relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*Type="[^"]*worksheet[^"]*"[^>]*\/>/g)).map((match) => [match[1], match[2].replace(/^\//, "").replace(/^xl\//, "xl/")]));
  for (const sheetMatch of workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g)) {
    const name = sheetMatch[1];
    const target = relTargets.get(sheetMatch[2]);
    const sourceXml = target ? entries.get(target) : undefined;
    const sheet = workbook.addWorksheet(name, { views: [{ showGridLines: false }] });
    if (sourceXml) populateFallbackSheet(sourceXml, sheet);
  }
  return workbook;
}

function cloneStyle(style: Partial<ExcelJS.Style> | undefined) {
  return style ? JSON.parse(JSON.stringify(style)) as Partial<ExcelJS.Style> : undefined;
}

function copyCell(source: ExcelJS.Cell, target: ExcelJS.Cell) {
  target.value = source.value;
  target.style = cloneStyle(source.style) ?? {};
  target.numFmt = source.numFmt;
  if (source.alignment) target.alignment = JSON.parse(JSON.stringify(source.alignment));
  target.border = source.border ? JSON.parse(JSON.stringify(source.border)) : undefined;
  target.fill = source.fill ? JSON.parse(JSON.stringify(source.fill)) : undefined;
  if (source.font) target.font = JSON.parse(JSON.stringify(source.font));
}

function cellValue(value: unknown) {
  return value === undefined ? null : value as ExcelJS.CellValue;
}

export async function buildBm06WorkbookFromTemplate(model: ReportExportModel) {
  const raw = await readFile(join(process.cwd(), "docs", "danh mục biểu mẫu", "BM06_QL_TRTB_01_Nhat_ky_hoat_dong_TTB_no_cover_owner_approved.xlsx"));
  const normalized = normalizeOpenXmlNamespaces(raw);
  const templateWorkbook = new ExcelJS.Workbook();
  try {
    await templateWorkbook.xlsx.load(new Uint8Array(normalized) as unknown as ExcelJS.Buffer);
  } catch {
    // Fallback below reads the small canonical template XML directly. This keeps
    // export working when ExcelJS cannot parse the Owner workbook package.
  }
  const fallbackTemplateWorkbook = templateWorkbook.worksheets.length ? null : addFallbackTemplateWorkbook(raw);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA";
  workbook.created = new Date();
  workbook.modified = new Date();

  const rowsByPage = new Map<string, typeof model.rows>();
  for (const page of BM06_TEMPLATE_PAGES) rowsByPage.set(page.name, model.rows.filter((row) => row.templatePageName === page.name));

  for (const pageSpec of BM06_TEMPLATE_PAGES) {
    const templateSource = fallbackTemplateWorkbook ?? templateWorkbook;
    const source = templateSource.getWorksheet(pageSpec.name)
      ?? templateSource.worksheets.find((sheet) => sheet.name.trim() === pageSpec.name)
      ?? templateSource.worksheets[Number(pageSpec.name.replace("Trang ", "")) - 1];
    if (!source) throw new Error(`Missing BM06 template sheet ${pageSpec.name}`);
    const sheet = workbook.addWorksheet(pageSpec.name, {
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ showGridLines: false }],
    });

    for (let c = 1; c <= source.columnCount; c++) {
      sheet.getColumn(c).width = source.getColumn(c).width;
    }
    for (let r = 1; r <= source.rowCount; r++) {
      const srcRow = source.getRow(r);
      const dstRow = sheet.getRow(r);
      dstRow.height = srcRow.height;
      for (let c = 1; c <= source.columnCount; c++) copyCell(srcRow.getCell(c), dstRow.getCell(c));
    }
    for (const range of Object.keys((source as unknown as { _merges: Record<string, unknown> })._merges ?? {})) sheet.mergeCells(range);

    sheet.getCell("A4").value = `Kỳ: ${model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`} · ${model.approvalStatusLabel}`;

    const pageRows = rowsByPage.get(pageSpec.name) ?? [];
    pageRows.forEach((rowModel, index) => {
      const rowNumber = 7 + index;
      const row = sheet.getRow(rowNumber);
      row.height = row.height || 27;
      const [recordId, businessDate, userName, time, ...rest] = rowModel.cells;
      const note = rest.at(-1);
      const statusValues = rest.slice(0, pageSpec.devices.length);
      sheet.getCell(`A${rowNumber}`).value = index % BM06_FINAL_SHIFT_WINDOWS.length === 0 ? cellValue(businessDate) : null;
      sheet.getCell(`B${rowNumber}`).value = index % BM06_FINAL_SHIFT_WINDOWS.length === 0 ? cellValue(userName) : null;
      sheet.getCell(`C${rowNumber}`).value = cellValue(time);
      pageSpec.devices.forEach((device, deviceIndex) => {
        sheet.getCell(`${device.column}${rowNumber}`).value = cellValue(statusValues[deviceIndex]);
      });
      sheet.getCell(`${pageSpec.noteCell}${rowNumber}`).value = cellValue(note);
      // Keep record id out of visual form; hidden note helps trace generated rows.
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = cell.border ?? thinBorder;
        cell.alignment = cell.alignment ?? { vertical: "middle", horizontal: "center", wrapText: true };
      });
      if (recordId) row.getCell(1).note = `record_id=${recordId}`;
    });
  }

  const summary = workbook.addWorksheet("Tổng quan");
  summary.addRows([
    ["Đơn vị", "Bệnh viện Quân y 103 · Khoa Sinh hóa"],
    ["Biểu mẫu", `${model.templateCode} — ${model.templateName}`],
    ["Phiên bản", model.period.form_template_versions.version_label],
    ["Kỳ", model.period.period_label ?? `${model.period.period_start} – ${model.period.period_end}`],
    ["Đối tượng", model.objectLabel],
    ["Trạng thái", model.approvalStatusLabel],
    ["Xác nhận lịch sử lúc", model.approvalTimestampLabel],
    ["Số bản ghi hiệu lực", model.recordCount],
    ["Mẫu nguồn", model.sourceTemplatePath ?? ""],
    ["Cấu hình chữ ký", `${model.signatureConfig.reviewerLabel} | ${model.signatureConfig.approverLabel}`],
  ]);
  summary.state = "hidden";

  return workbook;
}

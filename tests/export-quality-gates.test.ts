import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const exportRoutes = ["src/app/api/reports/[periodId]/xlsx/route.ts"];

describe("Preview/export quality gates", () => {
  it("keeps workflow XLSX-only in reports/export UI", () => {
    const page = read("src/app/reports/export/page.tsx");
    expect(page).toContain("Preview & xuất Excel");
    expect(page).toContain("/xlsx?");
    expect(page).not.toContain("/csv?");
    expect(page).not.toContain("/pdf?");
    expect(page).not.toContain("PrintButton");
    expect(page).not.toContain("CSV");
    expect(page).not.toContain("PDF");
  });

  it.each(exportRoutes)("%s uses a shared export model as the single source of preview/file data", (route) => {
    const source = read(route);
    expect(source).toContain("@/lib/p5/report-export-model");
    expect(source).toContain("buildReportExportModel");
  });

  it("uses Owner-approved BM.06 no-cover XLSX template without invented page breaks", () => {
    const model = read("src/lib/p5/report-export-model.ts");
    const template = read("src/lib/p5/bm06-template.ts");
    const page = read("src/app/reports/export/page.tsx");
    const xlsx = read("src/app/api/reports/[periodId]/xlsx/route.ts");
    expect(model).toContain("BM06_SOURCE_TEMPLATE_PATH");
    expect(template).toContain("no_cover_owner_approved.xlsx");
    expect(template).toContain("BM06_TEMPLATE_DEVICE_COUNT");
    expect(model).not.toContain("BM06_DAYS_PER_SOURCE_PAGE");
    expect(xlsx).not.toContain("addPageBreak");
    expect(page).toContain("pageNumber");
  });

  it("signature/admin labels are configurable through one shared export config", () => {
    const config = read("src/lib/p5/report-export-model.ts");
    const page = read("src/app/reports/export/page.tsx");
    const xlsx = read("src/app/api/reports/[periodId]/xlsx/route.ts");
    expect(config).toContain("SIGNATURE_CONFIG");
    expect(config).toContain("reviewerLabel");
    expect(config).toContain("approverLabel");
    expect(page).toContain("SIGNATURE_CONFIG");
    expect(xlsx).toContain("signatureConfig");
  });

  it("does not fabricate missing operational values in shared model or XLSX workflow", () => {
    const model = read("src/lib/p5/report-export-model.ts");
    expect(model).not.toMatch(/KTV trực|KTV:|\[ĐẠT\]|Đạt \(|Không có|Thiết bị xét nghiệm|PXN|Hoàn thành|Bình thường|Chưa nhập/);
    expect(model).toContain("byOrder.get(m.order) ?? null");
    expect(read("src/app/reports/export/page.tsx")).toContain('value ?? ""');
  });
});

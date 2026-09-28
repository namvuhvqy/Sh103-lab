import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const exportRoutes = [
  "src/app/api/reports/[periodId]/csv/route.ts",
  "src/app/api/reports/[periodId]/xlsx/route.ts",
  "src/app/api/reports/[periodId]/pdf/route.ts",
];

describe("Preview/export quality gates", () => {
  it("does not stamp unapproved exports as official/approved", () => {
    const csv = read("src/app/api/reports/[periodId]/csv/route.ts");
    const pdf = read("src/app/api/reports/[periodId]/pdf/route.ts");
    const xlsx = read("src/app/api/reports/[periodId]/xlsx/route.ts");

    expect(csv).toContain("approvalStatusLabel");
    expect(pdf).toContain("approvalStatusLabel");
    expect(xlsx).toContain("approvalStatusLabel");
    expect(csv).not.toContain('["Trạng thái: ĐÃ PHÊ DUYỆT (CHÍNH THỨC)"]');
    expect(pdf).not.toContain("Trạng thái: ĐÃ PHÊ DUYỆT ĐIỆN TỬ (Chính thức)");
  });

  it.each(exportRoutes)("%s uses a shared export model as the single source of preview/file data", (route) => {
    const source = read(route);
    expect(source).toContain("@/lib/p5/report-export-model");
    expect(source).toContain("buildReportExportModel");
  });

  it("BM.06 page breaks are template-bound, not arbitrary UI assumptions", () => {
    const model = read("src/lib/p5/report-export-model.ts");
    expect(model).toContain("BM06_DAYS_PER_SOURCE_PAGE = 15");
    expect(model).toContain("sourceTemplatePath");
    expect(model).toContain("BM.06_QL.TRTB.01_Nhat_Ky_25_TTB_4_Ca_v4.1.docx");
    expect(model).toContain("pageBreakAfter");
  });

  it("signature/admin labels are configurable through one shared export config", () => {
    const config = read("src/lib/p5/report-export-model.ts");
    const page = read("src/app/reports/export/page.tsx");
    const pdf = read("src/app/api/reports/[periodId]/pdf/route.ts");
    expect(config).toContain("SIGNATURE_CONFIG");
    expect(config).toContain("reviewerLabel");
    expect(config).toContain("approverLabel");
    expect(page).toContain("SIGNATURE_CONFIG");
    expect(pdf).toContain("SIGNATURE_CONFIG");
  });

  it.each(exportRoutes)("%s does not fabricate missing operational values", (route) => {
    const source = read(route);
    expect(source).not.toMatch(/KTV trực|KTV:|\[ĐẠT\]|Đạt \(|Không có|Thiết bị xét nghiệm|PXN|Hoàn thành|Bình thường/);
  });
});

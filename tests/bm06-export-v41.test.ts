import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const ownerQualityGateRoutes = [
  "src/app/api/reports/[periodId]/xlsx/route.ts",
];

describe("BM.06 v4.1 template-bound exports", () => {
  it.each(ownerQualityGateRoutes)("%s allows incomplete/unapproved periods to export", (route) => {
    const source = read(route);
    expect(source).not.toContain("status: 409");
    expect(source).not.toContain("Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt");
  });

  it.each(ownerQualityGateRoutes)("%s does not expose numeric usage or fabricated business defaults", (route) => {
    const source = read(route);
    expect(source).not.toMatch(/usage_value|usage_unit|usage_hours|Giờ chạy máy|Số giờ \/ Ca|Đạt chuẩn|KTV"|Đã thực hiện/);
  });

  it.each(ownerQualityGateRoutes)("%s presents the four fixed shift windows", (route) => {
    const source = read(route) + read("src/lib/p5/report-export-model.ts") + read("src/lib/p5/bm06-template.ts");
    expect(source).toContain("07:00–11:30");
    expect(source).toContain("11:30–13:30");
    expect(source).toContain("13:30–16:30");
    expect(source).toContain("16:30–07:00 hôm sau");
    expect(source).not.toContain("16:40");
  });

  it("XLSX renders all 25 machines through canonical source pages", () => {
    const source = read("src/app/api/reports/[periodId]/xlsx/route.ts") + read("src/lib/p5/report-export-model.ts") + read("src/lib/p5/bm06-template.ts");
    expect(source).toContain("BM06_TEMPLATE_PAGES");
    expect(source).toContain("asset_display_order_snapshot");
    expect(source).toContain("order: 25");
  });
});

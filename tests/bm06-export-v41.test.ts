import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const routes = [
  "src/app/api/reports/[periodId]/xlsx/route.ts",
  "src/app/api/reports/[periodId]/csv/route.ts",
  "src/app/api/reports/[periodId]/pdf/route.ts",
];

describe("BM.06 v4.1 template-bound exports", () => {
  it.each(routes)("%s allows incomplete/unapproved periods to export", (route) => {
    const source = read(route);
    expect(source).not.toContain("status: 409");
    expect(source).not.toContain("Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt");
  });

  it.each(routes)("%s does not expose numeric usage or fabricated business defaults", (route) => {
    const source = read(route);
    expect(source).not.toMatch(/usage_value|usage_unit|usage_hours|Giờ chạy máy|Số giờ \/ Ca|Đạt chuẩn|KTV"|Đã thực hiện/);
  });

  it.each(routes)("%s presents the four fixed shift windows", (route) => {
    const source = read(route) + read("src/lib/p5/report-export-model.ts");
    expect(source).toContain("07:00 – 11:30");
    expect(source).toContain("11:30 – 13:30");
    expect(source).toContain("13:30 – 16:30");
    expect(source).toContain("16:30 – 07:00");
    expect(source).not.toContain("16:40");
  });

  it("XLSX and CSV render all 25 machine columns in source order", () => {
    for (const route of routes.slice(0, 2)) {
      const source = read(route) + read("src/lib/p5/report-export-model.ts");
      expect(source).toContain("HOSPITAL_MACHINES_25.map");
      expect(source).toContain("asset_display_order_snapshot");
    }
  });
});

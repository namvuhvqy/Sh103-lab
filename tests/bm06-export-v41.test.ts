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

describe("BM.06 v4.1 official exports", () => {
  it.each(routes)("%s rejects unofficial periods", (route) => {
    const source = read(route);
    expect(source).toContain('status === "APPROVED"');
    expect(source).toMatch(/report\.official/);
  });

  it.each(routes)("%s does not expose numeric usage as business data", (route) => {
    const source = read(route);
    expect(source).not.toMatch(/usage_value|usage_unit|usage_hours|Giờ chạy máy|Số giờ \/ Ca/);
  });

  it.each(routes)("%s presents the four fixed shift windows", (route) => {
    const source = read(route);
    expect(source).toContain("07:00 – 11:30");
    expect(source).toContain("11:30 – 13:30");
    expect(source).toContain("13:30 – 16:30");
    expect(source).toContain("16:30 – 07:00");
    expect(source).not.toContain("16:40");
  });

  it("XLSX and CSV render all 25 machine columns in source order", () => {
    for (const route of routes.slice(0, 2)) {
      const source = read(route);
      expect(source).toContain("HOSPITAL_MACHINES_25.map");
      expect(source).toContain("asset_display_order_snapshot");
    }
  });
});

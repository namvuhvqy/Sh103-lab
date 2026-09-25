import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P5 M01-M06 route contract", () => {
  it.each([
    ["M01", "src/app/page.tsx"],
    ["M02", "src/app/temperature/page.tsx"],
    ["M03", "src/app/equipment/page.tsx"],
    ["M04", "src/app/decontamination/page.tsx"],
    ["M05", "src/app/approvals/page.tsx"],
    ["M06", "src/app/reports/page.tsx"],
    ["Dashboard", "src/app/dashboard/page.tsx"],
  ])("provides %s", (_screen, path) => expect(() => read(path)).not.toThrow());
  it("keeps Home free of removed blocks and patient/sample data", () => {
    const home = read("src/app/page.tsx");
    expect(home).not.toMatch(/Việc ưu tiên|Thao tác nhanh|mẫu hôm nay|patient|LIS/i);
    expect(home).toMatch(/OperationalBanner/);
  });
  it("provides authenticated official PDF and Excel export endpoints", () => {
    const csv = read("src/app/api/reports/[periodId]/csv/route.ts");
    const pdf = read("src/app/api/reports/[periodId]/pdf/route.ts");
    const xlsx = read("src/app/api/reports/[periodId]/xlsx/route.ts");
    for (const route of [csv, pdf, xlsx]) {
      expect(route).toMatch(/APPROVED/);
      expect(route).toMatch(/search\.get\("start"\)/);
      expect(route).toMatch(/search\.get\("shift"\)/);
    }
    expect(xlsx).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
  it("joins BM.06 statuses through equipment shift details", () => {
    const queries = read("src/lib/p5/operational-queries.ts");
    expect(queries).toContain("equipment_shift_details!inner(records!inner");
    expect(queries).not.toContain("status_code,records!inner");
  });
});

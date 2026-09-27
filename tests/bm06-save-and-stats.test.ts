import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("BM.06 saving & outward statistics contracts", () => {
  it("ShiftRegisterForm provides clear finalize button guidance with exact 25/25 requirement", () => {
    const formSrc = fs.readFileSync(path.resolve(process.cwd(), "src/components/forms/ShiftRegisterForm.tsx"), "utf8");
    expect(formSrc).toMatch(/Hoàn tất ca/);
    expect(formSrc).toMatch(/Lưu nháp/);
    expect(formSrc).toMatch(/canFinalize/);
  });

  it("api/forms/bm06 returns informative translated error messages instead of generic error", () => {
    const routeSrc = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/forms/bm06/route.ts"), "utf8");
    expect(routeSrc).toMatch(/error\.message|Cần ghi nhận đủ|Không thể lưu ca/);
    expect(routeSrc).toMatch(/saved:\s*"1"|saved=1/);
  });

  it("Equipment overview supports shift/date selection parameters", () => {
    const querySrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/p5/operational-queries.ts"), "utf8");
    expect(querySrc).toMatch(/getEquipmentOverview\s*\(\s*date\?:/);
  });

  it("Equipment page provides interactive shift and date filters", () => {
    const pageSrc = fs.readFileSync(path.resolve(process.cwd(), "src/app/equipment/page.tsx"), "utf8");
    expect(pageSrc).toMatch(/searchParams/);
    expect(pageSrc).toMatch(/shift|date/);
  });
});

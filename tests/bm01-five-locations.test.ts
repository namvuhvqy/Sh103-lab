import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPERATURE_AREAS, AREAS } from "@/constants/areas";

describe("BM.01 Canonical Five Locations & Quick Duty / Temperature Consolidation Contracts", () => {
  const rootDir = resolve(__dirname, "..");
  const readSource = (relPath: string) => readFileSync(resolve(rootDir, relPath), "utf8");

  describe("1. Exact 5 canonical BM.01 locations in order", () => {
    const expectedCanonicalBM01 = [
      { code: "SINH_HOA", name: "Khu vực làm xét nghiệm Sinh hóa" },
      { code: "MIEN_DICH", name: "Khu vực làm xét nghiệm Miễn dịch" },
      { code: "NUOC_TIEU", name: "Khu vực làm xét nghiệm Nước tiểu" },
      { code: "LY_TAM", name: "Khu vực Ly tâm" },
      { code: "NHAN_BENH_PHAM", name: "Khu vực Nhận bệnh phẩm" },
    ];

    it("TEMPERATURE_AREAS in src/constants/areas.ts must strictly match the 5 canonical codes and names in order", () => {
      const actualCodes = TEMPERATURE_AREAS.map((a) => a.code);
      const expectedCodes = expectedCanonicalBM01.map((a) => a.code);
      expect(actualCodes).toEqual(expectedCodes);

      const actualNames = TEMPERATURE_AREAS.map((a) => a.name);
      const expectedNames = expectedCanonicalBM01.map((a) => a.name);
      expect(actualNames).toEqual(expectedNames);
    });

    it("TEMPERATURE_AREAS must NOT contain legacy or fabricated codes like AUTOMATION, LOC_NUOC_RO, or auxiliary KHO", () => {
      const actualCodes = TEMPERATURE_AREAS.map((a) => a.code);
      expect(actualCodes).not.toContain("AUTOMATION");
      expect(actualCodes).not.toContain("LOC_NUOC_RO");
      expect(actualCodes).not.toContain("KHO");
    });

    it("AREAS constant in src/constants/areas.ts has exact 5 canonical area codes in order", () => {
      const areaCodes = AREAS.map((a) => a.code);
      expect(areaCodes).toEqual(["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"]);
      expect(areaCodes).not.toContain("AUTOMATION");
      expect(areaCodes).not.toContain("LOC_NUOC_RO");
      expect(areaCodes).not.toContain("KHO");
    });
  });

  describe("2. Temperature Shift Definitions and Time Slots", () => {
    it("SHIFT_DEFINITIONS and domain helpers must contain no 16:40 time strings (fixed 16:30 for SHIFT_3/SHIFT_4)", () => {
      const domainSource = readSource("src/lib/forms/domain.ts");
      expect(domainSource).not.toMatch(/16:40/);
    });

    it("Temperature dashboard options and current shift presentation must not contain 16:40", () => {
      const dashboardSource = readSource("src/components/forms/TemperatureLabDashboard.tsx");
      expect(dashboardSource).not.toMatch(/16:40/);

      const currentShiftCardSource = readSource("src/components/p5/CurrentShiftCard.tsx");
      expect(currentShiftCardSource).not.toMatch(/16:40/);
    });
  });

  describe("3. Temperature Dashboard Selected Slot / Shift Filters Points and Occurrences", () => {
    it("TemperatureLabDashboard must filter points/occurrences by selected shift/slot", () => {
      const dashboardSource = readSource("src/components/forms/TemperatureLabDashboard.tsx");
      // The dashboard filter must take selectedShift into account when computing filteredPoints or rendering
      expect(dashboardSource).toMatch(/selectedShift.*slot_code|slot_code.*selectedShift|p\.slot_code === selectedShift|pt\.slot === selectedShift|occurrence\.slot_code === selectedShift/);
    });
  });

  describe("4. Quick-Save Failure and Async Synchronization Invariants", () => {
    it("TemperatureLabDashboard quick-save helper must not silently ignore fetch failure or swallow errors", () => {
      const dashboardSource = readSource("src/components/forms/TemperatureLabDashboard.tsx");
      // Must not just .catch(console.warn) without rollback or error state notification
      expect(dashboardSource).not.toContain(".catch(console.warn)");
    });
  });

  describe("5. Quick Duty Consolidation & Work Session Orchestrator", () => {
    it("Quick Duty must be presented as Phiên làm việc / Work-Session Orchestrator without free-text staff fields", () => {
      const quickDutySource = readSource("src/app/quick-duty/page.tsx");
      // Free text staff inputs (ktv1 / ktv2 input text) are strictly forbidden
      expect(quickDutySource).not.toMatch(/<input[^>]*value=\{ktv1\}/);
      expect(quickDutySource).not.toMatch(/<input[^>]*value=\{ktv2\}/);
      expect(quickDutySource).not.toMatch(/setKtv1/);
      expect(quickDutySource).not.toMatch(/setKtv2/);
    });

    it("Quick Duty must NOT contain bulk status buttons for BM.06 (no 'Tất cả = BT' or 'Tất cả = KSD')", () => {
      const quickDutySource = readSource("src/app/quick-duty/page.tsx");
      expect(quickDutySource).not.toMatch(/handleSetAllMachines/);
      expect(quickDutySource).not.toMatch(/Tất cả = BT/);
      expect(quickDutySource).not.toMatch(/Tất cả = KSD/);
      expect(quickDutySource).not.toMatch(/Bulk All Normal/i);
    });

    it("Quick Duty heading and navigation should present as Phiên làm việc", () => {
      const quickDutySource = readSource("src/app/quick-duty/page.tsx");
      expect(quickDutySource).toMatch(/Phiên làm việc/i);
    });
  });
});

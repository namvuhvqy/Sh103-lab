import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPERATURE_AREAS } from "@/constants/areas";

describe("Unified Entry & Quick Duty Contracts", () => {
  const rootDir = resolve(__dirname, "..");
  const readSource = (relPath: string) => readFileSync(resolve(rootDir, relPath), "utf8");

  describe("1. QuickDuty / Work Session Orchestrator Architecture", () => {
    it("Quick Duty source title and headings reflect 'Phiên làm việc' or 'Nhập nhanh'", () => {
      const src = readSource("src/app/quick-duty/page.tsx");
      expect(src).toMatch(/Phiên làm việc|Nhập nhanh/i);
    });

    it("Quick Duty must not contain free-text staff/personnel input states", () => {
      const src = readSource("src/app/quick-duty/page.tsx");
      expect(src).not.toMatch(/ktv1|ktv2|setKtv1|setKtv2/);
    });

    it("Quick Duty must not offer bulk status action buttons (no 'Tất cả = BT' or 'Tất cả = KSD')", () => {
      const src = readSource("src/app/quick-duty/page.tsx");
      expect(src).not.toMatch(/Tất cả\s*=\s*BT/);
      expect(src).not.toMatch(/Tất cả\s*=\s*KSD/);
    });

    it("Quick Duty sections represent exact 5 BM01 areas, 9 cool storage, and 4 freezer storage points instead of aggregate inputs", () => {
      const src = readSource("src/app/quick-duty/page.tsx");
      // Expect distinct sections or representations for BM.01 (5 locations), Cool storage (9 units/points), Freezer storage (4 units/points)
      expect(src).toMatch(/9\s*tủ|9\s*điểm|COOL_STORAGE|BM\.02.*9/i);
      expect(src).toMatch(/4\s*tủ|4\s*điểm|FREEZER_STORAGE|BM\.03.*4/i);
    });
  });

  describe("2. Calendar retirement & personnel truthfulness", () => {
    it("Calendar routes to Quick Duty and never hard-codes staff assignments", () => {
      const src = readSource("src/app/calendar/page.tsx");
      expect(src).toContain('redirect("/quick-duty")');
      expect(src).not.toMatch(/leader:\s*["']/);
      expect(src).not.toMatch(/leadTech:\s*["']/);
      expect(src).not.toMatch(/Huỳnh Quang Thuận|Đỗ Văn Sơn|Vũ Thị Thủy|Đỗ Thị Hương/);
    });
  });

  describe("3. Canonical 5 Locations & Temperature Contract Invariants", () => {
    it("TEMPERATURE_AREAS has exactly 5 items and matches canonical codes in order", () => {
      const codes = TEMPERATURE_AREAS.map((a) => a.code);
      expect(codes).toEqual(["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"]);
    });

    it("TEMPERATURE_AREAS does not contain KHO, AUTOMATION, or LOC_NUOC_RO", () => {
      const codes = TEMPERATURE_AREAS.map((a) => a.code);
      expect(codes).not.toContain("KHO");
      expect(codes).not.toContain("AUTOMATION");
      expect(codes).not.toContain("LOC_NUOC_RO");
    });

    it("No 16:40 time string exists in forms domain or temperature components", () => {
      const domainSrc = readSource("src/lib/forms/domain.ts");
      const tempDashSrc = readSource("src/components/forms/TemperatureLabDashboard.tsx");
      expect(domainSrc).not.toMatch(/16:40/);
      expect(tempDashSrc).not.toMatch(/16:40/);
    });

    it("TemperatureLabDashboard filters data based on selected slot/shift, not just select state", () => {
      const src = readSource("src/components/forms/TemperatureLabDashboard.tsx");
      expect(src).toMatch(/p\.slotCode !== selectedShift|occurrence\.slot_code === selectedShift/);
    });
  });
});

import { describe, expect, it } from "vitest";
import { currentShift, isMeasurementAbnormal, shiftProgress } from "@/lib/forms/domain";

describe("P3 domain rules", () => {
  it("resolves all four BM06 shifts and keeps night business date", () => {
    expect(currentShift(new Date("2026-09-24T08:00:00+07:00"))).toMatchObject({ code: "SHIFT_1", businessDate: "2026-09-24" });
    expect(currentShift(new Date("2026-09-24T12:00:00+07:00"))).toMatchObject({ code: "SHIFT_2", businessDate: "2026-09-24" });
    expect(currentShift(new Date("2026-09-24T15:00:00+07:00"))).toMatchObject({ code: "SHIFT_3", businessDate: "2026-09-24" });
    expect(currentShift(new Date("2026-09-24T23:00:00+07:00"))).toMatchObject({ code: "SHIFT_4", businessDate: "2026-09-24" });
    expect(currentShift(new Date("2026-09-25T03:00:00+07:00"))).toMatchObject({ code: "SHIFT_4", businessDate: "2026-09-24" });
  });

  it("treats threshold boundaries as normal", () => {
    expect(isMeasurementAbnormal(21, 21, 26)).toBe(false);
    expect(isMeasurementAbnormal(26, 21, 26)).toBe(false);
    expect(isMeasurementAbnormal(20.9, 21, 26)).toBe(true);
    expect(isMeasurementAbnormal(-30, -30, -10)).toBe(false);
    expect(isMeasurementAbnormal(-9.9, -30, -10)).toBe(true);
  });

  it("only allows BM06 finalize when every applicable asset has a status", () => {
    expect(shiftProgress(24, 25)).toEqual({ completed: 24, total: 25, percent: 96, canFinalize: false });
    expect(shiftProgress(25, 25)).toEqual({ completed: 25, total: 25, percent: 100, canFinalize: true });
  });
});

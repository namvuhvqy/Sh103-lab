import { describe, expect, it } from "vitest";
import { buildOperationalSummary, filterOfficialRecords, measurementPresentation, shiftCompletion } from "@/lib/p5/domain";

describe("P5 operational domain", () => {
  it("derives KPI counts from live occurrence and record rows", () => {
    expect(buildOperationalSummary({
      occurrences: [{ status: "COMPLETED" }, { status: "N_A" }, { status: "PENDING" }],
      measurements: [{ temperature_abnormal: true, humidity_abnormal: false }],
      shiftStatuses: [{ status_code: "H" }, { status_code: "BT" }],
      maintenancePending: 2, decontaminationPending: 1, readyPeriods: 3, returnedPeriods: 1, openIncidents: 2, unreadNotifications: 4,
    })).toEqual(expect.objectContaining({ total: 3, completed: 1, na: 1, pending: 1, abnormal: 1, broken: 1 }));
  });
  it("never presents humidity for refrigerator/freezer forms", () => {
    expect(measurementPresentation("BM.02/QL.HTAT.01", 4.2, null)).toEqual({ temperature: "4.2°C", humidity: null });
    expect(measurementPresentation("BM.03/QL.HTAT.01", -20, null)).toEqual({ temperature: "-20°C", humidity: null });
    expect(measurementPresentation("BM.01/QL.HTAT.01", 24, 60)).toEqual({ temperature: "24°C", humidity: "60%" });
  });
  it("marks BM.06 complete only at 25 of 25", () => {
    expect(shiftCompletion(24, 25).complete).toBe(false);
    expect(shiftCompletion(25, 25).complete).toBe(true);
  });
  it("official export keeps approved effective records only", () => {
    const rows = [
      { id: "a", is_effective: true, register_periods: { status: "APPROVED" } },
      { id: "b", is_effective: false, register_periods: { status: "APPROVED" } },
      { id: "c", is_effective: true, register_periods: { status: "OPEN" } },
    ];
    expect(filterOfficialRecords(rows).map((row) => row.id)).toEqual(["a"]);
  });
});

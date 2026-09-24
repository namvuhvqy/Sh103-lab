import { describe, expect, it } from "vitest";
import { normalizeRecord } from "@/lib/forms/queries";

describe("PostgREST record relationship normalization", () => {
  it("flattens the one-to-one equipment detail and its nested statuses", () => {
    const record = normalizeRecord({
      id: "r1", period_id: "p1", record_type: "EQUIPMENT_SHIFT", business_date: "2026-09-24", slot_code: "SHIFT_4", record_state: "DRAFT", revision_no: 1, revision_of_record_id: null, is_effective: true, is_na: false, note: null,
      measurement_details: null, decontamination_details: null, maintenance_details: null,
      equipment_shift_details: { usage_value: 1, usage_unit: "HOURS", equipment_shift_statuses: [{ asset_display_order_snapshot: 1, status_code: "BT", asset_label_snapshot: "Máy 1" }] },
    });
    expect(record.equipment_shift_statuses).toHaveLength(1);
    expect(record.equipment_shift_details).toEqual({ usage_value: 1, usage_unit: "HOURS" });
  });
});

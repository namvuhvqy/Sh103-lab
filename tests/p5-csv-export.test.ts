import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOfficialPeriodReport } = vi.hoisted(() => ({ getOfficialPeriodReport: vi.fn() }));
vi.mock("@/lib/p5/operational-queries", () => ({ getOfficialPeriodReport }));

import { GET } from "@/app/api/reports/[periodId]/csv/route";

const context = { params: Promise.resolve({ periodId: "period-approved" }) };
const period = {
  status: "APPROVED",
  period_label: "Tháng 09/2026",
  period_start: "2026-09-01",
  period_end: "2026-09-30",
  approved_at: "2026-09-30T06:00:00Z",
  locations: null,
  assets: null,
  form_template_versions: { version_label: "v1", form_templates: { code: "BM.06/QL.TRTB.01", name: "Nhật ký hoạt động" } },
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  cells.push(value);
  return cells;
}

describe("official CSV export", () => {
  beforeEach(() => getOfficialPeriodReport.mockReset());

  it("maps BM.06 statuses to all 25 machine columns by display order", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period,
      records: [{
        id: "shift-1", record_type: "EQUIPMENT_SHIFT", business_date: "2026-09-01", slot_code: "SHIFT_1",
        performed_at: "2026-09-01T00:00:00Z", entered_at: "2026-09-01T00:00:00Z", is_na: false,
        na_reason: null, note: null, revision_no: 1, profiles: { full_name: "KTV kiểm thử" },
        equipment_shift_details: { equipment_shift_statuses: [
          { asset_display_order_snapshot: 25, status_code: "BT", asset_label_snapshot: "Máy 25" },
          { asset_display_order_snapshot: 2, status_code: "KSD", asset_label_snapshot: "Máy 2" },
          { asset_display_order_snapshot: 1, status_code: "H", asset_label_snapshot: "Máy 1" },
        ] },
      }],
    });

    const response = await GET(new Request("https://example.test"), context);
    const lines = (await response.text()).replace(/^\uFEFF/, "").split("\r\n");
    const headerIndex = lines.findIndex((line) => line.includes('"STT","Ngày vận hành"'));
    const row = parseCsvLine(lines[headerIndex + 1]);

    expect(row[6]).toBe("H");
    expect(row[7]).toBe("KSD");
    expect(row[8]).toBe("");
    expect(row[30]).toBe("BT");
    expect(parseCsvLine(lines[headerIndex + 2])[6]).toBe("");
  });
});

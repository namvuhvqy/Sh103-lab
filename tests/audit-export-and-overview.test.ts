import { describe, expect, it } from "vitest";
import { buildReportExportModel, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";

describe("Audit Preview & Export Logic", () => {
  const dummyPeriod: ReportPeriod = {
    id: "test-period-1",
    period_label: "Tháng 10/2026",
    period_start: "2026-10-01",
    period_end: "2026-10-31",
    status: "OPEN",
    approved_at: null,
    locations: { name: "Khu vực Nước tiểu" },
    assets: null,
    form_template_versions: {
      version_label: "v1",
      form_templates: {
        code: "BM.01/QL.HTAT.01",
        name: "Theo dõi nhiệt độ độ ẩm",
      },
    },
  };

  it("does not duplicate morning measurements entered in afternoon/night into afternoon slot", () => {
    const records: ReportRecord[] = [
      {
        id: "rec-1443",
        record_type: "MEASUREMENT",
        business_date: "2026-10-01",
        slot_code: "MORNING",
        performed_at: "2026-10-01T07:43:50.317Z", // 14:43 VN time
        entered_at: "2026-10-01T07:43:50.486Z",
        revision_no: 1,
        is_effective: true,
        measurement_details: {
          temperature_c: 22,
          humidity_pct: 6,
          temperature_abnormal: false,
          humidity_abnormal: true,
        },
      },
      {
        id: "rec-2328",
        record_type: "MEASUREMENT",
        business_date: "2026-10-18",
        slot_code: "MORNING",
        performed_at: "2026-10-18T16:28:20.493Z", // 23:28 VN time
        entered_at: "2026-10-18T16:28:20.734Z",
        revision_no: 1,
        is_effective: true,
        measurement_details: {
          temperature_c: 22,
          humidity_pct: 60,
          temperature_abnormal: false,
          humidity_abnormal: false,
        },
      },
    ];

    const model = buildReportExportModel({
      period: dummyPeriod,
      records,
      start: "2026-10-01",
      official: true,
    });

    // Check Day 1 (2026-10-01)
    const rowDay1 = model.rows.find((r) => r.key === "2026-10-01");
    expect(rowDay1).toBeDefined();
    // Cells: [day, timeM, timeA, tempM, tempA, humM, humA, note, performer]
    const cells1 = rowDay1!.cells;
    expect(cells1[0]).toBe(1);
    expect(cells1[1]).toBe("14:43"); // Morning time
    expect(cells1[2]).toBeNull();    // Afternoon time MUST be null (empty), NOT duplicated!
    expect(cells1[3]).toBe(22);      // Temp M
    expect(cells1[4]).toBeNull();    // Temp A MUST be null!
    expect(cells1[5]).toBe(6);       // Hum M
    expect(cells1[6]).toBeNull();    // Hum A MUST be null!

    // Check Day 2 (completely empty)
    const rowDay2 = model.rows.find((r) => r.key === "2026-10-02");
    expect(rowDay2).toBeDefined();
    const cells2 = rowDay2!.cells;
    expect(cells2[1]).toBeNull();
    expect(cells2[2]).toBeNull();
    expect(cells2[3]).toBeNull();
    expect(cells2[4]).toBeNull();

    // Check Day 18 (2026-10-18)
    const rowDay18 = model.rows.find((r) => r.key === "2026-10-18");
    expect(rowDay18).toBeDefined();
    const cells18 = rowDay18!.cells;
    expect(cells18[0]).toBe(18);
    expect(cells18[1]).toBe("23:28"); // Morning time
    expect(cells18[2]).toBeNull();    // Afternoon MUST be null!
    expect(cells18[3]).toBe(22);
    expect(cells18[4]).toBeNull();    // Afternoon MUST be null!
  });

  it("leaves evaluation empty on unentered days for BM.02 and BM.03 instead of reporting Đạt", () => {
    const periodBM02: ReportPeriod = {
      ...dummyPeriod,
      form_template_versions: {
        version_label: "v1",
        form_templates: {
          code: "BM.02/QL.HTAT.01",
          name: "Theo dõi tủ lạnh mát",
        },
      },
    };

    const recordsBM02: ReportRecord[] = [
      {
        id: "rec-bm02-day1",
        record_type: "MEASUREMENT",
        business_date: "2026-10-01",
        slot_code: "MORNING",
        performed_at: "2026-10-01T01:00:00Z",
        entered_at: "2026-10-01T01:00:00Z",
        revision_no: 1,
        is_effective: true,
        measurement_details: {
          temperature_c: 4,
          temperature_abnormal: false,
        },
      },
    ];

    const model = buildReportExportModel({
      period: periodBM02,
      records: recordsBM02,
      start: "2026-10-01",
      official: true,
    });

    // Day 1 has 4°C normal -> evalText should be "Đạt"
    const rowDay1 = model.rows.find((r) => r.key === "2026-10-01");
    // Cells: [day, tempM, tempA, evalText, note, performer]
    expect(rowDay1!.cells[3]).toBe("Đạt");

    // Day 2 has NO measurements -> evalText MUST be null (empty), NOT "Đạt"!
    const rowDay2 = model.rows.find((r) => r.key === "2026-10-02");
    expect(rowDay2!.cells[1]).toBeNull(); // tempM
    expect(rowDay2!.cells[2]).toBeNull(); // tempA
    expect(rowDay2!.cells[3]).toBeNull(); // evalText MUST be null!

    // Day 31 has NO measurements -> evalText MUST be null!
    const rowDay31 = model.rows.find((r) => r.key === "2026-10-31");
    expect(rowDay31!.cells[3]).toBeNull();
  });
});

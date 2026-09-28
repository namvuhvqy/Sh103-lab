import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOfficialPeriodReport } = vi.hoisted(() => ({ getOfficialPeriodReport: vi.fn() }));
vi.mock("@/lib/p5/operational-queries", () => ({ getOfficialPeriodReport }));

import { GET } from "@/app/api/reports/[periodId]/xlsx/route";

const context = { params: Promise.resolve({ periodId: "period-approved" }) };

describe("official XLSX export", () => {
  beforeEach(() => getOfficialPeriodReport.mockReset());

  it("returns a valid workbook with effective records", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-25T06:00:00Z",
        locations: { name: "Khu Sinh hóa" },
        assets: null,
        form_template_versions: { version_label: "v1", form_templates: { code: "BM.01", name: "Theo dõi nhiệt độ" } },
      },
      records: [{ id: "record-1", record_type: "MEASUREMENT", business_date: "2026-09-25", slot_code: "MORNING", performed_at: "2026-09-25T01:00:00Z", entered_at: "2026-09-25T01:05:00Z", is_na: false, na_reason: null, note: "Đạt", revision_no: 1 }],
    });

    const response = await GET(new Request("https://example.test"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Tổng quan", "Bản ghi hiệu lực"]);
    expect(workbook.getWorksheet("Bản ghi hiệu lực")?.getCell("A2").value).toBe("record-1");
    expect(workbook.getWorksheet("Tổng quan")?.getCell("B6").value).toBe("ĐÃ PHÊ DUYỆT");
  });

  it("passes workspace filters into the official report query", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: { status: "APPROVED", period_label: null, period_start: "2026-09-01", period_end: "2026-09-30", approved_at: null, locations: null, assets: null, form_template_versions: { version_label: "v1", form_templates: { code: "BM.01", name: "Theo dõi nhiệt độ" } } },
      records: [],
    });
    await GET(new Request("https://example.test/api/reports/period-approved/xlsx?start=2026-09-25&end=2026-09-25&shift=SHIFT_2"), context);
    expect(getOfficialPeriodReport).toHaveBeenCalledWith("period-approved", { start: "2026-09-25", end: "2026-09-25", shift: "SHIFT_2" });
  });

  it("rejects non-approved periods", async () => {
    getOfficialPeriodReport.mockResolvedValue({ official: false, period: { status: "OPEN" }, records: [] });
    const response = await GET(new Request("https://example.test?draft=true"), context);
    expect(response.status).toBe(409);
  });

  it("leaves missing BM.01 measurements empty instead of fabricating normal values", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-30T06:00:00Z",
        locations: { name: "Khu Sinh hóa" },
        assets: null,
        form_template_versions: { version_label: "v1", form_templates: { code: "BM.01/QL.HTAT.01", name: "Theo dõi nhiệt độ" } },
      },
      records: [{
        id: "record-day-2",
        record_type: "MEASUREMENT",
        business_date: "2026-09-02",
        slot_code: "MORNING",
        performed_at: "2026-09-02T01:00:00Z",
        entered_at: "2026-09-02T01:05:00Z",
        is_na: false,
        na_reason: null,
        note: null,
        revision_no: 1,
        profiles: { full_name: "KTV kiểm thử" },
        measurement_details: { temperature_c: 24, humidity_pct: 50, temperature_abnormal: false, humidity_abnormal: false },
      }],
    });

    const response = await GET(new Request("https://example.test"), context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    const row = workbook.getWorksheet("Bản ghi hiệu lực")!.getRow(2);

    expect(row.getCell(1).value).toBeNull();
    expect(row.getCell(6).value).toBeNull();
    expect(row.getCell(8).value).toBeNull();
    expect(row.getCell(10).value).toBeNull();
    expect(row.getCell(11).value).toBeNull();
  });

  it("maps each BM.06 machine status by display order and leaves absent statuses empty", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-30T06:00:00Z",
        locations: null,
        assets: null,
        form_template_versions: { version_label: "v1", form_templates: { code: "BM.06/QL.TRTB.01", name: "Nhật ký hoạt động" } },
      },
      records: [{
        id: "shift-1",
        record_type: "EQUIPMENT_SHIFT",
        business_date: "2026-09-01",
        slot_code: "SHIFT_1",
        performed_at: "2026-09-01T00:00:00Z",
        entered_at: "2026-09-01T00:00:00Z",
        is_na: false,
        na_reason: null,
        note: null,
        revision_no: 1,
        profiles: { full_name: "KTV kiểm thử" },
        equipment_shift_details: {
          equipment_shift_statuses: [
            { asset_display_order_snapshot: 25, status_code: "BT", asset_label_snapshot: "Máy 25" },
            { asset_display_order_snapshot: 2, status_code: "KSD", asset_label_snapshot: "Máy 2" },
            { asset_display_order_snapshot: 1, status_code: "H", asset_label_snapshot: "Máy 1" },
          ],
        },
      }],
    });

    const response = await GET(new Request("https://example.test"), context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet("Bản ghi hiệu lực")!;

    expect(sheet.getRow(2).getCell(7).value).toBe("H");
    expect(sheet.getRow(2).getCell(8).value).toBe("KSD");
    expect(sheet.getRow(2).getCell(9).value).toBeNull();
    expect(sheet.getRow(2).getCell(31).value).toBe("BT");
    expect(sheet.getRow(3).getCell(5).value).toBeNull();
    expect(sheet.getRow(3).getCell(6).value).toBeNull();
    expect(sheet.getRow(3).getCell(7).value).toBeNull();
  });

  it("does not mark a measurement record as normal when its detail is missing", async () => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-30T06:00:00Z",
        locations: { name: "Khu Sinh hóa" },
        assets: null,
        form_template_versions: { version_label: "v1", form_templates: { code: "BM.01/QL.HTAT.01", name: "Theo dõi nhiệt độ" } },
      },
      records: [{
        id: "record-without-detail", record_type: "MEASUREMENT", business_date: "2026-09-01", slot_code: "MORNING",
        performed_at: "2026-09-01T01:00:00Z", entered_at: "2026-09-01T01:05:00Z", is_na: false,
        na_reason: null, note: null, revision_no: 1, profiles: { full_name: "KTV kiểm thử" }, measurement_details: null,
      }],
    });

    const response = await GET(new Request("https://example.test"), context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    const row = workbook.getWorksheet("Bản ghi hiệu lực")!.getRow(2);

    expect(row.getCell(10).value).toBeNull();
  });

  it.each([
    ["BM.02/QL.HTAT.01", "Tủ mát", 6, 8, 9],
    ["BM.03/QL.HTAT.01", "Tủ đông", 6, 8, 9],
  ])("leaves missing %s measurements and evaluation empty", async (code, name, valueColumn, evaluationColumn, performerColumn) => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-30T06:00:00Z",
        locations: null,
        assets: { source_name: name },
        form_template_versions: { version_label: "v1", form_templates: { code, name } },
      },
      records: [],
    });

    const response = await GET(new Request("https://example.test"), context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    const row = workbook.getWorksheet("Bản ghi hiệu lực")!.getRow(2);

    expect(row.getCell(valueColumn).value).toBeNull();
    expect(row.getCell(evaluationColumn).value).toBeNull();
    expect(row.getCell(performerColumn).value).toBeNull();
  });

  it.each([
    ["BM.01_KNBM", 4, 5, 6, 7],
    ["BM.02/QL.TRTB.01", 4, 6, 7, 0],
  ])("leaves missing %s outcomes and performer empty", async (code, firstOutcome, secondOutcome, performerColumn, thirdOutcome) => {
    getOfficialPeriodReport.mockResolvedValue({
      official: true,
      period: {
        status: "APPROVED",
        period_label: "Tháng 09/2026",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        approved_at: "2026-09-30T06:00:00Z",
        locations: { name: "Khu Sinh hóa" },
        assets: { source_name: "Máy kiểm thử" },
        form_template_versions: { version_label: "v1", form_templates: { code, name: code } },
      },
      records: [],
    });

    const response = await GET(new Request("https://example.test"), context);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await response.arrayBuffer()) as unknown as ExcelJS.Buffer);
    const row = workbook.getWorksheet("Bản ghi hiệu lực")!.getRow(2);

    expect(row.getCell(firstOutcome).value).toBeNull();
    expect(row.getCell(secondOutcome).value).toBeNull();
    expect(row.getCell(performerColumn).value).toBeNull();
    if (thirdOutcome) expect(row.getCell(thirdOutcome).value).toBeNull();
  });
});

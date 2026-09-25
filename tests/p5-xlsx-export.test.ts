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
    const response = await GET(new Request("https://example.test"), context);
    expect(response.status).toBe(409);
  });
});

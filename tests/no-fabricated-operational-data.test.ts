import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("real operational data contract", () => {
  it("does not seed mock measurements in the temperature page or QC chart", () => {
    const page = source("src/app/temperature/page.tsx");
    const chart = source("src/components/p5/QCTrendChart.tsx");

    expect(page).not.toContain("targetMockPoints");
    expect(page).not.toContain("actualTemp = item.temp");
    expect(chart).not.toContain("data: [23.1");
    expect(chart).not.toContain("data: [56, 58");
    expect(chart).toContain("Chưa có dữ liệu lịch sử");
  });

  it("starts quick duty inputs empty instead of presenting fabricated completed values", () => {
    const quickDuty = source("src/app/quick-duty/page.tsx");

    expect(quickDuty).not.toContain('useState("KTV Nguyễn Văn A")');
    expect(quickDuty).not.toContain('NUOC_TIEU: { temp: "23.5"');
    expect(quickDuty).not.toContain('init[m.code] = "BT"');
    expect(quickDuty).not.toContain('?? "23.5"');
    expect(quickDuty).not.toContain('?? "BT"');
    expect(quickDuty).not.toContain("đã được đồng bộ vào hệ thống");
    expect(quickDuty).toContain("Chưa tạo hồ sơ chính thức");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperationalChart } from "@/components/p5/OperationalChart";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P5 mobile visual fidelity and data visualization", () => {
  it("provides a responsive clinical app shell with safe areas", () => {
    const shell = read("src/components/shell/AppShell.tsx");
    const header = read("src/components/shell/MobileHeader.tsx");
    const css = read("src/app/globals.css");
    expect(shell).toMatch(/clinical-shell/);
    expect(header).toMatch(/KHOA SINH HÓA/);
    expect(css).toMatch(/safe-area-inset-bottom/);
    expect(css).toMatch(/--clinical-primary/);
  });

  it("renders accessible real-data charts with a non-fabricated empty state", () => {
    const { rerender } = render(<OperationalChart title="Xu hướng nhiệt độ" unit="°C" points={[]} />);
    expect(screen.getByText("Chưa đủ dữ liệu để vẽ biểu đồ")).toBeInTheDocument();
    rerender(<OperationalChart title="Xu hướng nhiệt độ" unit="°C" points={[{ label: "06:00", value: 24.5 }, { label: "10:00", value: 25 }]} />);
    expect(screen.getByRole("img", { name: /Xu hướng nhiệt độ/ })).toBeInTheDocument();
    expect(screen.getByText("24.5°C")).toBeInTheDocument();
  });

  it("uses real charts on temperature, equipment and reports screens", () => {
    expect(read("src/app/temperature/page.tsx")).toMatch(/OperationalChart/);
    expect(read("src/app/equipment/page.tsx")).toMatch(/StatusDistribution/);
    expect(read("src/app/reports/page.tsx")).toMatch(/StatusDistribution/);
  });

  it("presents approval as a Head-only period and register center", () => {
    const approvals = read("src/app/approvals/page.tsx");
    expect(approvals).toMatch(/if \(!access\?\.canApprove\) redirect/);
    expect(approvals).toMatch(/Chờ phê duyệt/);
    expect(approvals).toMatch(/Đã phê duyệt/);
    expect(approvals).toMatch(/Bị trả lại/);
    expect(approvals).toMatch(/toàn kỳ\/sổ/);
  });

  it("provides the export workspace flow from the attached mockup", () => {
    const route = read("src/app/reports/export/page.tsx");
    expect(route).toMatch(/Kỳ báo cáo cần xuất/);
    expect(route).toMatch(/Chọn 1 trong/);
    expect(route).toMatch(/Xem trước/);
    expect(route).toMatch(/Excel \(\.xlsx\)/);
    expect(route).toMatch(/PrintButton/);
    expect(read("src/components/p5/PrintButton.tsx")).toMatch(/In phiếu \/ Lưu PDF/);
    expect(route).toMatch(/getExportWorkspace/);
  });

  it("keeps export data official, approved and effective", () => {
    const queries = read("src/lib/p5/operational-queries.ts");
    expect(queries).toMatch(/getExportWorkspace/);
    expect(queries).toContain('status", "APPROVED');
    expect(queries).toMatch(/is_effective/);
    expect(read("src/app/reports/page.tsx")).toContain("/reports/export");
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QCTrendChart, type QCTrendPoint } from "@/components/p5/QCTrendChart";
import { TemperatureLabDashboard } from "@/components/forms/TemperatureLabDashboard";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("QC Trend Chart & Temperature Screen Redesign", () => {
  const samplePoints: QCTrendPoint[] = [
    {
      areaName: "Khu vực Sinh hóa",
      locationName: "Sinh hóa",
      date: "2026-10-25",
      time: "25/10 08:00",
      temperature: 23.4,
      humidity: 55,
      category: "ROOM",
    },
    {
      areaName: "Khu vực Sinh hóa",
      locationName: "Sinh hóa",
      date: "2026-10-26",
      time: "26/10 08:00",
      temperature: 23.8,
      humidity: 58,
      category: "ROOM",
    },
    {
      areaName: "Khu vực Miễn dịch",
      locationName: "Miễn dịch",
      date: "2026-10-25",
      time: "25/10 08:00",
      temperature: 24.1,
      humidity: 52,
      category: "ROOM",
    },
  ];

  it("QCTrendChart renders QC points (circles), connecting polyline, and UCL/CL/LCL lines", () => {
    const { container } = render(
      <QCTrendChart title="Kiểm tra QC" points={samplePoints} />
    );

    // Connecting polyline
    const polylines = container.querySelectorAll("polyline");
    expect(polylines.length).toBeGreaterThan(0);

    // QC point circles
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(samplePoints.length);

    // Levey-Jennings reference lines
    expect(screen.getByText(/UCL: 26°C/)).toBeInTheDocument();
    expect(screen.getByText(/CL \(Mean\): 23.5°C/)).toBeInTheDocument();
    expect(screen.getByText(/LCL: 21°C/)).toBeInTheDocument();

    // Humidity chart directly below
    expect(screen.getByText(/Biểu đồ xu hướng Độ ẩm phòng xét nghiệm/)).toBeInTheDocument();
    expect(screen.getByText(/UCL: 80%/)).toBeInTheDocument();
    expect(screen.getByText(/CL \(Mean\): 50%/)).toBeInTheDocument();
    expect(screen.getByText(/LCL: 20%/)).toBeInTheDocument();
  });

  it("QCTrendChart shows empty state message when points array is empty", () => {
    render(<QCTrendChart points={[]} />);
    expect(screen.getByText("Chưa có dữ liệu lịch sử")).toBeInTheDocument();
  });

  it("QCTrendChart allows device isolation filtering", () => {
    render(<QCTrendChart points={samplePoints} />);
    const select = screen.getByTitle("Lọc riêng thiết bị để theo dõi đường cong QC độc lập");
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "Khu vực Sinh hóa" } });
    expect(select).toHaveValue("Khu vực Sinh hóa");
  });

  it("TemperatureLabDashboard provides 2 QC filtering modes: Daily and Range (Từ ngày A -> Đến ngày B)", () => {
    render(
      <TemperatureLabDashboard
        initialPoints={[]}
        occurrences={[]}
        chartPoints={[]}
        selectedDateIso="2026-10-31"
        initialFilterMode="daily"
      />
    );

    expect(screen.getByText("Theo ngày (Daily)")).toBeInTheDocument();
    expect(screen.getByText("Từ ngày A → Đến ngày B (Chuỗi QC)")).toBeInTheDocument();

    // Switch to range mode
    fireEvent.click(screen.getByText("Từ ngày A → Đến ngày B (Chuỗi QC)"));
    expect(screen.getByText("Từ ngày:")).toBeInTheDocument();
    expect(screen.getByText("Đến ngày:")).toBeInTheDocument();
    expect(screen.getByText("Xem biểu đồ")).toBeInTheDocument();
    expect(screen.getByText("Cả tháng 10 (31 ngày)")).toBeInTheDocument();
  });

  it("Source code respects all architectural contracts", () => {
    const dashboardSrc = readSource("src/components/forms/TemperatureLabDashboard.tsx");
    const chartSrc = readSource("src/components/p5/QCTrendChart.tsx");

    // Has QCTrendChart and InlineTemperatureList
    expect(dashboardSrc).toContain("QCTrendChart");
    expect(dashboardSrc).toContain("InlineTemperatureList");
    expect(dashboardSrc).toContain("Nhập số liệu");

    // No overview button
    expect(dashboardSrc).not.toMatch(/>\s*Tổng quan\s*</);

    // No uncontrolled input number
    expect(dashboardSrc).not.toContain('type="number"');
    expect(dashboardSrc).not.toContain("handleInlineCellChange");

    // No obsolete shift time or swallowed errors
    expect(dashboardSrc).not.toContain("16:40");
    expect(dashboardSrc).not.toContain(".catch(console.warn)");

    // QCTrendChart no mock data
    expect(chartSrc).not.toContain("data: [23.1");
    expect(chartSrc).not.toContain("data: [56, 58");
    expect(chartSrc).toContain("Chưa có dữ liệu lịch sử");
  });
});

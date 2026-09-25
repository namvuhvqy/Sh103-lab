import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/shell/BottomNav";
import { KpiCard } from "@/components/p5/KpiCard";
import { OperationalBanner } from "@/components/p5/OperationalBanner";
import { SegmentedControl } from "@/components/p5/SegmentedControl";

vi.mock("next/navigation", () => ({ usePathname: () => "/temperature" }));

describe("P5 clinical UI contract", () => {
  it("uses the canonical five-item mobile navigation", () => {
    render(<BottomNav currentPath="/temperature" />);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(Array.from(nav.querySelectorAll("a")).map((link) => link.textContent)).toEqual(["Tổng quan", "Nhiệt độ", "Thiết bị", "Khử nhiễm", "Thêm"]);
    expect(screen.getByRole("link", { name: "Nhiệt độ" })).toHaveAttribute("aria-current", "page");
  });
  it("renders KPI with textual status and drill-down", () => {
    render(<KpiCard label="BM.06 ca hiện tại" value="24/25" status="Còn 1 máy" tone="warning" href="/equipment" />);
    expect(screen.getByText("Còn 1 máy")).toBeVisible();
    expect(screen.getByRole("link", { name: /BM.06 ca hiện tại/ })).toHaveAttribute("href", "/equipment");
  });
  it("renders an operational banner with a direct workflow CTA", () => {
    render(<OperationalBanner title="Còn 2 điểm chưa ghi" description="Ca sáng" href="/temperature" cta="Ghi số đo" tone="warning" />);
    expect(screen.getByRole("link", { name: "Ghi số đo" })).toHaveAttribute("href", "/temperature");
  });
  it("exposes segmented state semantically", () => {
    render(<SegmentedControl items={[{ label: "Tất cả", href: "/notifications" }, { label: "Chưa đọc", href: "/notifications?filter=unread" }]} active="Chưa đọc" />);
    expect(screen.getByRole("link", { name: "Chưa đọc" })).toHaveAttribute("aria-current", "page");
  });
});

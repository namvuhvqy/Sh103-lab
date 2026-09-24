import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AreaCard } from "@/components/areas/AreaCard";

const base = { code: "SINH_HOA", name: "Khu vực làm xét nghiệm Sinh hóa", deviceCount: 9, completed: 4, total: 9 };
describe("Area-first UI", () => {
  it("links the work area to its detail and shows dynamic machine count", () => {
    render(<AreaCard {...base} />);
    expect(screen.getByRole("link", { name: /vào khu sinh hóa/i })).toHaveAttribute("href", "/areas/SINH_HOA");
    expect(screen.getByText("9 máy")).toBeInTheDocument();
    expect(screen.getByText("4/9 máy đã ghi nhận")).toBeInTheDocument();
  });
  it("describes specimen reception as decontamination-only", () => {
    render(<AreaCard code="NHAN_BENH_PHAM" name="Khu vực Nhận bệnh phẩm" deviceCount={0} completed={0} total={0} />);
    expect(screen.getByText("Không có máy — Chỉ khử nhiễm")).toBeInTheDocument();
  });
});

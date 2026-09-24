import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";

describe("P2 admin foundation UI", () => {
  it("renders an accessible admin page heading and navigation", () => {
    render(<AdminPageShell title="Quản lý Khu vực" description="Dữ liệu động"><p>Nội dung</p></AdminPageShell>);
    expect(screen.getByRole("heading", { name: "Quản lý Khu vực" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /quản trị/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /khu vực/i })).toHaveAttribute("href", "/admin/locations");
    expect(screen.getByRole("link", { name: /thiết bị/i })).toHaveAttribute("href", "/admin/assets");
  });

  it("renders summary values with explicit labels", () => {
    render(<SummaryCard label="Máy xét nghiệm" value={25} detail="9 / 8 / 4 / 4" />);
    expect(screen.getByText("Máy xét nghiệm")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("9 / 8 / 4 / 4")).toBeInTheDocument();
  });
});

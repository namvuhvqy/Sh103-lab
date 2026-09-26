import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { MobileHeader } from "@/components/shell/MobileHeader";
import { DesktopSidebar } from "@/components/shell/DesktopSidebar";
import { BottomNav } from "@/components/shell/BottomNav";
import { AREAS } from "@/constants/areas";

describe("P1 Shell & Navigation Requirements", () => {
  it("preserves Vietnamese UI and 5 work areas with machine counts 9/8/4/4/0", () => {
    expect(AREAS).toHaveLength(5);
    const counts = AREAS.map((a) => a.deviceCount);
    expect(counts).toEqual([9, 8, 4, 4, 0]);

    expect(AREAS[0].name).toBe("Khu Sinh hóa");
    expect(AREAS[0].code).toBe("SINH_HOA");
    expect(AREAS[1].name).toBe("Khu Miễn dịch");
    expect(AREAS[1].code).toBe("MIEN_DICH");
    expect(AREAS[2].name).toBe("Khu Nước tiểu");
    expect(AREAS[2].code).toBe("NUOC_TIEU");
    expect(AREAS[3].name).toBe("Khu Ly tâm");
    expect(AREAS[3].code).toBe("LY_TAM");
    expect(AREAS[4].name).toBe("Khu Nhận bệnh phẩm");
    expect(AREAS[4].code).toBe("NHAN_BENH_PHAM");
  });

  it("renders DesktopSidebar with 5 work areas and Vietnamese labels", () => {
    render(<DesktopSidebar currentPath="/areas/SINH_HOA" />);
    expect(screen.getByText("Khu Sinh hóa")).toBeInTheDocument();
    expect(screen.getByText("9 máy")).toBeInTheDocument();
    expect(screen.getByText("Khu Miễn dịch")).toBeInTheDocument();
    expect(screen.getByText("8 máy")).toBeInTheDocument();
    expect(screen.getByText("Khu Nước tiểu")).toBeInTheDocument();
    expect(screen.getAllByText("4 máy")).toHaveLength(2);
    expect(screen.getByText("Khu Ly tâm")).toBeInTheDocument();
    expect(screen.getByText("Khu Nhận bệnh phẩm")).toBeInTheDocument();
  });

  it("renders the canonical P5 BottomNav with 5 tabs", () => {
    render(<BottomNav currentPath="/" />);
    expect(screen.getByText("Tổng quan")).toBeInTheDocument();
    expect(screen.getByText("Nhiệt độ")).toBeInTheDocument();
    expect(screen.getByText("Thiết bị")).toBeInTheDocument();
    expect(screen.getByText("Khử nhiễm")).toBeInTheDocument();
    expect(screen.getByText("Thêm")).toBeInTheDocument();
  });

  it("renders MobileHeader with title and actions", () => {
    render(<MobileHeader title="SH103 Sinh Hóa" />);
    expect(screen.getByText("SH103 Sinh Hóa")).toBeInTheDocument();
  });

  it("renders AppShell wrapping children", () => {
    render(
      <AppShell>
        <div data-testid="child-content">Nội dung trang</div>
      </AppShell>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});

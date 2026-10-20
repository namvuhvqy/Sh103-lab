import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AuditLogClientView,
  type FormattedAuditEvent,
  type AuditPaginationInfo,
  type AuditCategoryCounts,
} from "@/components/admin/AuditLogClientView";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("page=1&category=ALL"),
}));

const mockEvents: FormattedAuditEvent[] = Array.from({ length: 25 }, (_, i) => ({
  id: `audit-${i + 1}`,
  createdAt: "2026-10-20T15:38:34.355Z",
  timeStr: "22:38:34 20/10/2026",
  actorName: `Kỹ thuật viên ${i + 1}`,
  actorRole: "Kỹ thuật viên",
  actionTitle: i % 2 === 0 ? "Ghi nhận bảo dưỡng thiết bị (BM.02)" : "Ghi nhận số đo nhiệt độ / độ ẩm",
  badgeLabel: i % 2 === 0 ? "BM.02 - Bảo dưỡng" : "BM.01/02/03 - Nhiệt ẩm",
  badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  category: i % 2 === 0 ? "BM06" : "TEMPERATURE",
  summary: `Hành động chi tiết kiểm toán sự kiện số ${i + 1}`,
  entityType: "Bản ghi xét nghiệm",
  entityId: `rec-${i + 1}`,
  technicalDetails: {
    actionCode: "CREATE_RECORD",
    targetDate: "2026-10-20",
    slotCode: "SHIFT_1",
    locationName: "Khu Sinh Hóa",
    assetName: "Máy xét nghiệm AU480",
    periodLabel: "Sổ kỳ tháng 10/2026",
    lockVersion: 1,
  },
}));

const mockPagination: AuditPaginationInfo = {
  page: 1,
  pageSize: 25,
  totalCount: 2204,
  totalPages: 89,
  category: "ALL",
};

const mockCategoryCounts: AuditCategoryCounts = {
  ALL: 2204,
  BM06: 842,
  TEMPERATURE: 1002,
  DECONTAMINATION: 180,
  APPROVAL: 109,
  MASTER: 49,
};

describe("PERFORMANCE P1: Audit Log Server Pagination & Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders 25 items per page and displays truthful total counts from database", () => {
    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    // Displays summary counter
    expect(screen.getByText("Hiển thị 1–25 / 2204 sự kiện")).toBeInTheDocument();

    // Renders the pagination footer
    expect(screen.getByText(/Trang/)).toBeInTheDocument();
    expect(screen.getByText(/89/)).toBeInTheDocument();

    // Renders category chips with real counts
    expect(screen.getByText("Tất cả sự kiện")).toBeInTheDocument();
    expect(screen.getAllByText("2204").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("842")).toBeInTheDocument();
    expect(screen.getByText("1002")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("109")).toBeInTheDocument();
    expect(screen.getByText("49")).toBeInTheDocument();
  });

  it("2. Previous button is disabled on page 1 and Next button navigates to page 2", () => {
    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /Trước/ });
    expect(prevBtn).toBeDisabled();

    const nextBtn = screen.getByRole("button", { name: /Sau/ });
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("3. Next button is disabled on last page and Prev button navigates backwards", () => {
    const lastPagePagination: AuditPaginationInfo = {
      page: 89,
      pageSize: 25,
      totalCount: 2204,
      totalPages: 89,
      category: "ALL",
    };

    render(
      <AuditLogClientView
        events={mockEvents.slice(0, 4)}
        pagination={lastPagePagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const nextBtn = screen.getByRole("button", { name: /Sau/ });
    expect(nextBtn).toBeDisabled();

    const prevBtn = screen.getByRole("button", { name: /Trước/ });
    expect(prevBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=88"));
  });

  it("4. Category chip click updates category in URL and resets to page 1", () => {
    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const bm06Btn = screen.getByRole("button", { name: /BM.06 Nhật ký máy/ });
    fireEvent.click(bm06Btn);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("category=BM06"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("5. Quick search filters the displayed slice immediately", () => {
    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên/);
    fireEvent.change(searchInput, { target: { value: "Kỹ thuật viên 1" } });

    // Should match "Kỹ thuật viên 1", "Kỹ thuật viên 10", etc.
    expect(screen.getByText("Kỹ thuật viên: Kỹ thuật viên 1")).toBeInTheDocument();
  });

  it("6. Technical ISO trace details can be expanded without data loss", () => {
    render(
      <AuditLogClientView
        events={mockEvents.slice(0, 1)}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    expect(screen.getByText("Xem mã truy vết & Thông số hệ thống")).toBeInTheDocument();
    expect(screen.getByText("audit-1")).toBeInTheDocument();
    expect(screen.getByText("Máy xét nghiệm AU480")).toBeInTheDocument();
    expect(screen.getByText("Sổ kỳ tháng 10/2026")).toBeInTheDocument();
  });
});

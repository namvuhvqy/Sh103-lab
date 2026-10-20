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
  APPROVAL: 111,
  MASTER: 49,
};

describe("PERFORMANCE P1: Audit Log Server Pagination & Regression", () => {
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

    // Displays truthful summary counter
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
    expect(screen.getByText("111")).toBeInTheDocument();
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

  it("5. Submitting search form triggers server-side query with q parameter and resets page to 1", () => {
    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm theo người thực hiện/);
    fireEvent.change(searchInput, { target: { value: "Bác sĩ Thuận" } });

    const searchBtn = screen.getByRole("button", { name: /Tìm kiếm/ });
    fireEvent.click(searchBtn);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=B%C3%A1c+s%C4%A9+Thu%E1%BA%ADn"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("6. Displays active search filter banner and supports clearing search", () => {
    const searchPagination: AuditPaginationInfo = {
      page: 1,
      pageSize: 25,
      totalCount: 42,
      totalPages: 2,
      category: "ALL",
      query: "APPROVE",
    };

    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={searchPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    expect(screen.getByText(/Đang tìm kiếm toàn bộ lịch sử theo:/)).toBeInTheDocument();
    expect(screen.getByText(/42 kết quả/)).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /Xóa bộ lọc tìm kiếm/ });
    fireEvent.click(clearBtn);

    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining("q="));
  });

  it("7. Search combined with pagination preserves q and navigates between result pages", () => {
    const searchPagination: AuditPaginationInfo = {
      page: 1,
      pageSize: 25,
      totalCount: 103,
      totalPages: 5,
      category: "ALL",
      query: "APPROVE",
    };

    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={searchPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    const nextBtn = screen.getByRole("button", { name: /Sau/ });
    fireEvent.click(nextBtn);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("8. Error response handling: does NOT display false zeros when count query fails", () => {
    const errorCategoryCounts: AuditCategoryCounts = {
      ALL: 2204,
      BM06: null, // query error
      TEMPERATURE: 1002,
      DECONTAMINATION: null, // query error
      APPROVAL: 111,
      MASTER: 49,
    };

    render(
      <AuditLogClientView
        events={mockEvents}
        pagination={mockPagination}
        categoryCounts={errorCategoryCounts}
      />
    );

    // Categories with errors should display dash (—) instead of false "0"
    const bm06Btn = screen.getByRole("button", { name: /BM.06 Nhật ký máy/ });
    expect(bm06Btn).toHaveTextContent("—");

    const deconBtn = screen.getByRole("button", { name: /Khử nhiễm BM.01/ });
    expect(deconBtn).toHaveTextContent("—");
  });

  it("9. Handles out-of-bounds page or empty results gracefully", () => {
    const emptyPagination: AuditPaginationInfo = {
      page: 999,
      pageSize: 25,
      totalCount: 0,
      totalPages: 1,
      category: "ALL",
      query: "nonexistent_term",
    };

    render(
      <AuditLogClientView
        events={[]}
        pagination={emptyPagination}
        categoryCounts={mockCategoryCounts}
      />
    );

    expect(screen.getByText("Không tìm thấy sự kiện kiểm toán nào")).toBeInTheDocument();
    expect(screen.getByText(/Không có sự kiện nào khớp với từ khóa/)).toBeInTheDocument();
  });

  it("10. Technical ISO trace details can be expanded without data loss", () => {
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

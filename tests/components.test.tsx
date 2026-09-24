import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataCard } from "@/components/ui/DataCard";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";

describe("P1 UI Components", () => {
  it("renders StatusBadge with correct Vietnamese label and styling variant", () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("Đã hoàn thành")).toBeInTheDocument();
  });

  it("renders DataCard with title, subtitle and children", () => {
    render(
      <DataCard title="Máy AU5800" subtitle="Khu Sinh hóa">
        <div>Nội dung thẻ</div>
      </DataCard>
    );
    expect(screen.getByText("Máy AU5800")).toBeInTheDocument();
    expect(screen.getByText("Khu Sinh hóa")).toBeInTheDocument();
    expect(screen.getByText("Nội dung thẻ")).toBeInTheDocument();
  });

  it("renders EmptyState with message and optional action", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Không có dữ liệu"
        description="Chưa có biểu mẫu nào trong ca này."
        actionLabel="Thêm mới"
        onAction={onAction}
      />
    );
    expect(screen.getByText("Không có dữ liệu")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "Thêm mới" });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders LoadingSpinner", () => {
    render(<LoadingSpinner label="Đang tải dữ liệu..." />);
    expect(screen.getByText("Đang tải dữ liệu...")).toBeInTheDocument();
  });

  it("renders ErrorState with retry callback", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Đã xảy ra lỗi"
        message="Không thể kết nối đến máy chủ"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText("Đã xảy ra lỗi")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "Thử lại" });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders ConfirmDialog and triggers confirm / cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Xác nhận gửi duyệt"
        message="Bạn có chắc chắn muốn gửi duyệt kỳ này không?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByText("Xác nhận gửi duyệt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders FilterSheet when open", () => {
    render(
      <FilterSheet isOpen={true} onClose={vi.fn()} title="Bộ lọc biểu mẫu">
        <div>Nội dung bộ lọc</div>
      </FilterSheet>
    );
    expect(screen.getByText("Bộ lọc biểu mẫu")).toBeInTheDocument();
    expect(screen.getByText("Nội dung bộ lọc")).toBeInTheDocument();
  });

  it("renders StickyActionBar with action buttons", () => {
    render(
      <StickyActionBar>
        <button>Lưu tạm</button>
        <button>Gửi duyệt</button>
      </StickyActionBar>
    );
    expect(screen.getByRole("button", { name: "Lưu tạm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi duyệt" })).toBeInTheDocument();
  });
});

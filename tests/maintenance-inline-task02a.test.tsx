import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MaintenanceWorkspace } from "@/components/maintenance/MaintenanceWorkspace";
import { saveMaintenanceAction } from "@/app/maintenance/actions";
import type { MaintenanceWorkspaceData } from "@/lib/maintenance/queries";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/maintenance/actions", () => ({
  saveMaintenanceAction: vi.fn(),
}));

const testData: MaintenanceWorkspaceData = {
  businessDate: "2026-10-20",
  items: [
    {
      id: "occ-au480",
      periodId: "p-1",
      periodStatus: "OPEN",
      assetId: "a-1",
      assetName: "Máy Sinh Hóa AU480-01",
      assetCode: "AU480",
      locationName: "Khu Hóa sinh",
      cadence: "DAILY",
      slotCode: "DAILY",
      status: "PENDING",
      businessDate: "2026-10-20",
      fulfilledByRecordId: null,
      record: null,
    },
    {
      id: "occ-cobas",
      periodId: "p-2",
      periodStatus: "OPEN",
      assetId: "a-2",
      assetName: "Máy Miễn Dịch Cobas E602",
      assetCode: "E602",
      locationName: "Khu Miễn dịch",
      cadence: "DAILY",
      slotCode: "DAILY",
      status: "PENDING",
      businessDate: "2026-10-20",
      fulfilledByRecordId: null,
      record: null,
    },
  ],
  counts: {
    total: 2,
    completed: 0,
    pending: 2,
    daily: 2,
    weekly: 0,
    monthly: 0,
  },
};

describe("TASK 02A.1: Inline Editing & Live Updates for Maintenance (/maintenance)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("1. Expands inline form on clicking 'Ghi nhận bảo dưỡng' and collapses on toggle; has NO external link button", () => {
    render(<MaintenanceWorkspace data={testData} />);

    // Initially, no form should be displayed in the document
    expect(screen.queryByLabelText(/Ngày giờ thực hiện/)).toBeNull();

    // Verify external link button has been completely removed from machine card
    expect(screen.queryByTitle(/Mở màn hình riêng/)).toBeNull();
    expect(screen.queryByLabelText(/Trang riêng/)).toBeNull();

    // Click "Ghi nhận bảo dưỡng" for the first machine
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // Form expands inline directly underneath the card
    expect(screen.getByLabelText(/Ngày giờ thực hiện/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đóng form/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lưu bảo dưỡng/ })).toBeInTheDocument();

    // Click "Đóng form" to collapse
    fireEvent.click(screen.getByRole("button", { name: /Đóng form/ }));
    expect(screen.queryByLabelText(/Ngày giờ thực hiện/)).toBeNull();
  });

  it("2. Enforces only ONE form open at a time (compact mobile accordion)", () => {
    render(<MaintenanceWorkspace data={testData} />);

    // Open first machine
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // First form is open
    expect(screen.getByRole("button", { name: /Đóng form/ })).toBeInTheDocument();

    // Now click to open second machine
    const secondButton = screen.getByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(secondButton);

    // Only one form should be present in DOM (for Cobas)
    expect(screen.getAllByRole("button", { name: /Đóng form/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Lưu bảo dưỡng/ })).toBeInTheDocument();
  });

  it("3. Saves inline successfully with real server recordId, updates machine status and counter without fake 'saved' ID or redirect", async () => {
    const mockSave = vi.mocked(saveMaintenanceAction);
    mockSave.mockResolvedValueOnce({
      success: true,
      recordId: "rec-real-au480-1",
      status: "COMPLETED",
      redirectUrl: "/maintenance?saved=occ-au480",
    });

    render(<MaintenanceWorkspace data={testData} />);

    // Initial progress
    expect(screen.getByText("0/2 máy đã bảo dưỡng")).toBeInTheDocument();

    // Expand AU480
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // Select "Đạt (PASS)"
    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    // Enter note
    const noteInput = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    fireEvent.change(noteInput, { target: { value: "Rửa kim hút, kiểm tra nhiệt độ buồng 37°C" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Lưu bảo dưỡng/ });
    fireEvent.click(saveBtn);

    // Wait for save action
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Verify NO router.push redirect was made (user stays at /maintenance)
    expect(mockPush).not.toHaveBeenCalled();

    // Status of AU480 updates to COMPLETED / PASS immediately (both badge and form option)
    await waitFor(() => {
      expect(screen.getAllByText("Đạt (PASS)").length).toBeGreaterThanOrEqual(1);
    });

    // Progress counter updates live
    expect(screen.getByText("1/2 máy đã bảo dưỡng")).toBeInTheDocument();

    // Confirmation banner shows
    expect(screen.getAllByText("Đã lưu kết quả bảo dưỡng thành công!").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Máy Sinh Hóa AU480-01 · Chu kỳ: Hằng ngày · Kết quả: Đạt/)).toBeInTheDocument();
  });

  it("4. Keeps user content and shows clear error message on server error with retry", async () => {
    const mockSave = vi.mocked(saveMaintenanceAction);
    mockSave.mockResolvedValueOnce({
      success: false,
      error: "Mất kết nối Supabase, vui lòng kiểm tra mạng.",
    });

    render(<MaintenanceWorkspace data={testData} />);

    // Expand
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // Fill data
    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    const noteInput = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    fireEvent.change(noteInput, { target: { value: "Nội dung quan trọng cần giữ" } });

    // Submit
    const saveBtn = screen.getByRole("button", { name: /Lưu bảo dưỡng/ });
    fireEvent.click(saveBtn);

    // Error is displayed clearly
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Mất kết nối Supabase, vui lòng kiểm tra mạng/)).toBeInTheDocument();
    });

    // Content is preserved
    expect((noteInput as HTMLTextAreaElement).value).toBe("Nội dung quan trọng cần giữ");
    expect((passRadio as HTMLInputElement).checked).toBe(true);

    // "Thử lưu lại" retry button is present
    expect(screen.getByRole("button", { name: /Thử lưu lại/ })).toBeInTheDocument();
  });

  it("5. Strict confirmation: Handles abnormal/null server response without falsely claiming success", async () => {
    const mockSave = vi.mocked(saveMaintenanceAction);
    // Server returns abnormal null/undefined response
    mockSave.mockResolvedValueOnce(null as any);

    render(<MaintenanceWorkspace data={testData} />);

    // Expand
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // Fill data
    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    const noteInput = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    fireEvent.change(noteInput, { target: { value: "Thử lưu với lỗi phản hồi bất thường" } });

    // Submit
    const saveBtn = screen.getByRole("button", { name: /Lưu bảo dưỡng/ });
    fireEvent.click(saveBtn);

    // Must show error alert and NOT claim success
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Máy chủ phản hồi bất thường hoặc không xác nhận lưu/)).toBeInTheDocument();
    });

    // Content is still preserved
    expect((noteInput as HTMLTextAreaElement).value).toBe("Thử lưu với lỗi phản hồi bất thường");

    // Progress must NOT falsely increment
    expect(screen.getByText("0/2 máy đã bảo dưỡng")).toBeInTheDocument();
  });

  it("6. Allows reviewing and editing existing completed records inline", async () => {
    const mockSave = vi.mocked(saveMaintenanceAction);
    mockSave.mockResolvedValueOnce({
      success: true,
      recordId: "rec-done-1",
      status: "COMPLETED",
      redirectUrl: "/maintenance?saved=occ-done",
    });

    const completedData: MaintenanceWorkspaceData = {
      businessDate: "2026-10-20",
      items: [
        {
          id: "occ-done",
          periodId: "p-1",
          periodStatus: "OPEN",
          assetId: "a-1",
          assetName: "Máy Điện Giải Gem 3500",
          assetCode: "GEM-3500",
          cadence: "DAILY",
          slotCode: "DAILY",
          status: "COMPLETED",
          businessDate: "2026-10-20",
          fulfilledByRecordId: "rec-done-1",
          record: {
            id: "rec-done-1",
            performedAt: "2026-10-20T08:15:00.000Z",
            result: "PASS",
            note: "Hiệu chuẩn điện cực pH/PCO2",
          },
        },
      ],
      counts: {
        total: 1,
        completed: 1,
        pending: 0,
        daily: 1,
        weekly: 0,
        monthly: 0,
      },
    };

    render(<MaintenanceWorkspace data={completedData} />);

    // Button shows "Xem / Sửa kết quả"
    const editBtn = screen.getByRole("button", { name: /Xem \/ Sửa kết quả/ });
    expect(editBtn).toBeInTheDocument();

    // Click to expand inline
    fireEvent.click(editBtn);

    // Pre-filled data is visible
    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    expect((passRadio as HTMLInputElement).checked).toBe(true);

    const noteInput = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    expect((noteInput as HTMLTextAreaElement).value).toBe("Hiệu chuẩn điện cực pH/PCO2");

    // Change to FAIL
    const failRadio = screen.getByLabelText(/Không đạt \(FAIL\)/);
    fireEvent.click(failRadio);

    // Submit update
    const saveBtn = screen.getByRole("button", { name: /Lưu bảo dưỡng/ });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Badge updates to FAIL (both badge and radio option in form)
    await waitFor(() => {
      expect(screen.getAllByText("Không đạt (FAIL)").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("7. Restores unsaved draft automatically when form is closed and reopened", () => {
    render(<MaintenanceWorkspace data={testData} />);

    // Open first machine
    const toggleButtons = screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ });
    fireEvent.click(toggleButtons[0]);

    // Type into note
    const noteInput = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    fireEvent.change(noteInput, { target: { value: "Bản nháp tự động lưu vào localStorage" } });

    // Close form
    fireEvent.click(screen.getByRole("button", { name: /Đóng form/ }));
    expect(screen.queryByPlaceholderText(/Ghi chú các hạng mục/)).toBeNull();

    // Re-open form
    fireEvent.click(screen.getAllByRole("button", { name: /Ghi nhận bảo dưỡng/ })[0]);

    // Draft is restored!
    const reopenedNote = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    expect((reopenedNote as HTMLTextAreaElement).value).toBe("Bản nháp tự động lưu vào localStorage");
    expect(screen.getByText(/Chưa lưu: Có thay đổi chưa gửi/)).toBeInTheDocument();
  });
});

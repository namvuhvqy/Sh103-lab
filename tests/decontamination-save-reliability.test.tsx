import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DecontaminationForm } from "@/components/forms/DecontaminationForm";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock action
vi.mock("@/app/areas/[areaCode]/knbm/actions", () => ({
  saveDecontaminationAction: vi.fn(),
}));

import { saveDecontaminationAction } from "@/app/areas/[areaCode]/knbm/actions";

describe("Task 3: BM01_KNBM Decontamination Save Reliability", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does NOT display false 'Đã lưu thành công' on initial render", () => {
    render(
      <DecontaminationForm
        periodId="p-1"
        areaCode="KHU_A"
        today="2026-10-20"
      />
    );

    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
    expect(screen.getByText("Sẵn sàng")).toBeDefined();
  });

  it("sets status to dirty when user toggles an activity checkbox", () => {
    render(
      <DecontaminationForm
        periodId="p-1"
        areaCode="KHU_A"
        today="2026-10-20"
      />
    );

    const dailyCheckbox = screen.getByLabelText(/Daily/);
    fireEvent.click(dailyCheckbox);

    expect(screen.getByText(/Chưa lưu: Có thay đổi chưa gửi/)).toBeDefined();
    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
  });

  it("prevents submission and shows clear error if no activities are selected", async () => {
    render(
      <DecontaminationForm
        periodId="p-1"
        areaCode="KHU_A"
        today="2026-10-20"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Lưu/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lưu thất bại: Vui lòng chọn ít nhất một hoạt động khử nhiễm/)).toBeDefined();
    });

    expect(saveDecontaminationAction).not.toHaveBeenCalled();
  });

  it("handles failed save: displays error, keeps checkbox selections and note, provides retry", async () => {
    (saveDecontaminationAction as any).mockResolvedValue({
      success: false,
      error: "Supabase connection error: connection timed out",
    });

    render(
      <DecontaminationForm
        periodId="p-1"
        areaCode="KHU_A"
        today="2026-10-20"
      />
    );

    // Check weekly and enter note
    const weeklyCheckbox = screen.getByLabelText(/Weekly/);
    fireEvent.click(weeklyCheckbox);

    const noteTextarea = screen.getByPlaceholderText(/Nhập ghi chú đặc biệt/);
    fireEvent.change(noteTextarea, { target: { value: "Đã lau cồn 70 độ toàn bộ bàn" } });

    const submitBtn = screen.getByRole("button", { name: /Lưu/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lưu thất bại: Supabase connection error/)).toBeDefined();
    });

    // Check that selections and notes are retained!
    expect((weeklyCheckbox as HTMLInputElement).checked).toBe(true);
    expect((noteTextarea as HTMLTextAreaElement).value).toBe("Đã lau cồn 70 độ toàn bộ bàn");

    // Retry button exists
    expect(screen.getByText("Thử lưu lại")).toBeDefined();
  });

  it("handles successful save: shows 'Đã lưu thành công' and clears local draft", async () => {
    (saveDecontaminationAction as any).mockResolvedValue({
      success: true,
      saved: "KHU_A",
    });

    render(
      <DecontaminationForm
        periodId="p-1"
        areaCode="KHU_A"
        today="2026-10-20"
      />
    );

    const dailyCheckbox = screen.getByLabelText(/Daily/);
    fireEvent.click(dailyCheckbox);

    const submitBtn = screen.getByRole("button", { name: /Lưu/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Đã lưu thành công")).toBeDefined();
    });

    // Verify localStorage draft was removed
    expect(localStorage.getItem("lab103_knbm_KHU_A_p-1")).toBeNull();
  });
});

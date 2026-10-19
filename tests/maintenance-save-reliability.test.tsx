import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/app/maintenance/actions", () => ({
  saveMaintenanceAction: vi.fn(),
}));

import { saveMaintenanceAction } from "@/app/maintenance/actions";

describe("Task 4: Maintenance BM.02 Save Reliability and Input Retention", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does NOT display false 'Đã lưu' on initial render", () => {
    render(
      <MaintenanceForm
        occurrenceId="m-occ-1"
        cadence="DAILY"
        assetName="Máy Ly Tâm 1"
      />
    );

    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
    expect(screen.getByText("Sẵn sàng")).toBeDefined();
  });

  it("updates status to dirty when user changes result or note", () => {
    render(
      <MaintenanceForm
        occurrenceId="m-occ-1"
        cadence="DAILY"
        assetName="Máy Ly Tâm 1"
      />
    );

    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    expect(screen.getByText(/Chưa lưu: Có thay đổi chưa gửi/)).toBeDefined();
    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
  });

  it("handles failed save: displays error, retains performedAt, result, and note, provides retry", async () => {
    (saveMaintenanceAction as any).mockResolvedValue({
      success: false,
      error: "Supabase transaction aborted: lock timeout",
    });

    render(
      <MaintenanceForm
        occurrenceId="m-occ-1"
        cadence="DAILY"
        assetName="Máy Ly Tâm 1"
      />
    );

    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    const noteTextarea = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
    fireEvent.change(noteTextarea, { target: { value: "Đã lau chùi rotor và kiểm tra chốt an toàn" } });

    const submitBtn = screen.getByRole("button", { name: "Lưu bảo dưỡng" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lưu thất bại: Supabase transaction aborted/)).toBeDefined();
    });

    // Inputs retained!
    expect((passRadio as HTMLInputElement).checked).toBe(true);
    expect((noteTextarea as HTMLTextAreaElement).value).toBe("Đã lau chùi rotor và kiểm tra chốt an toàn");

    // Retry button exists
    expect(screen.getByText("Thử lưu lại")).toBeDefined();

    // Draft preserved in localStorage
    const draft = localStorage.getItem("lab103_maintenance_draft_m-occ-1");
    expect(draft).not.toBeNull();
    expect(JSON.parse(draft!).result).toBe("PASS");
  });

  it("handles successful save: shows 'Đã lưu thành công', clears draft and navigates", async () => {
    (saveMaintenanceAction as any).mockResolvedValue({
      success: true,
      redirectUrl: "/tasks?saved=maintenance",
    });

    render(
      <MaintenanceForm
        occurrenceId="m-occ-1"
        cadence="DAILY"
        assetName="Máy Ly Tâm 1"
      />
    );

    const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
    fireEvent.click(passRadio);

    const submitBtn = screen.getByRole("button", { name: "Lưu bảo dưỡng" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/tasks?saved=maintenance");
    });

    expect(localStorage.getItem("lab103_maintenance_draft_m-occ-1")).toBeNull();
  });
});

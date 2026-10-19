import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShiftRegisterForm } from "@/components/forms/ShiftRegisterForm";

describe("Task 2: BM06 Save Reliability and State Retention", () => {
  const mockAssets = [
    { id: "asset-1", sourceOrder: 1, name: "Máy 1", locationCode: "SINH_HOA" },
    { id: "asset-2", sourceOrder: 2, name: "Máy 2", locationCode: "SINH_HOA" },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does NOT display false 'Saved / Đã lưu' badge on initial idle render", () => {
    render(
      <ShiftRegisterForm
        occurrenceId="occ-1"
        assets={mockAssets}
        initialStatuses={{}}
        lockVersion={1}
      />
    );

    // Must NOT have false "Saved" or "Đã lưu thành công"
    expect(screen.queryByText(/Đã lưu sau khi server xác nhận/)).toBeNull();
    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
    expect(screen.getByText("Sẵn sàng nhập liệu")).toBeDefined();
  });

  it("updates state to dirty with warning when user selects a status", () => {
    render(
      <ShiftRegisterForm
        occurrenceId="occ-1"
        assets={mockAssets}
        initialStatuses={{}}
        lockVersion={1}
      />
    );

    // Click BT for asset 1
    const btButtons = screen.getAllByTitle(/BT — Bình thường/);
    fireEvent.click(btButtons[0]);

    // Should show dirty state
    expect(screen.getByText(/Chưa lưu: Có thay đổi chưa gửi/)).toBeDefined();
    expect(screen.queryByText("Đã lưu thành công")).toBeNull();
  });

  it("handles failed save: displays error, keeps user selections, and provides retry button", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: "Supabase lock error: Version mismatch" }),
    } as any);

    render(
      <ShiftRegisterForm
        occurrenceId="occ-1"
        assets={mockAssets}
        initialStatuses={{ "asset-1": "BT" }}
        lockVersion={1}
      />
    );

    const draftBtn = screen.getByText(/Lưu nháp/);
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lưu thất bại: Supabase lock error/)).toBeDefined();
    });

    // Verify retry button exists
    expect(screen.getByText("Thử lưu lại")).toBeDefined();

    // Verify user selection is preserved
    expect(screen.getAllByTitle("BT — Bình thường")[0]).toBeDefined();

    // Verify localStorage has the backup draft
    const saved = localStorage.getItem("lab103_bm06_draft_occ-1");
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).statuses["asset-1"]).toBe("BT");
  });

  it("handles successful save: shows 'Đã lưu thành công' and clears backup draft", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, saved: "1", intent: "draft" }),
    } as any);

    render(
      <ShiftRegisterForm
        occurrenceId="occ-1"
        assets={mockAssets}
        initialStatuses={{ "asset-1": "BT" }}
        lockVersion={1}
      />
    );

    const draftBtn = screen.getByText(/Lưu nháp/);
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(screen.getByText("Đã lưu thành công")).toBeDefined();
    });

    // Verify localStorage draft is cleaned up after successful confirmation
    expect(localStorage.getItem("lab103_bm06_draft_occ-1")).toBeNull();
  });
});

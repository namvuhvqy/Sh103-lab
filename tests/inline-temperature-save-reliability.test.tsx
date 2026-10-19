import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InlineTemperatureCard, InlineOccurrence } from "@/components/forms/InlineTemperatureCard";

describe("Task 5: Temperature BM.01, BM.02, BM.03 Save Reliability", () => {
  const mockOccurrence: InlineOccurrence = {
    id: "temp-occ-1",
    status: "PENDING",
    slot_code: "MORNING",
    fulfilled_by_record_id: null,
    register_periods: {
      id: "p-1",
      locations: { name: "Phòng Sinh Hóa", code: "PHONG_SH" },
      assets: null,
      form_template_versions: {
        form_templates: { code: "BM.01/QL.CL.01", name: "Theo dõi nhiệt độ môi trường" },
      },
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("displays 'Chưa đo' when no measurement has been entered yet", () => {
    render(<InlineTemperatureCard occurrence={mockOccurrence} />);

    expect(screen.getByText("Chưa đo")).toBeDefined();
    expect(screen.queryByText(/Đã lưu/)).toBeNull();
  });

  it("displays 'Đã lưu: 24°C' when occurrence has initial saved measurement", () => {
    const savedOcc: InlineOccurrence = {
      ...mockOccurrence,
      initialTemperature: 24,
      initialHumidity: 50,
      fulfilled_by_record_id: "rec-1",
    };

    render(<InlineTemperatureCard occurrence={savedOcc} />);

    expect(screen.getByText("Bình thường: 24°C")).toBeDefined();
    expect(screen.queryByText("Chờ đồng bộ")).toBeNull();
  });

  it("NEVER displays green 'Đã lưu' when fetch fails; displays amber 'Chờ đồng bộ' and retry button", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection dropped"));

    render(<InlineTemperatureCard occurrence={mockOccurrence} />);

    const tempInput = screen.getByPlaceholderText("--.- °C");
    const humInput = screen.getByPlaceholderText("--.- %");
    fireEvent.change(tempInput, { target: { value: "23.5" } });
    fireEvent.change(humInput, { target: { value: "55" } });
    fireEvent.blur(humInput);

    await waitFor(() => {
      // Must show failure
      expect(screen.queryByText(/Đã lưu: 23.5°C/)).toBeNull();
      expect(screen.queryByText(/Bình thường: 23.5°C/)).toBeNull();
      expect(screen.getByText("Lưu thất bại")).toBeDefined();
    });

    // Verify retry button is rendered
    expect(screen.getByText("Thử lưu lại")).toBeDefined();

    // Verify local storage has the pending data
    const pending = localStorage.getItem("lab103_temp_temp-occ-1");
    expect(pending).not.toBeNull();
    expect(JSON.parse(pending!).temp).toBe(23.5);
  });

  it("handles successful retry: updates to 'Đã lưu: 23.5°C' and removes local storage draft", async () => {
    // First call fails
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error("Temporary 503"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, recordId: "new-rec" }),
      } as any);

    render(<InlineTemperatureCard occurrence={mockOccurrence} />);

    const tempInput = screen.getByPlaceholderText("--.- °C");
    const humInput = screen.getByPlaceholderText("--.- %");

    fireEvent.change(tempInput, { target: { value: "23.5" } });
    fireEvent.change(humInput, { target: { value: "55" } });
    fireEvent.blur(humInput);

    await waitFor(() => {
      expect(screen.getByText("Chờ đồng bộ")).toBeDefined();
    });

    // Now click retry
    const retryBtn = screen.getByText("Thử lưu lại");
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Bình thường: 23.5°C")).toBeDefined();
    });

    // Local storage cleaned up after confirmed server save
    expect(localStorage.getItem("lab103_temp_temp-occ-1")).toBeNull();
  });
});

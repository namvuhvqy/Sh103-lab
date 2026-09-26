import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InlineTemperatureCard, InlineOccurrence } from "@/components/forms/InlineTemperatureCard";

describe("Inline Click-to-Edit Temperature Card", () => {
  const baseOccurrence: InlineOccurrence = {
    id: "occ-temp-1",
    status: "PENDING",
    slot_code: "MORNING",
    fulfilled_by_record_id: null,
    initialTemperature: null,
    initialHumidity: null,
    register_periods: {
      id: "period-1",
      locations: null,
      assets: {
        source_name: "Tủ lạnh TOWASHI",
        source_code: "TU-01",
        storage_purpose: "Bảo quản hóa chất sinh hóa",
      },
      form_template_versions: {
        form_templates: {
          code: "BM.02/QL.HTAT.01",
          name: "Theo dõi tủ lạnh mát",
        },
      },
    },
  };

  it("renders with placeholder and Chưa đo badge when not measured", () => {
    render(<InlineTemperatureCard occurrence={baseOccurrence} />);
    expect(screen.getByText("Chưa đo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("--.- °C")).toBeInTheDocument();
    expect(screen.getByText("Tủ lạnh TOWASHI")).toBeInTheDocument();
    expect(screen.getByText("2°C – 8°C")).toBeInTheDocument();
  });

  it("renders Đã đo badge when measured in normal range (2°C - 8°C)", () => {
    const measuredOcc: InlineOccurrence = {
      ...baseOccurrence,
      status: "FULFILLED",
      initialTemperature: 4.5,
    };
    render(<InlineTemperatureCard occurrence={measuredOcc} />);
    expect(screen.getByText("Bình thường: 4.5°C")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.5")).toBeInTheDocument();
  });

  it("renders Vượt ngưỡng warning badge when out of range (e.g. 9.5°C)", () => {
    const abnormalOcc: InlineOccurrence = {
      ...baseOccurrence,
      status: "FULFILLED",
      initialTemperature: 9.5,
    };
    render(<InlineTemperatureCard occurrence={abnormalOcc} />);
    expect(screen.getByText("Vượt ngưỡng: 9.5°C")).toBeInTheDocument();
    expect(screen.getByText("Cảnh báo ISO")).toBeInTheDocument();
  });

  it("allows direct touch-to-edit inline without secondary sub-page navigation", () => {
    const handleSaved = vi.fn();
    render(<InlineTemperatureCard occurrence={baseOccurrence} onSaved={handleSaved} />);
    const input = screen.getByPlaceholderText("--.- °C");
    expect(input).toHaveAttribute("inputmode", "decimal");
    fireEvent.change(input, { target: { value: "5.2" } });
    expect(screen.getByDisplayValue("5.2")).toBeInTheDocument();
  });

  it("keeps a partial BM.01 measurement locally until humidity is entered", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const environmentOccurrence: InlineOccurrence = {
      ...baseOccurrence,
      id: "occ-environment-1",
      register_periods: {
        ...baseOccurrence.register_periods,
        assets: null,
        locations: { name: "Khu vực Sinh hóa", code: "SINH_HOA" },
        form_template_versions: { form_templates: { code: "BM.01/QL.HTAT.01", name: "Theo dõi nhiệt độ, độ ẩm" } },
      },
    };
    render(<InlineTemperatureCard occurrence={environmentOccurrence} />);
    const input = screen.getByPlaceholderText("--.- °C");
    fireEvent.change(input, { target: { value: "24" } });
    fireEvent.blur(input);
    await waitFor(() => expect(screen.getByText("Cần nhập độ ẩm")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not report an official save when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ error: "denied" }) }));
    const handleSaved = vi.fn();
    render(<InlineTemperatureCard occurrence={baseOccurrence} onSaved={handleSaved} />);
    const input = screen.getByPlaceholderText("--.- °C");
    fireEvent.change(input, { target: { value: "5.2" } });
    fireEvent.blur(input);
    await waitFor(() => expect(screen.getByText("Chờ đồng bộ")).toBeInTheDocument());
    expect(handleSaved).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(screen.getByText("Đã đo: 4.5°C")).toBeInTheDocument();
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
});

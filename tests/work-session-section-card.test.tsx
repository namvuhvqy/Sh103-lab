import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkSessionSectionCard } from "@/components/work-session/WorkSessionSectionCard";
import { Thermometer } from "lucide-react";

describe("WorkSessionSectionCard Component", () => {
  it("renders section information with occurrences and explicit deep link", () => {
    const occurrences = [
      {
        id: "occ-1",
        formCode: "BM.01",
        locationCode: "SINH_HOA",
        locationName: "Khu vực Sinh hóa",
        status: "PENDING",
        fulfilledByRecordId: null,
      },
      {
        id: "occ-2",
        formCode: "BM.01",
        locationCode: "MIEN_DICH",
        locationName: "Khu vực Miễn dịch",
        status: "FULFILLED",
        fulfilledByRecordId: "rec-2",
      },
    ];

    render(
      <WorkSessionSectionCard
        code="BM.01"
        title="Nhiệt độ & độ ẩm phòng xét nghiệm"
        description="5 khu vực · Sáng / Chiều"
        href="/temperature?shift=SHIFT_1&date=2026-09-27"
        icon={Thermometer}
        occurrences={occurrences}
      />
    );

    expect(screen.getByText("BM.01")).toBeInTheDocument();
    expect(screen.getByText("Nhiệt độ & độ ẩm phòng xét nghiệm")).toBeInTheDocument();
    expect(screen.getByText("1/2 hoàn thành")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/temperature?shift=SHIFT_1&date=2026-09-27");
  });
});

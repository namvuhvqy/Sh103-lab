import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";

describe("WorkSessionRosterCard Component", () => {
  it("renders duty roster members when roster exists", () => {
    const roster = {
      roster_id: "r1",
      duty_kind: "WEEKDAY_LUNCH",
      business_date: "2026-09-27",
      members: [
        { user_id: "u1", full_name: "TS.BS Vũ Văn Nam", business_role: "DEPARTMENT_HEAD" as const, member_order: 1 },
        { user_id: "u2", full_name: "KTV Lê Thị Mai", business_role: "TECHNICIAN" as const, member_order: 2 },
      ]
    };

    render(
      <WorkSessionRosterCard
        roster={roster}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={false}
      />
    );

    expect(screen.getByText("Phân công ca trực")).toBeInTheDocument();
    expect(screen.getByText("TS.BS Vũ Văn Nam")).toBeInTheDocument();
    expect(screen.getByText("KTV Lê Thị Mai")).toBeInTheDocument();
    expect(screen.getByText("Chưa tạo hồ sơ chính thức")).toBeInTheDocument();
  });

  it("renders notice when no roster assigned for this session", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-27"
        slotCode="SHIFT_1"
        isOfficialRecordCreated={false}
      />
    );

    expect(screen.getByText(/Chưa có phân công ca trực/i)).toBeInTheDocument();
  });
});

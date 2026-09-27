import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkSessionView } from "@/components/work-session/WorkSessionView";

describe("WorkSessionView Component", () => {
  it("renders the entire work session layout with session details and section cards", () => {
    const sessionData = {
      businessDate: "2026-09-27",
      slotCode: "SHIFT_1",
      roster: {
        roster_id: "r1",
        duty_kind: "WEEKDAY_LUNCH",
        business_date: "2026-09-27",
        members: [
          { user_id: "u1", full_name: "BS. Nguyễn Văn A", business_role: "DOCTOR" as const, member_order: 1 },
        ],
      },
      userId: "u1",
      isHead: false,
      isAdmin: false,
      isOfficialRecordCreated: false,
      occurrences: [
        {
          id: "occ-1",
          formCode: "BM.01",
          status: "PENDING",
        }
      ],
    };

    render(
      <WorkSessionView sessionData={sessionData} />
    );

    expect(screen.getByText("Phiên hiện tại")).toBeInTheDocument();
    expect(screen.getByText("Phân công ca trực")).toBeInTheDocument();
    expect(screen.getByText("Chưa tạo hồ sơ chính thức")).toBeInTheDocument();
    expect(screen.getByText("Công việc trong phiên")).toBeInTheDocument();
    expect(screen.getByText("BM.01")).toBeInTheDocument();
    expect(screen.getByText("BM.06")).toBeInTheDocument();
  });
});

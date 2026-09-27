import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";
import type { RosterStaffMember } from "@/lib/roster/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/quick-duty",
}));

const mockStaff: RosterStaffMember[] = [
  { user_id: "u-doc-1", full_name: "BS. Lê Thanh Hà", business_role: "DOCTOR", source_order: 2, account_kind: "STAFF", active: true },
  { user_id: "u-tech-1", full_name: "KTV. Nguyễn Văn Cường", business_role: "TECHNICIAN", source_order: 7, account_kind: "STAFF", active: true },
];

describe("WorkSessionRosterCard Component", () => {
  it("renders duty roster members when roster exists", () => {
    const roster = {
      roster_id: "r1",
      duty_kind: "WEEKDAY_LUNCH" as const,
      business_date: "2026-09-27",
      members: [
        { user_id: "u1", full_name: "BS. Nguyễn Văn A", business_role: "DOCTOR" as const, member_order: 1 },
        { user_id: "u2", full_name: "KTV. Trần Thị B", business_role: "TECHNICIAN" as const, member_order: 2 },
      ],
    };

    render(
      <WorkSessionRosterCard
        roster={roster}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={false}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getByText("Phân công ca trực")).toBeInTheDocument();
    expect(screen.getByText("BS. Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("KTV. Trần Thị B")).toBeInTheDocument();
  });

  it("renders morning shift normal working note for SHIFT_1", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-27"
        slotCode="SHIFT_1"
        isOfficialRecordCreated={false}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getByText(/Buổi sáng là giờ làm việc bình thường/i)).toBeInTheDocument();
  });

  it("renders notice and assign button when no roster assigned for special shift", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={false}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getByText(/Chưa có phân công ca trực/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Phân công kíp trực/i }).length).toBeGreaterThanOrEqual(1);
  });
});

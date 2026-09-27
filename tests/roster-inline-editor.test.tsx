import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";
import type { RosterStaffMember } from "@/lib/roster/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const mockStaff: RosterStaffMember[] = [
  { user_id: "u-doc-1", full_name: "BS. Lê Thanh Hà", business_role: "DOCTOR", source_order: 2, account_kind: "STAFF", active: true },
  { user_id: "u-tech-1", full_name: "KTV. Nguyễn Văn Cường", business_role: "TECHNICIAN", source_order: 11, account_kind: "STAFF", active: true },
];

describe("WorkSessionRosterCard inline assignment", () => {
  it("renders roster status and an interactive assign/edit button when no roster exists for special shift", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={false}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getByText(/Kíp trực chưa đủ 2 người/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Tự nhận|chọn kíp|Chọn người cùng ca/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders assigned roster members and allows re-editing", () => {
    render(
      <WorkSessionRosterCard
        roster={{
          roster_id: "r1",
          duty_kind: "WEEKDAY_LUNCH",
          business_date: "2026-09-27",
          members: [
            { user_id: "u-doc-1", full_name: "BS. Lê Thanh Hà", business_role: "DOCTOR", member_order: 1 },
            { user_id: "u-tech-1", full_name: "KTV. Nguyễn Văn Cường", business_role: "TECHNICIAN", member_order: 2 },
          ],
        }}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={true}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getByText("BS. Lê Thanh Hà")).toBeInTheDocument();
    expect(screen.getByText("KTV. Nguyễn Văn Cường")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chỉnh sửa kíp trực/i })).toBeInTheDocument();
  });

  it("displays regular working hours explanation for SHIFT_1 on a weekday", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-28"
        slotCode="SHIFT_1"
        isOfficialRecordCreated={false}
        availableStaff={mockStaff}
      />
    );

    expect(screen.getAllByText(/giờ làm việc bình thường/i).length).toBeGreaterThanOrEqual(1);
  });
});

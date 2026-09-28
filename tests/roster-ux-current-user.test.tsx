import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { RosterShiftEditor } from "@/components/roster/RosterShiftEditor";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";
import type { RosterStaffMember } from "@/lib/roster/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const staff: RosterStaffMember[] = [
  { user_id: "u-doc-1", full_name: "BS. Lê Thanh Hà", business_role: "DOCTOR", source_order: 2, account_kind: "STAFF", active: true },
  { user_id: "u-doc-2", full_name: "BS. Hồ Thị Hằng", business_role: "DOCTOR", source_order: 5, account_kind: "STAFF", active: true },
  { user_id: "u-tech-1", full_name: "KTV. Nguyễn Văn Cường", business_role: "TECHNICIAN", source_order: 11, account_kind: "STAFF", active: true },
  { user_id: "u-tech-2", full_name: "KTV. Nguyễn Thị Bích Hạnh", business_role: "TECHNICIAN", source_order: 12, account_kind: "STAFF", active: true },
  { user_id: "u-test", full_name: "TEST Account", business_role: "TECHNICIAN", source_order: null, account_kind: "TEST", active: true },
  { user_id: "u-system", full_name: "SYSTEM Account", business_role: "TECHNICIAN", source_order: null, account_kind: "SYSTEM", active: true },
  { user_id: "u-inactive", full_name: "Inactive Staff", business_role: "TECHNICIAN", source_order: 25, account_kind: "STAFF", active: false },
];

describe("current-user roster UX", () => {
  it("does not render the old 'Tôi nhận ca này' button when no roster exists", () => {
    render(
      <WorkSessionRosterCard
        roster={null}
        businessDate="2026-09-27"
        slotCode="SHIFT_2"
        isOfficialRecordCreated={false}
        availableStaff={staff}
        currentUserId="u-tech-1"
      />
    );

    expect(screen.queryByText(/Tôi nhận ca này/i)).not.toBeInTheDocument();
    expect(screen.getByText(/KTV. Nguyễn Văn Cường/i)).toBeInTheDocument();
    expect(screen.getByText(/Kỹ thuật viên trực/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Chọn người cùng kíp/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("prefills position 1 as current user, readonly, and only lets position 2 select another eligible active STAFF", () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-27"
        dutyKind="HOLIDAY_24H"
        availableStaff={staff}
        currentUserId="u-tech-1"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/Vị trí 1/i)).toBeInTheDocument();
    expect(screen.getByText(/KTV. Nguyễn Văn Cường/i)).toBeInTheDocument();
    expect(screen.getByText(/Readonly/i)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);

    const picker = screen.getByRole("combobox", { name: /Vị trí 2/i });
    expect(within(picker).queryByText(/KTV. Nguyễn Văn Cường/i)).not.toBeInTheDocument();
    expect(within(picker).queryByText(/TEST Account/i)).not.toBeInTheDocument();
    expect(within(picker).queryByText(/SYSTEM Account/i)).not.toBeInTheDocument();
    expect(within(picker).queryByText(/Inactive Staff/i)).not.toBeInTheDocument();
    expect(within(picker).getByText(/BS. Lê Thanh Hà/i)).toBeInTheDocument();
  });

  it("keeps an existing roster unchanged instead of replacing member 1 with current user", () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-27"
        dutyKind="HOLIDAY_24H"
        availableStaff={staff}
        initialMemberIds={["u-doc-2", "u-tech-2"]}
        currentUserId="u-tech-1"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/BS. Hồ Thị Hằng/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Vị trí 2/i })).toHaveValue("u-tech-2");
    expect(screen.queryByText(/^KTV\. Nguyễn Văn Cường$/i)).not.toBeInTheDocument();
  });

  it("shows Saving then Saved and saves roster by user_id pair", async () => {
    const onSave = vi.fn(async () => new Promise<void>((resolve) => setTimeout(resolve, 5)));
    render(
      <RosterShiftEditor
        businessDate="2026-09-27"
        dutyKind="HOLIDAY_24H"
        availableStaff={staff}
        currentUserId="u-tech-1"
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: /Vị trí 2/i }), { target: { value: "u-doc-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Lưu phân công/i }));
    expect(screen.getAllByText(/Saving/i).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      businessDate: "2026-09-27",
      dutyKind: "HOLIDAY_24H",
      userIds: ["u-tech-1", "u-doc-1"],
    }));
    await waitFor(() => expect(screen.getByText(/Saved/i)).toBeInTheDocument());
  });
});

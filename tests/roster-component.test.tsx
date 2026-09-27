import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RosterShiftEditor } from "@/components/roster/RosterShiftEditor";
import { type RosterStaffMember } from "@/lib/roster/domain";

const mockStaff: RosterStaffMember[] = [
  {
    user_id: "user-1",
    full_name: "Huỳnh Quang Thuận",
    business_role: "DEPARTMENT_HEAD",
    account_kind: "STAFF",
    source_order: 1,
    active: true,
  },
  {
    user_id: "user-2",
    full_name: "Lê Thanh Hà",
    business_role: "DOCTOR",
    account_kind: "STAFF",
    source_order: 2,
    active: true,
  },
  {
    user_id: "user-11",
    full_name: "Nguyễn Văn Cường",
    business_role: "TECHNICIAN",
    account_kind: "STAFF",
    source_order: 11,
    active: true,
  },
  {
    user_id: "user-12",
    full_name: "Nguyễn Thị Bích Hạnh",
    business_role: "TECHNICIAN",
    account_kind: "STAFF",
    source_order: 12,
    active: true,
  },
];

describe("RosterShiftEditor Component", () => {
  const onSaveMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders shift information and staff pickers with source order display", () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-28"
        dutyKind="WEEKDAY_LUNCH"
        availableStaff={mockStaff}
        initialMemberIds={["user-1", "user-11"]}
        onSave={onSaveMock}
      />
    );

    expect(screen.getByText(/Trực trưa ngày thường/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Bác sĩ \/ Trưởng khoa \+ 1 Kỹ thuật viên/i)).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue("user-1");
    expect(selects[1]).toHaveValue("user-11");
  });

  it("shows real-time validation error if selecting 2 technicians for lunch duty and blocks save", async () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-28"
        dutyKind="WEEKDAY_LUNCH"
        availableStaff={mockStaff}
        initialMemberIds={["user-11", "user-12"]}
        onSave={onSaveMock}
      />
    );

    expect(screen.getByText(/Ca trực yêu cầu 1 Bác sĩ \/ Lãnh đạo khoa và 1 Kỹ thuật viên/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /lưu phân công/i });
    expect(saveBtn).toBeDisabled();
  });

  it("allows selecting 2 technicians for afternoon duty and enables save", async () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-28"
        dutyKind="WEEKDAY_AFTERNOON"
        availableStaff={mockStaff}
        initialMemberIds={["user-11", "user-12"]}
        onSave={onSaveMock}
      />
    );

    expect(screen.queryByText(/Ca trực yêu cầu 1 Bác sĩ/i)).not.toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /lưu phân công/i });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onSaveMock).toHaveBeenCalledWith({
      businessDate: "2026-09-28",
      dutyKind: "WEEKDAY_AFTERNOON",
      userIds: ["user-11", "user-12"],
    });
  });

  it("shows error when selecting the exact same user twice", async () => {
    render(
      <RosterShiftEditor
        businessDate="2026-09-28"
        dutyKind="WEEKDAY_AFTERNOON"
        availableStaff={mockStaff}
        initialMemberIds={["user-11", "user-11"]}
        onSave={onSaveMock}
      />
    );

    expect(screen.getByText(/2 nhân sự trong ca trực phải khác nhau/i)).toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /lưu phân công/i });
    expect(saveBtn).toBeDisabled();
  });
});

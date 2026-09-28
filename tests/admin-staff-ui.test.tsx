import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaffManagementPanel } from "@/components/admin/StaffManagementPanel";
import { StaffReferenceCard } from "@/components/admin/StaffReferenceCard";
import { type StaffReferenceSummary } from "@/lib/admin/staff-domain";

describe("Admin Staff UI Components", () => {
  it("renders staff reference summary with honest indicators and disallows hard delete when references exist", () => {
    const summaryWithRefs: StaffReferenceSummary = {
      user_id: "u1",
      records_count: 10,
      approvals_count: 1,
      roster_assignments_count: 3,
      audit_events_count: 5,
      incidents_count: 0,
      can_hard_delete: false,
    };

    render(<StaffReferenceCard summary={summaryWithRefs} userName="Lê Thanh Hà" />);

    expect(screen.getByText(/Tổng hợp dữ liệu tham chiếu/i)).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // records
    expect(screen.getByText("1")).toBeInTheDocument(); // approvals
    expect(screen.getByText("3")).toBeInTheDocument(); // roster
    expect(screen.getByText(/Không thể xóa vĩnh viễn/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Chỉ được phép vô hiệu hóa/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows clean status when account has zero references", () => {
    const cleanSummary: StaffReferenceSummary = {
      user_id: "u2",
      records_count: 0,
      approvals_count: 0,
      roster_assignments_count: 0,
      audit_events_count: 0,
      incidents_count: 0,
      can_hard_delete: true,
    };

    render(<StaffReferenceCard summary={cleanSummary} userName="Test Fixture" />);
    expect(screen.getByText(/Không có dữ liệu ràng buộc/i)).toBeInTheDocument();
  });

  it("renders StaffManagementPanel with disabled/honest notice when authAdminPrerequisites are missing", () => {
    const onSave = vi.fn();
    const onDeactivate = vi.fn();

    render(
      <StaffManagementPanel
        authAdminAvailable={false}
        authAdminMissingReason="Thiếu SUPABASE_SERVICE_ROLE_KEY"
        initialProfile={{
          user_id: "u1",
          full_name: "Huỳnh Quang Thuận",
          business_role: "DEPARTMENT_HEAD",
          account_kind: "STAFF",
          is_admin: true,
          source_order: 1,
          active: true,
        }}
        onSaveProfile={onSave}
        onDeactivate={onDeactivate}
      />
    );

    expect(screen.getByText(/Khởi tạo \/ Đổi mật khẩu Auth bị khóa/i)).toBeInTheDocument();
    expect(screen.getByText(/Thiếu SUPABASE_SERVICE_ROLE_KEY/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Huỳnh Quang Thuận")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument(); // source_order
  });
});

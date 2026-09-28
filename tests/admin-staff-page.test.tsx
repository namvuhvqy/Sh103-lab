import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UsersPage from "@/app/admin/users/page";

vi.mock("@/lib/auth/requireAdmin", () => ({
  requireAdmin: vi.fn(async () => ({
    user: { id: "admin-1" },
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                user_id: "u1",
                full_name: "Huỳnh Quang Thuận",
                business_role: "DEPARTMENT_HEAD",
                account_kind: "STAFF",
                source_order: 1,
                is_admin: true,
                active: true,
              },
              {
                user_id: "u2",
                full_name: "Lê Thanh Hà",
                business_role: "DOCTOR",
                account_kind: "STAFF",
                source_order: 2,
                is_admin: false,
                active: true,
              },
              {
                user_id: "u-test",
                full_name: "TS.BS Vũ Văn Nam",
                business_role: "DOCTOR",
                account_kind: "TEST",
                source_order: null,
                is_admin: false,
                active: true,
              },
            ],
            error: null,
          }),
        }),
      }),
    },
  })),
}));

describe("Admin Users Page (/admin/users)", () => {
  it("renders staff directory with clear badges for roles, account_kind, and source order", async () => {
    const Component = await UsersPage();
    render(Component);

    expect(screen.getByText(/Nhân sự & Phân quyền/i)).toBeInTheDocument();
    expect(screen.getByText("Huỳnh Quang Thuận")).toBeInTheDocument();
    expect(screen.getByText("Lê Thanh Hà")).toBeInTheDocument();
    expect(screen.getByText("TS.BS Vũ Văn Nam")).toBeInTheDocument();

    // Check account kinds
    expect(screen.getAllByText("STAFF").length).toBe(2);
    expect(screen.getByText("TEST")).toBeInTheDocument();

    // Check source order indicator
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });
});

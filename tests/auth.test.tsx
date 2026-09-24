import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { roleLabel, routeAccessLevel, userAccessState } from "@/lib/auth/access";

describe("P2 authentication foundation", () => {
  it("renders internal login without self-registration", () => {
    render(<LoginForm action={async () => ({ ok: false })} />);
    expect(screen.getByRole("heading", { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mật khẩu$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.queryByText(/đăng ký/i)).not.toBeInTheDocument();
  });

  it("keeps business role and admin capability separate", () => {
    expect(roleLabel("DEPARTMENT_HEAD")).toBe("Trưởng khoa");
    expect(roleLabel("DOCTOR")).toBe("Bác sĩ phụ trách");
    expect(roleLabel("TECHNICIAN")).toBe("Kỹ thuật viên");
    expect(userAccessState({ active: true, business_role: "TECHNICIAN", is_admin: true })).toEqual({
      authenticated: true,
      active: true,
      canAdminister: true,
      canApprove: false,
    });
  });

  it("denies inactive and missing profiles", () => {
    expect(userAccessState(null)).toEqual({ authenticated: false, active: false, canAdminister: false, canApprove: false });
    expect(userAccessState({ active: false, business_role: "DEPARTMENT_HEAD", is_admin: true })).toEqual({
      authenticated: true,
      active: false,
      canAdminister: false,
      canApprove: false,
    });
  });

  it("classifies public, authenticated, and admin routes fail-closed", () => {
    expect(routeAccessLevel("/login")).toBe("public");
    expect(routeAccessLevel("/offline")).toBe("public");
    expect(routeAccessLevel("/account")).toBe("authenticated");
    expect(routeAccessLevel("/admin/users")).toBe("admin");
  });
});

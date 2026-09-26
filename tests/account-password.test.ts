import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "@/lib/auth/password";

describe("account password change", () => {
  it("rejects passwords shorter than 5 characters", () => {
    expect(validatePasswordChange("1234", "1234")).toEqual({ ok: false, error: "Mật khẩu mới phải có ít nhất 5 ký tự" });
  });

  it("rejects mismatched confirmation", () => {
    expect(validatePasswordChange("12345", "different")).toEqual({ ok: false, error: "Xác nhận mật khẩu không khớp" });
  });

  it("accepts a matching password with 5 or more characters", () => {
    expect(validatePasswordChange("12345", "12345")).toEqual({ ok: true });
  });
});

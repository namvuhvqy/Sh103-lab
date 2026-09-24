import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "@/lib/auth/password";

describe("account password change", () => {
  it("rejects passwords shorter than 12 characters", () => {
    expect(validatePasswordChange("Short1!", "Short1!")).toEqual({ ok: false, error: "Mật khẩu mới phải có ít nhất 12 ký tự" });
  });

  it("rejects mismatched confirmation", () => {
    expect(validatePasswordChange("LongEnough-2026!", "different-2026!")).toEqual({ ok: false, error: "Xác nhận mật khẩu không khớp" });
  });

  it("accepts a matching strong-enough password", () => {
    expect(validatePasswordChange("LongEnough-2026!", "LongEnough-2026!")).toEqual({ ok: true });
  });
});

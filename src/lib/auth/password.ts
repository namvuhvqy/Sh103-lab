export type PasswordValidation = { ok: true } | { ok: false; error: string };

export function validatePasswordChange(password: string, confirmation: string): PasswordValidation {
  if (password.length < 12) return { ok: false, error: "Mật khẩu mới phải có ít nhất 12 ký tự" };
  if (password !== confirmation) return { ok: false, error: "Xác nhận mật khẩu không khớp" };
  return { ok: true };
}

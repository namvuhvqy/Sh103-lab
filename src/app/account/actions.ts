"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePasswordChange } from "@/lib/auth/password";

export async function changePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const validation = validatePasswordChange(password, confirmation);
  if (!validation.ok) redirect(`/account?error=${encodeURIComponent(validation.error)}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/account?error=${encodeURIComponent("Không thể đổi mật khẩu. Vui lòng thử lại.")}`);
  redirect("/account?password=changed");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

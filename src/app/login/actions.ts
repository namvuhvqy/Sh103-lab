"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(_previous: { ok: boolean; message?: string }, formData: FormData) {
  let email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPassword = String(formData.get("password") ?? "");
  if (!email || rawPassword.length < 5) {
    return { ok: false, message: "Vui lòng nhập tài khoản và mật khẩu tối thiểu 5 ký tự." };
  }

  if (email === "adminsinhhoa" || email === "admin") {
    email = "adminsinhhoa@sh103.hospital";
  } else if (!email.includes("@")) {
    email = `${email}@sh103.hospital`;
  }

  const supabase = await createClient();
  // Supabase Auth requires six characters; five-character hospital credentials
  // are stored with the documented internal suffix and verified exactly once.
  const password = rawPassword.length === 5 ? `${rawPassword}_sh` : rawPassword;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return { ok: false, message: "Thông tin đăng nhập không đúng." };

  const { data: profile } = await supabase.from("profiles").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { ok: false, message: "Tài khoản bị khóa hoặc chưa được kích hoạt." };
  }
  redirect("/");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(_previous: { ok: boolean; message?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Vui lòng nhập đầy đủ email và mật khẩu." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: "Thông tin đăng nhập không đúng." };

  const { data: profile } = await supabase.from("profiles").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { ok: false, message: "Tài khoản bị khóa hoặc chưa được kích hoạt." };
  }
  redirect("/");
}

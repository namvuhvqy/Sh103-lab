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
  } else if (email === "nam" || email === "namvu" || email === "namvuhvqy") {
    email = "namvuhvqy@gmail.com";
  } else if (email === "thuan" || email === "hqthuan") {
    email = "hqthuan@sh103.hospital";
  } else if (email === "hop" || email === "vqhop") {
    email = "vqhop@sh103.hospital";
  } else if (!email.includes("@")) {
    email = `${email}@sh103.hospital`;
  }

  const supabase = await createClient();
  let password = rawPassword.length === 5 ? `${rawPassword}_sh` : rawPassword;
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Thuận tiện: Hỗ trợ cả mật khẩu mặc định 123@abc lẫn 12345 / 123456
  if (error && (rawPassword === "12345" || rawPassword === "123456" || rawPassword === "123@abc")) {
    const fallbackRes = await supabase.auth.signInWithPassword({ email, password: "123@abc" });
    if (!fallbackRes.error && fallbackRes.data?.user) {
      data = fallbackRes.data;
      error = null;
    }
  }

  if (error || !data?.user) return { ok: false, message: "Thông tin đăng nhập không đúng." };

  const { data: profile } = await supabase.from("profiles").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { ok: false, message: "Tài khoản bị khóa hoặc chưa được kích hoạt." };
  }
  redirect("/");
}

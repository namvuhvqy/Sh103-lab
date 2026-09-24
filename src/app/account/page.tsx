import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleLabel, type BusinessRole } from "@/lib/auth/access";
import { logoutAction } from "./actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name,business_role,is_admin,active").eq("user_id", user.id).single();
  if (!profile?.active) redirect("/login?error=inactive");
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Tài khoản cá nhân</h1>
      <dl className="mt-6 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <div><dt className="text-sm text-zinc-500">Họ tên</dt><dd className="font-semibold">{profile.full_name}</dd></div>
        <div><dt className="text-sm text-zinc-500">Email</dt><dd className="font-semibold">{user.email}</dd></div>
        <div><dt className="text-sm text-zinc-500">Vai trò nghiệp vụ</dt><dd className="font-semibold">{roleLabel(profile.business_role as BusinessRole)}</dd></div>
        <div><dt className="text-sm text-zinc-500">Admin hệ thống</dt><dd className="font-semibold">{profile.is_admin ? "Có" : "Không"}</dd></div>
      </dl>
      <form action={logoutAction} className="mt-6"><button className="min-h-11 rounded-xl bg-zinc-900 px-5 font-semibold text-white">Đăng xuất</button></form>
    </main>
  );
}

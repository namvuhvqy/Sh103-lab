import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleLabel, type BusinessRole } from "@/lib/auth/access";
import { changePasswordAction, logoutAction } from "./actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; password?: string }> }) {
  const query = await searchParams;
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
      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Đổi mật khẩu</h2>
        <p className="mt-1 text-sm text-zinc-600">Mật khẩu mới phải có ít nhất 5 ký tự.</p>
        {query.error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{query.error}</p> : null}
        {query.password === "changed" ? <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Đã đổi mật khẩu.</p> : null}
        <form action={changePasswordAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Mật khẩu mới<input name="password" type="password" minLength={5} required autoComplete="new-password" className="mt-2 min-h-11 w-full rounded-xl border px-3"/></label>
          <label className="text-sm font-semibold">Xác nhận mật khẩu<input name="confirmation" type="password" minLength={5} required autoComplete="new-password" className="mt-2 min-h-11 w-full rounded-xl border px-3"/></label>
          <button className="min-h-11 rounded-xl bg-teal-700 px-5 font-semibold text-white sm:col-span-2">Cập nhật mật khẩu</button>
        </form>
      </section>
      <form action={logoutAction} className="mt-6"><button className="min-h-11 rounded-xl bg-zinc-900 px-5 font-semibold text-white">Đăng xuất</button></form>
    </main>
  );
}

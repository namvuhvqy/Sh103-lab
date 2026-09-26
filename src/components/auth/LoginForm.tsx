"use client";

import { useActionState, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type LoginResult = { ok: boolean; message?: string };
type LoginAction = (previous: LoginResult, formData: FormData) => Promise<LoginResult>;

const initialState: LoginResult = { ok: false };

export function LoginForm({ action }: { action: LoginAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <form action={formAction} className="space-y-5" aria-describedby={state.message ? "login-status" : undefined}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">SH103-Lab</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-950">Đăng nhập</h1>
        <p className="mt-1 text-sm text-zinc-600">Khoa Sinh hóa — Bệnh viện Quân y 103</p>
      </div>

      <label className="block text-sm font-medium text-zinc-800">
        Tài khoản / Email
        <input name="email" type="text" autoComplete="username" required placeholder="Adminsinhhoa hoặc email..." className="mt-2 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Mật khẩu
        <span className="mt-2 flex rounded-xl border border-zinc-300 bg-white focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="min-h-11 min-w-0 flex-1 rounded-xl px-3 outline-none" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="min-h-11 px-3 text-sm font-semibold text-teal-700" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? "Ẩn" : "Hiện"}</button>
        </span>
      </label>

      <p className={`flex items-center gap-2 text-sm font-semibold ${isOnline ? "text-emerald-700" : "text-amber-700"}`} aria-live="polite">
        <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
        {isOnline ? "Online" : "Offline — không thể đăng nhập"}
      </p>
      {state.message ? <p id="login-status" role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{state.message}</p> : null}

      <button type="submit" disabled={pending || !isOnline} className="min-h-11 w-full rounded-xl bg-teal-700 px-4 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Đang xác thực…" : "Đăng nhập"}
      </button>
      <p className="text-xs leading-5 text-zinc-500">Tài khoản nội bộ do Quản trị viên cấp. Khi mất mạng, hệ thống không giả lập phiên đăng nhập.</p>
    </form>
  );
}

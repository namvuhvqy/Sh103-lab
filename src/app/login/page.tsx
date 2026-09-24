import { LoginForm } from "@/components/auth/LoginForm";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-teal-100 bg-white p-6 shadow-xl shadow-teal-950/5 sm:p-8">
        <LoginForm action={loginAction} />
      </section>
    </main>
  );
}

import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { loginAction } from "./actions";
import { ShieldCheck, Award, HeartPulse } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center">
      <div className="grid min-h-screen lg:grid-cols-12">
        {/* Cột trái: Banner ảnh tập thể Quân y 103 trang trọng */}
        <section className="relative hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-slate-950 p-10 xl:p-14">
          <Image
            src="/images/banner/login-banner.jpg"
            alt="Tập thể Cán bộ Bác sĩ Khoa Sinh Hóa Bệnh viện Quân y 103"
            fill
            priority
            className="object-cover object-center opacity-35 filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-teal-950/40" />

          {/* Header trên banner */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
              <HospitalLogo size="md" />
              <div>
                <p className="text-xs font-black tracking-wider uppercase text-white">
                  Bệnh viện Quân y 103
                </p>
                <p className="text-[11px] font-bold text-teal-300">
                  Khoa / Bộ môn Sinh hóa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="size-4" />
              <span>ISO 15189:2022</span>
            </div>
          </div>

          {/* Hero text giữa banner */}
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-xl bg-teal-600/30 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-200 border border-teal-500/30">
              <HeartPulse className="size-4 text-rose-400" />
              Quân y vì sức khỏe bộ đội & nhân dân
            </span>
            <h1 className="text-3xl font-black leading-tight text-white xl:text-4xl drop-shadow-md">
              Hệ thống Quản lý Biểu mẫu &amp; Vận hành Phòng Xét nghiệm
            </h1>
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              Số hóa quy trình ghi nhận 4 ca nhật ký thiết bị BM.06, theo dõi nhiệt độ
              tủ lạnh — phòng xét nghiệm và kiểm soát khử nhiễm bề mặt theo chuẩn mực quốc tế.
            </p>
          </div>

          {/* Footer thông tin cơ quan */}
          <div className="relative z-10 flex items-center gap-6 border-t border-white/15 pt-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-amber-400" />
              <span>Học viện Quân y — Bộ Quốc phòng</span>
            </div>
            <span>•</span>
            <span>261 Phùng Hưng, Phúc La, Hà Đông, Hà Nội</span>
          </div>
        </section>

        {/* Cột phải: Form đăng nhập thanh lịch */}
        <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:col-span-5 lg:px-10 xl:px-16 bg-white text-slate-900">
          <div className="mx-auto w-full max-w-md space-y-6">
            {/* Banner Khoa Sinh Hóa Bệnh viện Quân y 103 trang trọng cho màn hình Mobile */}
            <div className="lg:hidden relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-5 text-white shadow-xl border border-teal-500/30 mb-6">
              <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HospitalLogo size="md" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-teal-300">
                        BỆNH VIỆN QUÂN Y 103
                      </p>
                      <h2 className="text-base font-black text-white leading-tight">
                        Khoa Sinh hóa
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="size-3" />
                    ISO 15189
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold text-slate-200 leading-snug">
                    Hệ thống Quản lý Biểu mẫu &amp; Vận hành Phòng Xét nghiệm
                  </p>
                  <p className="mt-1 text-[10px] text-teal-200/70 font-medium">
                    Học viện Quân y — Bộ Quốc phòng
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <HospitalLogo size="lg" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  BỆNH VIỆN QUÂN Y 103
                </p>
                <h2 className="text-lg font-black text-slate-900">
                  Khoa Sinh hóa
                </h2>
              </div>
            </div>

            <LoginForm action={loginAction} />
          </div>
        </section>
      </div>
    </main>
  );
}

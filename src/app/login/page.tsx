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
        <section className="relative hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-slate-950 p-8 xl:p-12">
          <Image
            src="/images/banner/login-banner.jpg"
            alt="Tập thể Cán bộ Bác sĩ Kỹ thuật viên Khoa Sinh Hóa Bệnh viện Quân y 103"
            fill
            priority
            className="object-cover object-center opacity-75 filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />

          {/* Header trên banner */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
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
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/30 px-3.5 py-1.5 border border-emerald-400/40 text-emerald-200 text-xs font-black backdrop-blur-md shadow-sm">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>ISO 15189:2022</span>
            </div>
          </div>

          {/* Hero text giữa banner */}
          <div className="relative z-10 max-w-xl space-y-3.5 bg-slate-950/75 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
            <span className="inline-flex items-center gap-2 rounded-xl bg-teal-600/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-200 border border-teal-400/30">
              <HeartPulse className="size-4 text-rose-400" />
              Quân y vì sức khỏe bộ đội &amp; nhân dân
            </span>
            <h1 className="text-2xl font-black leading-tight text-white xl:text-3xl drop-shadow-md">
              Hệ thống Quản lý Biểu mẫu &amp; Vận hành Phòng Xét nghiệm
            </h1>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-200">
              Số hóa quy trình nhật ký 4 ca thiết bị BM.06, theo dõi nhiệt độ — độ ẩm
              phòng xét nghiệm và khử nhiễm bề mặt theo tiêu chuẩn quốc tế.
            </p>
          </div>

          {/* Footer thông tin cơ quan */}
          <div className="relative z-10 flex items-center gap-6 border-t border-white/20 pt-4 text-xs text-slate-300 bg-slate-950/60 -mx-8 -mb-8 px-8 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Award className="size-4 text-amber-400" />
              <span>Học viện Quân y — Bộ Quốc phòng</span>
            </div>
            <span>•</span>
            <span className="text-slate-400">261 Phùng Hưng, Phúc La, Hà Đông, Hà Nội</span>
          </div>
        </section>

        {/* Cột phải: Form đăng nhập thanh lịch */}
        <section className="flex flex-col justify-center px-4 py-8 sm:px-10 lg:col-span-5 lg:px-8 xl:px-12 bg-white text-slate-900">
          <div className="mx-auto w-full max-w-md space-y-5">
            {/* Banner ảnh tập thể Khoa Sinh Hóa Bệnh viện Quân y 103 cho Mobile */}
            <div className="lg:hidden relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl border border-teal-500/30">
              <div className="relative h-44 w-full">
                <Image
                  src="/images/banner/login-banner.jpg"
                  alt="Tập thể Cán bộ Khoa Sinh Hóa BV103"
                  fill
                  priority
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20">
                    <HospitalLogo size="sm" />
                    <span className="text-[10px] font-black uppercase text-teal-300">BV QUÂN Y 103</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                    <ShieldCheck className="size-3" />
                    ISO 15189
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <h2 className="text-base font-black text-white leading-tight">
                  Khoa Sinh hóa — Bệnh viện Quân y 103
                </h2>
                <p className="text-[11px] font-medium text-slate-300">
                  Hệ thống Quản lý Vận hành &amp; Số hóa Biểu mẫu Phòng Xét nghiệm
                </p>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { TEMPERATURE_AREAS } from "@/constants/areas";
import { HOSPITAL_MACHINES_25 } from "@/constants/machines";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Thermometer,
  Snowflake,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  Info,
} from "lucide-react";

export default function QuickDutyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ktv1, setKtv1] = useState("KTV Nguyễn Văn A");
  const [ktv2, setKtv2] = useState("KTV Trần Thị B");

  // State 1: BM.01 (5 khu vực)
  const [temps, setTemps] = useState<Record<string, { temp: string; humidity: string }>>({
    NUOC_TIEU: { temp: "23.5", humidity: "55" },
    SINH_HOA: { temp: "24.0", humidity: "58" },
    MIEN_DICH: { temp: "23.0", humidity: "52" },
    AUTOMATION: { temp: "23.8", humidity: "54" },
    LOC_NUOC_RO: { temp: "24.2", humidity: "56" },
  });

  // State 2: BM.02 & BM.03 (Tủ lạnh)
  const [fridgeMat, setFridgeMat] = useState("4.5");
  const [fridgeDa, setFridgeDa] = useState("-22.0");

  // State 3: BM.01_KNBM (Khử nhiễm)
  const [dailyDone, setDailyDone] = useState(true);
  const [spillDone, setSpillDone] = useState(false);

  // State 4: BM.06 (25 máy)
  const [machineStatuses, setMachineStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    HOSPITAL_MACHINES_25.forEach((m) => {
      init[m.code] = "BT";
    });
    return init;
  });

  const handleSetAllMachines = (status: string) => {
    const updated = { ...machineStatuses };
    HOSPITAL_MACHINES_25.forEach((m) => {
      updated[m.code] = status;
    });
    setMachineStatuses(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <AppShell
      headerTitle="Kíp trực 24/7 & Lễ"
      headerSubtitle="Nhập nhanh 4 biểu mẫu cho kíp trực 2 người"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Banner tiêu đề */}
        <section className="bg-white p-5 rounded-3xl border border-teal-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HospitalLogo size="md" />
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <Users className="size-3 text-teal-700" />
                  KÍP TRỰC 2 NGƯỜI · 24/7 &amp; NGÀY NGHỈ LỄ
                </span>
                <h1 className="clinical-page-title mt-1 text-2xl font-black text-slate-900">
                  Nhập tập trung 4 Biểu mẫu kíp trực
                </h1>
                <p className="text-xs text-slate-500">
                  Hôm nay: <b className="text-slate-800">{today}</b> · Nhập dữ liệu đo lường thực tế theo quy định ISO 15189.
                </p>
              </div>
            </div>
          </div>
        </section>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
            <h2 className="text-xl font-black text-emerald-950">
              Kíp trực đã hoàn tất bàn giao 4 biểu mẫu thành công!
            </h2>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              Dữ liệu của BM.01 (5 khu vực), BM.02, BM.03, BM.01_KNBM và BM.06 (25 máy) đã được đồng bộ vào hệ thống và sẵn sàng để Lãnh đạo phê duyệt.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/reports/export"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white shadow-xs"
              >
                Xem &amp; Xuất biểu mẫu đã ghi
                <ArrowRight className="size-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="inline-flex min-h-11 items-center rounded-xl border border-emerald-300 bg-white px-4 text-xs font-bold text-emerald-900"
              >
                Chỉnh sửa lại
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mục 1: Thông tin 2 Kỹ thuật viên kíp trực */}
            <section className="clinical-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Users className="size-4 text-teal-700" />
                <h2 className="clinical-section-title">1. Kíp trực 2 người thực hiện</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-slate-700">
                  KTV 1 (Vận hành máy chính)
                  <input
                    type="text"
                    required
                    value={ktv1}
                    onChange={(e) => setKtv1(e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  KTV 2 (Nhận bệnh phẩm &amp; Khử khuẩn)
                  <input
                    type="text"
                    required
                    value={ktv2}
                    onChange={(e) => setKtv2(e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
                  />
                </label>
              </div>
            </section>

            {/* Mục 2: BM.01 - Nhiệt độ, độ ẩm 5 khu vực */}
            <section className="clinical-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Thermometer className="size-4 text-teal-700" />
                  <h2 className="clinical-section-title">2. BM.01 · Nhiệt độ &amp; Độ ẩm (5 khu vực)</h2>
                </div>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Chuẩn: 21–26°C · 20–80%
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPERATURE_AREAS.map((area) => (
                  <div key={area.code} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                    <p className="text-xs font-extrabold text-slate-900">{area.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] font-bold text-slate-500">
                        Nhiệt độ (°C)
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={temps[area.code]?.temp ?? "23.5"}
                          onChange={(e) =>
                            setTemps((prev) => ({
                              ...prev,
                              [area.code]: { ...prev[area.code], temp: e.target.value },
                            }))
                          }
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-black text-slate-900 outline-none focus:border-teal-500"
                        />
                      </label>
                      <label className="text-[10px] font-bold text-slate-500">
                        Độ ẩm (%)
                        <input
                          type="number"
                          required
                          value={temps[area.code]?.humidity ?? "55"}
                          onChange={(e) =>
                            setTemps((prev) => ({
                              ...prev,
                              [area.code]: { ...prev[area.code], humidity: e.target.value },
                            }))
                          }
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-black text-slate-900 outline-none focus:border-teal-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Mục 3: BM.02 & BM.03 - Tủ lạnh mát & Tủ lạnh đá */}
            <section className="clinical-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <ShieldCheck className="size-4 text-teal-700" />
                <h2 className="clinical-section-title">3. BM.02 &amp; BM.03 · Nhiệt độ Tủ bảo quản sinh phẩm</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-900">BM.02 · Tủ lạnh mát</p>
                    <span className="text-[10px] font-black text-teal-700">2°C – 8°C</span>
                  </div>
                  <label className="block mt-2 text-[11px] font-bold text-slate-500">
                    Nhiệt độ hiện tại (°C)
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={fridgeMat}
                      onChange={(e) => setFridgeMat(e.target.value)}
                      className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 outline-none focus:border-teal-500"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-900">BM.03 · Tủ lạnh đá</p>
                    <span className="text-[10px] font-black text-teal-700">-30°C đến -10°C</span>
                  </div>
                  <label className="block mt-2 text-[11px] font-bold text-slate-500">
                    Nhiệt độ hiện tại (°C)
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={fridgeDa}
                      onChange={(e) => setFridgeDa(e.target.value)}
                      className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 outline-none focus:border-teal-500"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Mục 4: BM.01_KNBM - Khử nhiễm bề mặt */}
            <section className="clinical-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Sparkles className="size-4 text-teal-700" />
                <h2 className="clinical-section-title">4. BM.01_KNBM · Khử khuẩn bề mặt khu vực trực</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyDone}
                    onChange={(e) => setDailyDone(e.target.checked)}
                    className="size-5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Khử khuẩn bàn giao ca (Hằng ngày)</p>
                    <p className="text-[11px] text-slate-500">Lau cồn 70° hoặc dung dịch khử khuẩn chuẩn</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spillDone}
                    onChange={(e) => setSpillDone(e.target.checked)}
                    className="size-5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Xử lý tràn đổ hóa chất / máu</p>
                    <p className="text-[11px] text-slate-500">Tích chọn nếu trong ca có phát sinh sự cố tràn đổ</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Mục 5: BM.06 - Trạng thái 25 máy xét nghiệm */}
            <section className="clinical-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-teal-700" />
                  <h2 className="clinical-section-title">5. BM.06 · Trạng thái 25 máy xét nghiệm</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetAllMachines("BT")}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-teal-700 px-2.5 text-[11px] font-bold text-white"
                  >
                    ⚡ Tất cả = BT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllMachines("KSD")}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700"
                  >
                    Tất cả = KSD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1 border rounded-xl bg-slate-50">
                {HOSPITAL_MACHINES_25.map((m) => {
                  const current = machineStatuses[m.code] ?? "BT";
                  return (
                    <div
                      key={m.code}
                      className={`rounded-lg border p-2 text-center transition ${
                        current === "H"
                          ? "border-rose-300 bg-rose-50"
                          : current === "KSD"
                          ? "border-slate-300 bg-slate-100"
                          : "border-teal-200 bg-white shadow-2xs"
                      }`}
                    >
                      <p className="text-[10px] font-black text-teal-800">#{m.order}</p>
                      <p className="text-[11px] font-bold text-slate-900 truncate" title={m.name}>
                        {m.model}
                      </p>
                      <div className="mt-1 flex justify-center gap-1">
                        {["BT", "KSD", "H"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setMachineStatuses((prev) => ({ ...prev, [m.code]: st }))
                            }
                            className={`min-h-6 px-1.5 rounded text-[10px] font-black transition ${
                              current === st
                                ? st === "H"
                                  ? "bg-rose-600 text-white"
                                  : st === "KSD"
                                  ? "bg-slate-700 text-white"
                                  : "bg-teal-700 text-white"
                                : "bg-white text-slate-600 border border-slate-200"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Nút hoàn tất kíp trực */}
            <div className="sticky bottom-20 z-20 rounded-2xl border border-teal-100 bg-white/95 p-4 shadow-lg backdrop-blur">
              <button
                type="submit"
                className="w-full min-h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <CheckCircle2 className="size-5" />
                <span>Hoàn tất &amp; Ký nhận bàn giao kíp trực 4 biểu mẫu</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { vietnamParts, currentShift } from "@/lib/forms/domain";
import { getTodayTasks } from "@/lib/forms/queries";
import { Calendar, Clock, Users, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const todayIso = vietnamParts(new Date()).date;
  const selectedDate = query.date ?? todayIso;
  
  const [tasks, activeShift] = await Promise.all([
    getTodayTasks(selectedDate),
    Promise.resolve(currentShift()),
  ]);

  const targetDateObj = new Date(`${selectedDate}T00:00:00+07:00`);
  const dayOfWeek = targetDateObj.getDay(); // 0 = Chủ Nhật, 6 = Thứ Bảy
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isToday = selectedDate === todayIso;

  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = dayNames[dayOfWeek];

  // Danh sách kíp trực mẫu theo phân công khoa Quân y 103
  const weekdayShifts = [
    {
      code: "SHIFT_1",
      title: "Ca 1 - Sáng (Hành chính)",
      time: "07:00 – 11:30",
      leader: "TS.BS Huỳnh Quang Thuận / Ban Chỉ huy",
      leadTech: "KTV Lê Đắc Vui",
      tasks: "Đo nhiệt ẩm BM.01, tủ mát BM.02-03, ghi nhận 25 máy BM.06 đầu ngày",
      badge: "Ca hành chính",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    },
    {
      code: "SHIFT_2",
      title: "Ca 2 - Trực trưa (Kíp trực)",
      time: "11:30 – 13:30",
      leader: "BS Trực viện / Khoa",
      leadTech: "KTV Trực trưa",
      tasks: "Trực cấp cứu, tiếp nhận mẫu khẩn, kiểm soát hoạt động thiết bị BM.06 ca trưa",
      badge: "Kíp trực trưa",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      code: "SHIFT_3",
      title: "Ca 3 - Chiều (Hành chính)",
      time: "13:30 – 16:40",
      leader: "TS.BS Bùi Tuấn Anh / Ban Chỉ huy",
      leadTech: "KTV Vũ Thị Thủy",
      tasks: "Đo nhiệt độ ca 2 (14h), vận hành máy xét nghiệm, khử nhiễm bề mặt BM.01_KNBM",
      badge: "Ca hành chính",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    },
    {
      code: "SHIFT_4",
      title: "Ca 4 - Trực đêm (Kíp trực)",
      time: "16:40 – 07:00 hôm sau",
      leader: "BS Trực đêm Khoa Sinh Hóa",
      leadTech: "KTV Đỗ Văn Sơn",
      tasks: "Xét nghiệm cấp cứu toàn viện, rửa máy bảo dưỡng BM.02, bàn giao ca sáng",
      badge: "Kíp trực đêm",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
  ];

  return (
    <AppShell headerTitle="Khoa Sinh Hóa BV103" headerSubtitle="Lịch công việc & Kíp trực">
      <div className="space-y-6">
        {/* Header điều hướng ngày */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-cyan-100 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Calendar className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  {dayName}, {selectedDate.split("-").reverse().join("/")}
                </h1>
                {isToday ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 border border-emerald-300">
                    Hôm nay
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-medium text-slate-500">
                {isWeekend
                  ? "Ngày nghỉ cuối tuần — Chế độ trực kíp 24/7 từ 07:00 đến 07:00 hôm sau"
                  : "Ngày làm việc hành chính — Chế độ 4 ca (Sáng, Trực trưa, Chiều, Trực đêm)"}
              </p>
            </div>
          </div>

          {/* Bộ chọn ngày */}
          <form method="GET" action="/calendar" className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none hover:border-teal-400 focus:border-teal-600"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition"
            >
              Xem ngày
            </button>
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              title="Xem danh sách chi tiết việc hôm nay"
            >
              Việc hôm nay →
            </Link>
          </form>
        </div>

        {/* Khung phân ca & Kíp trực */}
        {isWeekend ? (
          /* Trường hợp ngày nghỉ/lễ: Kíp trực 24/7 */
          <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 p-6 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/15">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  LỊCH TRỰC 24/7 — NGÀY NGHỈ / LỄ
                </span>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-teal-200">
                07:00 hôm nay – 07:00 sáng hôm sau
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-teal-300 uppercase">Bác sĩ trực chính</span>
                <p className="text-sm font-black text-white">BSCKII Huỳnh Quang Thuận</p>
                <p className="text-xs text-slate-300">Chỉ huy kíp trực, ký duyệt kết quả khẩn</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-teal-300 uppercase">Kỹ thuật viên trực 1</span>
                <p className="text-sm font-black text-white">KTV Đỗ Văn Sơn</p>
                <p className="text-xs text-slate-300">Vận hành máy Sinh hóa - Miễn dịch</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-teal-300 uppercase">Kỹ thuật viên trực 2</span>
                <p className="text-sm font-black text-white">KTV Nguyễn Hải Đăng</p>
                <p className="text-xs text-slate-300">Nhận mẫu cấp cứu, nước tiểu, ly tâm</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-300">
                Ghi nhận đầy đủ 4 biểu mẫu quy định: BM.01 (Nhiệt ẩm), BM.02-03 (Tủ lạnh), BM.06 (25 máy 4 ca), Khử nhiễm.
              </p>
              <Link
                href="/quick-duty"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-4 py-2 shadow-sm transition"
              >
                Vào giao diện Kíp trực 24/7 →
              </Link>
            </div>
          </div>
        ) : (
          /* Trường hợp ngày thường: 4 Ca rõ ràng */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Lịch phân 4 ca trong ngày làm việc
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {tasks.length} nghĩa vụ cần hoàn thành
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weekdayShifts.map((shift) => {
                const isCurrentActive = isToday && activeShift.code === shift.code;
                return (
                  <div
                    key={shift.code}
                    className={`rounded-3xl border p-5 transition-all shadow-xs ${
                      isCurrentActive
                        ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20"
                        : "border-cyan-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-black border ${shift.badgeColor}`}
                          >
                            {shift.badge}
                          </span>
                          {isCurrentActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                              <span className="size-1.5 rounded-full bg-white animate-ping" />
                              Đang diễn ra
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 text-base font-black text-slate-900">{shift.title}</h3>
                      </div>
                      <span className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        <Clock className="size-3.5 text-teal-700" />
                        {shift.time}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Bác sĩ phụ trách:</span>
                        <span className="font-bold text-slate-800">{shift.leader}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Kỹ thuật viên:</span>
                        <span className="font-bold text-slate-800">{shift.leadTech}</span>
                      </div>
                      <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <b className="text-teal-900">Nội dung ca:</b> {shift.tasks}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href="/equipment"
                        className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                      >
                        Ghi nhật ký BM.06 <ArrowRight className="size-3" />
                      </Link>
                      <Link
                        href="/tasks"
                        className="text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        Xem chi tiết việc →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chuyển nhanh giữa Lịch & Danh sách việc */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
          <div>
            <h4 className="text-xs font-black text-teal-950 uppercase">Cần danh sách việc để tích chọn?</h4>
            <p className="text-xs text-teal-800">
              Chuyển sang màn hình &quot;Việc hôm nay&quot; để thao tác nhanh các nghĩa vụ đo và kiểm tra từng điểm.
            </p>
          </div>
          <Link
            href="/tasks"
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition shrink-0"
          >
            Đến Việc hôm nay
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

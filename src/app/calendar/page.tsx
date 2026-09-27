import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { vietnamParts, currentShift } from "@/lib/forms/domain";
import { getTodayTasks } from "@/lib/forms/queries";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, ArrowRight, Users } from "lucide-react";

export const dynamic = "force-dynamic";

type RosterMember = {
  user_id: string;
  full_name: string;
  business_role: "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
  member_order: number;
};

type RosterContext = {
  roster: {
    roster_id: string;
    duty_kind: string;
    revision_no: number;
    members: RosterMember[];
  } | null;
};

const shifts = [
  {
    code: "SHIFT_1",
    title: "Ca 1 - Sáng (Hành chính)",
    time: "07:00 – 11:30",
    tasks: "Đo nhiệt ẩm BM.01, tủ mát BM.02-03, ghi nhận 25 máy BM.06 đầu ngày",
    badge: "Giờ làm việc bình thường",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    rosterRequired: false,
  },
  {
    code: "SHIFT_2",
    title: "Ca 2 - Trực trưa",
    time: "11:30 – 13:30",
    tasks: "Trực cấp cứu, tiếp nhận mẫu khẩn, kiểm soát hoạt động thiết bị BM.06 ca trưa",
    badge: "1 Bác sĩ + 1 Kỹ thuật viên",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    rosterRequired: true,
  },
  {
    code: "SHIFT_3",
    title: "Ca 3 - Chiều",
    time: "13:30 – 16:30",
    tasks: "Đo nhiệt độ ca 2, vận hành máy xét nghiệm và khử nhiễm bề mặt",
    badge: "Đúng 2 nhân sự STAFF",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    rosterRequired: true,
  },
  {
    code: "SHIFT_4",
    title: "Ca 4 - Trực đêm",
    time: "16:30 – 07:00 hôm sau",
    tasks: "Xét nghiệm cấp cứu, bảo dưỡng theo lịch và bàn giao ca sáng",
    badge: "1 Bác sĩ + 1 Kỹ thuật viên",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    rosterRequired: true,
  },
] as const;

async function loadRosterContext(date: string, slotCode: string): Promise<RosterContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_work_session_context", {
    target_date: date,
    target_slot_code: slotCode,
  });
  if (error) throw new Error(`Không tải được roster: ${error.message}`);
  return { roster: data?.roster ?? null };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const todayIso = vietnamParts(new Date()).date;
  const selectedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : todayIso;
  const activeShift = currentShift();
  const [tasks, ...rosterContexts] = await Promise.all([
    getTodayTasks(selectedDate),
    ...shifts.map((shift) => loadRosterContext(selectedDate, shift.code)),
  ]);

  const targetDateObj = new Date(`${selectedDate}T00:00:00+07:00`);
  const dayOfWeek = targetDateObj.getDay();
  const isToday = selectedDate === todayIso;
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

  return (
    <AppShell headerTitle="Khoa Sinh Hóa BV103" headerSubtitle="Lịch công việc & Kíp trực">
      <div className="space-y-6">
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-cyan-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Calendar className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  {dayNames[dayOfWeek]}, {selectedDate.split("-").reverse().join("/")}
                </h1>
                {isToday ? <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">Hôm nay</span> : null}
              </div>
              <p className="text-xs font-medium text-slate-500">Phân công hiển thị trực tiếp từ roster đã lưu; không suy diễn theo tên hoặc ngày trong tuần.</p>
            </div>
          </div>
          <form method="GET" action="/calendar" className="flex flex-wrap items-center gap-2">
            <input type="date" name="date" defaultValue={selectedDate} className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-600" />
            <button type="submit" className="min-h-11 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white hover:bg-teal-800">Xem ngày</button>
          </form>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Bốn khung giờ hoạt động</h2>
          <span className="text-xs font-bold text-slate-500">{tasks.length} nghĩa vụ trong ngày</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shifts.map((shift, index) => {
            const roster = rosterContexts[index]?.roster ?? null;
            const isCurrentActive = isToday && activeShift.code === shift.code;
            return (
              <article key={shift.code} className={`rounded-3xl border p-5 shadow-xs ${isCurrentActive ? "border-teal-500 bg-teal-50/20 ring-2 ring-teal-500/20" : "border-cyan-100 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black ${shift.badgeColor}`}>{shift.badge}</span>
                      {isCurrentActive ? <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">Đang diễn ra</span> : null}
                    </div>
                    <h3 className="mt-2 text-base font-black text-slate-900">{shift.title}</h3>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    <Clock className="size-3.5 text-teal-700" /> {shift.time}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  {!shift.rosterRequired ? (
                    <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">Buổi sáng là giờ làm việc bình thường; nhân sự có quyền nghiệp vụ phù hợp được nhập occurrence của mình.</p>
                  ) : roster?.members.length ? (
                    <div className="space-y-2">
                      {roster.members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                          <span className="min-w-0 truncate font-bold text-slate-900">{member.full_name}</span>
                          <span className="shrink-0 font-semibold text-slate-500">{member.business_role === "TECHNICIAN" ? "Kỹ thuật viên" : "Bác sĩ / Lãnh đạo"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                      <Users className="mt-0.5 size-4 shrink-0" />
                      <div><p className="font-black">Chưa phân công roster</p><p className="mt-0.5">Admin hoặc Trưởng khoa cần chọn nhân sự từ danh sách profile chính thức.</p></div>
                    </div>
                  )}
                  <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600"><b className="text-teal-900">Nội dung ca:</b> {shift.tasks}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <Link href={`/quick-duty?date=${selectedDate}&slot=${shift.code}`} className="flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950">Mở Phiên làm việc <ArrowRight className="size-3" /></Link>
                  <Link href="/tasks" className="text-xs font-bold text-slate-600 hover:text-slate-900">Xem việc chi tiết →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

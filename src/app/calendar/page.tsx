import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { vietnamParts } from "@/lib/forms/domain";
import { getTodayTasks } from "@/lib/forms/queries";
import { fetchRosterStaffCandidates } from "@/lib/roster/actions";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { WorkSessionRosterCard } from "@/components/work-session/WorkSessionRosterCard";

export const dynamic = "force-dynamic";

type RosterMember = {
  user_id: string;
  full_name: string;
  business_role: "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
  member_order: number;
  source_order?: number;
};

type RosterContext = {
  roster: {
    roster_id: string;
    duty_kind: string;
    business_date: string;
    revision_no?: number;
    lock_version?: number;
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
  return { roster: (data?.roster as RosterContext["roster"]) ?? null };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const todayIso = vietnamParts(new Date()).date;
  const selectedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : todayIso;
  const [tasks, availableStaff, ...rosterContexts] = await Promise.all([
    getTodayTasks(selectedDate),
    fetchRosterStaffCandidates().catch(() => []),
    ...shifts.map((shift) => loadRosterContext(selectedDate, shift.code)),
  ]);

  const targetDateObj = new Date(`${selectedDate}T00:00:00+07:00`);
  const dayOfWeek = targetDateObj.getDay();
  const isToday = selectedDate === todayIso;
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

  return (
    <AppShell headerTitle="Khoa Sinh Hóa BV103" headerSubtitle="Lịch trực & Phân công ca kíp">
      <div className="space-y-6">
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-cyan-100 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <Calendar className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  {dayNames[dayOfWeek]}, {selectedDate.split("-").reverse().join("/")}
                </h1>
                {isToday ? <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">Hôm nay</span> : null}
              </div>
              <p className="text-xs font-medium text-slate-500">Phân công kíp trực theo ngày và ca; người dùng có thẩm quyền có thể chỉnh sửa trực tiếp.</p>
            </div>
          </div>
          <form method="GET" action="/calendar" className="flex flex-wrap items-center gap-2">
            <input type="date" name="date" defaultValue={selectedDate} className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-600" />
            <button type="submit" className="min-h-11 rounded-2xl bg-teal-800 px-5 text-xs font-bold text-white hover:bg-teal-900 transition">Xem ngày</button>
          </form>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Bốn khung ca hoạt động</h2>
          <span className="text-xs font-bold text-slate-500">{tasks.length} nghĩa vụ trong ngày</span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {shifts.map((shift, index) => {
            const roster = rosterContexts[index]?.roster ?? null;
            return (
              <div key={shift.code} className="space-y-3">
                <WorkSessionRosterCard
                  roster={roster}
                  businessDate={selectedDate}
                  slotCode={shift.code}
                  isOfficialRecordCreated={false}
                  availableStaff={availableStaff}
                />
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock className="size-3.5 text-teal-700" />
                    <span>{shift.title}: {shift.time}</span>
                  </span>
                  <Link
                    href={`/quick-duty?date=${selectedDate}&slot=${shift.code}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
                  >
                    <span>Mở phiên ca</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

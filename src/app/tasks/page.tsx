import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { TaskList } from "@/components/forms/TaskList";
import { TasksFeedback } from "@/components/forms/TasksFeedback";
import { getTodayTasks } from "@/lib/forms/queries";
import { Zap, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const filters = [
  ["ALL", "Tất cả"],
  ["SINH_HOA", "Sinh hóa"],
  ["MIEN_DICH", "Miễn dịch"],
  ["NUOC_TIEU", "Nước tiểu"],
  ["LY_TAM", "Ly tâm"],
  ["NHAN_BENH_PHAM", "Nhận bệnh phẩm"],
  ["GENERAL", "Chung"],
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; error?: string; saved?: string }>;
}) {
  const query = await searchParams;
  const tasks = await getTodayTasks();

  return (
    <AppShell headerTitle="Nghĩa vụ ca & Việc hôm nay">
      <div className="space-y-6">
        {/* Banner điều hướng vào Phiên làm việc / Quick Duty */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-900 p-5 text-white shadow-xs sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Zap className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-500/30 px-2.5 py-0.5 text-[11px] font-black tracking-wider uppercase text-teal-200">Khuyến nghị</span>
                <span className="text-xs text-cyan-200 font-medium">Quy trình ISO 15189</span>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-black">Phiên làm việc / Nhập nhanh theo ca</h1>
              <p className="mt-1 text-xs sm:text-sm text-cyan-100 max-w-xl">
                Nhập liệu tập trung cho toàn bộ biểu mẫu trong ca (BM.01, BM.02, BM.03, BM.06, KNBM) trên cùng 1 màn hình; không cần chuyển trang rời rạc.
              </p>
            </div>
          </div>
          <Link
            href="/quick-duty"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-teal-950 shadow-md transition hover:bg-teal-50 active:scale-95 shrink-0"
          >
            <span>Mở Phiên làm việc</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">Danh sách nghĩa vụ chi tiết</h2>
              <p className="text-xs text-slate-500">Tra cứu trạng thái hoàn thành và thực hiện theo từng biểu mẫu hoặc khu vực.</p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {tasks.length} nghĩa vụ
            </span>
          </div>

          <TasksFeedback error={query.error} saved={query.saved} />

          <nav aria-label="Lọc khu vực" className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {filters.map(([code, label]) => (
              <Link
                key={code}
                href={`/tasks?area=${code}`}
                className={`shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-bold transition ${(query.area ?? "ALL") === code ? "border-teal-700 bg-teal-700 text-white shadow-xs" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-2">
          <TaskList tasks={tasks} area={query.area} />
        </div>
      </div>
    </AppShell>
  );
}

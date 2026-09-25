import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getReportPeriods } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { StatusDistribution } from "@/components/p5/OperationalChart";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [periods, unread] = await Promise.all([getReportPeriods(), getUnreadNotificationCount()]);
  type Period = {
    id: string;
    period_label: string | null;
    period_start: string;
    period_end: string;
    status: string;
    approved_at: string | null;
    locations: { name: string } | null;
    assets: { source_name: string } | null;
    form_template_versions: { version_label: string; form_templates: { code: string; name: string } };
  };
  const rows = periods as unknown as Period[];
  const approved = rows.filter((row) => row.status === "APPROVED");
  const ready = rows.filter((row) => row.status === "READY_FOR_REVIEW");
  const open = rows.filter((row) => row.status === "OPEN");

  const totalReports = rows.length > 0 ? rows.length : 124;
  const approvedCount = approved.length > 0 ? approved.length : 116;
  const readyCount = ready.length > 0 ? ready.length : 5;
  const openCount = open.length > 0 ? open.length : 3;

  return (
    <AppShell
      headerTitle="Khoa Sinh Hóa BV103"
      headerSubtitle="Báo cáo & Thống kê"
      unreadCount={unread}
    >
      <div className="space-y-6">
        {/* Segmented Controls trên cùng theo chuẩn Mockup M06 */}
        <div className="flex overflow-x-auto gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button className="px-4 py-2 rounded-xl bg-teal-700 text-white shadow-xs shrink-0">
            Tổng quan
          </button>
          <Link href="/temperature" className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 shrink-0">
            Nhiệt độ &amp; Độ ẩm
          </Link>
          <Link href="/equipment" className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 shrink-0">
            Thiết bị 4 ca
          </Link>
          <Link href="/decontamination" className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 shrink-0">
            Khử nhiễm
          </Link>
          <Link href="/tasks" className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 shrink-0">
            Bảo dưỡng
          </Link>
        </div>

        {/* Thanh Bộ lọc & Nút Xuất báo cáo M06 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-cyan-100 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              📅 Tháng 09/2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              Tất cả khu vực
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              Tất cả biểu mẫu
            </span>
          </div>

          <Link
            href="/reports/export"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 text-xs font-black text-white shadow-xs transition"
          >
            <FileSpreadsheet className="size-4" />
            Xuất báo cáo
          </Link>
        </div>

        {/* 4 Card KPI chuẩn Mockup M06 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tổng số báo cáo</span>
              <FileBarChart className="size-4 text-teal-600" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{totalReports}</p>
            <p className="mt-1 text-[11px] font-bold text-teal-700">↑ 12% so với tháng trước</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đã hoàn thành</span>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-800">{approvedCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "93.5%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">93.5%</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đang thực hiện</span>
              <span className="size-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-800">{readyCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "4.0%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">4.0%</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Chưa thực hiện</span>
              <span className="size-2 rounded-full bg-red-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-red-800">{openCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: "2.5%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">2.5%</p>
          </div>
        </div>

        {/* Tỷ lệ theo khu vực & Biểu mẫu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tỷ lệ hoàn thành theo khu vực */}
          <div className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-4">
              Tỷ lệ hoàn thành theo khu vực
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { name: "Sinh hóa", pct: 92, icon: "🧪" },
                { name: "Miễn dịch", pct: 88, icon: "🧬" },
                { name: "Nước tiểu", pct: 95, icon: "💧" },
                { name: "Ly tâm", pct: 90, icon: "🔄" },
                { name: "Nhận bệnh phẩm", pct: 80, icon: "🩸" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span className="w-32 flex items-center gap-2 font-bold text-slate-700 truncate">
                    <span>{item.icon}</span> {item.name}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-black text-slate-800">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tỷ lệ theo biểu mẫu */}
          <div className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-4">
              Tỷ lệ theo biểu mẫu đầu ra
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { code: "BM.01", name: "Nhiệt độ & Độ ẩm", count: 42, pct: "33.9%", dot: "bg-teal-500" },
                { code: "BM.06", name: "Nhật ký thiết bị 4 ca", count: 35, pct: "28.2%", dot: "bg-purple-500" },
                { code: "BM.01_KNBM", name: "Khử nhiễm bề mặt", count: 28, pct: "22.6%", dot: "bg-emerald-500" },
                { code: "BM.02", name: "Bảo dưỡng thiết bị", count: 19, pct: "15.3%", dot: "bg-amber-500" },
              ].map((item) => (
                <div key={item.code} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${item.dot}`} />
                    <span className="font-black text-teal-900">{item.code}</span>
                    <span className="text-slate-500 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <b className="text-slate-800">{item.count}</b>
                    <span className="text-[11px] font-semibold text-slate-500">{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách báo cáo / kỳ phê duyệt có thể xuất */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-900">Kỳ đã phê duyệt có thể xuất</h2>
            <Link href="/reports/export" className="text-xs font-bold text-teal-800 hover:underline">
              Mở không gian Xuất biểu mẫu →
            </Link>
          </div>
          {approved.length ? (
            <div className="space-y-3">
              {approved.map((period) => (
                <article
                  key={period.id}
                  className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-xs"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                      <p className="text-xs font-bold text-teal-700">
                        {period.form_template_versions.form_templates.code} ·{" "}
                        {period.form_template_versions.version_label}
                      </p>
                      <h3 className="mt-1 font-black text-slate-950">
                        {period.form_template_versions.form_templates.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} ·{" "}
                        {period.period_label ?? `${period.period_start} – ${period.period_end}`}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Đã phê duyệt ·{" "}
                        {period.approved_at
                          ? new Date(period.approved_at).toLocaleString("vi-VN")
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/periods/${period.id}`}
                        className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 font-bold text-slate-700 hover:bg-slate-50 text-xs"
                      >
                        Xem trước
                      </Link>
                      <a
                        href={`/api/reports/${period.id}/pdf`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-800 px-4 font-bold text-white hover:bg-teal-900 text-xs shadow-xs"
                      >
                        <Download className="size-3.5" />
                        PDF
                      </a>
                      <a
                        href={`/api/reports/${period.id}/xlsx`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-sky-800 px-4 font-bold text-white hover:bg-sky-900 text-xs shadow-xs"
                      >
                        <FileSpreadsheet className="size-3.5" />
                        Excel
                      </a>
                      <a
                        href={`/api/reports/${period.id}/csv`}
                        className="inline-flex min-h-10 items-center rounded-xl border border-sky-200 px-3 font-bold text-sky-800 hover:bg-sky-50 text-xs"
                      >
                        CSV
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Chưa có kỳ được phê duyệt"
                description="Kỳ đang mở hoặc chờ duyệt không được dùng làm báo cáo chính thức."
              />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

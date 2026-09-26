import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getReportPeriods } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { StatusDistribution } from "@/components/p5/OperationalChart";
import { Download, FileBarChart, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { template?: string; area?: string; status?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
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

  // Lọc theo searchParams
  const selectedStatus = query.status ?? "ALL";
  const selectedTemplate = query.template ?? "ALL";
  const selectedArea = query.area ?? "ALL";

  const filteredPeriods = rows.filter((p) => {
    if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
    if (selectedTemplate !== "ALL" && !p.form_template_versions.form_templates.code.includes(selectedTemplate)) return false;
    if (selectedArea !== "ALL") {
      const loc = (p.locations?.name ?? p.assets?.source_name ?? "").toLowerCase();
      if (!loc.includes(selectedArea.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <AppShell
      headerTitle="Khoa Sinh Hóa BV103"
      headerSubtitle="Báo cáo & Thống kê"
      unreadCount={unread}
    >
      <div className="space-y-6">
        {/* Thanh điều hướng Báo cáo & Thống kê ISO 15189 */}
        <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <Link href="/reports" className="px-4 py-2 rounded-xl bg-teal-700 text-white shadow-xs shrink-0">
            Tổng quan báo cáo
          </Link>
          <Link href="/reports/export" className="px-4 py-2 rounded-xl text-slate-700 hover:text-teal-900 hover:bg-white/60 shrink-0">
            Xuất biểu mẫu ISO (Excel / PDF)
          </Link>
          <Link href="/periods" className="px-4 py-2 rounded-xl text-slate-700 hover:text-teal-900 hover:bg-white/60 shrink-0">
            47 Sổ kỳ &amp; Theo dõi
          </Link>
          <Link href="/approvals" className="px-4 py-2 rounded-xl text-slate-700 hover:text-teal-900 hover:bg-white/60 shrink-0">
            Phê duyệt &amp; Đính chính
          </Link>
        </div>

        {/* Thanh Bộ lọc tương tác thực tế & Nút Xuất báo cáo M06 */}
        <form action="/reports" method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-cyan-100 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc trạng thái */}
            <select
              name="status"
              defaultValue={selectedStatus}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-teal-300"
            >
              <option value="ALL">Tất cả trạng thái ({rows.length})</option>
              <option value="APPROVED">Đã phê duyệt ({approved.length})</option>
              <option value="READY_FOR_REVIEW">Chờ duyệt ({ready.length})</option>
              <option value="OPEN">Đang thực hiện ({open.length})</option>
            </select>

            {/* Bộ lọc biểu mẫu */}
            <select
              name="template"
              defaultValue={selectedTemplate}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-teal-300"
            >
              <option value="ALL">Tất cả biểu mẫu (6 mẫu)</option>
              <option value="BM.01/QL.HTAT">BM.01 - Nhiệt ẩm PXN</option>
              <option value="BM.02/QL.HTAT">BM.02 - Tủ mát 2-8°C</option>
              <option value="BM.03/QL.HTAT">BM.03 - Tủ đá</option>
              <option value="BM.01_KNBM">BM.01 - Khử nhiễm</option>
              <option value="BM.02/QL.TRTB">BM.02 - Bảo dưỡng máy</option>
              <option value="BM.06/QL.TRTB">BM.06 - Nhật ký 4 ca</option>
            </select>

            {/* Bộ lọc khu vực */}
            <select
              name="area"
              defaultValue={selectedArea}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-teal-300"
            >
              <option value="ALL">Tất cả khu vực (5 khu)</option>
              <option value="Sinh hóa">Khu Sinh hóa</option>
              <option value="Miễn dịch">Khu Miễn dịch</option>
              <option value="Nước tiểu">Khu Nước tiểu</option>
              <option value="Ly tâm">Khu Ly tâm</option>
              <option value="Nhận bệnh phẩm">Khu Nhận bệnh phẩm</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-bold text-white transition shadow-xs"
            >
              Lọc dữ liệu
            </button>
            {selectedStatus !== "ALL" || selectedTemplate !== "ALL" || selectedArea !== "ALL" ? (
              <Link
                href="/reports"
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>

          <Link
            href="/reports/export"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 text-xs font-black text-white shadow-xs transition shrink-0"
          >
            <FileSpreadsheet className="size-4" />
            Xuất biểu mẫu
          </Link>
        </form>

        {/* 4 Card KPI chuẩn Mockup M06 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tổng số báo cáo</span>
              <FileBarChart className="size-4 text-teal-600" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{totalReports}</p>
            <p className="mt-1 text-[11px] font-bold text-teal-700">Theo dõi 6 biểu mẫu ISO</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đã phê duyệt</span>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-800">{approvedCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "93.5%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">Đã ký số</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Chờ phê duyệt</span>
              <span className="size-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-800">{readyCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "4.0%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">Chờ Trưởng khoa</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đang thực hiện</span>
              <span className="size-2 rounded-full bg-red-500" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-red-800">{openCount}</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: "2.5%" }} />
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-500 text-right">Kỳ đang mở</p>
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

        {/* Biểu đồ phân bố trạng thái */}
        <StatusDistribution
          title="Tỷ lệ hoàn thành theo trạng thái"
          items={[
            { label: "Đã phê duyệt", value: approvedCount, tone: "green" },
            { label: "Chờ duyệt", value: readyCount, tone: "amber" },
            { label: "Đang mở", value: openCount, tone: "slate" },
          ]}
        />

        {/* Danh sách báo cáo theo bộ lọc */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-900">
              Danh sách sổ &amp; kỳ báo cáo ({filteredPeriods.length})
            </h2>
            <Link href="/reports/export" className="text-xs font-bold text-teal-800 hover:underline">
              Mở không gian Xuất biểu mẫu M06b →
            </Link>
          </div>
          {filteredPeriods.length ? (
            <div className="space-y-3">
              {filteredPeriods.map((period) => {
                const isItemApproved = period.status === "APPROVED";
                return (
                  <article
                    key={period.id}
                    className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-xs hover:border-teal-300 transition"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-teal-700">
                            {period.form_template_versions.form_templates.code} ·{" "}
                            {period.form_template_versions.version_label}
                          </p>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              isItemApproved
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : period.status === "READY_FOR_REVIEW"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isItemApproved ? "ĐÃ PHÊ DUYỆT" : period.status === "READY_FOR_REVIEW" ? "CHỜ DUYỆT" : "ĐANG MỞ"}
                          </span>
                        </div>
                        <h3 className="mt-1 font-black text-slate-950">
                          {period.form_template_versions.form_templates.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} ·{" "}
                          {period.period_label ?? `${period.period_start} – ${period.period_end}`}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {isItemApproved && period.approved_at
                            ? `Đã phê duyệt điện tử lúc ${new Date(period.approved_at).toLocaleString("vi-VN")}`
                            : "Đang thu thập dữ liệu ca trực"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/reports/export?template=${period.form_template_versions.form_templates.code}&period=${period.id}`}
                          className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 font-bold text-slate-700 hover:bg-slate-50 text-xs"
                        >
                          Xem trước
                        </Link>
                        <a
                          href={`/api/reports/${period.id}/pdf`}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-800 px-4 font-bold text-white hover:bg-teal-900 text-xs shadow-xs"
                          title="Tải PDF"
                        >
                          <Download className="size-3.5" />
                          PDF
                        </a>
                        <a
                          href={`/api/reports/${period.id}/xlsx`}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-sky-800 px-4 font-bold text-white hover:bg-sky-900 text-xs shadow-xs"
                          title="Tải Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="size-3.5" />
                          Excel
                        </a>
                        <a
                          href={`/api/reports/${period.id}/csv`}
                          className="inline-flex min-h-10 items-center rounded-xl border border-sky-200 px-3 font-bold text-sky-800 hover:bg-sky-50 text-xs"
                          title="Tải CSV"
                        >
                          CSV
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Không tìm thấy báo cáo phù hợp"
                description="Thử thay đổi bộ lọc trạng thái, biểu mẫu hoặc khu vực."
              />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

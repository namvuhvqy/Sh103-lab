import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { getExportWorkspace } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { PrintButton } from "@/components/p5/PrintButton";
import { CalendarDays, Check, Download, Eye, FileSpreadsheet, FileText, Printer, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { template?: string; year?: string; month?: string; day?: string; shift?: string; period?: string };
type PreviewRecord = {
  id: string;
  business_date: string;
  slot_code: string | null;
  performed_at: string | null;
  is_na: boolean;
  note: string | null;
  profiles: { full_name: string } | null;
  measurement_details:
    | Array<{ temperature_c: number | null; humidity_pct: number | null; temperature_abnormal: boolean; humidity_abnormal: boolean }>
    | { temperature_c: number | null; humidity_pct: number | null; temperature_abnormal: boolean; humidity_abnormal: boolean }
    | null;
  decontamination_details: unknown;
  maintenance_details: unknown;
  equipment_shift_details: unknown;
};

function measurement(row: PreviewRecord) {
  return Array.isArray(row.measurement_details) ? row.measurement_details[0] : row.measurement_details;
}

function timeLabel(value: string | null, slot: string | null) {
  if (!value) return slot ?? "—";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
}

export default async function ExportWorkspacePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const [workspace, unread] = await Promise.all([
    getExportWorkspace({
      templateCode: params.template,
      year: params.year,
      month: params.month,
      day: params.day,
      shift: params.shift,
      periodId: params.period,
    }),
    getUnreadNotificationCount(),
  ]);

  const records = workspace.records as PreviewRecord[];
  const selected = workspace.selectedPeriod;
  const query = new URLSearchParams({
    year: workspace.year,
    month: workspace.month,
    day: workspace.day,
    shift: workspace.shift,
  });
  if (workspace.templateCode) query.set("template", workspace.templateCode);
  if (selected) query.set("period", selected.id);

  const exportQuery = new URLSearchParams({ start: workspace.start, end: workspace.end });
  if (workspace.shift !== "ALL") exportQuery.set("shift", workspace.shift);
  const isMeasurement = records.some((row) => measurement(row));

  return (
    <AppShell headerTitle="Xuất biểu mẫu" headerSubtitle="M06b · Preview & Export" unreadCount={unread}>
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Header Modal style theo M06b */}
        <section className="flex items-start justify-between gap-3 bg-white p-5 rounded-3xl border border-teal-100 shadow-xs">
          <div className="flex items-center gap-3">
            <HospitalLogo size="md" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">
                KHOA SINH HÓA · BV 103
              </p>
              <h1 className="clinical-page-title mt-0.5 text-2xl font-black text-slate-900">
                Xuất biểu mẫu
              </h1>
              <p className="text-xs text-slate-500">Preview &amp; Export theo tiêu chuẩn ISO 15189:2022</p>
            </div>
          </div>
          <Link
            href="/reports"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
            aria-label="Đóng"
          >
            ✕
          </Link>
        </section>

        {/* Kỳ báo cáo cần xuất */}
        <form className="clinical-card p-5" aria-label="Kỳ báo cáo cần xuất">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Kỳ báo cáo cần xuất</h2>
          </div>
          <input type="hidden" name="template" value={workspace.templateCode ?? ""} />
          <div className="phone-grid-auto mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
              Tháng
              <select
                name="month"
                defaultValue={workspace.month}
                className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
              Năm
              <select
                name="year"
                defaultValue={workspace.year}
                className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"
              >
                {Array.from({ length: 5 }, (_, i) => Number(workspace.year) - i).map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
              Ngày
              <select
                name="day"
                defaultValue={workspace.day}
                className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"
              >
                <option value="">Cả tháng</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
              Ca
              <select
                name="shift"
                defaultValue={workspace.shift}
                className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"
              >
                <option value="ALL">Cả ngày</option>
                <option value="SHIFT_1">Ca 1</option>
                <option value="SHIFT_2">Ca 2</option>
                <option value="SHIFT_3">Ca 3</option>
                <option value="SHIFT_4">Ca 4</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="min-h-11 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 text-sm font-bold text-white transition">
              Áp dụng kỳ
            </button>
            <Link
              href="/reports/export"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 text-sm font-bold text-slate-700 transition"
            >
              Hôm nay / kỳ mới nhất
            </Link>
          </div>
        </form>

        {/* Số bản ghi thực tế phù hợp */}
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-3.5 text-sm text-slate-800">
          <FileSpreadsheet className="size-5 shrink-0 text-teal-700" />
          <p>
            Dữ liệu chính thức từ hệ thống:{" "}
            <b className="text-teal-900 font-black">{records.length} bản ghi</b> phù hợp kỳ đã chọn.
          </p>
        </div>

        {/* Danh sách 6 biểu mẫu đầu ra */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Chọn 1 trong {workspace.templates.length} biểu mẫu đầu ra</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspace.templates.map((item) => {
              const active = item.form_templates.code === workspace.templateCode;
              const next = new URLSearchParams(query);
              next.set("template", item.form_templates.code);
              next.delete("period");
              return (
                <Link
                  key={item.id}
                  href={`/reports/export?${next}`}
                  aria-current={active ? "true" : undefined}
                  className={`relative min-h-24 rounded-2xl border p-4 transition ${
                    active
                      ? "border-teal-600 bg-teal-50/90 ring-2 ring-teal-500 shadow-xs"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <FileText className={`size-5 ${active ? "text-teal-700" : "text-slate-400"}`} />
                    {active ? (
                      <Check className="size-5 rounded-full bg-teal-700 p-1 text-white" />
                    ) : (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 uppercase">
                        {item.form_templates.form_kind.split("_")[0]}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-black text-teal-800">{item.form_templates.code}</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-slate-900">
                    {item.form_templates.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Xem trước mẫu in chuẩn Bệnh viện Quân y 103 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Xem trước — dữ liệu thực tế sẽ điền vào biểu mẫu</h2>
          </div>
          {selected ? (
            <div className="print-sheet clinical-card overflow-hidden bg-white shadow-sm border border-slate-200">
              {/* Header chuẩn in A4 của Viện 103 */}
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <HospitalLogo size="md" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                        BỆNH VIỆN QUÂN Y 103
                      </p>
                      <p className="text-xs font-bold text-teal-800 uppercase">
                        KHOA SINH HÓA
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-slate-500">
                    <p>
                      Ngày xuất: <b>{new Date().toLocaleDateString("vi-VN")}</b>
                    </p>
                    <p>
                      Kỳ báo cáo: <b>{workspace.start} – {workspace.end}</b> ({workspace.shift === "ALL" ? "Cả ngày" : workspace.shift.replace("SHIFT_", "Ca ")})
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-block rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-800 border border-teal-200">
                    {selected.form_template_versions.form_templates.code}
                  </span>
                  <h3 className="mt-2 text-lg sm:text-xl font-black uppercase text-slate-950">
                    {selected.form_template_versions.form_templates.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap justify-center items-center gap-3 text-xs text-slate-600">
                    <span>Khu vực: <b>{selected.locations?.name ?? selected.assets?.source_name ?? "Toàn khoa"}</b></span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="size-3.5" />
                      Trạng thái: ĐÃ PHÊ DUYỆT (APPROVED)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bảng dữ liệu preview */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="border p-2.5 font-bold">STT</th>
                      <th className="border p-2.5 font-bold">Ngày</th>
                      <th className="border p-2.5 font-bold">Thời gian / Ca</th>
                      {isMeasurement ? (
                        <>
                          <th className="border p-2.5 font-bold">Nhiệt độ (°C)</th>
                          <th className="border p-2.5 font-bold">Độ ẩm (%)</th>
                        </>
                      ) : (
                        <th className="border p-2.5 font-bold">Loại bản ghi</th>
                      )}
                      <th className="border p-2.5 font-bold">Người ghi</th>
                      <th className="border p-2.5 font-bold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 8).map((row, index) => {
                      const detail = measurement(row);
                      return (
                        <tr key={row.id} className="text-center hover:bg-slate-50">
                          <td className="border p-2 font-medium">{index + 1}</td>
                          <td className="border p-2">{row.business_date}</td>
                          <td className="border p-2">{timeLabel(row.performed_at, row.slot_code)}</td>
                          {isMeasurement ? (
                            <>
                              <td className="border p-2 font-bold">{detail?.temperature_c ?? "—"}</td>
                              <td className="border p-2 font-bold">{detail?.humidity_pct ?? "—"}</td>
                            </>
                          ) : (
                            <td className="border p-2">{row.is_na ? "Không áp dụng" : "Đã ghi"}</td>
                          )}
                          <td className="border p-2">{row.profiles?.full_name ?? "—"}</td>
                          <td className="border p-2 text-slate-600">
                            {row.note ?? (detail?.temperature_abnormal || detail?.humidity_abnormal ? "Ngoài ngưỡng" : "Đạt")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {records.length > 8 ? (
                <p className="border-t p-3 text-center text-xs font-semibold text-slate-500 bg-slate-50">
                  Còn {records.length - 8} bản ghi trong file xuất đầy đủ
                </p>
              ) : null}

              {/* Chữ ký số 2 cấp theo chuẩn ISO 15189 */}
              <div className="p-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-800">
                <div className="space-y-12">
                  <p className="font-bold uppercase">Người theo dõi / KTV</p>
                  <p className="text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="space-y-12">
                  <p className="font-bold uppercase">Trưởng khoa / Phụ trách duyệt</p>
                  <p className="text-slate-500 italic">(Ký điện tử &amp; đóng dấu)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="Chưa có kỳ APPROVED phù hợp"
                description="Chọn kỳ hoặc biểu mẫu khác. Hệ thống không tạo dữ liệu giả để preview."
              />
            </div>
          )}
        </section>

        {/* Thanh tác vụ xuất file */}
        <section className="no-print rounded-3xl border border-teal-100 bg-white p-4 shadow-lg md:sticky md:bottom-4">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-slate-600">
            <Printer className="size-4 text-teal-700" />
            Hỗ trợ Excel (.xlsx), CSV, PDF và in trực tiếp theo chuẩn ISO
          </p>
          <div className="phone-action-stack grid grid-cols-2 gap-2 sm:grid-cols-4">
            {selected ? (
              <>
                <a
                  href={`/api/reports/${selected.id}/xlsx?${exportQuery}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-3 text-xs font-bold text-white transition shadow-sm"
                >
                  <Download className="size-4" />
                  Excel (.xlsx)
                </a>
                <a
                  href={`/api/reports/${selected.id}/pdf?${exportQuery}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-3 text-xs font-bold text-white transition shadow-sm"
                >
                  <FileText className="size-4" />
                  Tải PDF
                </a>
                <a
                  href={`/api/reports/${selected.id}/csv?${exportQuery}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 transition"
                >
                  CSV
                </a>
              </>
            ) : (
              <p className="col-span-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 sm:col-span-3">
                Chọn kỳ APPROVED để bật các nút tải file.
              </p>
            )}
            <PrintButton disabled={!selected} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            File chính thức lấy bản ghi hiệu lực thuộc kỳ APPROVED và đúng ngày/ca đã chọn.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

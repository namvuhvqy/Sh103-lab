import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { getExportWorkspace } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { PrintButton } from "@/components/p5/PrintButton";
import {
  CalendarDays,
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { template?: string; year?: string; month?: string; day?: string; shift?: string; period?: string };

type MeasurementDetail = {
  temperature_c: number | null;
  humidity_pct: number | null;
  temperature_abnormal: boolean;
  humidity_abnormal: boolean;
};

type DecontaminationDetail = {
  daily_done: boolean;
  weekly_done: boolean;
  spill_event_done: boolean;
};

type MaintenanceDetail = {
  cadence: string | null;
  result: string | null;
};

type EquipmentShiftDetail = {
  equipment_shift_statuses: {
    status_code: string | null;
    asset_label_snapshot: string | null;
  } | null;
};

type PreviewRecord = {
  id: string;
  business_date: string;
  slot_code: string | null;
  performed_at: string | null;
  is_na: boolean;
  na_reason: string | null;
  note: string | null;
  profiles: { full_name: string } | null;
  measurement_details: MeasurementDetail[] | MeasurementDetail | null;
  decontamination_details: DecontaminationDetail[] | DecontaminationDetail | null;
  maintenance_details: MaintenanceDetail[] | MaintenanceDetail | null;
  equipment_shift_details: EquipmentShiftDetail[] | EquipmentShiftDetail | null;
};

function firstItem<T>(val: T[] | T | null): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] ?? null : val;
}

function timeLabel(value: string | null, slot: string | null) {
  if (value) {
    return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  }
  return slot ? slot.replace("SHIFT_", "Ca ") : "—";
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
  const currentNow = new Date();
  const todayDay = String(currentNow.getDate()).padStart(2, "0");
  const todayMonth = String(currentNow.getMonth() + 1).padStart(2, "0");
  const todayYear = String(currentNow.getFullYear());

  const tCode = workspace.templateCode ?? "BM.01/QL.HTAT.01";
  const isApproved = selected?.status === "APPROVED";

  const query = new URLSearchParams({
    year: workspace.year,
    month: workspace.month,
    day: workspace.day,
    shift: workspace.shift,
  });
  if (workspace.templateCode) query.set("template", tCode);
  if (selected) query.set("period", selected.id);

  const exportQuery = new URLSearchParams({ start: workspace.start, end: workspace.end });
  if (workspace.shift !== "ALL") exportQuery.set("shift", workspace.shift);
  if (!isApproved) exportQuery.set("draft", "true");

  // URL cho các nút bấm nhanh ngày (xóa bỏ param period cũ để tự tìm kỳ theo ngày/tháng mới)
  const todayParams = new URLSearchParams(query);
  todayParams.set("year", todayYear);
  todayParams.set("month", todayMonth);
  todayParams.set("day", todayDay);
  todayParams.delete("period");

  const allMonthParams = new URLSearchParams(query);
  allMonthParams.delete("day");
  allMonthParams.delete("period");

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
            <X className="size-5" />
          </Link>
        </section>

        {/* Kỳ báo cáo cần xuất - Đầy đủ bộ lọc Tháng, Năm, Ngày, Ca */}
        <form action="/reports/export" method="GET" className="clinical-card p-5" aria-label="Kỳ báo cáo cần xuất">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Kỳ báo cáo cần xuất</h2>
          </div>
          <input type="hidden" name="template" value={tCode} />
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

          {/* Hàng nút thao tác bộ lọc theo đúng Mockup M06b */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 text-xs font-bold text-white transition shadow-xs"
            >
              Áp dụng kỳ
            </button>
            <Link
              href={`/reports/export?${todayParams}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 px-3.5 text-xs font-bold text-teal-800 transition"
            >
              📅 Hôm nay
            </Link>
            <Link
              href={`/reports/export?${allMonthParams}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 text-xs font-bold text-slate-700 transition"
            >
              📅 Cả tháng
            </Link>
          </div>
        </form>

        {/* Số bản ghi thực tế phù hợp */}
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-3.5 text-sm text-slate-800">
          <FileSpreadsheet className="size-5 shrink-0 text-teal-700" />
          <p>
            Dữ liệu thực tế từ hệ thống:{" "}
            <b className="text-teal-900 font-black">{records.length} bản ghi</b> phù hợp kỳ đã chọn.
          </p>
        </div>

        {/* Danh sách 6 biểu mẫu đầu ra theo danh mục ISO 15189 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Chọn 1 trong 6 biểu mẫu đầu ra</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspace.templates.map((item) => {
              const code = item.form_templates.code;
              const active = code === tCode;
              const next = new URLSearchParams(query);
              next.set("template", code);
              next.delete("period");

              // Mã nhóm biểu mẫu theo Mockup (HTAT, KNBM, TRTB)
              const kindBadge = code.includes("HTAT") ? "HTAT" : code.includes("KNBM") ? "KNBM" : "TRTB";

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
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 uppercase">
                        {kindBadge}
                      </span>
                      {active ? (
                        <Check className="size-5 rounded-full bg-teal-700 p-1 text-white" />
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-black text-teal-800">{code}</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-slate-900">
                    {item.form_templates.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bộ chọn Đối tượng / Khu vực khi biểu mẫu có nhiều sổ kỳ */}
        {workspace.periods.length > 1 ? (
          <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-xs" aria-label="Bộ chọn đối tượng sổ kỳ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
              <p className="text-xs font-black text-teal-900 uppercase tracking-wider">
                Chọn khu vực / đối tượng theo dõi ({workspace.periods.length} sổ kỳ)
              </p>
              <span className="text-[11px] text-teal-700 font-semibold">
                Đang xem: <b>{selected?.locations?.name ?? selected?.assets?.source_name ?? "Toàn khoa"}</b>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {workspace.periods.map((p) => {
                const isCurrent = p.id === selected?.id;
                const nextP = new URLSearchParams(query);
                nextP.set("template", tCode);
                nextP.set("period", p.id);
                const label = p.locations?.name ?? p.assets?.source_name ?? p.period_label ?? `${p.period_start} – ${p.period_end}`;
                const pApproved = p.status === "APPROVED";

                return (
                  <Link
                    key={p.id}
                    href={`/reports/export?${nextP}`}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                      isCurrent
                        ? "bg-teal-700 text-white ring-2 ring-teal-500"
                        : "bg-white border border-slate-200 text-slate-800 hover:border-teal-300 hover:bg-teal-50/30"
                    }`}
                  >
                    {isCurrent ? <Check className="size-3.5" /> : null}
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        isCurrent
                          ? pApproved
                            ? "bg-teal-800 text-teal-100"
                            : "bg-amber-800 text-amber-100"
                          : pApproved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {pApproved ? "✓ Đã duyệt" : "Bản nháp"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Xem trước mẫu in chuẩn Bệnh viện Quân y 103 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="size-5 text-teal-700" />
            <h2 className="clinical-section-title">Xem trước — dữ liệu thực tế sẽ điền vào biểu mẫu</h2>
          </div>
          {selected ? (
            <div className="print-sheet clinical-card relative overflow-hidden bg-white shadow-sm border border-slate-200">
              {/* Cảnh báo bản nháp nếu kỳ chưa duyệt */}
              {!isApproved ? (
                <div className="no-print bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs font-bold text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                    <span>Bản nháp — Kỳ chưa phê duyệt chính thức ({selected.status}). File xuất sẽ gắn nhãn bản nháp.</span>
                  </div>
                  <Link href="/approvals" className="underline hover:text-amber-950">
                    Duyệt tại P4 →
                  </Link>
                </div>
              ) : null}

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
                    <span>Đối tượng: <b>{selected.locations?.name ?? selected.assets?.source_name ?? "Toàn khoa"}</b></span>
                    <span>•</span>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="size-3.5" />
                        Trạng thái: ĐÃ PHÊ DUYỆT (APPROVED)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <AlertTriangle className="size-3.5" />
                        Trạng thái: BẢN NHÁP (DRAFT)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bảng dữ liệu preview theo từng biểu mẫu */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700">
                    {tCode.includes("BM.01/QL.HTAT") ? (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Thời gian</th>
                        <th className="border p-2.5 font-bold">Nhiệt độ (°C)</th>
                        <th className="border p-2.5 font-bold">Độ ẩm (%)</th>
                        <th className="border p-2.5 font-bold">Khu vực</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    ) : tCode.includes("BM.02/QL.HTAT") || tCode.includes("BM.03/QL.HTAT") ? (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Thời gian</th>
                        <th className="border p-2.5 font-bold">Tủ lưu trữ</th>
                        <th className="border p-2.5 font-bold">Nhiệt độ (°C)</th>
                        <th className="border p-2.5 font-bold">Đánh giá ngưỡng</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    ) : tCode.includes("BM.01_KNBM") || tCode.includes("KNBM") ? (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Ngày</th>
                        <th className="border p-2.5 font-bold">Khu vực</th>
                        <th className="border p-2.5 font-bold">Hằng ngày</th>
                        <th className="border p-2.5 font-bold">Hằng tuần</th>
                        <th className="border p-2.5 font-bold">Xử lý tràn đổ</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    ) : tCode.includes("BM.02/QL.TRTB") ? (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Ngày</th>
                        <th className="border p-2.5 font-bold">Trang thiết bị</th>
                        <th className="border p-2.5 font-bold">Chu kỳ bảo dưỡng</th>
                        <th className="border p-2.5 font-bold">Kết quả</th>
                        <th className="border p-2.5 font-bold">Người thực hiện</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    ) : tCode.includes("BM.06") ? (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Trang thiết bị</th>
                        <th className="border p-2.5 font-bold">Ca trực</th>
                        <th className="border p-2.5 font-bold">Trạng thái (BT/KSD/H)</th>
                        <th className="border p-2.5 font-bold">Người trực ca</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="border p-2.5 font-bold">STT</th>
                        <th className="border p-2.5 font-bold">Ngày</th>
                        <th className="border p-2.5 font-bold">Ca / Giờ</th>
                        <th className="border p-2.5 font-bold">Người ghi</th>
                        <th className="border p-2.5 font-bold">Ghi chú</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {records.slice(0, 10).map((row, index) => {
                      const m = firstItem(row.measurement_details);
                      const d = firstItem(row.decontamination_details);
                      const maint = firstItem(row.maintenance_details);
                      const s = firstItem(row.equipment_shift_details)?.equipment_shift_statuses;

                      if (tCode.includes("BM.01/QL.HTAT")) {
                        return (
                          <tr key={row.id} className="text-center hover:bg-slate-50">
                            <td className="border p-2 font-medium">{index + 1}</td>
                            <td className="border p-2">{timeLabel(row.performed_at, row.slot_code)}</td>
                            <td className="border p-2 font-bold">{m?.temperature_c ?? "—"}</td>
                            <td className="border p-2 font-bold">{m?.humidity_pct ?? "—"}</td>
                            <td className="border p-2 text-slate-700">{selected.locations?.name ?? "Khu vực xét nghiệm"}</td>
                            <td className="border p-2 text-slate-600">
                              {row.note ?? (m?.temperature_abnormal || m?.humidity_abnormal ? "Ngoài ngưỡng" : "Đạt")}
                            </td>
                          </tr>
                        );
                      }

                      if (tCode.includes("BM.02/QL.HTAT") || tCode.includes("BM.03/QL.HTAT")) {
                        return (
                          <tr key={row.id} className="text-center hover:bg-slate-50">
                            <td className="border p-2 font-medium">{index + 1}</td>
                            <td className="border p-2">{timeLabel(row.performed_at, row.slot_code)}</td>
                            <td className="border p-2 text-slate-700">{selected.assets?.source_name ?? "Tủ lạnh"}</td>
                            <td className="border p-2 font-bold">{m?.temperature_c ?? "—"}</td>
                            <td className="border p-2 text-slate-600">
                              {m?.temperature_abnormal ? "Ngoài ngưỡng" : "Đạt dải chuẩn"}
                            </td>
                            <td className="border p-2 text-slate-600">{row.note ?? "Bình thường"}</td>
                          </tr>
                        );
                      }

                      if (tCode.includes("BM.01_KNBM") || tCode.includes("KNBM")) {
                        return (
                          <tr key={row.id} className="text-center hover:bg-slate-50">
                            <td className="border p-2 font-medium">{index + 1}</td>
                            <td className="border p-2">{row.business_date}</td>
                            <td className="border p-2 text-slate-700">{selected.locations?.name ?? "PXN"}</td>
                            <td className="border p-2 font-semibold">{d?.daily_done ? "Đã lau" : "—"}</td>
                            <td className="border p-2 font-semibold">{d?.weekly_done ? "Đã lau" : "—"}</td>
                            <td className="border p-2">{d?.spill_event_done ? "Có xử lý" : "Không"}</td>
                            <td className="border p-2 text-slate-600">{row.note ?? "Hoàn thành"}</td>
                          </tr>
                        );
                      }

                      if (tCode.includes("BM.02/QL.TRTB")) {
                        return (
                          <tr key={row.id} className="text-center hover:bg-slate-50">
                            <td className="border p-2 font-medium">{index + 1}</td>
                            <td className="border p-2">{row.business_date}</td>
                            <td className="border p-2 text-slate-700">{selected.assets?.source_name ?? "Máy xét nghiệm"}</td>
                            <td className="border p-2">{maint?.cadence ?? "Hằng ngày"}</td>
                            <td className="border p-2 font-bold text-emerald-700">{maint?.result ?? "ĐẠT"}</td>
                            <td className="border p-2">{row.profiles?.full_name ?? "KTV"}</td>
                            <td className="border p-2 text-slate-600">{row.note ?? "Đạt chuẩn"}</td>
                          </tr>
                        );
                      }

                      if (tCode.includes("BM.06")) {
                        const statusColor = s?.status_code === "H" ? "text-rose-600 font-bold" : s?.status_code === "KSD" ? "text-slate-500" : "text-emerald-700 font-bold";
                        return (
                          <tr key={row.id} className="text-center hover:bg-slate-50">
                            <td className="border p-2 font-medium">{index + 1}</td>
                            <td className="border p-2 text-slate-800 font-bold">{s?.asset_label_snapshot ?? selected.assets?.source_name ?? "Máy xét nghiệm"}</td>
                            <td className="border p-2">{row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "Ca 1"}</td>
                            <td className={`border p-2 ${statusColor}`}>{s?.status_code ?? "BT"}</td>
                            <td className="border p-2">{row.profiles?.full_name ?? "KTV trực"}</td>
                            <td className="border p-2 text-slate-600">{row.note ?? "Vận hành ổn định"}</td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id} className="text-center hover:bg-slate-50">
                          <td className="border p-2 font-medium">{index + 1}</td>
                          <td className="border p-2">{row.business_date}</td>
                          <td className="border p-2">{timeLabel(row.performed_at, row.slot_code)}</td>
                          <td className="border p-2">{row.profiles?.full_name ?? "—"}</td>
                          <td className="border p-2 text-slate-600">{row.note ?? "Đạt"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {records.length > 10 ? (
                <p className="border-t p-3 text-center text-xs font-semibold text-slate-500 bg-slate-50">
                  Hiển thị 10/{records.length} bản ghi xem trước. File xuất đầy đủ sẽ có toàn bộ {records.length} dòng.
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
                  <p className="text-slate-500 italic">
                    {isApproved ? "(Đã ký số & đóng dấu điện tử)" : "(Chờ ký duyệt)"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState
                title="Chưa có dữ liệu cho biểu mẫu này"
                description="Không tìm thấy bản ghi phù hợp kỳ đã chọn. Hãy chọn kỳ khác."
              />
            </div>
          )}
        </section>

        {/* Thanh tác vụ xuất file theo đúng Mockup M06b */}
        <section className="no-print rounded-3xl border border-teal-100 bg-white p-4 shadow-lg md:sticky md:bottom-4">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-slate-600">
            <Printer className="size-4 text-teal-700" />
            Hỗ trợ In trực tiếp, Excel (.csv) và PDF
          </p>

          <div className="phone-action-stack grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Nút 1: Tải Excel (.csv) theo Mockup */}
            {selected ? (
              <div className="flex gap-1.5">
                <a
                  href={`/api/reports/${selected.id}/xlsx?${exportQuery}`}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-3 text-xs font-bold text-white transition shadow-sm"
                  title="Tải bảng tính Excel (.xlsx) chuẩn danh mục"
                >
                  <Download className="size-4" />
                  Tải Excel (.xlsx)
                </a>
                <a
                  href={`/api/reports/${selected.id}/csv?${exportQuery}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 transition"
                  title="Tải file CSV phân tích"
                >
                  CSV
                </a>
              </div>
            ) : (
              <button
                disabled
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-400 cursor-not-allowed"
              >
                Tải Excel (.csv)
              </button>
            )}

            {/* Nút 2: In phiếu / Lưu PDF theo Mockup */}
            {selected ? (
              <div className="flex gap-1.5">
                <PrintButton />
                <a
                  href={`/api/reports/${selected.id}/pdf?${exportQuery}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-800 hover:bg-blue-100 transition shadow-xs"
                  title="Tải trực tiếp file PDF"
                >
                  <FileText className="size-4" />
                  PDF
                </a>
              </div>
            ) : (
              <button
                disabled
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-400 cursor-not-allowed"
              >
                In phiếu / Lưu PDF
              </button>
            )}

            {/* Nút 3: Đóng theo Mockup */}
            <Link
              href="/reports"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 text-xs font-bold text-slate-700 transition"
            >
              Đóng
            </Link>
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Dữ liệu xuất được trích xuất theo đúng danh mục biểu mẫu của Khoa Sinh hóa · Bệnh viện Quân y 103.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

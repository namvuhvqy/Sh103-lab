import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { getExportWorkspace } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { buildReportExportModel, SIGNATURE_CONFIG, type ReportPeriod, type ReportRecord } from "@/lib/p5/report-export-model";
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Download, Eye, FileSpreadsheet, X } from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { template?: string; year?: string; month?: string; day?: string; shift?: string; period?: string; page?: string };

const showDayShiftFilters = (code: string) => code.includes("BM.06");
const displayCell = (value: string | number | null) => value ?? "";

function periodStatusLabel(status?: string | null) {
  return status === "APPROVED" ? "Đã có xác nhận lịch sử" : "Đang theo dõi / chưa xác nhận lịch sử";
}

export default async function ExportWorkspacePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const [workspace, unread] = await Promise.all([
    getExportWorkspace({ templateCode: params.template, year: params.year, month: params.month, day: params.day, shift: params.shift, periodId: params.period }),
    getUnreadNotificationCount(),
  ]);

  const selected = workspace.selectedPeriod;
  const tCode = workspace.templateCode ?? "BM.01/QL.HTAT.01";
  const model = selected
    ? buildReportExportModel({
        period: selected as unknown as ReportPeriod,
        records: workspace.records as unknown as ReportRecord[],
        start: workspace.start,
        official: selected.status === "APPROVED",
      })
    : null;

  const isBm06 = tCode.includes("BM.06");
  const pageCount = isBm06 && model ? Math.max(...model.rows.map((row) => row.pageNumber), 1) : 1;
  const currentPage = Math.min(Math.max(Number(params.page ?? "1") || 1, 1), pageCount);
  const visibleRows = model?.rows.filter((row) => row.pageNumber === currentPage) ?? [];
  const query = new URLSearchParams({ year: workspace.year, month: workspace.month });
  if (workspace.templateCode) query.set("template", tCode);
  if (workspace.day) query.set("day", workspace.day);
  if (workspace.shift !== "ALL") query.set("shift", workspace.shift);
  if (selected) query.set("period", selected.id);

  const exportQuery = new URLSearchParams({ start: workspace.start, end: workspace.end });
  if (workspace.shift !== "ALL") exportQuery.set("shift", workspace.shift);
  const filterNeedsDayShift = showDayShiftFilters(tCode);

  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/reports/export?${next}`;
  };

  return (
    <AppShell headerTitle="Xuất biểu mẫu" headerSubtitle="Preview & Excel (.xlsx)" unreadCount={unread}>
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="flex items-start justify-between gap-3 rounded-3xl border border-teal-100 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <HospitalLogo size="md" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">KHOA SINH HÓA · BV 103</p>
              <h1 className="clinical-page-title mt-0.5 text-2xl font-black text-slate-900">Preview & xuất Excel</h1>
              <p className="text-xs text-slate-500">Chọn biểu mẫu → chọn thời gian/khu vực → Preview → Excel (.xlsx)</p>
            </div>
          </div>
          <Link href="/reports" className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100" aria-label="Đóng"><X className="size-5" /></Link>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2"><FileSpreadsheet className="size-5 text-teal-700" /><h2 className="clinical-section-title">6 biểu mẫu đầu ra</h2></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {workspace.templates.map((item) => {
              const code = item.form_templates.code;
              const active = code === tCode;
              const next = new URLSearchParams({ year: workspace.year, month: workspace.month, template: code });
              return <Link key={item.id} href={`/reports/export?${next}`} className={`shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-black transition ${active ? "border-teal-600 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"}`}><span className="mr-1">{active ? "✓" : ""}</span>{code}</Link>;
            })}
          </div>
        </section>

        <form action="/reports/export" method="GET" className="clinical-card p-5" aria-label="Bộ lọc preview Excel">
          <div className="flex items-center gap-2"><CalendarDays className="size-5 text-teal-700" /><h2 className="clinical-section-title">Thời gian và đối tượng</h2></div>
          <input type="hidden" name="template" value={tCode} />
          {selected ? <input type="hidden" name="period" value={selected.id} /> : null}
          <div className={`mt-4 grid grid-cols-2 gap-2 ${filterNeedsDayShift ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">Tháng<select name="month" defaultValue={workspace.month} className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}</select></label>
            <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">Năm<select name="year" defaultValue={workspace.year} className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none">{Array.from({ length: 5 }, (_, i) => Number(workspace.year) - i).map((year) => <option key={year}>{year}</option>)}</select></label>
            {filterNeedsDayShift ? <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">Ngày<select name="day" defaultValue={workspace.day} className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"><option value="">Cả tháng</option>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}</select></label> : null}
            {filterNeedsDayShift ? <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">Ca<select name="shift" defaultValue={workspace.shift} className="mt-1 block w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"><option value="ALL">Cả ngày</option><option value="SHIFT_1">Ca 1</option><option value="SHIFT_2">Ca 2</option><option value="SHIFT_3">Ca 3</option><option value="SHIFT_4">Ca 4</option></select></label> : null}
          </div>
          <button type="submit" className="mt-3.5 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-teal-800">Preview</button>
        </form>

        {workspace.periods.length > 0 ? <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-xs" aria-label="Bộ chọn đối tượng">
          <p className="mb-2.5 text-xs font-black uppercase tracking-wider text-teal-900">Khu vực / đối tượng ({workspace.periods.length})</p>
          <div className="flex flex-wrap gap-2">{workspace.periods.map((p) => { const nextP = new URLSearchParams(query); nextP.set("period", p.id); nextP.delete("page"); const label = p.locations?.name ?? p.assets?.source_name ?? p.period_label ?? `${p.period_start} – ${p.period_end}`; return <Link key={p.id} href={`/reports/export?${nextP}`} className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs transition ${p.id === selected?.id ? "bg-teal-700 text-white ring-2 ring-teal-500" : "border border-slate-200 bg-white text-slate-800 hover:border-teal-300"}`}>{p.id === selected?.id ? <Check className="size-3.5" /> : null}<span>{label}</span></Link>; })}</div>
        </section> : null}

        <section>
          <div className="mb-3 flex items-center gap-2"><Eye className="size-5 text-teal-700" /><h2 className="clinical-section-title">Preview — cùng dữ liệu/quy tắc với Excel</h2></div>
          {model && selected ? <div className="clinical-card overflow-hidden bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-row justify-between gap-3 border-b border-slate-200 pb-3 text-xs"><div><p className="font-bold uppercase text-slate-900">BỆNH VIỆN QUÂN Y 103</p><p className="font-bold uppercase text-slate-900">BỘ MÔN KHOA SINH HÓA</p></div><div className="text-right"><p className="font-bold uppercase text-slate-900">{model.templateCode}</p><p className="text-slate-600">Phiên bản: {model.period.form_template_versions.version_label}</p></div></div>
              <div className="mt-4 text-center"><span className="inline-block rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-800">{model.templateCode}</span><h3 className="mt-2 text-lg font-black uppercase text-slate-950 sm:text-xl">{model.templateName}</h3><div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600"><span>Đối tượng: <b>{model.objectLabel}</b></span><span>•</span><span className={model.isApproved ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>{periodStatusLabel(selected.status)}</span></div></div>
              {!model.isApproved ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900"><AlertTriangle className="mr-1 inline size-4" />Preview/XLSX khả dụng dù kỳ chưa có xác nhận lịch sử; ô thiếu dữ liệu được để trống.</div> : null}
            </div>
            {isBm06 ? <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-700"><Link aria-disabled className="pointer-events-none inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 opacity-40" href={pageHref(1)}><ChevronLeft className="size-4" />Trang trước</Link><span>Trang 1 / 1</span><Link aria-disabled className="pointer-events-none inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 opacity-40" href={pageHref(1)}>Trang sau<ChevronRight className="size-4" /></Link></div> : null}
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-xs"><thead className="bg-slate-50 text-slate-700"><tr>{model.columns.map((column) => <th key={column} className="border p-2 font-bold whitespace-nowrap">{column}</th>)}</tr></thead><tbody>{visibleRows.map((row) => <tr key={row.key} className="text-center hover:bg-slate-50">{row.cells.map((cell, index) => <td key={index} className="border p-1.5 text-slate-800">{displayCell(cell)}</td>)}</tr>)}</tbody></table></div>
            <div className="grid grid-cols-2 border-t border-slate-200 p-6 text-center text-xs text-slate-800"><div className="space-y-12"><p className="font-bold uppercase">{SIGNATURE_CONFIG.reviewerLabel}</p><p className="text-slate-500 italic">{SIGNATURE_CONFIG.reviewerHint}</p></div><div className="space-y-12"><p className="font-bold uppercase">{SIGNATURE_CONFIG.approverLabel}</p><p className="text-slate-500 italic">{model.isApproved ? SIGNATURE_CONFIG.approvedHint : SIGNATURE_CONFIG.draftHint}</p></div></div>
          </div> : <div className="mt-3"><EmptyState title="Chưa có kỳ phù hợp" description="Không tìm thấy sổ kỳ phù hợp bộ lọc. Hãy chọn biểu mẫu hoặc tháng khác." /></div>}
        </section>

        <section className="rounded-3xl border border-teal-100 bg-white p-4 shadow-lg md:sticky md:bottom-4">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-slate-600"><FileSpreadsheet className="size-4 text-teal-700" />Xuất Excel/XLSX theo cùng dữ liệu và quy tắc preview</p>
          {selected ? <a href={`/api/reports/${selected.id}/xlsx?${exportQuery}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 sm:w-auto" title="Tải bảng tính Excel (.xlsx)"><Download className="size-4" />Tải Excel (.xlsx)</a> : <button disabled className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-400">Tải Excel (.xlsx)</button>}
        </section>
      </div>
    </AppShell>
  );
}

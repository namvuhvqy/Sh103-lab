"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HospitalLogo } from "@/components/ui/HospitalLogo";
import { toggleInternalConfirmationAction } from "@/app/reports/actions";
import type { ReportExportModel } from "@/lib/p5/report-export-model";
import { BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Info,
  Layers,
  Lock,
  Printer,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";

export interface UnifiedPeriod {
  id: string;
  period_label: string | null;
  period_start: string;
  period_end: string;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  locations: { name: string } | null;
  assets: { source_name: string } | null;
  form_template_versions: {
    version_label: string;
    form_templates: { code: string; name: string };
  };
  record_count?: number;
}

export interface ReportsUnifiedViewProps {
  periods: UnifiedPeriod[];
  templates: Array<{
    id: string;
    version_label: string;
    form_templates: { code: string; name: string; form_kind: string };
  }>;
  workspace: {
    year: string;
    month: string;
    day: string;
    shift: string;
    templateCode: string;
    selectedPeriod: UnifiedPeriod | null;
    periods: UnifiedPeriod[];
  };
  model: ReportExportModel | null;
  access: {
    userId: string;
    role: string;
    isAdmin: boolean;
    canApprove: boolean;
  } | null;
  initialTab?: "overview" | "forms";
}

const TEMPLATE_ICONS: Record<string, typeof Thermometer> = {
  "BM.01/QL.HTAT": Thermometer,
  "BM.02/QL.HTAT": Thermometer,
  "BM.03/QL.HTAT": Thermometer,
  "BM.01_KNBM": Sparkles,
  "BM.02/QL.TRTB": Wrench,
  "BM.06/QL.TRTB": Layers,
};

function getTemplateIcon(code: string) {
  for (const [prefix, Icon] of Object.entries(TEMPLATE_ICONS)) {
    if (code.includes(prefix)) return Icon;
  }
  return FileText;
}

export function ReportsUnifiedView({
  periods,
  templates,
  workspace,
  model,
  access,
  initialTab = "overview",
}: ReportsUnifiedViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "forms">(initialTab);
  const [isPending, startTransition] = useTransition();
  const [confirmStatus, setConfirmStatus] = useState<boolean>(
    workspace.selectedPeriod?.status === "APPROVED"
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync confirm status with selectedPeriod
  useEffect(() => {
    setConfirmStatus(workspace.selectedPeriod?.status === "APPROVED");
  }, [workspace.selectedPeriod?.id, workspace.selectedPeriod?.status]);

  // BM.06 cycle & sub-page view
  const isBm06 = workspace.templateCode.includes("BM.06");
  const pageCount = isBm06 && model ? Math.max(...model.rows.map((row) => row.pageNumber), 1) : 1;
  const [bm06Page, setBm06Page] = useState<number>(1);
  const [bm06SubView, setBm06SubView] = useState<"t1" | "t2" | "both">("t1");

  const canConfirm = Boolean(access?.isAdmin || access?.canApprove);
  const selectedPeriod = workspace.selectedPeriod;
  const currentTemplateCode = workspace.templateCode;

  // KPI Calculations
  const totalPeriods = periods.length;
  const confirmedCount = periods.filter((p) => p.status === "APPROVED").length;
  const inProgressCount = totalPeriods - confirmedCount;
  const percentConfirmed = totalPeriods > 0 ? Math.round((confirmedCount / totalPeriods) * 100) : 0;

  // Group periods by template
  const templateSummaries = templates.map((t) => {
    const code = t.form_templates.code;
    const matching = periods.filter((p) => p.form_template_versions.form_templates.code === code);
    const confirmed = matching.filter((p) => p.status === "APPROVED").length;
    return {
      code,
      name: t.form_templates.name,
      total: matching.length,
      confirmed,
      percent: matching.length > 0 ? Math.round((confirmed / matching.length) * 100) : 0,
    };
  });

  // Switch Tab without full-page navigation
  const handleTabSwitch = (tab: "overview" | "forms") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Switch Month
  const handleSelectMonth = (month: string, year: string = workspace.year) => {
    router.push(
      `/reports?tab=forms&template=${encodeURIComponent(currentTemplateCode)}&year=${year}&month=${month}`
    );
  };

  // Switch Template and navigate to Tab B
  const handleSelectTemplate = (templateCode: string) => {
    setActiveTab("forms");
    router.push(
      `/reports?tab=forms&template=${encodeURIComponent(templateCode)}&year=${workspace.year}&month=${workspace.month}`
    );
  };

  // Toggle Internal Confirmation
  const handleToggleConfirm = async () => {
    if (!canConfirm || !selectedPeriod) return;
    const nextVal = !confirmStatus;
    setConfirmStatus(nextVal);
    setStatusMessage(null);

    startTransition(async () => {
      const res = await toggleInternalConfirmationAction(selectedPeriod.id, nextVal);
      if (!res.ok) {
        setConfirmStatus(!nextVal); // Rollback
        setStatusMessage(res.message ?? "Lỗi cập nhật xác nhận");
      } else {
        setStatusMessage(nextVal ? "Đã ghi nhận xác nhận nội bộ của Chỉ huy BMK." : "Đã hủy xác nhận nội bộ.");
        router.refresh();
      }
    });
  };

  const visibleRows = isBm06 && model
    ? model.rows.filter((row) => row.pageNumber === bm06Page)
    : (model?.rows ?? []);

  const exportUrl = selectedPeriod
    ? `/api/reports/${selectedPeriod.id}/xlsx${isBm06 ? `?cycle=${bm06Page}` : ""}`
    : "#";

  // Devices for BM06
  const bm06Page1Devices = BM06_TEMPLATE_PAGES[0].devices;
  const bm06Page2Devices = BM06_TEMPLATE_PAGES[1].devices;

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-teal-100 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <HospitalLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-800">
                ISO 15189:2022
              </span>
              <span className="text-xs font-semibold text-slate-500">Bộ môn - Khoa Sinh Hóa · Bệnh viện Quân y 103</span>
            </div>
            <h1 className="clinical-page-title mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Báo cáo &amp; Xuất biểu mẫu
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Tổng quan chỉ số hoạt động · Sổ kỳ theo dõi · Xem trước &amp; Xuất Excel (.xlsx) chuẩn 100%
            </p>
          </div>
        </div>

        {/* 2 INTERNAL TABS */}
        <div className="flex w-full sm:w-auto items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => handleTabSwitch("overview")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-teal-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="size-4" />
            <span>TỔNG QUAN</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("forms")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === "forms"
                ? "bg-teal-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
            }`}
          >
            <FileSpreadsheet className="size-4" />
            <span>BIỂU MẪU VÀ XUẤT</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAB A: TỔNG QUAN                                                          */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 CARD KPI TINH GỌN */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng số sổ kỳ</span>
                <ClipboardList className="size-4 text-teal-700" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{totalPeriods}</p>
              <p className="mt-1 text-[11px] font-bold text-teal-800">Theo dõi 6 biểu mẫu ISO</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Xác nhận nội bộ</span>
                <ShieldCheck className="size-4 text-emerald-700" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-800">{confirmedCount}</p>
              <p className="mt-1 text-[11px] font-bold text-emerald-700">{percentConfirmed}% đã rà soát</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Đang thực hiện</span>
                <Clock className="size-4 text-blue-700" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-blue-900">{inProgressCount}</p>
              <p className="mt-1 text-[11px] font-bold text-blue-700">Ghi nhận liên tục các ca</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Mẫu đầu ra</span>
                <FileCheck2 className="size-4 text-amber-700" />
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">100%</p>
              <p className="mt-1 text-[11px] font-bold text-amber-700">Khớp chuẩn Bệnh viện 103</p>
            </div>
          </div>

          {/* DANH THIẾP 6 BIỂU MẪU CHUẨN */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Danh mục 6 biểu mẫu chuyên môn</h2>
                <p className="text-xs text-slate-500">Bấm vào biểu mẫu để mở ngay màn hình xem trước và xuất file Excel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {templateSummaries.map((item) => {
                const Icon = getTemplateIcon(item.code);
                return (
                  <div
                    key={item.code}
                    onClick={() => handleSelectTemplate(item.code)}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition">
                          <Icon className="size-4" />
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {item.code}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-black text-slate-900 group-hover:text-teal-800 transition line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.total} sổ kỳ · {item.confirmed} đã xác nhận nội bộ
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                      <span>Mở biểu mẫu &amp; Xuất</span>
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* LỊCH SỬ CÁC KỲ GẦN ĐÂY */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="size-4 text-teal-700" />
                <h2 className="text-base font-black text-slate-900">Sổ kỳ theo dõi gần nhất</h2>
              </div>
              <span className="text-xs font-medium text-slate-500">Tự động đồng bộ từ Supabase</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 text-xs">
              {periods.slice(0, 10).map((period) => {
                const pMonth = period.period_start.slice(5, 7);
                const pYear = period.period_start.slice(0, 4);
                return (
                  <div
                    key={period.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-slate-50/80 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-teal-800">
                          {period.form_template_versions.form_templates.code}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">
                          {period.form_template_versions.form_templates.name}
                        </span>
                        {typeof period.record_count === "number" && (
                          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                            {period.record_count} bản ghi
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-slate-500">
                        {period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} · Kỳ:{" "}
                        {period.period_label ?? `${period.period_start} – ${period.period_end}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          period.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {period.status === "APPROVED" ? "Đã xác nhận nội bộ" : "Đang theo dõi"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/reports?tab=forms&template=${encodeURIComponent(
                              period.form_template_versions.form_templates.code
                            )}&period=${period.id}&year=${pYear}&month=${pMonth}`
                          );
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: BIỂU MẪU VÀ XUẤT (GỘP TOÀN BỘ SỔ KỲ, PREVIEW VÀ EXPORT)           */}
      {/* ========================================================================= */}
      {activeTab === "forms" && (
        <div className="space-y-6">
          {/* THANH CHỌN BIỂU MẪU NHANH */}
          <section className="rounded-3xl border border-teal-100 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-800">
                1. Chọn Biểu Mẫu Chuyên Môn
              </span>
              <span className="text-xs text-slate-500">6 mẫu chuẩn ISO 15189 BV103</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {templates.map((item) => {
                const code = item.form_templates.code;
                const active = code === currentTemplateCode;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      router.push(
                        `/reports?tab=forms&template=${encodeURIComponent(code)}&year=${workspace.year}&month=${workspace.month}`
                      );
                    }}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                      active
                        ? "bg-teal-800 text-white shadow-xs ring-2 ring-teal-600/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>

            {/* BỘ CHỌN THÁNG LINH HOẠT TỪ THÁNG 9/2026 TRỞ ĐI */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="size-4 text-teal-700 shrink-0" />
                <span className="font-bold text-slate-700 shrink-0">Chọn tháng theo dõi:</span>

                {/* Các nút bấm chọn nhanh */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { value: "09", year: "2026", label: "Tháng 09/2026", tag: "Mẫu ISO chuẩn" },
                    { value: "10", year: "2026", label: "Tháng 10/2026", tag: "Hiện hành" },
                    { value: "11", year: "2026", label: "Tháng 11/2026", tag: "" },
                    { value: "12", year: "2026", label: "Tháng 12/2026", tag: "" },
                  ].map((m) => {
                    const active = workspace.month === m.value && workspace.year === m.year;
                    return (
                      <button
                        key={`${m.year}-${m.value}`}
                        type="button"
                        onClick={() => handleSelectMonth(m.value, m.year)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                          active
                            ? "bg-teal-800 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {m.label} {m.tag ? `(${m.tag})` : ""}
                      </button>
                    );
                  })}
                </div>

                {/* Menu chọn tất cả các tháng bắt đầu từ Tháng 09/2026 */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-slate-500 font-medium">Tất cả tháng:</span>
                  <select
                    value={`${workspace.year}-${workspace.month}`}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split("-");
                      if (m && y) handleSelectMonth(m, y);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="2026-09">Tháng 09/2026 (Mẫu ISO chuẩn · 100% dữ liệu)</option>
                    <option value="2026-10">Tháng 10/2026 (Tháng hiện hành)</option>
                    <option value="2026-11">Tháng 11/2026</option>
                    <option value="2026-12">Tháng 12/2026</option>
                    <option value="2027-01">Tháng 01/2027</option>
                    <option value="2027-02">Tháng 02/2027</option>
                    <option value="2027-03">Tháng 03/2027</option>
                  </select>
                </div>
              </div>

              <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                Đang hiển thị: Tháng {workspace.month} / {workspace.year}
              </span>
            </div>
          </section>

          {/* THANH ĐIỀU KHIỂN KỲ & CHECKBOX XÁC NHẬN NỘI BỘ */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Thông tin kỳ đang chọn */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-black text-teal-800">
                    {currentTemplateCode}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {selectedPeriod?.form_template_versions.form_templates.name ?? "Biểu mẫu báo cáo"}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Đối tượng: <strong className="text-slate-700">{selectedPeriod?.locations?.name ?? selectedPeriod?.assets?.source_name ?? "Toàn khoa"}</strong> · Tháng {workspace.month}/{workspace.year}
                  {typeof selectedPeriod?.record_count === "number" && (
                    <span className="ml-2 rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800">
                      {selectedPeriod.record_count} bản ghi đã ghi nhận
                    </span>
                  )}
                </p>
              </div>

              {/* Nút hành động Xuất & In */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedPeriod ? (
                  <a
                    href={exportUrl}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-xs font-black text-white shadow-xs hover:bg-teal-900 transition"
                    title="Tải bảng tính Excel (.xlsx) chuẩn 100% Bệnh viện 103"
                  >
                    <Download className="size-4" />
                    Tải Excel (.xlsx) chuẩn
                  </a>
                ) : (
                  <button disabled className="min-h-11 rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-400">
                    Tải Excel (.xlsx)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  title="In trực tiếp biểu mẫu theo khổ in A4"
                >
                  <Printer className="size-4" />
                  In biểu mẫu
                </button>
              </div>
            </div>

            {/* KHU VỰC CHECKBOX XÁC NHẬN NỘI BỘ */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl">
              <div className="flex items-center gap-3">
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmStatus}
                    disabled={!canConfirm || isPending || !selectedPeriod}
                    onChange={handleToggleConfirm}
                    className="size-5 rounded-md border-slate-300 text-teal-700 focus:ring-teal-500/20 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900">
                      Đã rà soát &amp; Xác nhận nội bộ
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {!access?.userId ? (
                        <span>
                          Chưa đăng nhập. Vui lòng{" "}
                          <Link href="/login" className="font-bold text-teal-700 underline hover:text-teal-900">
                            đăng nhập
                          </Link>{" "}
                          tài khoản Chỉ huy BMK / Quản trị viên để xác nhận nội bộ.
                        </span>
                      ) : canConfirm ? (
                        "Chỉ huy BMK / Bác sĩ Admin tick xác nhận sau khi kiểm tra kỳ."
                      ) : (
                        "Tài khoản hiện tại không có quyền Chỉ huy BMK hoặc Quản trị viên."
                      )}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
                    confirmStatus
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {confirmStatus ? <CheckCircle2 className="size-3.5" /> : <Info className="size-3.5" />}
                  {confirmStatus ? "Đã xác nhận nội bộ" : "Chưa xác nhận"}
                </span>
                {statusMessage && (
                  <span className="text-[11px] font-semibold text-teal-800 animate-fade-in">
                    {statusMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Lọc kỳ con (Nếu mẫu có nhiều vị trí hoặc máy) */}
            {workspace.periods.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-bold text-slate-500 shrink-0">Chọn khu vực / máy:</span>
                {workspace.periods.map((p) => {
                  const target = p.locations?.name ?? p.assets?.source_name ?? "Toàn khoa";
                  const active = p.id === selectedPeriod?.id;
                  const countLabel = typeof p.record_count === "number" ? ` (${p.record_count})` : "";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        router.push(
                          `/reports?tab=forms&template=${encodeURIComponent(currentTemplateCode)}&period=${p.id}&year=${workspace.year}&month=${workspace.month}`
                        );
                      }}
                      className={`shrink-0 rounded-lg px-2.5 py-1 font-bold transition ${
                        active
                          ? "bg-teal-700 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {target}{countLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* KHUNG PREVIEW BIỂU MẪU MÔ PHỎNG CHUẨN GỐC BỆNH VIỆN 103 */}
          <section className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
            {/* Header In Ấn Chuẩn */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start text-xs font-black">
                <div className="text-left">
                  <p className="uppercase">BỆNH VIỆN QUÂN Y 103</p>
                  <p className="uppercase text-teal-900">BỘ MÔN - KHOA SINH HÓA</p>
                </div>
                <div className="text-right">
                  <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="text-[10px] font-bold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
                  <p className="mt-1 text-[10px] text-teal-800">Mã hiệu: {currentTemplateCode}</p>
                </div>
              </div>

              <div className="text-center mt-3">
                <h3 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wide">
                  {selectedPeriod?.form_template_versions.form_templates.name ?? "PHIẾU THEO DÕI"}
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Thời gian: Tháng {workspace.month} Năm {workspace.year}
                  {selectedPeriod?.locations?.name ? ` — Khu vực: ${selectedPeriod.locations.name}` : ""}
                  {selectedPeriod?.assets?.source_name ? ` — Thiết bị: ${selectedPeriod.assets.source_name}` : ""}
                </p>
              </div>
            </div>

            {/* ĐIỀU KHIỂN RIÊNG CHO BM.06: CHU KỲ 3 NGÀY & TÁCH TRANG 1 / TRANG 2 */}
            {isBm06 && pageCount > 1 && (
              <div className="mb-4 space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                {/* 10 Đợt chu kỳ 3 ngày */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                    Chu kỳ 3 ngày / đợt (Tháng {workspace.month}):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: pageCount }, (_, idx) => {
                      const cNum = idx + 1;
                      const active = cNum === bm06Page;
                      const startDay = (cNum - 1) * 3 + 1;
                      const endDay = Math.min(cNum * 3, 30);
                      return (
                        <button
                          key={cNum}
                          type="button"
                          onClick={() => setBm06Page(cNum)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                            active
                              ? "bg-teal-800 text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          Đợt {cNum} ({startDay}–{endDay})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chế độ xem Trang 1 / Trang 2 / Bản gộp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-600">
                    Định dạng trang theo cặp ISO 15189:
                  </span>
                  <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setBm06SubView("t1")}
                      className={`px-3 py-1 rounded-lg font-black transition ${
                        bm06SubView === "t1"
                          ? "bg-teal-700 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Trang 1: Máy 1–10 (Arch-2, Alinity, Maglumi...)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBm06SubView("t2")}
                      className={`px-3 py-1 rounded-lg font-black transition ${
                        bm06SubView === "t2"
                          ? "bg-teal-700 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Trang 2: Máy 11–20 (Hb1, Gem, LabUMat...) &amp; Ghi chú
                    </button>
                    <button
                      type="button"
                      onClick={() => setBm06SubView("both")}
                      className={`px-3 py-1 rounded-lg font-black transition ${
                        bm06SubView === "both"
                          ? "bg-teal-700 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Bản gộp 20 máy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* RENDER BẢNG PREVIEW THEO TỪNG MẪU CHUẨN                       */}
            {/* ============================================================= */}
            {model && visibleRows.length > 0 ? (
              <div className="overflow-x-auto">
                {/* 1. MẪU BM.01: NHIỆT ĐỘ, ĐỘ ẨM PXN */}
                {currentTemplateCode.includes("BM.01/QL.HTAT") ? (
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black text-center">
                        <th rowSpan={2} className="border border-slate-900 px-2 py-2 w-14">Ngày</th>
                        <th colSpan={2} className="border border-slate-900 px-2 py-1">Giờ kiểm tra</th>
                        <th colSpan={2} className="border border-slate-900 px-2 py-1">Nhiệt độ phòng (18 - 26°C)</th>
                        <th colSpan={2} className="border border-slate-900 px-2 py-1">Độ ẩm phòng (40 - 70%)</th>
                        <th rowSpan={2} className="border border-slate-900 px-2 py-2">Ghi chú</th>
                        <th rowSpan={2} className="border border-slate-900 px-2 py-2 w-44">Người thực hiện</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-900 font-bold text-center text-[11px]">
                        <th className="border border-slate-900 px-2 py-1">Sáng</th>
                        <th className="border border-slate-900 px-2 py-1">Chiều</th>
                        <th className="border border-slate-900 px-2 py-1">Sáng</th>
                        <th className="border border-slate-900 px-2 py-1">Chiều</th>
                        <th className="border border-slate-900 px-2 py-1">Sáng</th>
                        <th className="border border-slate-900 px-2 py-1">Chiều</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, rIdx) => {
                        const [day, timeM, timeA, tempM, tempA, humM, humA, note, performer] = row.cells;
                        return (
                          <tr key={row.key ?? rIdx} className="hover:bg-slate-50 transition">
                            <td className="border border-slate-900 px-2 py-1 text-center font-bold">{day}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{timeM ? String(timeM) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{timeA ? String(timeA) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{tempM !== null && tempM !== undefined ? String(tempM) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{tempA !== null && tempA !== undefined ? String(tempA) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{humM !== null && humM !== undefined ? String(humM) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center">{humA !== null && humA !== undefined ? String(humA) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1">{note ? String(note) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 font-medium">{performer ? String(performer) : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : currentTemplateCode.includes("BM.01_KNBM") || currentTemplateCode.includes("KNBM") ? (
                  /* 2. MẪU BM.01_KNBM: KHỬ NHIỄM BỀ MẶT */
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black text-center">
                        <th className="border border-slate-900 px-2 py-2 w-14">Ngày</th>
                        <th className="border border-slate-900 px-2 py-2">Hằng ngày (Bàn XN)</th>
                        <th className="border border-slate-900 px-2 py-2">Hằng tuần (Sàn/tường...)</th>
                        <th className="border border-slate-900 px-2 py-2">Khi có tràn đổ</th>
                        <th className="border border-slate-900 px-2 py-2">Ghi chú</th>
                        <th className="border border-slate-900 px-2 py-2 w-44">Người thực hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, rIdx) => {
                        const [day, daily, weekly, spill, note, performer] = row.cells;
                        return (
                          <tr key={row.key ?? rIdx} className="hover:bg-slate-50 transition">
                            <td className="border border-slate-900 px-2 py-1 text-center font-bold">{day}</td>
                            <td className="border border-slate-900 px-2 py-1 text-center font-bold text-teal-800">
                              {daily ? "X" : ""}
                            </td>
                            <td className="border border-slate-900 px-2 py-1 text-center font-bold text-teal-800">
                              {weekly ? "X" : ""}
                            </td>
                            <td className="border border-slate-900 px-2 py-1 text-center font-bold text-teal-800">
                              {spill ? "X" : ""}
                            </td>
                            <td className="border border-slate-900 px-2 py-1">{note ? String(note) : ""}</td>
                            <td className="border border-slate-900 px-2 py-1 font-medium">{performer ? String(performer) : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : isBm06 ? (
                  /* 3. MẪU BM.06: NHẬT KÝ 20 MÁY XÉT NGHIỆM */
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black text-center">
                        <th className="border border-slate-900 px-2 py-2 w-24">Ngày</th>
                        <th className="border border-slate-900 px-2 py-2 w-28">Ca trực</th>
                        <th className="border border-slate-900 px-2 py-2 min-w-48">Người sử dụng (Kíp trực)</th>
                        {/* Máy Trang 1 (1..10) */}
                        {(bm06SubView === "t1" || bm06SubView === "both") &&
                          bm06Page1Devices.map((dev) => (
                            <th key={dev.order} className="border border-slate-900 px-1 py-1.5 text-center min-w-16">
                              <span className="block text-[10px] text-slate-500">#{dev.order}</span>
                              <span className="block text-xs font-bold leading-tight">{dev.shortLabel}</span>
                            </th>
                          ))}
                        {/* Máy Trang 2 (11..20) */}
                        {(bm06SubView === "t2" || bm06SubView === "both") &&
                          bm06Page2Devices.map((dev) => (
                            <th key={dev.order} className="border border-slate-900 px-1 py-1.5 text-center min-w-16">
                              <span className="block text-[10px] text-slate-500">#{dev.order}</span>
                              <span className="block text-xs font-bold leading-tight">{dev.shortLabel}</span>
                            </th>
                          ))}
                        {/* Ghi chú */}
                        {(bm06SubView === "t2" || bm06SubView === "both") && (
                          <th className="border border-slate-900 px-2 py-2 min-w-28">Ghi chú</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, rIdx) => {
                        const isDayStart = rIdx % 4 === 0;
                        const dateStr = String(row.cells[0] ?? "");
                        const formattedDate = dateStr ? dateStr.split("-").reverse().join("/") : "";
                        const shiftLabel = String(row.cells[1] ?? "");
                        const performer = row.cells[2] ? String(row.cells[2]) : "";
                          const isMorning = shiftLabel.includes("Ca 1") || shiftLabel.includes("7h");
                          const note = row.cells[23] ? String(row.cells[23]) : "";
                          const shiftTime = shiftLabel.includes("(") ? shiftLabel.split("(")[1].replace(")", "") : shiftLabel;
                          const shiftName = shiftLabel.includes("(") ? shiftLabel.split("(")[0].trim() : "";

                          return (
                            <tr key={row.key ?? rIdx} className={`hover:bg-slate-50 transition ${isMorning ? "min-h-[55px]" : ""}`}>
                              {/* Cột Ngày: gộp 4 hàng cho mỗi ngày */}
                              {isDayStart && (
                                <td
                                  rowSpan={4}
                                  className="border border-slate-900 px-2 py-3 text-center font-black bg-slate-50 text-slate-900 align-middle whitespace-nowrap"
                                >
                                  {formattedDate}
                                </td>
                              )}

                              {/* Cột Lượng sử dụng / Ca trực */}
                              <td className={`border border-slate-900 px-2 text-center align-middle whitespace-nowrap ${isMorning ? "py-3 bg-amber-50/30" : "py-1.5"}`}>
                                <span className="block text-xs font-bold text-slate-900">{shiftTime}</span>
                                {shiftName && <span className="block text-[10px] font-medium text-slate-500">{shiftName}</span>}
                              </td>

                              {/* Cột Người sử dụng */}
                              <td className={`border border-slate-900 px-3 align-middle ${isMorning ? "py-3" : "py-1.5"}`}>
                                <div className="text-xs font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                                  {performer}
                                </div>
                              </td>

                            {/* Máy Trang 1 (1..10) */}
                            {(bm06SubView === "t1" || bm06SubView === "both") &&
                              bm06Page1Devices.map((dev, dIdx) => {
                                const st = row.cells[3 + dIdx];
                                return (
                                  <td
                                    key={dev.order}
                                    className="border border-slate-900 px-1 py-1 text-center align-middle"
                                  >
                                    {st === "BT" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        BT
                                      </span>
                                    ) : st === "KSD" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                        KSD
                                      </span>
                                    ) : st === "H" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                        H
                                      </span>
                                    ) : (
                                      st ? String(st) : ""
                                    )}
                                  </td>
                                );
                              })}

                            {/* Máy Trang 2 (11..20) */}
                            {(bm06SubView === "t2" || bm06SubView === "both") &&
                              bm06Page2Devices.map((dev, dIdx) => {
                                const st = row.cells[13 + dIdx];
                                return (
                                  <td
                                    key={dev.order}
                                    className="border border-slate-900 px-1 py-1 text-center align-middle"
                                  >
                                    {st === "BT" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        BT
                                      </span>
                                    ) : st === "KSD" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                        KSD
                                      </span>
                                    ) : st === "H" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                        H
                                      </span>
                                    ) : (
                                      st ? String(st) : ""
                                    )}
                                  </td>
                                );
                              })}

                            {/* Ghi chú */}
                            {(bm06SubView === "t2" || bm06SubView === "both") && (
                              <td className="border border-slate-900 px-2 py-1 text-left align-middle text-slate-600">
                                {note}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* 4. CÁC MẪU CÒN LẠI (BM.02 TỦ LẠNH MÁT, BM.03 TỦ LẠNH ĐÁ, BM.02 TRTB BẢO DƯỠNG) */
                  <table className="w-full border-collapse border border-slate-900 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black">
                        {model.columns.map((col, idx) => (
                          <th
                            key={idx}
                            className="border border-slate-900 px-2 py-2 text-center whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, rIdx) => (
                        <tr key={row.key ?? rIdx} className="hover:bg-slate-50 transition">
                          {row.cells.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`border border-slate-900 px-2 py-1.5 ${
                                cIdx === 0 || cIdx === 1 || cIdx === 2
                                  ? "text-center whitespace-nowrap font-medium"
                                  : ""
                              }`}
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText className="mx-auto size-10 text-slate-300" />
                <p className="mt-2 text-sm font-semibold">Chưa có bản ghi nào trong kỳ Tháng {workspace.month}/{workspace.year}.</p>
                <p className="text-xs text-slate-400">
                  {workspace.month === "10" ? (
                    <span>
                      Gợi ý: Chọn nút <strong className="text-teal-700">"Tháng 09/2026"</strong> ở trên để xem đầy đủ hồ sơ mẫu chuẩn ISO 15189 đã được kiểm tra.
                    </span>
                  ) : (
                    "Các ca trực ghi nhận sẽ tự động hiển thị tại đây."
                  )}
                </p>
              </div>
            )}

            {/* CHỮ KÝ CHÂN TRANG CHUẨN MẪU */}
            <div className="mt-8 pt-4 grid grid-cols-3 text-center text-xs text-slate-900 gap-4">
              <div>
                <p className="font-black uppercase">Người ghi sổ / thực hiện</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-20" />
              </div>

              <div>
                <p className="font-black uppercase">Cán bộ kiểm tra</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-20" />
              </div>

              <div>
                <p className="font-black uppercase">Chỉ huy Bộ môn - Khoa</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
                <p className="font-black text-teal-950">TS. Huỳnh Quang Thuận</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

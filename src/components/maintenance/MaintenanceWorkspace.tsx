"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  CheckCircle2,
  CircleAlert,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { MaintenanceOccurrenceItem, MaintenanceWorkspaceData } from "@/lib/maintenance/queries";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";

interface Props {
  data: MaintenanceWorkspaceData;
  initialCadence?: string;
  savedId?: string;
}

const CADENCE_LABELS: Record<string, string> = {
  DAILY: "Hằng ngày",
  WEEKLY: "Hằng tuần",
  MONTHLY: "Hằng tháng",
};

export function MaintenanceWorkspace({ data, initialCadence = "ALL", savedId }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<MaintenanceOccurrenceItem[]>(data.items);
  const [activeCadence, setActiveCadence] = useState<string>(initialCadence);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissSaved, setDismissSaved] = useState(false);
  const [lastInlineSaved, setLastInlineSaved] = useState<{
    id: string;
    assetName: string;
    cadence: string;
    result: "PASS" | "FAIL";
  } | null>(null);

  // Sync items when data from server changes (e.g. date change)
  useEffect(() => {
    setItems(data.items);
  }, [data.items]);

  const businessDate = data.businessDate;

  // Handle date change
  const navigateDate = (newDate: string) => {
    setExpandedId(null);
    router.push(`/maintenance?date=${newDate}&cadence=${activeCadence}`);
  };

  const shiftDay = (days: number) => {
    const [y, m, d] = businessDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d + days));
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextDate = `${dateObj.getUTCFullYear()}-${pad(dateObj.getUTCMonth() + 1)}-${pad(dateObj.getUTCDate())}`;
    navigateDate(nextDate);
  };

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  // Handle inline save success without navigating away
  const handleInlineSaveSuccess = (
    itemId: string,
    savedData: {
      performedAt: string;
      result: "PASS" | "FAIL";
      note?: string;
      recordId?: string | null;
      status?: string;
    }
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const finalRecordId = savedData.recordId ?? it.fulfilledByRecordId ?? null;
          const finalStatus = savedData.status ?? (finalRecordId ? "COMPLETED" : it.status);
          return {
            ...it,
            status: finalStatus,
            fulfilledByRecordId: finalRecordId,
            record: {
              id: finalRecordId ?? (it.record?.id ?? ""),
              performedAt: savedData.performedAt,
              result: savedData.result,
              note: savedData.note ?? null,
            },
          };
        }
        return it;
      })
    );

    const savedTarget = items.find((i) => i.id === itemId);
    if (savedTarget) {
      setLastInlineSaved({
        id: itemId,
        assetName: savedTarget.assetName,
        cadence: savedTarget.cadence,
        result: savedData.result,
      });
    }

    try {
      router.refresh();
    } catch {}
  };

  // Toggle inline form expansion (only one open at a time)
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeCadence !== "ALL" && item.cadence !== activeCadence) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = item.assetName.toLowerCase().includes(q);
      const matchCode = item.assetCode?.toLowerCase().includes(q) ?? false;
      const matchLoc = item.locationName?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchCode && !matchLoc) return false;
    }
    return true;
  });

  // Dynamic counts reflecting truthful Supabase-backed state
  const completedCount = items.filter((i) => i.status === "COMPLETED" || Boolean(i.fulfilledByRecordId)).length;
  const totalCount = items.length;
  const dailyCount = items.filter((i) => i.cadence === "DAILY").length;
  const weeklyCount = items.filter((i) => i.cadence === "WEEKLY").length;
  const monthlyCount = items.filter((i) => i.cadence === "MONTHLY").length;

  const urlSavedItem = savedId ? items.find((i) => i.id === savedId) : null;

  return (
    <div className="space-y-5">
      {/* Date Navigation & Summary Banner */}
      <section className="overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10">
              <Wrench className="size-5 text-teal-200" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">BM.02/QL.TRTB.01</p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl">Bảo dưỡng trang thiết bị</h1>
              <p className="mt-1 text-sm font-semibold text-cyan-100">
                Theo dõi và kiểm tra tình trạng máy định kỳ theo chuẩn ISO 15189
              </p>
            </div>
          </div>

          {/* Date Picker Buttons */}
          <div className="flex items-center gap-1.5 self-start rounded-2xl border border-white/20 bg-white/10 p-1.5 sm:self-auto">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              className="grid size-9 place-items-center rounded-xl text-white transition hover:bg-white/20 active:scale-95"
              aria-label="Ngày trước"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="size-4 text-cyan-200" />
              <input
                type="date"
                value={businessDate}
                onChange={(e) => e.target.value && navigateDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              className="grid size-9 place-items-center rounded-xl text-white transition hover:bg-white/20 active:scale-95"
              aria-label="Ngày sau"
            >
              <ChevronRight className="size-5" />
            </button>
            {businessDate !== todayStr && (
              <button
                type="button"
                onClick={() => navigateDate(todayStr)}
                className="ml-1 rounded-xl bg-teal-500/30 px-2.5 py-1 text-xs font-bold text-cyan-100 hover:bg-teal-500/50"
              >
                Hôm nay
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 border-t border-white/15 pt-4">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-100">
            <span>Tiến độ thực hiện ngày {businessDate}</span>
            <span>
              {completedCount}/{totalCount} máy đã bảo dưỡng
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
              style={{
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </section>

      {/* Inline Saved Notification Banner */}
      {lastInlineSaved && (
        <div
          role="status"
          className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white">
              <Check className="size-4" />
            </span>
            <div>
              <p className="text-sm font-black">Đã lưu kết quả bảo dưỡng thành công!</p>
              <p className="text-xs text-emerald-800">
                {lastInlineSaved.assetName} · Chu kỳ: {CADENCE_LABELS[lastInlineSaved.cadence]} · Kết quả:{" "}
                {lastInlineSaved.result === "FAIL" ? "Không đạt" : "Đạt"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastInlineSaved(null)}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* URL Saved Notification Banner (legacy fallback) */}
      {!lastInlineSaved && savedId && !dismissSaved && (
        <div
          role="status"
          className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white">
              <Check className="size-4" />
            </span>
            <div>
              <p className="text-sm font-black">Đã lưu kết quả bảo dưỡng thành công!</p>
              {urlSavedItem && (
                <p className="text-xs text-emerald-800">
                  {urlSavedItem.assetName} · Chu kỳ: {CADENCE_LABELS[urlSavedItem.cadence]} · Kết quả:{" "}
                  {urlSavedItem.record?.result === "FAIL" ? "Không đạt" : "Đạt"}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissSaved(true)}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Cadence Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setActiveCadence("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              activeCadence === "ALL"
                ? "bg-white text-teal-950 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCadence("DAILY")}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              activeCadence === "DAILY"
                ? "bg-white text-teal-950 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hằng ngày ({dailyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCadence("WEEKLY")}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              activeCadence === "WEEKLY"
                ? "bg-white text-teal-950 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hằng tuần ({weeklyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCadence("MONTHLY")}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
              activeCadence === "MONTHLY"
                ? "bg-white text-teal-950 shadow-xs ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hằng tháng ({monthlyCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên máy, mã máy…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Occurrences List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <Wrench className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-2 text-base font-black text-slate-800">
            {totalCount === 0
              ? "Chưa có lịch bảo dưỡng cho ngày này"
              : "Không tìm thấy thiết bị phù hợp với bộ lọc"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {totalCount === 0
              ? "Vui lòng chọn ngày khác hoặc quay lại ngày hôm nay để thực hiện bảo dưỡng."
              : "Thử tìm kiếm với từ khóa khác hoặc chuyển sang tab chu kỳ khác."}
          </p>
          {totalCount === 0 && businessDate !== todayStr && (
            <button
              type="button"
              onClick={() => navigateDate(todayStr)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-teal-800 px-4 py-2 text-xs font-black text-white hover:bg-teal-900"
            >
              Về ngày hôm nay ({todayStr})
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredItems.map((item) => (
            <MaintenanceCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => toggleExpand(item.id)}
              onSaveSuccess={(savedData) => handleInlineSaveSuccess(item.id, savedData)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MaintenanceCard({
  item,
  isExpanded,
  onToggle,
  onSaveSuccess,
}: {
  item: MaintenanceOccurrenceItem;
  isExpanded: boolean;
  onToggle: () => void;
  onSaveSuccess: (savedData: {
    performedAt: string;
    result: "PASS" | "FAIL";
    note?: string;
    recordId?: string | null;
    status?: string;
  }) => void;
}) {
  const isCompleted = item.status === "COMPLETED" || Boolean(item.fulfilledByRecordId);
  const result = item.record?.result;
  const isFail = result === "FAIL";

  return (
    <div
      className={`flex flex-col justify-between rounded-3xl border p-4 sm:p-5 transition shadow-xs ${
        isExpanded
          ? "border-teal-500 bg-white ring-2 ring-teal-500/20 shadow-md sm:col-span-2 lg:col-span-3"
          : isCompleted
          ? isFail
            ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
            : "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
          : "border-slate-200 bg-white hover:border-teal-300"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-teal-800">
            {CADENCE_LABELS[item.cadence]}
          </span>
          {isCompleted ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black border ${
                isFail
                  ? "border-rose-200 bg-rose-100/80 text-rose-800"
                  : "border-emerald-200 bg-emerald-100/80 text-emerald-800"
              }`}
            >
              {isFail ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3" />}
              {isFail ? "Không đạt (FAIL)" : "Đạt (PASS)"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              <CircleAlert className="size-3" />
              Chưa ghi
            </span>
          )}
        </div>

        <h3 className="mt-3 text-base font-black text-slate-900 leading-snug line-clamp-2">
          {item.assetName}
        </h3>

        {item.locationName && (
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.locationName}</p>
        )}

        {isCompleted && item.record?.performedAt && (
          <p className="mt-2 text-[11px] text-slate-500 font-medium">
            Đã ghi nhận lúc:{" "}
            {new Intl.DateTimeFormat("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              timeZone: "Asia/Ho_Chi_Minh",
            }).format(new Date(item.record.performedAt))}
          </p>
        )}

        {isCompleted && item.record?.note && (
          <p className="mt-1 text-xs italic text-slate-600 line-clamp-1">
            &ldquo;{item.record.note}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-black transition cursor-pointer select-none active:scale-[0.99] ${
            isExpanded
              ? "bg-teal-950 text-white shadow-xs"
              : isCompleted
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
              : "bg-teal-800 text-white hover:bg-teal-900 shadow-xs"
          }`}
        >
          <span>
            {isExpanded ? "Đóng form" : isCompleted ? "Xem / Sửa kết quả" : "Ghi nhận bảo dưỡng"}
          </span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {/* INLINE FORM EXPANSION */}
        {isExpanded && (
          <div className="mt-3.5 border-t border-slate-200/80 pt-3">
            <MaintenanceForm
              occurrenceId={item.id}
              cadence={item.cadence}
              assetName={item.assetName}
              isInline={true}
              onSuccess={onSaveSuccess}
              onCancel={onToggle}
              initialRecord={
                item.record
                  ? {
                      performedAt: item.record.performedAt,
                      result: item.record.result,
                      note: item.record.note ?? "",
                      isCompleted: isCompleted,
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

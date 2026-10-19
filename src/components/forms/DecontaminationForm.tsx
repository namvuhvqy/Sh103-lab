"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { saveDecontaminationAction } from "@/app/areas/[areaCode]/knbm/actions";

export interface DecontaminationValues {
  daily: boolean;
  weekly: boolean;
  spill: boolean;
  note: string;
}

interface Props {
  periodId: string;
  areaCode: string;
  today: string;
  returnTo?: string;
  defaultValues?: DecontaminationValues;
  submitLabel?: string;
}

const ACTIVITIES = [
  ["daily", "Daily", "Khử nhiễm hằng ngày"],
  ["weekly", "Weekly", "Khử nhiễm hằng tuần"],
  ["spill", "Spill", "Xử lý tràn đổ"],
] as const;

export function DecontaminationForm({
  periodId,
  areaCode,
  today,
  returnTo,
  defaultValues = { daily: false, weekly: false, spill: false, note: "" },
  submitLabel = "Lưu khử nhiễm",
}: Props) {
  const router = useRouter();
  const [businessDate, setBusinessDate] = useState(today);
  const [daily, setDaily] = useState(defaultValues.daily);
  const [weekly, setWeekly] = useState(defaultValues.weekly);
  const [spill, setSpill] = useState(defaultValues.spill);
  const [note, setNote] = useState(defaultValues.note || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // Restore unsaved local draft if present
  useEffect(() => {
    try {
      const draftKey = `lab103_knbm_${areaCode}_${periodId}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessDate === today) {
          setDaily(Boolean(parsed.daily));
          setWeekly(Boolean(parsed.weekly));
          setSpill(Boolean(parsed.spill));
          if (typeof parsed.note === "string") setNote(parsed.note);
          setSaveStatus("dirty");
        }
      }
    } catch {}
  }, [areaCode, periodId, today]);

  const saveToDraft = (next: { daily: boolean; weekly: boolean; spill: boolean; note: string }) => {
    try {
      const draftKey = `lab103_knbm_${areaCode}_${periodId}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({ ...next, businessDate, updatedAt: new Date().toISOString() })
      );
    } catch {}
  };

  const handleCheckboxChange = (name: "daily" | "weekly" | "spill", checked: boolean) => {
    const next = {
      daily: name === "daily" ? checked : daily,
      weekly: name === "weekly" ? checked : weekly,
      spill: name === "spill" ? checked : spill,
      note,
    };
    if (name === "daily") setDaily(checked);
    if (name === "weekly") setWeekly(checked);
    if (name === "spill") setSpill(checked);

    setSaveStatus("dirty");
    setErrorMessage(null);
    saveToDraft(next);
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    setSaveStatus("dirty");
    setErrorMessage(null);
    saveToDraft({ daily, weekly, spill, note: val });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!daily && !weekly && !spill) {
      setSaveStatus("error");
      setErrorMessage("Vui lòng chọn ít nhất một hoạt động khử nhiễm (Daily, Weekly, hoặc Spill)");
      return;
    }

    setIsSubmitting(true);
    setSaveStatus("saving");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("periodId", periodId);
    formData.append("areaCode", areaCode);
    formData.append("businessDate", businessDate);
    if (daily) formData.append("daily", "on");
    if (weekly) formData.append("weekly", "on");
    if (spill) formData.append("spill", "on");
    if (note) formData.append("note", note);
    if (returnTo) formData.append("returnTo", returnTo);
    formData.append("ajax", "1");

    try {
      const result = await saveDecontaminationAction(formData);
      if (result && !result.success) {
        setSaveStatus("error");
        setErrorMessage(result.error || "Không thể lưu khử nhiễm. Vui lòng thử lại.");
      } else {
        setSaveStatus("saved");
        setErrorMessage(null);
        try {
          localStorage.removeItem(`lab103_knbm_${areaCode}_${periodId}`);
        } catch {}
        startTransition(() => {
          if (router) router.refresh();
        });
      }
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err?.message || "Lỗi kết nối khi gửi dữ liệu khử nhiễm. Thông tin vừa nhập đã được giữ nguyên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm sm:p-5">
      <input type="hidden" name="periodId" value={periodId} />
      <input type="hidden" name="areaCode" value={areaCode} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      {/* Save Status Header Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-50 pb-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700">BM.01_KNBM · {areaCode}</span>
        <div>
          {saveStatus === "saving" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800 border border-sky-200">
              <Loader2 className="size-3 animate-spin text-sky-600" />
              Đang lưu lên hệ thống…
            </span>
          ) : saveStatus === "saved" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3 text-emerald-600" />
              Đã lưu thành công
            </span>
          ) : saveStatus === "dirty" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
              <Clock className="size-3 text-amber-600" />
              Chưa lưu: Có thay đổi chưa gửi
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500">Sẵn sàng</span>
          )}
        </div>
      </div>

      {/* Error alert box with Retry button */}
      {saveStatus === "error" ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-rose-900 shadow-xs" role="alert">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              <span>Lưu thất bại: {errorMessage}. Dữ liệu vừa nhập vẫn được giữ nguyên.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-1 self-start sm:self-auto rounded-xl bg-rose-700 px-3 py-1 text-xs font-black text-white hover:bg-rose-800 transition"
            >
              <RefreshCw className="size-3" />
              Thử lưu lại
            </button>
          </div>
        </div>
      ) : null}

      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
        Ngày thực hiện
        <input
          required
          type="date"
          name="businessDate"
          value={businessDate}
          onChange={(e) => {
            setBusinessDate(e.target.value);
            setSaveStatus("dirty");
          }}
          className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <fieldset>
        <legend className="text-xs font-black uppercase tracking-wider text-slate-700">Hoạt động đã thực hiện</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ACTIVITIES.map(([name, label, description]) => {
            const isChecked = name === "daily" ? daily : name === "weekly" ? weekly : spill;
            return (
              <label
                key={name}
                className={`flex min-h-12 items-start gap-3 rounded-2xl border p-3 text-sm transition cursor-pointer select-none ${
                  isChecked
                    ? "border-teal-300 bg-teal-50/60 shadow-xs"
                    : "border-slate-200 bg-slate-50/60 hover:border-teal-200 hover:bg-teal-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  name={name}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(name, e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>
                  <span className="block font-black text-slate-900">{label}</span>
                  <span className="text-xs font-medium text-slate-500">{description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
        Ghi chú
        <textarea
          name="note"
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Nhập ghi chú đặc biệt (hóa chất, sự cố, người bàn giao)..."
          className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-2xl bg-teal-800 px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal-900 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        {isSubmitting ? "Đang lưu lên hệ thống…" : submitLabel}
      </button>
    </form>
  );
}

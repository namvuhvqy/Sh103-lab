"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { saveMaintenanceAction } from "@/app/maintenance/actions";

const labels = {
  DAILY: "Hằng ngày",
  WEEKLY: "Hằng tuần",
  MONTHLY: "Hằng tháng",
} as const;

export interface InitialMaintenanceRecord {
  performedAt: string;
  result: "PASS" | "FAIL";
  note?: string;
  isCompleted?: boolean;
}

export interface MaintenanceFormProps {
  occurrenceId: string;
  cadence: keyof typeof labels;
  assetName: string;
  initialError?: string;
  initialRecord?: InitialMaintenanceRecord;
  isInline?: boolean;
  onSuccess?: (savedData: { performedAt: string; result: "PASS" | "FAIL"; note?: string }) => void;
  onCancel?: () => void;
}

function toDatetimeLocal(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
}

export function MaintenanceForm({
  occurrenceId,
  cadence,
  assetName,
  initialError,
  initialRecord,
  isInline,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const router = useRouter();
  const [performedAt, setPerformedAt] = useState<string>("");
  const [result, setResult] = useState<"PASS" | "FAIL" | "">("");
  const [note, setNote] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    initialError ? "error" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore draft or initial record or set default datetime
  useEffect(() => {
    try {
      const draftKey = `lab103_maintenance_draft_${occurrenceId}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.performedAt) setPerformedAt(parsed.performedAt);
        if (parsed.result) setResult(parsed.result);
        if (typeof parsed.note === "string") setNote(parsed.note);
        setSaveStatus("dirty");
        return;
      }
    } catch {}

    if (initialRecord) {
      if (initialRecord.performedAt) {
        setPerformedAt(toDatetimeLocal(initialRecord.performedAt));
      }
      if (initialRecord.result) {
        setResult(initialRecord.result);
      }
      if (typeof initialRecord.note === "string") {
        setNote(initialRecord.note);
      }
      return;
    }

    // Default to current local time in YYYY-MM-DDTHH:mm
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setPerformedAt(localIso);
  }, [occurrenceId, initialRecord]);

  const saveToDraft = (next: { performedAt: string; result: string; note: string }) => {
    try {
      localStorage.setItem(`lab103_maintenance_draft_${occurrenceId}`, JSON.stringify(next));
    } catch {}
  };

  const handlePerformedAtChange = (val: string) => {
    setPerformedAt(val);
    setSaveStatus("dirty");
    setErrorMessage(null);
    saveToDraft({ performedAt: val, result, note });
  };

  const handleResultChange = (val: "PASS" | "FAIL") => {
    setResult(val);
    setSaveStatus("dirty");
    setErrorMessage(null);
    saveToDraft({ performedAt, result: val, note });
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    setSaveStatus("dirty");
    setErrorMessage(null);
    saveToDraft({ performedAt, result, note: val });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!performedAt) {
      setSaveStatus("error");
      setErrorMessage("Vui lòng chọn ngày giờ thực hiện bảo dưỡng.");
      return;
    }

    if (!result) {
      setSaveStatus("error");
      setErrorMessage("Vui lòng chọn kết quả bảo dưỡng (Đạt hoặc Không đạt).");
      return;
    }

    setIsSubmitting(true);
    setSaveStatus("saving");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("occurrenceId", occurrenceId);
    formData.append("cadence", cadence);
    formData.append("performedAt", performedAt);
    formData.append("result", result);
    formData.append("note", note);
    formData.append("ajax", "1");

    try {
      const res = await saveMaintenanceAction(formData);
      if (res && !res.success) {
        setSaveStatus("error");
        setErrorMessage(res.error || "Không thể lưu bảo dưỡng. Vui lòng thử lại.");
      } else {
        setSaveStatus("saved");
        setErrorMessage(null);
        try {
          localStorage.removeItem(`lab103_maintenance_draft_${occurrenceId}`);
        } catch {}

        if (onSuccess) {
          onSuccess({ performedAt, result: result as "PASS" | "FAIL", note });
        } else {
          const targetUrl = res?.redirectUrl || `/maintenance?saved=${encodeURIComponent(occurrenceId)}`;
          if (router) {
            router.push(targetUrl);
          } else if (typeof window !== "undefined") {
            window.location.href = targetUrl;
          }
        }
      }
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err?.message || "Lỗi kết nối khi gửi kết quả bảo dưỡng. Thông tin vừa nhập đã được giữ nguyên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-3xl border transition shadow-sm ${
        isInline ? "border-teal-200 bg-slate-50/70 p-3.5 sm:p-4" : "border-slate-200 bg-white p-5"
      }`}
    >
      <input type="hidden" name="occurrenceId" value={occurrenceId} />
      <input type="hidden" name="cadence" value={cadence} />

      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">{labels[cadence]}</p>
          {!isInline && <h2 className="text-xl font-black text-slate-900">{assetName}</h2>}
          {isInline && <p className="text-xs font-semibold text-slate-600">Nhập kết quả kiểm tra định kỳ</p>}
        </div>
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
          ) : initialRecord?.isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3 text-emerald-600" />
              Đã hoàn thành ({initialRecord.result === "FAIL" ? "Không đạt" : "Đạt"})
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500">Sẵn sàng</span>
          )}
        </div>
      </header>

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
        Ngày giờ thực hiện
        <input
          required
          name="performedAt"
          type="datetime-local"
          value={performedAt}
          onChange={(e) => handlePerformedAtChange(e.target.value)}
          className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <fieldset>
        <legend className="text-xs font-black uppercase tracking-wider text-slate-700">Kết quả kiểm tra bảo dưỡng</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label
            className={`flex min-h-12 items-center gap-2 rounded-2xl border p-3 cursor-pointer select-none transition ${
              result === "PASS"
                ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500/20"
                : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
            }`}
          >
            <input
              required
              type="radio"
              name="result"
              value="PASS"
              aria-label="Đạt"
              checked={result === "PASS"}
              onChange={() => handleResultChange("PASS")}
              className="size-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Đạt (PASS)</span>
          </label>

          <label
            className={`flex min-h-12 items-center gap-2 rounded-2xl border p-3 cursor-pointer select-none transition ${
              result === "FAIL"
                ? "border-rose-500 bg-rose-50 text-rose-950 font-black shadow-xs ring-1 ring-rose-500/20"
                : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
            }`}
          >
            <input
              required
              type="radio"
              name="result"
              value="FAIL"
              aria-label="Không đạt"
              checked={result === "FAIL"}
              onChange={() => handleResultChange("FAIL")}
              className="size-4 text-rose-600 focus:ring-rose-500"
            />
            <span>Không đạt (FAIL)</span>
          </label>
        </div>
      </fieldset>

      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
        Ghi chú &amp; Chi tiết bảo dưỡng
        <textarea
          name="note"
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Ghi chú các hạng mục đã kiểm tra, dầu mỡ bôi trơn, màng lọc, v.v..."
          className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-[0.99]"
          >
            Đóng
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 rounded-2xl bg-teal-800 px-4 text-xs sm:text-sm font-black text-white shadow-sm transition hover:bg-teal-900 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          {isSubmitting ? "Đang lưu lên hệ thống…" : "Lưu bảo dưỡng"}
        </button>
      </div>
    </form>
  );
}

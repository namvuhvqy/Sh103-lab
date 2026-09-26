"use client";

import React, { useState, useRef, useCallback } from "react";
import { Thermometer, Droplets, ShieldCheck, Check, Loader2, AlertTriangle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InlineOccurrence {
  id: string;
  status: string;
  slot_code: string | null;
  fulfilled_by_record_id: string | null;
  initialTemperature?: number | null;
  initialHumidity?: number | null;
  register_periods: {
    id: string;
    locations: { name: string; code?: string } | null;
    assets: { source_name: string; source_code?: string; storage_purpose: string | null } | null;
    form_template_versions: { form_templates: { code: string; name: string } };
  };
}

interface InlineTemperatureCardProps {
  occurrence: InlineOccurrence;
  onSaved?: (occurrenceId: string, temp: number | null, hum: number | null) => void;
}

export function InlineTemperatureCard({ occurrence, onSaved }: InlineTemperatureCardProps) {
  const code = occurrence.register_periods.form_template_versions.form_templates.code;
  const isEnv = code.includes("BM.01");
  const isFreezer = code.includes("BM.03");

  // Ngưỡng chuẩn ISO 15189
  const minTemp = isEnv ? 21 : isFreezer ? -30 : 2;
  const maxTemp = isEnv ? 26 : isFreezer ? -10 : 8;
  const minHum = 20;
  const maxHum = 80;
  const rangeLabel = isEnv
    ? "21°C – 26°C · Độ ẩm 20% – 80%"
    : isFreezer
    ? "-30°C đến -10°C"
    : "2°C – 8°C";

  const recovery = (() => {
    if (typeof window === "undefined") return null;
    try {
      const pending = localStorage.getItem(`lab103_temp_${occurrence.id}`);
      return pending ? JSON.parse(pending) as { temp?: number | null; hum?: number | null } : null;
    } catch {
      return null;
    }
  })();
  const [tempVal, setTempVal] = useState<string>(
    occurrence.initialTemperature != null ? String(occurrence.initialTemperature) : recovery?.temp != null ? String(recovery.temp) : ""
  );
  const [humVal, setHumVal] = useState<string>(
    occurrence.initialHumidity != null ? String(occurrence.initialHumidity) : recovery?.hum != null ? String(recovery.hum) : ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTemp, setLastSavedTemp] = useState<number | null>(occurrence.initialTemperature ?? null);
  const [lastSavedHum, setLastSavedHum] = useState<number | null>(occurrence.initialHumidity ?? null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingSync, setPendingSync] = useState(Boolean(recovery));
  const [saveError, setSaveError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tempInputRef = useRef<HTMLInputElement>(null);

  // Tính trạng thái vượt ngưỡng
  const numTemp = tempVal.trim() !== "" ? parseFloat(tempVal) : null;
  const numHum = humVal.trim() !== "" ? parseFloat(humVal) : null;

  const isTempEntered = numTemp !== null && !isNaN(numTemp);
  const isTempAbnormal = isTempEntered && (numTemp < minTemp || numTemp > maxTemp);
  const isHumAbnormal = isEnv && numHum !== null && !isNaN(numHum) && (numHum < minHum || numHum > maxHum);
  const isAbnormal = isTempAbnormal || isHumAbnormal;

  // Xử lý rung xúc giác (Haptic Feedback)
  const triggerHaptic = useCallback((abnormal: boolean) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        if (abnormal) {
          // Rung 2 nhịp cảnh báo
          navigator.vibrate([100, 50, 100]);
        } else {
          // Rung nhẹ 1 nhịp xác nhận
          navigator.vibrate(50);
        }
      } catch {
        // Trình duyệt không cấp quyền vibrate
      }
    }
  }, []);

  // Hàm lưu dữ liệu lên Supabase & Audit trail
  const saveToServer = useCallback(
    async (temp: number | null, hum: number | null, force = false) => {
      if (!force && temp === lastSavedTemp && hum === lastSavedHum) return;

      // Cập nhật localStorage ngay lập tức để không bao giờ mất dữ liệu người dùng
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `lab103_temp_${occurrence.id}`,
            JSON.stringify({ temp, hum, updatedAt: new Date().toISOString() })
          );
        }
      } catch {
        // localStorage có thể bị khóa ở môi trường private
      }

      setSaveSuccess(false);
      setSaveError(null);

      if (isEnv && temp !== null && hum === null) {
        setPendingSync(true);
        setSaveError("Cần nhập độ ẩm");
        return;
      }

      setIsSaving(true);
      try {
        const res = await fetch("/api/measurements/quick-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrenceId: occurrence.id,
            temperature: temp,
            humidity: hum,
          }),
        });
        const data = await res.json().catch(() => ({ success: false, error: "Không thể đọc phản hồi" }));
        if (!res.ok || !data.success) throw new Error(data.error || "Không thể đồng bộ số đo");

        setLastSavedTemp(temp);
        setLastSavedHum(hum);
        setPendingSync(false);
        setSaveSuccess(true);
        try { localStorage.removeItem(`lab103_temp_${occurrence.id}`); } catch {}
        setTimeout(() => setSaveSuccess(false), 2500);
        if (temp !== null) triggerHaptic(isAbnormal);
        onSaved?.(occurrence.id, temp, hum);
      } catch (err) {
        setPendingSync(true);
        setSaveError(err instanceof Error ? err.message : "Chưa thể đồng bộ số đo");
      } finally {
        setIsSaving(false);
      }
    },
    [occurrence.id, lastSavedTemp, lastSavedHum, triggerHaptic, onSaved, isAbnormal, isEnv]
  );

  // Debounce khi gõ số để lưu tự động
  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTempVal(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const parsed = val.trim() !== "" ? parseFloat(val) : null;
      const currentHum = humVal.trim() !== "" ? parseFloat(humVal) : null;
      if (parsed === null || !isNaN(parsed)) {
        saveToServer(parsed, currentHum);
      }
    }, 600);
  };

  const handleHumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHumVal(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const parsedHum = val.trim() !== "" ? parseFloat(val) : null;
      const currentTemp = tempVal.trim() !== "" ? parseFloat(tempVal) : null;
      if (parsedHum === null || !isNaN(parsedHum)) {
        saveToServer(currentTemp, parsedHum);
      }
    }, 600);
  };

  // Lưu ngay lập tức khi blur hoặc bấm Enter
  const handleBlur = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const parsedTemp = tempVal.trim() !== "" ? parseFloat(tempVal) : null;
    const parsedHum = humVal.trim() !== "" ? parseFloat(humVal) : null;
    saveToServer(parsedTemp, parsedHum, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const label =
    occurrence.register_periods.locations?.name ??
    occurrence.register_periods.assets?.source_name ??
    occurrence.register_periods.form_template_versions.form_templates.name;

  return (
    <article
      className={cn(
        "relative flex flex-col justify-between rounded-3xl border bg-white p-4 sm:p-5 shadow-xs transition-all duration-200",
        isTempEntered
          ? isAbnormal
            ? "border-rose-400/90 ring-2 ring-rose-500/20 bg-rose-50/20"
            : "border-emerald-400/90 ring-2 ring-emerald-500/20 bg-emerald-50/15"
          : "border-cyan-100 hover:border-teal-300"
      )}
    >
      {/* Header Thẻ Thiết Bị / Khu Vực */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black tracking-wide text-teal-800 truncate">
              {code} · {occurrence.slot_code === "MORNING" ? "Ca sáng (08h)" : "Ca chiều (14h)"}
            </p>
            <h3 className="mt-0.5 text-sm sm:text-base font-black text-slate-950 truncate">
              {label}
            </h3>
            {occurrence.register_periods.assets?.storage_purpose ? (
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                {occurrence.register_periods.assets.storage_purpose}
              </p>
            ) : null}
          </div>

          {/* Badge trạng thái đo - Chuyển màu tức thì */}
          <div className="shrink-0 flex items-center gap-1.5">
            {isSaving ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                <Loader2 className="size-3 animate-spin text-teal-600" />
                Lưu…
              </span>
            ) : isTempEntered ? (
              isAbnormal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black text-rose-800 border border-rose-300 animate-pulse">
                  <AlertTriangle className="size-3 text-rose-600" />
                  Vượt ngưỡng: {numTemp}°C
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800 border border-emerald-300">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  Bình thường: {numTemp}°C
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                <Clock3 className="size-3 text-amber-600" />
                Chưa đo
              </span>
            )}
          </div>
        </div>

        {/* Ngưỡng chuẩn ISO 15189 */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-teal-600" />
            Ngưỡng chuẩn:
          </span>
          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {rangeLabel}
          </span>
        </div>
      </div>

      {/* Cơ chế Nhập liệu & Sửa tức thì (Inline Click-to-Edit) */}
      <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Ô nhập Nhiệt độ */}
          <div className="space-y-1">
            <label className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Thermometer className="size-3.5 text-teal-700" />
                Nhiệt độ (°C)
              </span>
              {saveSuccess ? <span className="text-[10px] font-bold text-emerald-700">✓ Đã lưu</span> : pendingSync ? <span className="text-[10px] font-bold text-amber-700" title={saveError ?? undefined}>{saveError === "Cần nhập độ ẩm" ? saveError : "Chờ đồng bộ"}</span> : null}
            </label>
            <div className="relative flex items-center">
              <input
                ref={tempInputRef}
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={tempVal}
                onChange={handleTempChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="--.- °C"
                className={cn(
                  "h-12 w-full rounded-2xl border px-3.5 text-base font-black transition-all duration-150 outline-none select-text",
                  isTempEntered
                    ? isAbnormal
                      ? "border-rose-400 bg-white text-rose-950 focus:border-rose-600 focus:ring-2 focus:ring-rose-400/30"
                      : "border-emerald-400 bg-white text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                    : "border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                )}
              />
              <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400">
                °C
              </span>
            </div>
          </div>

          {/* Ô nhập Độ ẩm (nếu là BM.01 Môi trường) */}
          {isEnv ? (
            <div className="space-y-1">
              <label className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Droplets className="size-3.5 text-teal-700" />
                  Độ ẩm (%)
                </span>
                {isHumAbnormal && (
                  <span className="text-[10px] font-bold text-rose-700">Vượt ngưỡng ẩm</span>
                )}
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={humVal}
                  onChange={handleHumChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="--.- %"
                  className={cn(
                    "h-12 w-full rounded-2xl border px-3.5 text-base font-black transition-all duration-150 outline-none select-text",
                    humVal.trim() !== ""
                      ? isHumAbnormal
                        ? "border-rose-400 bg-white text-rose-950 focus:border-rose-600 focus:ring-2 focus:ring-rose-400/30"
                        : "border-emerald-400 bg-white text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                      : "border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                  )}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Trợ giúp thao tác nhanh: Chạm để sửa ngay */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span>{pendingSync ? "Đã giữ cục bộ · Chạm ra ngoài để thử đồng bộ lại" : isTempEntered ? "Chạm con số để sửa ngay · Tự động lưu" : "Gõ số đo · Tự lưu khi xong"}</span>
          {isAbnormal && (
            <span className="font-bold text-rose-700 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
              Cảnh báo ISO
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

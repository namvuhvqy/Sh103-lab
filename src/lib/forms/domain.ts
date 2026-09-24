export const SHIFT_DEFINITIONS = [
  { code: "SHIFT_1", label: "07:00–11:30", startMinutes: 7 * 60, endMinutes: 11 * 60 + 30 },
  { code: "SHIFT_2", label: "11:30–13:30", startMinutes: 11 * 60 + 30, endMinutes: 13 * 60 + 30 },
  { code: "SHIFT_3", label: "13:30–16:30", startMinutes: 13 * 60 + 30, endMinutes: 16 * 60 + 30 },
  { code: "SHIFT_4", label: "16:30–07:00 hôm sau", startMinutes: 16 * 60 + 30, endMinutes: 7 * 60 },
] as const;

export function vietnamParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, hour: Number(value("hour")), minute: Number(value("minute")) };
}

function previousDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function currentShift(now = new Date()) {
  const local = vietnamParts(now);
  const minutes = local.hour * 60 + local.minute;
  const shift = SHIFT_DEFINITIONS.find((item) => item.code !== "SHIFT_4" && minutes >= item.startMinutes && minutes < item.endMinutes) ?? SHIFT_DEFINITIONS[3];
  return { ...shift, businessDate: shift.code === "SHIFT_4" && minutes < 7 * 60 ? previousDate(local.date) : local.date };
}

export function isMeasurementAbnormal(value: number, minimum: number, maximum: number) {
  return value < minimum || value > maximum;
}

export function shiftProgress(completed: number, total: number) {
  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  return { completed: safeCompleted, total: safeTotal, percent: safeTotal ? Math.round((safeCompleted / safeTotal) * 100) : 0, canFinalize: safeTotal > 0 && safeCompleted === safeTotal };
}

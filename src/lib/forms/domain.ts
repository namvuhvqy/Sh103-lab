export const SHIFT_DEFINITIONS = [
  { code: "SHIFT_1", label: "Ca 1 - Sáng (07:00–11:30)", name: "Ca sáng", startMinutes: 7 * 60, endMinutes: 11 * 60 + 30, isDuty: false },
  { code: "SHIFT_2", label: "Ca 2 - Trực trưa (11:30–13:30)", name: "Ca trực trưa", startMinutes: 11 * 60 + 30, endMinutes: 13 * 60 + 30, isDuty: true },
  { code: "SHIFT_3", label: "Ca 3 - Chiều (13:30–16:40)", name: "Ca chiều", startMinutes: 13 * 60 + 30, endMinutes: 16 * 60 + 40, isDuty: false },
  { code: "SHIFT_4", label: "Ca 4 - Trực đêm (16:40–07:00 hôm sau)", name: "Ca trực đêm", startMinutes: 16 * 60 + 40, endMinutes: 7 * 60, isDuty: true },
] as const;

export function vietnamParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  
  // Tính thứ trong tuần theo giờ Việt Nam
  const dayOfWeek = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })).getDay();
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    dayOfWeek, // 0 = Chủ Nhật, 6 = Thứ Bảy
  };
}

function previousDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function currentShift(now = new Date()) {
  const local = vietnamParts(now);
  const minutes = local.hour * 60 + local.minute;
  const isWeekend = local.dayOfWeek === 0 || local.dayOfWeek === 6;

  const baseShift =
    SHIFT_DEFINITIONS.find((item) => item.code !== "SHIFT_4" && minutes >= item.startMinutes && minutes < item.endMinutes) ??
    SHIFT_DEFINITIONS[3];

  const businessDate = baseShift.code === "SHIFT_4" && minutes < 7 * 60 ? previousDate(local.date) : local.date;

  return {
    ...baseShift,
    businessDate,
    isWeekend,
    isHolidayOrWeekend: isWeekend,
    dutyType: isWeekend ? ("DUTY_24H" as const) : (baseShift.isDuty ? ("DUTY_SHIFT" as const) : ("REGULAR_SHIFT" as const)),
    statusTitle: isWeekend
      ? "Kíp trực 24h ngày nghỉ/lễ"
      : baseShift.name,
    statusSubtitle: isWeekend
      ? "Trực liên tục từ 07:00 hôm nay đến 07:00 hôm sau"
      : baseShift.label,
    timeRange: isWeekend ? "07:00 – 07:00 hôm sau" : (baseShift.code === "SHIFT_1" ? "07:00–11:30" : baseShift.code === "SHIFT_2" ? "11:30–13:30" : baseShift.code === "SHIFT_3" ? "13:30–16:40" : "16:40–07:00"),
  };
}

export function isMeasurementAbnormal(value: number, minimum: number, maximum: number) {
  return value < minimum || value > maximum;
}

export function shiftProgress(completed: number, total: number) {
  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  return { completed: safeCompleted, total: safeTotal, percent: safeTotal ? Math.round((safeCompleted / safeTotal) * 100) : 0, canFinalize: safeTotal > 0 && safeCompleted === safeTotal };
}

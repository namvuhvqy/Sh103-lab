const DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function vietnamLocalDateTimeToIso(raw: string): string {
  const match = DATETIME_LOCAL.exec(raw);
  if (!match) throw new Error("Ngày giờ không hợp lệ");
  const [, year, month, day, hour, minute, second = "00"] = match;
  const value = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
  if (Number.isNaN(value.getTime())) throw new Error("Ngày giờ không hợp lệ");
  return value.toISOString();
}

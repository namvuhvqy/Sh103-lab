import { AppShell } from "@/components/shell/AppShell";
import { TemperatureLabDashboard, type TemperaturePoint } from "@/components/forms/TemperatureLabDashboard";
import type { InlineOccurrence } from "@/components/forms/InlineTemperatureCard";
import type { QCTrendPoint } from "@/components/p5/QCTrendChart";
import { currentShift, vietnamParts } from "@/lib/forms/domain";
import { getTemperatureOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";

export const dynamic = "force-dynamic";

type Detail = {
  temperature_c: number | null;
  humidity_pct: number | null;
  temperature_min_snapshot: number | null;
  temperature_max_snapshot: number | null;
  temperature_abnormal: boolean;
  humidity_abnormal: boolean;
};

type Occurrence = {
  id: string;
  status: string;
  slot_code: string | null;
  fulfilled_by_record_id: string | null;
  register_periods: {
    locations: { code: string; name: string } | null;
    assets: { source_name: string; storage_purpose: string | null } | null;
    form_template_versions: { form_templates: { code: string; name: string } };
  };
};

type MeasurementRecord = {
  id: string;
  performed_at: string | null;
  measurement_details: Detail[] | Detail | null;
};

const firstDetail = (record?: MeasurementRecord): Detail | null => {
  if (!record?.measurement_details) return null;
  return Array.isArray(record.measurement_details) ? record.measurement_details[0] ?? null : record.measurement_details;
};

const documentedRange = (code: string) => code.includes("BM.01/") ? { min: 21, max: 26 } : code.includes("BM.03/") ? { min: -30, max: -10 } : { min: 2, max: 8 };

export default async function TemperaturePage() {
  const [data, unread] = await Promise.all([getTemperatureOverview(), getUnreadNotificationCount()]);
  const rows = (data.occurrences ?? []) as unknown as Occurrence[];
  const records = (data.records ?? []) as unknown as MeasurementRecord[];
  const recordMap = new Map(records.map((record) => [record.id, record]));

  const initialPoints: TemperaturePoint[] = rows.map((occurrence, index) => {
    const record = occurrence.fulfilled_by_record_id ? recordMap.get(occurrence.fulfilled_by_record_id) : undefined;
    const detail = firstDetail(record);
    const template = occurrence.register_periods.form_template_versions.form_templates;
    const documented = documentedRange(template.code);
    const temperature = detail?.temperature_c ?? null;
    const minTemp = detail?.temperature_min_snapshot ?? documented.min;
    const maxTemp = detail?.temperature_max_snapshot ?? documented.max;

    return {
      id: occurrence.id,
      stt: index + 1,
      name: occurrence.register_periods.assets?.source_name ?? occurrence.register_periods.locations?.name ?? template.name,
      area: occurrence.register_periods.locations?.name ?? "Chưa gán khu vực",
      temperature,
      humidity: detail?.humidity_pct ?? null,
      isAbnormal: Boolean(detail?.temperature_abnormal || detail?.humidity_abnormal || (temperature !== null && (temperature < minTemp || temperature > maxTemp))),
      updatedAt: record?.performed_at ? new Date(record.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa ghi",
      code: template.code.split("/")[0],
      minTemp,
      maxTemp,
    };
  });

  const mappedOccurrences: InlineOccurrence[] = rows.map((occurrence) => {
    const detail = firstDetail(occurrence.fulfilled_by_record_id ? recordMap.get(occurrence.fulfilled_by_record_id) : undefined);
    return {
      id: occurrence.id,
      status: occurrence.status,
      slot_code: occurrence.slot_code,
      fulfilled_by_record_id: occurrence.fulfilled_by_record_id,
      initialTemperature: detail?.temperature_c ?? null,
      initialHumidity: detail?.humidity_pct ?? null,
      register_periods: occurrence.register_periods as unknown as InlineOccurrence["register_periods"],
    };
  });

  const chartPoints: QCTrendPoint[] = initialPoints
    .filter((point) => point.temperature !== null || point.humidity !== null)
    .map((point) => ({ areaName: point.area, time: point.updatedAt, temperature: point.temperature, humidity: point.humidity }));
  const nowShift = currentShift();
  const today = vietnamParts(new Date()).date.split("-").reverse().join("/");

  return (
    <AppShell headerTitle="Khoa Sinh Hóa BV103" headerSubtitle="Nhiệt độ & Độ ẩm (BM.01 - BM.02 - BM.03)" unreadCount={unread}>
      <TemperatureLabDashboard initialPoints={initialPoints} occurrences={mappedOccurrences} chartPoints={chartPoints} activeDate={`${today} · ${nowShift.name}`} />
    </AppShell>
  );
}

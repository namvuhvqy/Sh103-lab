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
  business_date?: string;
  slot_code?: string | null;
  performed_at: string | null;
  locations?: { name: string } | null;
  assets?: { source_name: string } | null;
  form_template_versions?: { form_templates: { code: string } } | null;
  measurement_details: Detail[] | Detail | null;
};

const firstDetail = (record?: MeasurementRecord): Detail | null => {
  if (!record?.measurement_details) return null;
  return Array.isArray(record.measurement_details) ? record.measurement_details[0] ?? null : record.measurement_details;
};

const documentedRange = (code: string) => code.includes("BM.01/") ? { min: 21, max: 26 } : code.includes("BM.03/") ? { min: -30, max: -10 } : { min: 2, max: 8 };

import { redirect } from "next/navigation";
import { getCurrentAccess } from "@/lib/forms/workflow";

export default async function TemperaturePage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; from?: string; to?: string; mode?: string; range?: string }>;
}) {
  const query = (await searchParams) ?? {};
  const todayIso = vietnamParts(new Date()).date;
  const isIsoDate = (val?: string) => Boolean(val && /^\d{4}-\d{2}-\d{2}$/.test(val));

  const hasExplicitRange = isIsoDate(query.from) && isIsoDate(query.to);
  const filterMode: "daily" | "range" =
    query.mode === "daily" ? "daily" : query.mode === "range" || hasExplicitRange ? "range" : "daily";

  const selectedDateIso = isIsoDate(query.date)
    ? query.date!
    : hasExplicitRange
    ? query.to!
    : todayIso;

  const requestedRange = Number(query.range);
  const selectedRangeDays =
    filterMode === "daily"
      ? 1
      : [1, 7, 14, 30].includes(requestedRange)
      ? requestedRange
      : 7;

  const defaultFromObj = new Date(`${selectedDateIso}T00:00:00Z`);
  defaultFromObj.setUTCDate(defaultFromObj.getUTCDate() - (Math.max(selectedRangeDays, 7) - 1));
  const fromDateIso = hasExplicitRange ? query.from! : defaultFromObj.toISOString().slice(0, 10);
  const toDateIso = hasExplicitRange ? query.to! : selectedDateIso;

  let data;
  let unread = 0;
  let access = null;
  try {
    const [overviewData, unreadCount, currentAccess] = await Promise.all([
      getTemperatureOverview(
        filterMode === "range"
          ? { fromDate: fromDateIso, toDate: toDateIso }
          : { date: selectedDateIso, rangeDays: 1 }
      ),
      getUnreadNotificationCount().catch(() => 0),
      getCurrentAccess().catch(() => null),
    ]);
    data = overviewData;
    unread = unreadCount;
    access = currentAccess;
  } catch (err) {
    console.error("TemperaturePage fetch error:", err);
    redirect("/login?next=%2Ftemperature");
  }

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
      slotCode: occurrence.slot_code,
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

  const chartPoints: QCTrendPoint[] = records
    .map((record) => {
      const detail = firstDetail(record);
      if (!detail || (detail.temperature_c === null && detail.humidity_pct === null)) return null;
      const code = record.form_template_versions?.form_templates?.code ?? "BM.01";
      const category: "ROOM" | "COOLER" | "FREEZER" = code.includes("BM.01")
        ? "ROOM"
        : code.includes("BM.03")
        ? "FREEZER"
        : "COOLER";
      const areaLabel = record.assets?.source_name ?? record.locations?.name ?? "Điểm đo";
      const shortDate = record.business_date ? record.business_date.slice(8, 10) + "/" + record.business_date.slice(5, 7) : "";
      const timeLabel = record.performed_at
        ? new Date(record.performed_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Ho_Chi_Minh",
          })
        : record.slot_code === "AFTERNOON"
        ? "14:00"
        : "08:00";

      return {
        areaName: areaLabel,
        locationName: record.locations?.name ?? areaLabel,
        date: record.business_date ?? selectedDateIso,
        slotCode: record.slot_code ?? null,
        time: (data.rangeDays ?? selectedRangeDays) > 1 && shortDate ? `${shortDate} ${timeLabel}` : timeLabel,
        temperature: detail.temperature_c,
        humidity: detail.humidity_pct,
        category,
      };
    })
    .filter((pt): pt is NonNullable<typeof pt> => pt !== null);

  const nowShift = currentShift();
  const formattedDate = selectedDateIso.split("-").reverse().join("/");

  return (
    <AppShell headerTitle="Khoa Sinh Hóa BV103" headerSubtitle="Nhiệt độ & Độ ẩm (BM.01 - BM.02 - BM.03)" unreadCount={unread} isAdmin={access?.isAdmin}>
      <TemperatureLabDashboard
        initialPoints={initialPoints}
        occurrences={mappedOccurrences}
        chartPoints={chartPoints}
        activeDate={`${formattedDate} · ${nowShift.name}`}
        selectedDateIso={selectedDateIso}
        selectedRangeDays={data.rangeDays ?? selectedRangeDays}
        initialFilterMode={filterMode}
        initialFromDateIso={data.startDate ?? fromDateIso}
        initialToDateIso={data.endDate ?? toDateIso}
      />
    </AppShell>
  );
}

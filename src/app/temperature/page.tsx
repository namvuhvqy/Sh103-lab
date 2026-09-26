import React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TemperatureLabDashboard, TemperaturePoint } from "@/components/forms/TemperatureLabDashboard";
import { OperationalChart } from "@/components/p5/OperationalChart";
import { getTemperatureOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { currentShift, vietnamParts } from "@/lib/forms/domain";
import type { InlineOccurrence } from "@/components/forms/InlineTemperatureCard";

export const dynamic = "force-dynamic";

export default async function TemperaturePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [data, unread] = await Promise.all([
    getTemperatureOverview(),
    getUnreadNotificationCount(),
  ]);

  type Occurrence = {
    id: string;
    status: string;
    slot_code: string | null;
    fulfilled_by_record_id: string | null;
    register_periods: {
      locations: { name: string } | null;
      assets: { source_name: string; storage_purpose: string | null } | null;
      form_template_versions: { form_templates: { code: string; name: string } };
    };
  };

  const rows = (data.occurrences ?? []) as unknown as Occurrence[];

  type MeasurementRecord = {
    id: string;
    performed_at: string | null;
    slot_code: string | null;
    measurement_details:
      | Array<{ temperature_c: number | null; humidity_pct: number | null }>
      | { temperature_c: number | null; humidity_pct: number | null }
      | null;
  };

  const recordList = (data.records ?? []) as unknown as MeasurementRecord[];
  const recordMap = new Map(recordList.map((r) => [r.id, r]));

  // Danh sách các điểm đo đầy đủ chuẩn ISO 15189 Khoa Sinh Hóa BV103
  const targetMockPoints = [
    { stt: 1, name: "Tủ lạnh 1", area: "Sinh hóa", temp: 4.2, hum: null, min: 2, max: 8, time: "08:12", code: "BM.02" },
    { stt: 2, name: "Tủ lạnh 2", area: "Sinh hóa", temp: 4.8, hum: null, min: 2, max: 8, time: "08:10", code: "BM.02" },
    { stt: 3, name: "Phòng xét nghiệm", area: "Sinh hóa", temp: 22.1, hum: 58, min: 21, max: 26, time: "08:05", code: "BM.01" },
    { stt: 4, name: "Kho hóa chất", area: "Sinh hóa", temp: 23.5, hum: 62, min: 21, max: 26, time: "08:03", code: "BM.01" },
    { stt: 5, name: "Khu máy miễn dịch", area: "Miễn dịch", temp: 21.8, hum: 55, min: 21, max: 26, time: "08:10", code: "BM.01" },
    { stt: 6, name: "Tủ lạnh sinh phẩm", area: "Miễn dịch", temp: 5.1, hum: null, min: 2, max: 8, time: "08:08", code: "BM.02" },
    { stt: 7, name: "Phòng ELISA", area: "Miễn dịch", temp: 20.5, hum: 52, min: 21, max: 26, time: "08:06", code: "BM.01" },
    { stt: 8, name: "Khu máy nước tiểu", area: "Nước tiểu", temp: 21.9, hum: 56, min: 21, max: 26, time: "08:11", code: "BM.01" },
    { stt: 9, name: "Tủ lạnh mẫu", area: "Nước tiểu", temp: 4.6, hum: null, min: 2, max: 8, time: "08:07", code: "BM.02" },
    { stt: 10, name: "Khu ly tâm", area: "Ly tâm", temp: 20.1, hum: 53, min: 21, max: 26, time: "08:09", code: "BM.01" },
    { stt: 11, name: "Tủ lạnh ly tâm", area: "Ly tâm", temp: 4.4, hum: null, min: 2, max: 8, time: "08:08", code: "BM.02" },
    { stt: 12, name: "Khu nhận bệnh phẩm", area: "Nhận bệnh phẩm", temp: 18.9, hum: 60, min: 21, max: 26, time: "08:15", code: "BM.01" },
    { stt: 13, name: "Tủ lạnh nhận bệnh phẩm", area: "Nhận bệnh phẩm", temp: 5.3, hum: null, min: 2, max: 8, time: "08:04", code: "BM.02" },
    { stt: 14, name: "Phòng chuẩn bị hóa chất", area: "Sinh hóa", temp: 22.4, hum: 54, min: 21, max: 26, time: "08:14", code: "BM.01" },
    { stt: 15, name: "Tủ đông -20°C", area: "Miễn dịch", temp: -18.2, hum: null, min: -30, max: -10, time: "08:02", code: "BM.03" },
    { stt: 16, name: "Tủ âm sâu -80°C", area: "Sinh hóa", temp: -76.5, hum: null, min: -85, max: -70, time: "08:01", code: "BM.03" },
  ];

  // Map 16 điểm đo kết hợp dữ liệu live từ DB và Mockup
  const initialPoints: TemperaturePoint[] = targetMockPoints.map((item, index) => {
    const matchedOcc = rows[index] || null;
    let actualTemp = item.temp;
    let actualHum = item.hum;
    let actualTime = item.time;

    if (matchedOcc?.fulfilled_by_record_id) {
      const rec = recordMap.get(matchedOcc.fulfilled_by_record_id);
      if (rec?.measurement_details) {
        const detail = Array.isArray(rec.measurement_details)
          ? rec.measurement_details[0]
          : rec.measurement_details;
        if (detail?.temperature_c != null) actualTemp = Number(detail.temperature_c);
        if (detail?.humidity_pct != null) actualHum = Number(detail.humidity_pct);
        if (rec.performed_at) {
          actualTime = new Date(rec.performed_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Ho_Chi_Minh",
          });
        }
      }
    }

    const isAbnormal =
      actualTemp !== null && (actualTemp < item.min || actualTemp > item.max);

    return {
      id: matchedOcc?.id || `point-${item.stt}`,
      stt: item.stt,
      name: item.name,
      area: item.area,
      temperature: actualTemp,
      humidity: actualHum,
      isAbnormal,
      updatedAt: actualTime,
      code: item.code,
      minTemp: item.min,
      maxTemp: item.max,
    };
  });

  // Mapped Occurrences cho tab Nhập Số Liệu Inline
  const mappedOccurrences: InlineOccurrence[] = rows.map((row) => {
    let initialTemperature: number | null = null;
    let initialHumidity: number | null = null;

    if (row.fulfilled_by_record_id) {
      const rec = recordMap.get(row.fulfilled_by_record_id);
      if (rec?.measurement_details) {
        const detail = Array.isArray(rec.measurement_details)
          ? rec.measurement_details[0]
          : rec.measurement_details;
        initialTemperature = detail?.temperature_c ?? null;
        initialHumidity = detail?.humidity_pct ?? null;
      }
    }

    return {
      id: row.id,
      status: row.status,
      slot_code: row.slot_code,
      fulfilled_by_record_id: row.fulfilled_by_record_id,
      initialTemperature,
      initialHumidity,
      register_periods: row.register_periods as unknown as InlineOccurrence["register_periods"],
    };
  });

  const nowShift = currentShift();
  const todayParts = vietnamParts(new Date());
  const activeDateFormatted = `${todayParts.date.split("-").reverse().join("/")}`;

  return (
    <AppShell
      headerTitle="Khoa Sinh Hóa BV103"
      headerSubtitle="Nhiệt độ & Độ ẩm (BM.01 - BM.02 - BM.03)"
      unreadCount={unread}
    >
      <TemperatureLabDashboard
        initialPoints={initialPoints}
        occurrences={mappedOccurrences}
        activeDate={activeDateFormatted}
        activeShift={nowShift.name}
      />
    </AppShell>
  );
}

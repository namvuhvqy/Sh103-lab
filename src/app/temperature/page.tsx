import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { OperationalChart } from "@/components/p5/OperationalChart";
import { getTemperatureOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { TEMPERATURE_AREAS } from "@/constants/areas";
import { HOSPITAL_FRIDGES_13 } from "@/constants/fridges";
import { CheckCircle2, CircleAlert, Clock3, Thermometer, ShieldCheck } from "lucide-react";
import { InlineTemperatureList } from "@/components/forms/InlineTemperatureList";
import type { InlineOccurrence } from "@/components/forms/InlineTemperatureCard";

export const dynamic = "force-dynamic";

function getSafeRangeInfo(code: string) {
  if (code.includes("BM.01")) {
    return {
      range: "21°C – 26°C · Độ ẩm ≤ 70%",
      type: "Phòng xét nghiệm",
      pillClass: "bg-teal-50 text-teal-800 border-teal-200",
    };
  }
  if (code.includes("BM.02")) {
    return {
      range: "2°C – 8°C",
      type: "Tủ lạnh mát",
      pillClass: "bg-sky-50 text-sky-800 border-sky-200",
    };
  }
  if (code.includes("BM.03")) {
    return {
      range: "-30°C đến -10°C",
      type: "Tủ đông / Tủ đá",
      pillClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    };
  }
  return {
    range: "Theo tiêu chuẩn ISO 15189",
    type: "Kiểm soát nhiệt độ",
    pillClass: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

export default async function TemperaturePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const query = await searchParams;
  const group = query.group === "storage" ? "storage" : "environment";
  const [data, unread] = await Promise.all([getTemperatureOverview(), getUnreadNotificationCount()]);
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
  const rows = data.occurrences as unknown as Occurrence[];
  const filtered = rows.filter((row) =>
    group === "environment"
      ? row.register_periods.form_template_versions.form_templates.code === "BM.01/QL.HTAT.01"
      : ["BM.02/QL.HTAT.01", "BM.03/QL.HTAT.01"].includes(
          row.register_periods.form_template_versions.form_templates.code
        )
  );
  const done = filtered.filter((row) => row.status !== "PENDING").length;
  type MeasurementRecord = {
    id: string;
    performed_at: string | null;
    slot_code: string | null;
    measurement_details:
      | Array<{ temperature_c: number | null; humidity_pct: number | null }>
      | { temperature_c: number | null; humidity_pct: number | null }
      | null;
  };
  const recordList = data.records as unknown as MeasurementRecord[];
  const recordMap = new Map(recordList.map((r) => [r.id, r]));

  const mappedOccurrences: InlineOccurrence[] = filtered.map((row) => {
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

  const chartPoints = recordList.flatMap((record) => {
    const detail = Array.isArray(record.measurement_details)
      ? record.measurement_details[0]
      : record.measurement_details;
    return detail?.temperature_c == null
      ? []
      : [
          {
            label: record.performed_at
              ? new Date(record.performed_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Ho_Chi_Minh",
                })
              : record.slot_code ?? "—",
            value: Number(detail.temperature_c),
          },
        ];
  });

  return (
    <AppShell headerTitle="Nhiệt độ & Độ ẩm" headerSubtitle="BM.01 · BM.02 · BM.03" unreadCount={unread}>
      <div className="space-y-6">
        {/* Banner tổng quan */}
        <section className="rounded-[1.75rem] bg-gradient-to-br from-teal-900 via-cyan-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-md">
              <Thermometer className="size-7 text-teal-300" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Hôm nay · {data.today}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black">Theo dõi Nhiệt độ &amp; Độ ẩm</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-200">
            {done}/{filtered.length} điểm trong nhóm hiện tại đã được xử lý theo ca trực.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-teal-400 transition-all duration-500"
              style={{ width: `${filtered.length ? Math.round((done / filtered.length) * 100) : 0}%` }}
            />
          </div>
        </section>

        {/* Tab chuyển đổi môi trường */}
        <SegmentedControl
          active={group === "environment" ? "Môi trường PXN" : "Tủ lạnh / Tủ đá"}
          items={[
            { label: "Môi trường PXN", href: "/temperature?group=environment" },
            { label: "Tủ lạnh / Tủ đá", href: "/temperature?group=storage" },
          ]}
        />

        {/* 5 Khu vực giám sát nhiệt độ chuẩn Viện 103 */}
        {group === "environment" ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-teal-900">
                5 Khu vực theo dõi nhiệt độ &amp; độ ẩm (BM.01)
              </h2>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Ngưỡng chuẩn: 21–26°C · 20–80%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {TEMPERATURE_AREAS.map((a) => (
                <div
                  key={a.code}
                  className="rounded-xl border border-teal-100 bg-white p-3 text-center shadow-xs transition hover:border-teal-300"
                >
                  <p className="text-xs font-black text-slate-900">{a.name}</p>
                  <p className="mt-1 text-[10px] font-bold text-teal-700">{a.normTemp}</p>
                  <p className="text-[10px] text-slate-500">{a.normHumidity}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-teal-900">
                13 Tủ bảo quản / Tủ lạnh &amp; Tủ đá (BM.02 &amp; BM.03)
              </h2>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Danh mục Phụ lục TTB
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {HOSPITAL_FRIDGES_13.map((f) => (
                <div
                  key={f.code}
                  className="rounded-2xl border border-sky-100 bg-white p-3.5 shadow-xs transition hover:border-teal-300"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                      {f.code}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        f.type === "FREEZER"
                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                          : "bg-sky-50 text-sky-800 border-sky-200"
                      }`}
                    >
                      {f.tempRange}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-900 leading-snug">{f.name}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>{f.locationName}</span>
                    <span className="font-semibold text-teal-700">{f.trackingDevice}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Biểu đồ xu hướng */}
        <OperationalChart
          title="Xu hướng nhiệt độ thực tế"
          unit="°C"
          points={chartPoints}
          description="Không nội suy điểm đo còn thiếu — Grounded in real measurements"
        />

        {/* Ghi nhận nhiệt độ trực tiếp (Inline Click-to-Edit Mobile tốc độ cao) */}
        <InlineTemperatureList initialOccurrences={mappedOccurrences} />
      </div>
    </AppShell>
  );
}

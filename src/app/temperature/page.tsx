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
    performed_at: string | null;
    slot_code: string | null;
    measurement_details:
      | Array<{ temperature_c: number | null; humidity_pct: number | null }>
      | { temperature_c: number | null; humidity_pct: number | null }
      | null;
  };
  const chartPoints = (data.records as unknown as MeasurementRecord[]).flatMap((record) => {
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

        {/* Danh sách phiếu ca hiện tại */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Phiếu ca hiện tại</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Ghi nhận theo slot: MORNING (08:00) và AFTERNOON (14:00)
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {filtered.length} điểm đo
            </span>
          </div>

          {filtered.length ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {filtered.map((row) => {
                const completed = row.status !== "PENDING";
                const code = row.register_periods.form_template_versions.form_templates.code;
                const label =
                  row.register_periods.locations?.name ??
                  row.register_periods.assets?.source_name ??
                  row.register_periods.form_template_versions.form_templates.name;

                const rangeInfo = getSafeRangeInfo(code);

                return (
                  <article
                    key={row.id}
                    className="flex min-w-0 flex-col justify-between rounded-3xl border border-cyan-100 bg-white p-4 sm:p-5 shadow-xs hover:border-teal-300 transition overflow-hidden"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black tracking-wide text-teal-800 truncate">
                            {code} · {row.slot_code ?? "Ca đo"}
                          </p>
                          <h3 className="mt-1 font-black text-sm sm:text-base text-slate-950 truncate">
                            {label}
                          </h3>
                          {row.register_periods.assets?.storage_purpose ? (
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {row.register_periods.assets.storage_purpose}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            completed
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {completed ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
                          {completed ? (row.status === "N_A" ? "Không áp dụng" : "Đã ghi") : "Chưa đo"}
                        </span>
                      </div>

                      {/* Dải an toàn trực quan theo tiêu chuẩn ISO */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
                          <ShieldCheck className="size-3.5 text-teal-600" />
                          Ngưỡng chuẩn:
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold truncate max-w-full border ${rangeInfo.pillClass}`}>
                          {rangeInfo.range}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={row.fulfilled_by_record_id ? `/records/${row.fulfilled_by_record_id}` : `/entry/${row.id}`}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-teal-800 px-4 font-bold text-white shadow-xs hover:bg-teal-900 transition text-sm text-center"
                    >
                      {completed ? "Xem chi tiết" : "Ghi số đo"}
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Không có điểm đo"
                description="Không có nghĩa vụ phù hợp với bộ lọc hôm nay."
                icon={<CircleAlert />}
              />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getRecord } from "@/lib/forms/queries";

export const dynamic = "force-dynamic";

function Detail({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  return <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{String(value)}</dd></div>;
}

export default async function RecordPage({ params }: { params: Promise<{ recordId: string }> }) {
  const record = await getRecord((await params).recordId);
  if (!record) notFound();
  const measurement = Array.isArray(record.measurement_details) ? record.measurement_details[0] : record.measurement_details as Record<string, unknown> | null;
  const decontamination = Array.isArray(record.decontamination_details) ? record.decontamination_details[0] : record.decontamination_details as Record<string, unknown> | null;
  const maintenance = Array.isArray(record.maintenance_details) ? record.maintenance_details[0] : record.maintenance_details as Record<string, unknown> | null;
  return <AppShell headerTitle="Chi tiết bản ghi">
    <p className="text-sm font-bold text-blue-800">{record.record_type}</p>
    <h1 className="mt-1 text-3xl font-bold text-slate-950">{record.business_date}{record.slot_code ? ` · ${record.slot_code}` : ""}</h1>
    <p className="mt-2 text-sm text-slate-600">Bản ghi chỉ đọc · Trạng thái {record.record_state}</p>
    <dl className="mt-6 grid gap-3 sm:grid-cols-2">
      <Detail label="Không áp dụng" value={record.is_na ? "Có" : "Không"}/><Detail label="Ghi chú" value={record.note}/>
      <Detail label="Nhiệt độ" value={measurement?.temperature_c}/><Detail label="Độ ẩm" value={measurement?.humidity_pct}/>
      <Detail label="Hằng ngày" value={decontamination?.daily_done}/><Detail label="Hằng tuần" value={decontamination?.weekly_done}/><Detail label="Tràn đổ" value={decontamination?.spill_event_done}/>
      <Detail label="Chu kỳ bảo dưỡng" value={maintenance?.cadence}/><Detail label="Kết quả" value={maintenance?.result}/>
    </dl>
    {record.equipment_shift_statuses?.length ? <section className="mt-8"><h2 className="text-xl font-bold">Trạng thái thiết bị</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...record.equipment_shift_statuses].sort((a,b)=>a.asset_display_order_snapshot-b.asset_display_order_snapshot).map(item=><div key={item.asset_display_order_snapshot} className="rounded-xl border bg-white p-3"><b>#{item.asset_display_order_snapshot} · {item.asset_label_snapshot}</b><p className="text-sm text-slate-600">{item.status_code}</p></div>)}</div></section>:null}
  </AppShell>;
}

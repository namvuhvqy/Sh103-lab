import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowFeedback } from "@/components/forms/WorkflowFeedback";
import { getCorrectionContext } from "@/lib/forms/workflow";
import { createCorrectionAction } from "./actions";

export const dynamic = "force-dynamic";

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

type ShiftStatus = {
  asset_id: string;
  asset_display_order_snapshot: number;
  status_code: "BT" | "KSD" | "H";
  asset_label_snapshot: string;
};

export default async function CorrectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { recordId } = await params;
  const query = await searchParams;
  const record = await getCorrectionContext(recordId);
  if (!record) notFound();

  const measurement = one(record.measurement_details) as {
    temperature_c?: number;
    humidity_pct?: number;
  } | null;
  const cleaning = one(record.decontamination_details) as {
    daily_done?: boolean;
    weekly_done?: boolean;
    spill_event_done?: boolean;
  } | null;
  const maintenance = one(record.maintenance_details) as {
    cadence?: string;
    result?: string;
  } | null;
  const shift = one(record.equipment_shift_details) as {
    usage_value?: number;
    usage_unit?: string;
    equipment_shift_statuses?: ShiftStatus[];
  } | null;
  const statuses = [...(shift?.equipment_shift_statuses ?? [])].sort(
    (a, b) => a.asset_display_order_snapshot - b.asset_display_order_snapshot,
  );

  const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base";

  return (
    <AppShell headerTitle="Tạo đính chính">
      <p className="text-xs font-bold text-blue-800">
        {record.record_type} · Revision {record.revision_no}
      </p>
      <h1 className="mt-1 text-3xl font-bold">Đính chính bản ghi</h1>
      <p className="mt-2 text-slate-600">
        Bản gốc được bảo toàn. Bản mới chỉ có hiệu lực sau khi Trưởng khoa xác nhận.
      </p>
      <WorkflowFeedback error={query.error} />

      <section aria-labelledby="original-record-heading" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 id="original-record-heading" className="font-bold">Bản gốc · chỉ đọc</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-500">Ngày nghiệp vụ</dt><dd className="font-semibold">{record.business_date}</dd></div>
          <div><dt className="text-slate-500">Ca</dt><dd className="font-semibold">{record.slot_code ?? "—"}</dd></div>
          <div><dt className="text-slate-500">Ghi chú</dt><dd className="font-semibold">{record.note ?? "—"}</dd></div>
          {measurement ? <><div><dt className="text-slate-500">Nhiệt độ</dt><dd className="font-semibold">{measurement.temperature_c ?? "—"}</dd></div><div><dt className="text-slate-500">Độ ẩm</dt><dd className="font-semibold">{measurement.humidity_pct ?? "—"}</dd></div></> : null}
          {maintenance ? <><div><dt className="text-slate-500">Chu kỳ</dt><dd className="font-semibold">{maintenance.cadence ?? "—"}</dd></div><div><dt className="text-slate-500">Kết quả</dt><dd className="font-semibold">{maintenance.result ?? "—"}</dd></div></> : null}
          {shift ? <div><dt className="text-slate-500">Thiết bị</dt><dd className="font-semibold">{statuses.length} dòng trạng thái</dd></div> : null}
        </dl>
      </section>

      <form action={createCorrectionAction} className="mt-6 space-y-5 rounded-2xl border bg-white p-5">
        <input type="hidden" name="recordId" value={record.id} />
        <input type="hidden" name="recordType" value={record.record_type} />

        {record.record_type === "MEASUREMENT" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-semibold">
              Nhiệt độ
              <input type="number" step="0.1" name="temperature_c" defaultValue={measurement?.temperature_c} className={fieldClass} />
            </label>
            <label className="font-semibold">
              Độ ẩm
              <input type="number" step="0.1" name="humidity_pct" defaultValue={measurement?.humidity_pct} className={fieldClass} />
            </label>
          </div>
        ) : null}

        {record.record_type === "DECONTAMINATION" ? (
          <fieldset className="space-y-2">
            <legend className="font-semibold">Hoạt động khử nhiễm</legend>
            {[
              ["daily_done", "Hằng ngày", cleaning?.daily_done],
              ["weekly_done", "Hằng tuần", cleaning?.weekly_done],
              ["spill_event_done", "Xử lý tràn đổ", cleaning?.spill_event_done],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="flex min-h-11 items-center gap-3 rounded-xl border px-3">
                <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="size-5" />
                {String(label)}
              </label>
            ))}
          </fieldset>
        ) : null}

        {record.record_type === "MAINTENANCE" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-semibold">
              Chu kỳ
              <select name="cadence" defaultValue={maintenance?.cadence} className={fieldClass}>
                <option value="DAILY">Hằng ngày</option>
                <option value="WEEKLY">Hằng tuần</option>
                <option value="MONTHLY">Hằng tháng</option>
              </select>
            </label>
            <label className="font-semibold">
              Kết quả
              <select name="result" defaultValue={maintenance?.result} className={fieldClass}>
                <option value="PASS">Đạt</option>
                <option value="FAIL">Không đạt</option>
              </select>
            </label>
          </div>
        ) : null}

        {record.record_type === "EQUIPMENT_SHIFT" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-semibold">
                Giá trị sử dụng
                <input type="number" step="0.01" name="usage_value" defaultValue={shift?.usage_value} className={fieldClass} />
              </label>
              <label className="font-semibold">
                Đơn vị
                <input name="usage_unit" defaultValue={shift?.usage_unit} className={fieldClass} />
              </label>
            </div>
            <fieldset className="space-y-3">
              <legend className="font-semibold">Trạng thái thiết bị</legend>
              {statuses.map((status) => (
                <label key={status.asset_id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_9rem] sm:items-center">
                  <span>{status.asset_display_order_snapshot}. {status.asset_label_snapshot}</span>
                  <select name={`status:${status.asset_id}`} defaultValue={status.status_code} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3">
                    <option value="BT">Bình thường</option>
                    <option value="KSD">Không sử dụng</option>
                    <option value="H">Hỏng</option>
                  </select>
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}

        <label className="block font-semibold">
          Ghi chú
          <textarea name="note" defaultValue={record.note ?? ""} rows={3} className={`${fieldClass} py-3`} />
        </label>
        <label className="block font-semibold">
          Lý do đính chính <span aria-hidden="true" className="text-red-700">*</span>
          <textarea name="reason" required rows={3} className={`${fieldClass} py-3`} />
        </label>
        <button className="min-h-11 w-full rounded-xl bg-blue-700 px-5 font-bold text-white sm:w-auto">
          Gửi đề nghị đính chính
        </button>
      </form>
    </AppShell>
  );
}

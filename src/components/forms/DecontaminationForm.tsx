import { saveDecontaminationAction } from "@/app/areas/[areaCode]/knbm/actions";

export interface DecontaminationValues {
  daily: boolean;
  weekly: boolean;
  spill: boolean;
  note: string;
}

interface Props {
  periodId: string;
  areaCode: string;
  today: string;
  returnTo?: string;
  defaultValues?: DecontaminationValues;
  submitLabel?: string;
}

const ACTIVITIES = [
  ["daily", "Daily", "Khử nhiễm hằng ngày"],
  ["weekly", "Weekly", "Khử nhiễm hằng tuần"],
  ["spill", "Spill", "Xử lý tràn đổ"],
] as const;

export function DecontaminationForm({
  periodId,
  areaCode,
  today,
  returnTo,
  defaultValues = { daily: false, weekly: false, spill: false, note: "" },
  submitLabel = "Lưu khử nhiễm",
}: Props) {
  return (
    <form action={saveDecontaminationAction} className="space-y-4 rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm sm:p-5">
      <input type="hidden" name="periodId" value={periodId} />
      <input type="hidden" name="areaCode" value={areaCode} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
        Ngày thực hiện
        <input
          required
          type="date"
          name="businessDate"
          defaultValue={today}
          className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <fieldset>
        <legend className="text-xs font-black uppercase tracking-wider text-slate-700">Hoạt động đã thực hiện</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ACTIVITIES.map(([name, label, description]) => (
            <label key={name} className="flex min-h-12 items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm transition hover:border-teal-200 hover:bg-teal-50/40">
              <input
                type="checkbox"
                name={name}
                defaultChecked={defaultValues[name]}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span>
                <span className="block font-black text-slate-900">{label}</span>
                <span className="text-xs font-medium text-slate-500">{description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
        Ghi chú
        <textarea
          name="note"
          defaultValue={defaultValues.note}
          className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
        />
      </label>

      <button className="min-h-12 w-full rounded-2xl bg-teal-800 px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal-900 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
        {submitLabel}
      </button>
    </form>
  );
}

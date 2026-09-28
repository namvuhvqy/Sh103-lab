import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import { DecontaminationForm } from "./DecontaminationForm";
import type { DecontaminationWorkspaceArea } from "@/lib/p5/operational-queries";

interface Props {
  today: string;
  shift: string;
  areas: DecontaminationWorkspaceArea[];
}

const doneLabel = (area: DecontaminationWorkspaceArea) => {
  const done = [area.daily, area.weekly, area.spill].filter(Boolean).length;
  if (done === 0) return "Chưa thực hiện";
  if (area.status === "N_A") return "Không áp dụng";
  return `Đã ghi ${done}/3 mục`;
};

export function DecontaminationWorkspace({ today, shift, areas }: Props) {
  const completed = areas.filter((area) => area.status !== "PENDING" || area.recordId).length;
  const returnTo = `/decontamination?date=${encodeURIComponent(today)}&shift=${encodeURIComponent(shift)}`;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-5 shadow-[0_14px_40px_rgba(14,116,144,0.09)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#0f766e_var(--progress),#dff8f4_0)] p-2"
            style={{ "--progress": `${(completed / Math.max(areas.length, 1)) * 100}%` } as React.CSSProperties}
          >
            <div className="grid size-full place-items-center rounded-full bg-white text-center">
              <span>
                <b className="block text-2xl text-slate-950">{completed}/{areas.length}</b>
                <small className="font-bold text-teal-700">đã xử lý</small>
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Ngày · {today} · {shift}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Nhập nhanh khử nhiễm bề mặt</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Hiển thị sẵn toàn bộ 5 khu vực áp dụng BM.01_KNBM. Mỗi khu lưu độc lập Daily / Weekly / Spill vào đúng period/occurrence; refresh đọc lại dữ liệu đã lưu.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="knbm-areas-title" className="space-y-4">
        <div>
          <h2 id="knbm-areas-title" className="text-xl font-black text-slate-950">5 khu vực làm việc</h2>
          <p className="mt-1 text-sm text-slate-600">Nhập trực tiếp tại màn này, không chuyển sang workflow mới.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {areas.map((area, index) => {
            const done = area.status !== "PENDING" || area.recordId;
            return (
              <article key={area.id} id={`knbm-${area.code}`} className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
                <header className="flex items-start gap-3 border-b border-cyan-50 bg-cyan-50/40 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white font-black text-teal-800 shadow-sm">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-950">{area.name}</h3>
                    <p className="text-xs font-semibold text-slate-500">BM.01_KNBM · {area.code}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${done ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                    {done ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                    {doneLabel(area)}
                  </span>
                </header>
                <div className="p-3 sm:p-4">
                  {area.periodId ? (
                    <DecontaminationForm
                      periodId={area.periodId}
                      areaCode={area.code}
                      today={today}
                      returnTo={`${returnTo}#knbm-${area.code}`}
                      defaultValues={{ daily: area.daily, weekly: area.weekly, spill: area.spill, note: area.note }}
                      submitLabel={`Lưu ${area.code}`}
                    />
                  ) : (
                    <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-800">
                      Chưa tìm thấy period BM.01_KNBM cho khu vực này. Vui lòng tải lại sau khi hệ thống khởi tạo tháng vận hành.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="rounded-3xl bg-teal-950 p-5 text-white">
        <Sparkles className="size-6 text-cyan-300" />
        <h2 className="mt-3 text-lg font-black">Sự kiện tràn đổ</h2>
        <p className="mt-1 text-sm text-white/75">
          Spill chỉ được ghi khi thực sự phát sinh. Người thực tế bấm lưu vẫn được ghi bằng tài khoản đăng nhập qua entered_by = auth.uid().
        </p>
      </aside>
    </div>
  );
}

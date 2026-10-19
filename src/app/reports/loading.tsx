export default function ReportsLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải báo cáo" className="space-y-5 animate-pulse p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 rounded-xl bg-teal-100/70" />
        <div className="h-10 w-44 rounded-xl bg-slate-100" />
      </div>
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <div className="h-9 w-32 rounded-xl bg-teal-100" />
        <div className="h-9 w-32 rounded-xl bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-slate-200 bg-white/70" />
        ))}
      </div>
    </div>
  );
}

export default function TemperatureLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu nhiệt độ" className="space-y-5 animate-pulse p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded-xl bg-teal-100/70" />
        <div className="h-9 w-28 rounded-xl bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100/80" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-3xl border border-slate-200/60 bg-white/70 p-4" />
        ))}
      </div>
    </div>
  );
}

export default function EquipmentLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu thiết bị" className="space-y-6 animate-pulse p-4 sm:p-6">
      <div className="h-32 rounded-[2rem] bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-slate-900/40" />
      <div className="h-16 rounded-3xl border border-slate-200 bg-white/80" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-9 w-32 rounded-full bg-slate-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100/80" />
        ))}
      </div>
      <div className="h-96 rounded-3xl border border-slate-200 bg-white/80" />
    </div>
  );
}

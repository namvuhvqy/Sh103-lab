export default function MoreLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh mục tiện ích" className="space-y-6 animate-pulse p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-teal-100/70" />
        <div className="h-4 w-80 rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-slate-200/60 bg-white/80 p-3.5" />
        ))}
      </div>
    </div>
  );
}


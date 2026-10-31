export default function DecontaminationLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu khử nhiễm" className="mx-auto max-w-5xl space-y-5 animate-pulse p-4 sm:p-6">
      <div className="h-28 rounded-3xl border border-slate-200/70 bg-white/80" />
      <div className="h-20 rounded-3xl border border-teal-100 bg-teal-50/40" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-36 rounded-3xl border border-slate-200/60 bg-white/70 p-4" />
        ))}
      </div>
    </div>
  );
}


export default function Loading() {
  return <main aria-busy="true" aria-label="Đang tải nội dung" className="mx-auto min-h-screen w-full max-w-7xl animate-pulse space-y-5 p-4 md:p-6"><div className="h-7 w-52 rounded-xl bg-cyan-100" /><div className="h-36 rounded-[1.75rem] bg-gradient-to-r from-cyan-100 to-teal-50" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-3xl bg-slate-100" />)}</div><p className="sr-only">Đang tải dữ liệu từ hệ thống…</p></main>;
}

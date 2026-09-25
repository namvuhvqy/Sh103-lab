"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><section role="alert" className="w-full max-w-lg rounded-[1.75rem] border border-red-100 bg-white p-7 text-center shadow-lg"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-700"><CircleAlert className="size-7" /></span><h1 className="mt-4 text-2xl font-black text-slate-950">Không tải được dữ liệu</h1><p className="mt-2 text-slate-600">Kết nối hoặc truy vấn gặp lỗi. Dữ liệu chưa được thay đổi.</p><button onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 px-5 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"><RotateCcw className="size-4" />Thử lại</button></section></main>;
}

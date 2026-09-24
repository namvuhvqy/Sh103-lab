import Link from "next/link";
import { ArrowRight, Beaker, Microscope, TestTubeDiagonal, RefreshCw, ClipboardCheck } from "lucide-react";

const icons = { SINH_HOA: Beaker, MIEN_DICH: Microscope, NUOC_TIEU: TestTubeDiagonal, LY_TAM: RefreshCw, NHAN_BENH_PHAM: ClipboardCheck } as const;
const shortNames: Record<string,string> = { SINH_HOA: "Sinh hóa", MIEN_DICH: "Miễn dịch", NUOC_TIEU: "Nước tiểu", LY_TAM: "Ly tâm", NHAN_BENH_PHAM: "Nhận bệnh phẩm" };
export interface AreaCardProps { code: string; name: string; deviceCount: number; completed: number; total: number; }
export function AreaCard({ code,name,deviceCount,completed,total }: AreaCardProps) {
  const Icon=icons[code as keyof typeof icons] ?? Beaker; const percent=total?Math.round(completed/total*100):0;
  return <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus-within:ring-4 focus-within:ring-blue-100">
    <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-800"><Icon className="h-6 w-6" aria-hidden="true"/></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{deviceCount ? `${deviceCount} máy` : "0 máy"}</span></div>
    <h2 className="mt-4 text-lg font-bold text-slate-950">{name}</h2><p className="mt-1 text-sm text-slate-600">{deviceCount ? `${completed}/${total} máy đã ghi nhận` : "Không có máy — Chỉ khử nhiễm"}</p>
    {deviceCount ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Tiến độ ${percent}%`}><div className="h-full rounded-full bg-blue-700" style={{width:`${percent}%`}}/></div>:null}
    <Link href={`/areas/${code}`} aria-label={`Vào khu ${shortNames[code] ?? name}`} className="mt-5 flex min-h-11 items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-blue-800">Vào chi tiết khu vực <ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
  </article>;
}

import Link from "next/link";
import { ArrowRight, Beaker, Microscope, TestTubeDiagonal, RefreshCw, ClipboardCheck } from "lucide-react";

const icons = { SINH_HOA: Beaker, MIEN_DICH: Microscope, NUOC_TIEU: TestTubeDiagonal, LY_TAM: RefreshCw, NHAN_BENH_PHAM: ClipboardCheck } as const;
const shortNames: Record<string,string> = { SINH_HOA: "Sinh hóa", MIEN_DICH: "Miễn dịch", NUOC_TIEU: "Nước tiểu", LY_TAM: "Ly tâm", NHAN_BENH_PHAM: "Nhận bệnh phẩm" };
export interface AreaCardProps { code: string; name: string; deviceCount: number; completed: number; total: number; }
export function AreaCard({ code,name,deviceCount,completed,total }: AreaCardProps) {
  const Icon=icons[code as keyof typeof icons] ?? Beaker; const percent=total?Math.round(completed/total*100):0;
  return <article className="group clinical-card min-w-[8.75rem] overflow-hidden transition hover:-translate-y-0.5 hover:border-teal-300 focus-within:ring-2 focus-within:ring-teal-500">
    <Link href={`/areas/${code}`} aria-label={`Vào khu ${shortNames[code] ?? name}`} className="flex h-full min-h-32 flex-col p-3.5">
      <div className="flex items-start justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-800"><Icon className="size-5" aria-hidden="true"/></span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{deviceCount ? `${deviceCount} máy` : "0 máy"}</span></div>
      <h2 className="mt-3 text-sm font-extrabold leading-4 text-slate-950">{shortNames[code] ?? name}</h2><p className="mt-1 text-[11px] leading-4 text-slate-500">{deviceCount ? `${completed}/${total} máy đã ghi nhận` : "Không có máy — Chỉ khử nhiễm"}</p>
      {deviceCount ? <div className="mt-auto pt-3"><div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`Tiến độ ${percent}%`}><div className="h-full rounded-full bg-teal-600" style={{width:`${percent}%`}}/></div></div>:<ArrowRight className="mt-auto size-4 self-end text-teal-700" aria-hidden="true"/>}
    </Link>
  </article>;
}

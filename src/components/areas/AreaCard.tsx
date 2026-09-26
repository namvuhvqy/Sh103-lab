import Link from "next/link";
import { ArrowRight, Beaker, Microscope, TestTubeDiagonal, RefreshCw, ClipboardCheck } from "lucide-react";

const icons = { SINH_HOA: Beaker, MIEN_DICH: Microscope, NUOC_TIEU: TestTubeDiagonal, LY_TAM: RefreshCw, NHAN_BENH_PHAM: ClipboardCheck } as const;
const shortNames: Record<string,string> = { SINH_HOA: "Sinh hóa", MIEN_DICH: "Miễn dịch", NUOC_TIEU: "Nước tiểu", LY_TAM: "Ly tâm", NHAN_BENH_PHAM: "Nhận bệnh phẩm" };
const areaThemes: Record<
  string,
  { iconBox: string; iconColor: string; badge: string; progress: string }
> = {
  SINH_HOA: {
    iconBox: "bg-teal-50 border border-teal-200/60",
    iconColor: "text-teal-700",
    badge: "bg-teal-100/70 text-teal-800",
    progress: "bg-teal-600",
  },
  MIEN_DICH: {
    iconBox: "bg-indigo-50 border border-indigo-200/60",
    iconColor: "text-indigo-700",
    badge: "bg-indigo-100/70 text-indigo-800",
    progress: "bg-indigo-600",
  },
  NUOC_TIEU: {
    iconBox: "bg-amber-50 border border-amber-200/60",
    iconColor: "text-amber-700",
    badge: "bg-amber-100/70 text-amber-800",
    progress: "bg-amber-500",
  },
  LY_TAM: {
    iconBox: "bg-purple-50 border border-purple-200/60",
    iconColor: "text-purple-700",
    badge: "bg-purple-100/70 text-purple-800",
    progress: "bg-purple-600",
  },
  NHAN_BENH_PHAM: {
    iconBox: "bg-rose-50 border border-rose-200/60",
    iconColor: "text-rose-700",
    badge: "bg-rose-100/70 text-rose-800",
    progress: "bg-rose-500",
  },
};

export interface AreaCardProps {
  code: string;
  name: string;
  deviceCount: number;
  completed: number;
  total: number;
}

export function AreaCard({ code, name, deviceCount, completed, total }: AreaCardProps) {
  const Icon = icons[code as keyof typeof icons] ?? Beaker;
  const theme = areaThemes[code] ?? areaThemes.SINH_HOA;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <article className="group clinical-card min-w-[8.75rem] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-within:ring-2 focus-within:ring-teal-500">
      <Link
        href={`/areas/${code}`}
        aria-label={`Vào khu ${shortNames[code] ?? name}`}
        className="flex h-full min-h-32 flex-col p-3.5"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`grid size-10 place-items-center rounded-2xl shadow-2xs ${theme.iconBox}`}>
            <Icon className={`size-5 ${theme.iconColor}`} aria-hidden="true" />
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${theme.badge}`}>
            {deviceCount ? `${deviceCount} máy` : "0 máy"}
          </span>
        </div>
        <h2 className="mt-3 text-sm font-black leading-4 text-slate-900">
          {shortNames[code] ?? name}
        </h2>
        <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
          {deviceCount ? `${completed}/${total} máy đã ghi nhận` : "Không có máy — Chỉ khử nhiễm"}
        </p>
        {deviceCount ? (
          <div className="mt-auto pt-3">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              aria-label={`Tiến độ ${percent}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${theme.progress}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : (
          <ArrowRight className="mt-auto size-4 self-end text-rose-600" aria-hidden="true" />
        )}
      </Link>
    </article>
  );
}

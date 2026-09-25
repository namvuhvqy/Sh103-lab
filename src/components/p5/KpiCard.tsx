import Link from "next/link";
import { ArrowUpRight, CircleAlert, CircleCheck, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: { surface: "border-sky-100 bg-white", icon: "bg-sky-50 text-sky-700", value: "text-slate-950" },
  success: { surface: "border-emerald-100 bg-white", icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-800" },
  warning: { surface: "border-amber-100 bg-white", icon: "bg-amber-50 text-amber-700", value: "text-amber-800" },
  danger: { surface: "border-red-100 bg-white", icon: "bg-red-50 text-red-700", value: "text-red-800" },
} as const;

type Tone = keyof typeof tones;

export function KpiCard({ label, value, status, tone = "neutral", href, icon }: { label: string; value: string | number; status: string; tone?: Tone; href: string; icon?: React.ReactNode }) {
  const styles = tones[tone];
  const StatusIcon = tone === "success" ? CircleCheck : tone === "neutral" ? CircleDot : CircleAlert;
  return (
    <Link href={href} aria-label={`${label}: ${value}, ${status}`} className={cn("group relative min-h-36 overflow-hidden rounded-3xl border p-4 shadow-[0_10px_30px_rgba(14,116,144,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(14,116,144,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2", styles.surface)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 place-items-center rounded-2xl", styles.icon)}>{icon ?? <StatusIcon aria-hidden="true" className="size-5" />}</span>
        <ArrowUpRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:text-teal-700" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
      <p className={cn("mt-1 text-2xl font-black tracking-tight", styles.value)}>{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600"><StatusIcon aria-hidden="true" className="size-3.5" />{status}</p>
    </Link>
  );
}

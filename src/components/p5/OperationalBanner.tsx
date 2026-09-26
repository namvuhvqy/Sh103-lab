import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: {
    container: "bg-gradient-to-r from-teal-50/95 via-sky-50/85 to-blue-50/90 border-teal-200/80 text-slate-900 shadow-sm",
    eyebrow: "text-teal-800",
    title: "text-slate-950",
    desc: "text-slate-600",
    iconBox: "bg-teal-500/15 text-teal-700 ring-teal-500/20",
    btn: "bg-teal-700 text-white hover:bg-teal-800",
  },
  success: {
    container: "bg-gradient-to-r from-teal-50/95 via-sky-50/85 to-blue-50/90 border-teal-200/80 text-slate-900 shadow-sm",
    eyebrow: "text-teal-800",
    title: "text-slate-950",
    desc: "text-slate-600",
    iconBox: "bg-teal-500/20 text-teal-700 ring-teal-600/30",
    btn: "bg-teal-700 text-white hover:bg-teal-800",
  },
  warning: {
    container: "bg-gradient-to-r from-amber-50 via-orange-50/90 to-rose-50 border-amber-200 text-amber-950 shadow-sm",
    eyebrow: "text-amber-800",
    title: "text-amber-950",
    desc: "text-amber-800",
    iconBox: "bg-amber-500/20 text-amber-700 ring-amber-500/30",
    btn: "bg-amber-700 text-white hover:bg-amber-800",
  },
  danger: {
    container: "bg-gradient-to-r from-rose-50 via-red-50/90 to-orange-50 border-red-200 text-red-950 shadow-sm",
    eyebrow: "text-red-800",
    title: "text-red-950",
    desc: "text-red-800",
    iconBox: "bg-red-500/20 text-red-700 ring-red-500/30",
    btn: "bg-red-700 text-white hover:bg-red-800",
  },
} as const;

export function OperationalBanner({
  title,
  description,
  href,
  cta,
  tone = "neutral",
  eyebrow = "Hoạt động khoa",
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone?: keyof typeof toneStyles;
  eyebrow?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "neutral" ? Info : CircleAlert;
  const theme = toneStyles[tone];

  return (
    <section
      aria-labelledby="operational-title"
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border p-5 sm:p-6 transition",
        theme.container
      )}
    >
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl ring-1 shadow-xs",
              theme.iconBox
            )}
          >
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] font-black uppercase tracking-wider", theme.eyebrow)}>
              {eyebrow}
            </p>
            <h2
              id="operational-title"
              className={cn("mt-1 text-lg sm:text-2xl font-black leading-tight", theme.title)}
            >
              {title}
            </h2>
            <p className={cn("mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed", theme.desc)}>
              {description}
            </p>
          </div>
        </div>

        <Link
          href={href}
          className={cn(
            "inline-flex shrink-0 min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs transition focus-visible:outline-none focus-visible:ring-2 w-full sm:w-auto",
            theme.btn
          )}
        >
          {cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}

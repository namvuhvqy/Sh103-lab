import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "from-teal-800 via-cyan-800 to-sky-800",
  success: "from-emerald-800 via-teal-800 to-cyan-800",
  warning: "from-amber-700 via-orange-700 to-rose-700",
  danger: "from-red-800 via-rose-800 to-orange-800",
} as const;

export function OperationalBanner({ title, description, href, cta, tone = "neutral", eyebrow = "Trạng thái vận hành" }: { title: string; description: string; href: string; cta: string; tone?: keyof typeof toneStyles; eyebrow?: string }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "neutral" ? Info : CircleAlert;
  return (
    <section aria-labelledby="operational-title" className={cn("relative isolate overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_14px_36px_rgba(8,145,178,0.16)] md:p-6", toneStyles[tone])}>
      <div aria-hidden="true" className="absolute -right-12 -top-14 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><Icon aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-50">{eyebrow}</p>
          <h2 id="operational-title" className="mt-1 text-lg font-black leading-tight md:text-2xl">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/85 sm:text-sm">{description}</p>
          <Link href={href} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-teal-900 shadow-sm transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-800">{cta}<ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
      </div>
    </section>
  );
}

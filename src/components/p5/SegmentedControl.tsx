import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SegmentItem { label: string; href: string; count?: number; }

export function SegmentedControl({ items, active, label = "Bộ lọc chế độ", wrap = false }: { items: SegmentItem[]; active: string; label?: string; wrap?: boolean }) {
  return (
    <nav aria-label={label} className={cn("flex max-w-full gap-1 rounded-2xl bg-slate-100 p-1", wrap ? "flex-wrap" : "overflow-x-auto [scrollbar-width:none]")}>
      {items.map((item) => {
        const selected = item.label === active;
        return <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={cn("inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600", selected ? "bg-teal-800 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950")}>{item.label}{item.count === undefined ? null : <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", selected ? "bg-white/20" : "bg-white text-slate-700")}>{item.count}</span>}</Link>;
      })}
    </nav>
  );
}

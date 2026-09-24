import Link from "next/link";
import type { ReactNode } from "react";

const adminLinks = [
  ["Khu vực", "/admin/locations"],
  ["Thiết bị & tủ", "/admin/assets"],
  ["Nhân sự", "/admin/users"],
  ["Master Data", "/admin/master"],
  ["Seed / Import", "/admin/import"],
] as const;

export function AdminPageShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6">
      <header className="rounded-3xl bg-zinc-950 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">SH103-Lab · Quản trị</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300">{description}</p>
      </header>
      <nav aria-label="Điều hướng quản trị" className="my-5 flex gap-2 overflow-x-auto pb-1">
        {adminLinks.map(([label, href]) => <Link key={href} href={href} className="min-h-11 shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:border-teal-500">{label}</Link>)}
      </nav>
      {children}
    </main>
  );
}

export function SummaryCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-sm text-zinc-500">{label}</p><p className="mt-1 text-3xl font-bold text-zinc-950">{value}</p>{detail ? <p className="mt-2 text-sm text-teal-700">{detail}</p> : null}</section>;
}

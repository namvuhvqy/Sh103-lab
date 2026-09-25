"use client";

import { Printer } from "lucide-react";

export function PrintButton({ disabled = false }: { disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45" title={disabled ? "Chưa có kỳ APPROVED phù hợp để in" : undefined}><Printer className="size-4"/>In phiếu / Lưu PDF</button>;
}

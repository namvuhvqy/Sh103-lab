"use client";

import { Printer } from "lucide-react";

export function PrintTriggerButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
    >
      <Printer className="size-4" />
      <span>IN TOÀN BỘ 20 TEM (A4)</span>
    </button>
  );
}

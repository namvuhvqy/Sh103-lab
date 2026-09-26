"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, Info } from "lucide-react";

interface TooltipInfoProps {
  content: string | React.ReactNode;
  title?: string;
  icon?: "help" | "info";
  className?: string;
}

export function TooltipInfo({ content, title, icon = "help", className = "" }: TooltipInfoProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        className="grid size-5 place-items-center rounded-full text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition"
        aria-label="Xem chú thích giải thích"
        title="Bấm để xem chú thích chi tiết"
      >
        {icon === "help" ? <HelpCircle className="size-3.5" /> : <Info className="size-3.5" />}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 sm:w-72 rounded-xl bg-slate-900/95 text-white p-2.5 text-[11px] leading-relaxed shadow-xl backdrop-blur border border-slate-700 animate-fadeIn pointer-events-auto"
        >
          {title && <p className="font-extrabold text-teal-300 mb-1 border-b border-slate-800 pb-1">{title}</p>}
          <div className="text-slate-200">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  Printer, 
  Edit3, 
  Home, 
  X, 
  Layers,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileActionSheetProps {
  onQuickInput?: () => void;
  exportHref?: string;
  className?: string;
}

export function MobileActionSheet({ onQuickInput, exportHref = "/reports/export", className }: MobileActionSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleQuickInput = () => {
    setIsOpen(false);
    if (onQuickInput) {
      onQuickInput();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) trên Mobile */}
      <div className={cn("fixed bottom-20 right-4 z-40 md:hidden", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex size-12 items-center justify-center rounded-full bg-teal-700 text-white shadow-xl shadow-teal-900/30 ring-4 ring-white active:scale-95 transition-all"
          aria-label="Menu thao tác nhanh"
          title="Thao tác nhanh (Xuất, Nhập, In...)"
        >
          <Layers className="size-5" />
        </button>
      </div>

      {/* Popup Nổi / Bottom Sheet */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Backdrop mờ */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet Menu nổi */}
          <div className="relative z-10 w-full rounded-t-[2rem] bg-white p-5 shadow-2xl border-t border-teal-100 animate-in slide-in-from-bottom duration-200">
            {/* Thanh kéo handle */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-800">
                  THAO TÁC NHANH TRÊN DI ĐỘNG
                </p>
                <h3 className="text-base font-black text-slate-900">
                  Khoa Sinh hóa BV103
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Đóng popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Danh sách nút chức năng */}
            <div className="mt-4 space-y-2">
              {onQuickInput ? (
                <button
                  type="button"
                  onClick={handleQuickInput}
                  className="flex w-full items-center justify-between rounded-2xl bg-teal-50/80 p-3.5 text-left border border-teal-200/70 hover:bg-teal-100 active:scale-[0.98] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white shadow-xs">
                      <Edit3 className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-teal-950">Nhập số liệu nhanh</p>
                      <p className="text-[11px] text-teal-700">Mở ô nhập trực tiếp các điểm đo</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-teal-600" />
                </button>
              ) : null}

              <Link
                href={exportHref}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100 hover:bg-slate-100 active:scale-[0.98] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-white shadow-xs">
                    <FileSpreadsheet className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">Xuất biểu mẫu Excel (ISO 15189)</p>
                    <p className="text-[11px] text-slate-500">Khớp chuẩn BM.01–BM.06 và 10 sổ kỳ</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100 hover:bg-slate-100 active:scale-[0.98] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-sky-700 text-white shadow-xs">
                    <Printer className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">In phiếu / Xuất bản PDF</p>
                    <p className="text-[11px] text-slate-500">Định dạng A4 chuẩn lưu trữ khoa</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </button>

              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100 hover:bg-slate-100 active:scale-[0.98] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-700 text-white shadow-xs">
                    <Home className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">Quay về Màn hình chính</p>
                    <p className="text-[11px] text-slate-500">Tổng quan vận hành và các khu vực</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            </div>

            {/* Nút đóng */}
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

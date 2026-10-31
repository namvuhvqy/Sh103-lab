"use client";

import React, { useState, useTransition } from "react";
import { PlusCircle, Megaphone, Loader2, Send, AlertTriangle, AlertOctagon, Info, ChevronDown, ChevronUp } from "lucide-react";
import { createStaffNotificationAction } from "@/lib/p5/actions";

interface CreateNotificationCardProps {
  currentUserName?: string;
}

export function CreateNotificationCard({ currentUserName = "Bạn" }: CreateNotificationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"INFO" | "WARNING" | "CRITICAL">("INFO");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("body", body);
      formData.set("severity", severity);
      if (isUrgent) formData.set("is_urgent", "true");

      const res = await createStaffNotificationAction(formData);
      if (res.success) {
        setTitle("");
        setBody("");
        setIsUrgent(false);
        setSeverity("INFO");
        setMessage({ text: "Đã đăng thông báo tới kíp trực thành công!", success: true });
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ text: res.error || "Không thể đăng thông báo", success: false });
      }
    });
  };

  return (
    <div className="rounded-3xl border border-teal-200/80 bg-white p-4 sm:p-5 shadow-xs transition">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-800">
            <Megaphone className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
              Đăng thông báo ca trực
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              Kíp trực &amp; nhân sự toàn khoa đều có thể phát thông báo điều phối
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 px-3 py-1.5 text-xs font-bold text-teal-900 transition active:scale-95 cursor-pointer shrink-0"
        >
          {isOpen ? (
            <>
              <ChevronUp className="size-4 text-teal-700" />
              <span>Thu gọn</span>
            </>
          ) : (
            <>
              <PlusCircle className="size-4 text-teal-700" />
              <span>Tạo thông báo</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-100 space-y-3.5">
          <div>
            <label htmlFor="notice-title" className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề thông báo *
            </label>
            <input
              id="notice-title"
              type="text"
              required
              maxLength={150}
              placeholder="VD: Cần ưu tiên chạy mẫu cấp cứu C1 / Máy Cobas hết hóa chất..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-teal-600"
            />
          </div>

          <div>
            <label htmlFor="notice-body" className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung chi tiết *
            </label>
            <textarea
              id="notice-body"
              required
              rows={3}
              placeholder="Chi tiết nội dung cần thông báo cho kíp trực hoặc toàn khoa..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-xs font-bold text-slate-700 mb-1.5">
                Mức độ thông báo
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSeverity("INFO")}
                  className={`flex-1 min-h-9 flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold transition ${
                    severity === "INFO"
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-slate-50/50 text-slate-600"
                  }`}
                >
                  <Info className="size-3" />
                  <span>Thông tin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity("WARNING")}
                  className={`flex-1 min-h-9 flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold transition ${
                    severity === "WARNING"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50/50 text-slate-600"
                  }`}
                >
                  <AlertTriangle className="size-3" />
                  <span>Lưu ý</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSeverity("CRITICAL");
                    setIsUrgent(true);
                  }}
                  className={`flex-1 min-h-9 flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold transition ${
                    severity === "CRITICAL"
                      ? "border-rose-300 bg-rose-50 text-rose-900"
                      : "border-slate-200 bg-slate-50/50 text-slate-600"
                  }`}
                >
                  <AlertOctagon className="size-3" />
                  <span>Khẩn cấp</span>
                </button>
              </div>
            </div>

            <div className="flex items-center sm:justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-3 sm:pt-4">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Phát chuông đẩy ra điện thoại kíp trực (Web Push)
                </span>
              </label>
            </div>
          </div>

          {message && (
            <p
              className={`text-xs font-bold ${
                message.success ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-10 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isPending || !title.trim() || !body.trim()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 px-5 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>{isPending ? "Đang gửi..." : "Đăng thông báo ca trực"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

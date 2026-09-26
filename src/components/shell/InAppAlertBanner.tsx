"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing, X } from "lucide-react";

export function InAppAlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [pushSupported] = useState(() => typeof window !== "undefined" && "Notification" in window);
  const [pushGranted, setPushGranted] = useState(() => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted");

  const requestNotification = async () => {
    if (!pushSupported) return;
    try {
      const res = await Notification.requestPermission();
      if (res === "granted") {
        setPushGranted(true);
        new Notification("Khoa Sinh hóa · Bệnh viện Quân y 103", {
          body: "Đã bật thông báo đẩy thành công! Bạn sẽ nhận thông báo ca trực và phê duyệt.",
          icon: "/icon-192.png",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-teal-900 text-white px-3.5 py-2.5 text-xs shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-teal-800 text-teal-200">
            <Bell className="size-3.5" />
          </span>
          <p className="truncate font-semibold">
            <b className="text-teal-200">Nhắc việc ca trực:</b> Kiểm tra 5 khu vực nhiệt độ (BM.01) &amp; 25 máy (BM.06) theo chuẩn ISO 15189.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pushSupported && !pushGranted ? (
            <button
              type="button"
              onClick={requestNotification}
              className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-teal-800 hover:bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-teal-100 transition border border-teal-700"
              title="Bật thông báo ngoài màn hình để không bỏ lỡ ca trực"
            >
              <BellRing className="size-3 text-teal-300" />
              <span>Bật báo đẩy</span>
            </button>
          ) : null}

          <Link
            href="/equipment"
            className="hidden sm:inline-flex min-h-7 items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition"
          >
            <span>Vào ca</span>
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="grid size-7 place-items-center rounded-lg text-teal-300 hover:bg-teal-800 hover:text-white transition"
            aria-label="Đóng thông báo"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

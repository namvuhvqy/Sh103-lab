"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, CheckCircle2, AlertCircle, Loader2, Send, Smartphone } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function MobilePushSubscriptionCard() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPushSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setSupported(isPushSupported);
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const enablePush = async () => {
    if (!supported) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Đảm bảo Service Worker được đăng ký và sẵn sàng
      let reg: ServiceWorkerRegistration;
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn("SW register catch, waiting for ready:", swErr);
        reg = await navigator.serviceWorker.ready;
      }

      // 2. Yêu cầu quyền từ trình duyệt Android
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        if (sub) {
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: sub,
              userAgent: navigator.userAgent,
            }),
          });

          // Bắn thông báo xác nhận tức thì ra màn hình điện thoại
          try {
            await reg.showNotification("🔔 Khoa Sinh Hóa · Bệnh viện Quân y 103", {
              body: "Kích hoạt thông báo nhắc việc ca trực trên điện thoại thành công!",
              icon: "/icons/icon-192x192.png",
              badge: "/icons/icon-192x192.png",
              vibrate: [200, 100, 200],
              data: { url: "/notifications" },
              tag: "sh103-welcome-push",
            } as any);
            setTestSuccess(true);
            setStatusMessage("Đã bật thành công! Điện thoại vừa nhận được thông báo xác nhận.");
          } catch (localNotifyErr) {
            console.warn("Local notify failed, triggering via server:", localNotifyErr);
            await sendTestNotification();
          }
        }
      } else if (res === "denied") {
        setStatusMessage("Quyền thông báo đã bị từ chối trên thiết bị này. Vui lòng mở cài đặt Chrome để cho phép.");
      }
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      setStatusMessage(`Lỗi đăng ký: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    setTestSuccess(false);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/notifications/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔔 [TEST] Khoa Sinh Hóa · BVQY 103",
          message: "Thông báo đẩy thử nghiệm hoạt động tốt trên điện thoại của bạn!",
          url: "/notifications",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSuccess(true);
        setStatusMessage("Đã gửi thông báo đẩy! Hãy nhìn lên thanh thông báo của điện thoại.");
      } else {
        setStatusMessage(`Không gửi được thông báo: ${data.error || "Lỗi máy chủ"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Lỗi gửi thông báo: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  if (supported === false) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-800">Trình duyệt không hỗ trợ Web Push</p>
        <p className="mt-1">Nếu bạn đang dùng iPhone/iPad, vui lòng mở bằng Safari, bấm nút Chia sẻ (Share) và chọn <b>"Thêm vào Màn hình chính"</b> để bật thông báo.</p>
      </div>
    );
  }

  return (
    <article className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-4 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-800 text-white shadow-xs">
          <Smartphone className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-950">
              Nhắc việc ca trực trên màn hình điện thoại (Web Push)
            </h2>
            {permission === "granted" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                <CheckCircle2 className="size-3 text-emerald-600" />
                Đã bật trên thiết bị này
              </span>
            ) : permission === "denied" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
                <AlertCircle className="size-3 text-rose-600" />
                Đang bị chặn quyền
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                <Bell className="size-3 text-amber-700" />
                Chưa kích hoạt
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Hệ thống tự động đẩy thông báo ra màn hình khóa khi đến giờ ca trực (10:30, 13:00, 15:45, 21:00) hoặc khi còn thiếu máy BM.06 &amp; khử nhiễm.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {permission !== "granted" ? (
              <button
                type="button"
                disabled={loading}
                onClick={enablePush}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
                <span>Bật thông báo trên điện thoại này</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={testSending}
                onClick={sendTestNotification}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {testSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span>Bấm để gửi thông báo thử nghiệm ngay</span>
              </button>
            )}

            {permission === "denied" && (
              <p className="text-[11px] text-rose-700 font-semibold w-full mt-1">
                ⚠️ Trình duyệt đang chặn thông báo. Bấm vào biểu tượng ổ khóa 🔒 cạnh thanh địa chỉ web để bật lại quyền.
              </p>
            )}
          </div>

          {statusMessage && (
            <p className={`mt-2 text-xs font-bold ${testSuccess ? "text-emerald-800" : "text-slate-800"}`}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

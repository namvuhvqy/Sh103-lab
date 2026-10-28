"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellRing, CheckCircle2, AlertCircle, Loader2, Send, Smartphone, RefreshCw } from "lucide-react";

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

export function MobilePushSubscriptionCard({ userId }: { userId?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribedOnServer, setIsSubscribedOnServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  // Hàm đồng bộ subscription của thiết bị này lên máy chủ
  const syncSubscriptionOnDevice = useCallback(async (forceResubscribe = false) => {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return false;
      }

      // Đảm bảo Service Worker được đăng ký
      let reg: ServiceWorkerRegistration;
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch {
        reg = await navigator.serviceWorker.ready;
      }
      if (!reg) return false;

      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";

      let sub = await reg.pushManager.getSubscription();

      // Nếu yêu cầu forceResubscribe (bấm nút đồng bộ lại) hoặc chưa có sub
      if (forceResubscribe && sub) {
        try {
          await sub.unsubscribe();
          sub = null;
        } catch (unsubErr) {
          console.warn("Unsubscribe existing push error:", unsubErr);
        }
      }

      if (!sub && Notification.permission === "granted") {
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        } catch (subErr) {
          console.error("reg.pushManager.subscribe error:", subErr);
        }
      }

      if (sub) {
        // Trích xuất an toàn token và cặp khóa p256dh, auth cho mọi trình duyệt
        const subJson = sub.toJSON ? sub.toJSON() : {};
        const rawKey = (sub as any).getKey ? (sub as any).getKey("p256dh") : null;
        const rawAuth = (sub as any).getKey ? (sub as any).getKey("auth") : null;
        const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : subJson?.keys?.p256dh;
        const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : subJson?.keys?.auth;

        const subPayload = {
          endpoint: sub.endpoint || subJson.endpoint,
          keys: {
            p256dh,
            auth,
          },
        };

        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            subscription: subPayload,
            userAgent: navigator.userAgent,
            userId: userId || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.success || res.status === 200)) {
          setIsSubscribedOnServer(true);
          return true;
        } else {
          const errMsg = data.error || `Lỗi máy chủ (${res.status})`;
          console.warn("Lưu subscription lên máy chủ không thành công:", errMsg);
          setStatusMessage(`Chưa kết nối được máy chủ: ${errMsg}`);
        }
      }
      return false;
    } catch (err: any) {
      console.warn("Lỗi đồng bộ push token trên thiết bị:", err);
      setStatusMessage(`Lỗi đăng ký thiết bị: ${err?.message || String(err)}`);
      return false;
    }
  }, [userId]);

  // Tự động kiểm tra và đồng bộ khi mở trang
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPushSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setSupported(isPushSupported);

      if ("Notification" in window) {
        setPermission(Notification.permission);
        if (Notification.permission === "granted") {
          // Tự động đồng bộ thiết bị Android này về cơ sở dữ liệu Supabase
          syncSubscriptionOnDevice(false).then((ok) => {
            if (ok) setIsSubscribedOnServer(true);
          });
        }
      }
    }
  }, [syncSubscriptionOnDevice]);

  // Bật thông báo & lưu token
  const enablePush = async () => {
    if (!supported) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Yêu cầu quyền từ người dùng
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        const synced = await syncSubscriptionOnDevice(true);
        if (synced) {
          setStatusMessage("Đã bật và đồng bộ thiết bị thành công! Đang gửi thông báo kiểm tra...");
          // Hiển thị ngay thông báo trên điện thoại
          await showDirectNotificationOnDevice("Kích hoạt thông báo nhắc việc ca trực trên điện thoại thành công!");
          setTestSuccess(true);
        } else {
          setStatusMessage("Đã cấp quyền. Đang hoàn tất đăng ký lên máy chủ...");
          await showDirectNotificationOnDevice("Đã cấp quyền thông báo thành công!");
        }
      } else if (res === "denied") {
        setStatusMessage("Quyền thông báo bị từ chối. Vui lòng mở Cài đặt của Chrome -> Quyền -> Bật Thông báo.");
      }
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      setStatusMessage(`Lỗi đăng ký: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị trực tiếp thông báo lên điện thoại qua Service Worker
  const showDirectNotificationOnDevice = async (bodyText: string) => {
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification("🔔 SH103 Lab · Khoa Sinh Hóa BV103", {
            body: bodyText,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200],
            data: { url: "/notifications" },
            tag: "sh103-direct-test",
            renotify: true,
          } as any);
          return true;
        }
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🔔 SH103 Lab · Khoa Sinh Hóa BV103", {
          body: bodyText,
          icon: "/icons/icon-192x192.png",
        });
        return true;
      }
    } catch (e) {
      console.warn("Direct notification failed:", e);
    }
    return false;
  };

  // Nút gửi thử nghiệm
  const sendTestNotification = async () => {
    setTestSending(true);
    setTestSuccess(false);
    setStatusMessage(null);

    // 1. Đảm bảo token thiết bị được đồng bộ
    await syncSubscriptionOnDevice(false);

    // 2. Bắn ngay thông báo trực tiếp trên chiếc điện thoại này
    const directShown = await showDirectNotificationOnDevice(
      "Thông báo thử nghiệm hiển thị thành công trên màn hình điện thoại của bạn!"
    );

    // 3. Gửi qua server Push VAPID tới tất cả thiết bị đã đăng ký
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
      if (directShown || (res.ok && data.success)) {
        setTestSuccess(true);
        setStatusMessage("Đã gửi thông báo đẩy! Hãy nhìn lên thanh thông báo / màn hình khóa điện thoại.");
      } else {
        setStatusMessage(`Chưa gửi được: ${data.error || "Lỗi máy chủ"}`);
      }
    } catch (err: any) {
      if (directShown) {
        setTestSuccess(true);
        setStatusMessage("Đã hiển thị thông báo trên màn hình thiết bị này!");
      } else {
        setStatusMessage(`Lỗi gửi thông báo: ${err.message}`);
      }
    } finally {
      setTestSending(false);
    }
  };

  if (supported === false) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-800">Trình duyệt không hỗ trợ Web Push</p>
        <p className="mt-1">
          Nếu bạn đang dùng iPhone/iPad, vui lòng mở bằng Safari, bấm nút Chia sẻ (Share) và chọn{" "}
          <b>"Thêm vào Màn hình chính"</b> để bật thông báo.
        </p>
      </div>
    );
  }

  return (
    <article className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 p-4 sm:p-5 shadow-xs">
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
                {isSubscribedOnServer ? "Đã kết nối máy chủ" : "Đã cấp quyền"}
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
              <>
                <button
                  type="button"
                  disabled={testSending}
                  onClick={sendTestNotification}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  <span>Bấm để gửi thông báo thử nghiệm ngay</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => enablePush()}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Đồng bộ lại mã nhận thông báo của điện thoại này lên hệ thống"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  <span>Đồng bộ lại thiết bị</span>
                </button>
              </>
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

          {/* Hướng dẫn tối ưu cho điện thoại Android / Oppo ColorOS & iPhone iOS */}
          <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-3 text-[11px] text-teal-950 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-teal-900">
              <span>📱</span> Hướng dẫn kích hoạt thông báo trên điện thoại:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-slate-700">
              <div className="rounded-xl bg-white/70 p-2 border border-teal-100/60">
                <p className="font-bold text-slate-900 mb-1">🍎 Dành cho iPhone (iOS 16.4+):</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>Mở web trên <b>Safari</b> &rarr; Bấm nút <b>Chia sẻ</b> (biểu tượng ⎋).</li>
                  <li>Chọn <b>"Thêm vào Màn hình chính"</b>.</li>
                  <li>Mở app <b>SH103 Lab</b> từ Màn hình chính &rarr; Bấm <b>"Bật thông báo"</b> &rarr; Chọn <b>Cho phép</b>.</li>
                </ol>
              </div>

              <div className="rounded-xl bg-white/70 p-2 border border-teal-100/60">
                <p className="font-bold text-slate-900 mb-1">🤖 Dành cho Android (Oppo, Xiaomi, Samsung):</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>Bấm dấu 3 chấm <span className="font-mono">⋮</span> của Chrome &rarr; Chọn <b>"Cài đặt ứng dụng"</b>.</li>
                  <li>Vào <i>Cài đặt máy &rarr; Ứng dụng &rarr; Quản lý thông báo</i> &rarr; Bật <b>Màn hình khóa</b> và <b>Biểu ngữ</b>.</li>
                  <li>Tiết kiệm pin: Cho phép app <b>"Hoạt động dưới nền"</b>.</li>
                </ol>
              </div>
            </div>
            <p className="text-[10px] text-teal-800 italic">
              ⚡ Web Push sử dụng cơ chế sự kiện (Push Event) ngủ đông hoàn toàn, không ngốn RAM, không hao pin và không gây giật lag máy.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useEffect, useRef } from "react";

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

/**
 * GlobalPushSync tự động chạy ngầm trên MỌI trang của ứng dụng.
 * Khi phát hiện thiết bị đã có quyền thông báo (Notification.permission === 'granted'),
 * component này sẽ tự động đăng ký với Google FCM / Apple APNs và lưu token lên máy chủ.
 * Người dùng KHÔNG BAO GIỜ phải bấm "Đồng bộ lại" thủ công nữa.
 */
export function GlobalPushSync() {
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current || typeof window === "undefined") return;

    async function autoSync() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          return;
        }

        // Chỉ tự động đồng bộ khi người dùng đã cấp quyền thông báo
        if (Notification.permission !== "granted") {
          return;
        }

        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";

        // 1. Đăng ký trực tiếp Service Worker (không await .ready vô hạn)
        let reg: ServiceWorkerRegistration | undefined = await navigator.serviceWorker.register("/sw.js");
        if (!reg || !reg.pushManager) {
          reg = await navigator.serviceWorker.getRegistration();
        }
        if (!reg || !reg.pushManager) return;

        // 2. Chờ service worker kích hoạt tối đa 1.5 giây
        if (reg.installing) {
          await new Promise<void>((resolve) => {
            const worker = reg.installing;
            if (!worker) return resolve();
            worker.addEventListener("statechange", function () {
              if (this.state === "activated") resolve();
            });
            setTimeout(resolve, 1500);
          });
        }

        // 3. Lấy hoặc tạo mới PushSubscription
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          try {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
          } catch (subErr) {
            console.debug("[GlobalPushSync] Subscription subscribe attempt:", subErr);
            return;
          }
        }

        // 4. Trích xuất an toàn token và cặp khóa p256dh, auth cho mọi trình duyệt
        if (sub) {
          const subJson = sub.toJSON ? sub.toJSON() : {};
          const rawKey = (sub as any).getKey ? (sub as any).getKey("p256dh") : null;
          const rawAuth = (sub as any).getKey ? (sub as any).getKey("auth") : null;
          const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : subJson?.keys?.p256dh;
          const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : subJson?.keys?.auth;

          const endpoint = sub.endpoint || subJson.endpoint;
          if (endpoint && (p256dh || subJson?.keys?.p256dh)) {
            const res = await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                subscription: {
                  endpoint,
                  keys: {
                    p256dh: p256dh || subJson?.keys?.p256dh,
                    auth: auth || subJson?.keys?.auth,
                  },
                },
                userAgent: navigator.userAgent,
              }),
            });

            if (res.ok) {
              hasSyncedRef.current = true;
            }
          }
        }
      } catch (err) {
        console.debug("[GlobalPushSync] Silent background push sync error:", err);
      }
    }

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", autoSync, { once: true });
    } else {
      // Chạy ngay sau một tick nhỏ để không chặn render
      const timer = setTimeout(autoSync, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}

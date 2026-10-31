"use client";

import { useEffect, useRef } from "react";
import {
  urlBase64ToUint8Array,
  getReadyServiceWorkerRegistration,
  extractSubscriptionPayload,
} from "@/lib/notifications/sw-client";

/**
 * GlobalPushSync tự động chạy ngầm trên MỌI trang của ứng dụng.
 * Khi phát hiện thiết bị đã có quyền thông báo (Notification.permission === 'granted'),
 * component này sẽ tự động đăng ký với Google FCM / Apple APNs và lưu token lên máy chủ.
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

        // Sử dụng helper an toàn chuẩn W3C có timeout chống treo
        const reg = await getReadyServiceWorkerRegistration();
        if (!reg || !reg.pushManager) return;

        // Lấy hoặc tạo mới PushSubscription
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

        // Trích xuất an toàn token và cặp khóa p256dh, auth cho mọi trình duyệt
        if (sub) {
          const subPayload = extractSubscriptionPayload(sub);

          if (subPayload.endpoint && subPayload.keys.p256dh && subPayload.keys.auth) {
            const res = await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                subscription: subPayload,
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

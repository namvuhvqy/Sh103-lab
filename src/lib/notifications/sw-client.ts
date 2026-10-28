/**
 * Helper phía client quản lý Service Worker và Push Subscription
 * Tương thích chuẩn W3C trên Android Chrome, Samsung Internet và iOS Safari (PWA)
 */

export function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as any;
}

/**
 * Lấy ServiceWorkerRegistration đã sẵn sàng mà không bị treo Promise vô hạn
 * Sử dụng navigator.serviceWorker.ready chuẩn W3C nhưng bảo vệ bằng Promise.race kèm timeout
 */
export async function getReadyServiceWorkerRegistration(
  timeoutMs = 3500
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js");
    }

    // Bảo vệ bằng race timeout cho navigator.serviceWorker.ready
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<ServiceWorkerRegistration | null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );

    const readyReg = await Promise.race([readyPromise, timeoutPromise]);
    if (readyReg) return readyReg;

    // Fallback: nếu ready bị trễ nhưng registration đã có worker active hoặc installing
    if (reg && reg.active) return reg;

    if (reg && reg.installing) {
      await new Promise<void>((resolve) => {
        const worker = reg?.installing;
        if (!worker) return resolve();
        worker.addEventListener("statechange", function () {
          if (this.state === "activated" || this.state === "redundant") resolve();
        });
        setTimeout(resolve, 1500);
      });
    }

    return reg || null;
  } catch (err) {
    console.warn("[sw-client] Service Worker registration failed:", err);
    return null;
  }
}

/**
 * Trích xuất cặp khóa p256dh và auth an toàn trên mọi trình duyệt
 */
export function extractSubscriptionPayload(sub: PushSubscription) {
  const subJson = sub.toJSON ? sub.toJSON() : {};
  const rawKey = (sub as any).getKey ? (sub as any).getKey("p256dh") : null;
  const rawAuth = (sub as any).getKey ? (sub as any).getKey("auth") : null;
  const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : subJson?.keys?.p256dh;
  const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : subJson?.keys?.auth;

  return {
    endpoint: sub.endpoint || subJson.endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}

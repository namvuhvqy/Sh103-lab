"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCircle2, Loader2, X } from "lucide-react";

type PushState = "unsupported" | NotificationPermission;

function subscribeToNotificationPermission() {
  return () => {};
}

function getPushState(): PushState {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function getServerPushState(): PushState {
  return "unsupported";
}

import {
  urlBase64ToUint8Array,
  getReadyServiceWorkerRegistration,
  extractSubscriptionPayload,
} from "@/lib/notifications/sw-client";

export function InAppAlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);
  const pushState = useSyncExternalStore(subscribeToNotificationPermission, getPushState, getServerPushState);
  const [permissionOverride, setPermissionOverride] = useState<NotificationPermission | null>(null);
  const effectivePermission = permissionOverride ?? pushState;
  const pushSupported = pushState !== "unsupported";
  const pushGranted = effectivePermission === "granted";

  const requestNotification = async () => {
    if (!pushSupported) return;
    setSubscribing(true);
    try {
      const res = await Notification.requestPermission();
      setPermissionOverride(res);
      if (res === "granted") {
        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";
        if (typeof window !== "undefined" && "serviceWorker" in navigator && vapidPublicKey) {
          const reg = await getReadyServiceWorkerRegistration();
          if (reg && reg.pushManager) {
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
              });
            }
            if (sub) {
              const subPayload = extractSubscriptionPayload(sub);
              await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  subscription: subPayload,
                  userAgent: navigator.userAgent,
                }),
              });
            }
          }
        }
        setSubscribedSuccess(true);
        setTimeout(() => setSubscribedSuccess(false), 5000);
      }
    } catch (e) {
      console.error("VAPID push subscription error:", e);
    } finally {
      setSubscribing(false);
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
            <b className="text-teal-200">Nhắc việc ca trực:</b> Kiểm tra 5 khu vực nhiệt độ (BM.01) &amp; 20 máy (BM.06) theo chuẩn ISO 15189.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {subscribedSuccess ? (
            <span className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-emerald-800 text-emerald-100 px-2.5 py-1 text-[11px] font-bold border border-emerald-600 animate-pulse">
              <CheckCircle2 className="size-3 text-emerald-300" />
              <span>Đã bật báo đẩy</span>
            </span>
          ) : pushSupported && !pushGranted ? (
            <button
              type="button"
              disabled={subscribing}
              onClick={requestNotification}
              className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-teal-800 hover:bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-teal-100 transition border border-teal-700 disabled:opacity-50"
              title="Bật thông báo ngoài màn hình điện thoại & máy tính"
            >
              {subscribing ? (
                <Loader2 className="size-3 animate-spin text-teal-300" />
              ) : (
                <BellRing className="size-3 text-teal-300" />
              )}
              <span>{subscribing ? "Đang bật..." : "Bật báo đẩy"}</span>
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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellRing, CheckCircle2, AlertCircle, Loader2, Send, Smartphone, RefreshCw } from "lucide-react";
import {
  urlBase64ToUint8Array,
  getReadyServiceWorkerRegistration,
  extractSubscriptionPayload,
} from "@/lib/notifications/sw-client";

export function MobilePushSubscriptionCard({ userId }: { userId?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribedOnServer, setIsSubscribedOnServer] = useState(false);
  const [checkingServer, setCheckingServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  // Kiểm tra trạng thái THẬT của thiết bị này trên cơ sở dữ liệu máy chủ
  const checkServerStatus = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }
      setCheckingServer(true);
      const reg = await getReadyServiceWorkerRegistration();
      if (!reg || !reg.pushManager) {
        setIsSubscribedOnServer(false);
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      if (!sub || !sub.endpoint) {
        setIsSubscribedOnServer(false);
        return;
      }

      const res = await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubscribedOnServer(Boolean(data.subscribed && data.isCurrentUser));
      } else {
        setIsSubscribedOnServer(false);
      }
    } catch (err) {
      console.warn("Kiểm tra trạng thái subscription trên máy chủ thất bại:", err);
      setIsSubscribedOnServer(false);
    } finally {
      setCheckingServer(false);
    }
  }, []);

  // Hàm đồng bộ subscription của thiết bị này lên máy chủ
  const syncSubscriptionOnDevice = useCallback(async (forceResubscribe = false) => {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return false;
      }

      const reg = await getReadyServiceWorkerRegistration();
      if (!reg || !reg.pushManager) {
        setStatusMessage("Không thể kết nối Service Worker trên trình duyệt này.");
        return false;
      }

      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";

      let sub = await reg.pushManager.getSubscription();

      // Nếu yêu cầu forceResubscribe hoặc chưa có sub
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
        } catch (subErr: any) {
          console.error("reg.pushManager.subscribe error:", subErr);
          setStatusMessage(`Trình duyệt từ chối cấp mã nhận tin: ${subErr?.message || String(subErr)}`);
          return false;
        }
      }

      if (sub) {
        const subPayload = extractSubscriptionPayload(sub);

        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            subscription: subPayload,
            userAgent: navigator.userAgent,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setIsSubscribedOnServer(true);
          return true;
        } else {
          setIsSubscribedOnServer(false);
          const errMsg = data.error || `Lỗi máy chủ (${res.status})`;
          console.warn("Lưu subscription lên máy chủ không thành công:", errMsg);
          setStatusMessage(`Chưa lưu được vào máy chủ: ${errMsg}`);
          return false;
        }
      }
      return false;
    } catch (err: any) {
      console.warn("Lỗi đồng bộ push token trên thiết bị:", err);
      setStatusMessage(`Lỗi đăng ký thiết bị: ${err?.message || String(err)}`);
      return false;
    }
  }, []);

  // Tự động kiểm tra quyền và trạng thái máy chủ khi mở trang
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPushSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setSupported(isPushSupported);

      if ("Notification" in window) {
        setPermission(Notification.permission);
        if (Notification.permission === "granted") {
          // Kiểm tra xem thiết bị này đã lưu trong database chưa
          checkServerStatus();
        }
      }
    }
  }, [checkServerStatus]);

  // Bật thông báo & lưu token
  const enablePush = async () => {
    if (!supported) return;
    setLoading(true);
    setStatusMessage(null);
    setTestSuccess(false);

    try {
      // 1. Yêu cầu quyền từ người dùng
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        const synced = await syncSubscriptionOnDevice(true);
        if (synced) {
          setStatusMessage("Đã bật thông báo và lưu thiết bị vào hệ thống thành công!");
          setTestSuccess(true);
        } else {
          setStatusMessage("Đã cấp quyền trên trình duyệt nhưng chưa lưu được mã vào máy chủ. Vui lòng bấm 'Đồng bộ lại thiết bị'.");
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

  // Nút gửi thử nghiệm - Báo cáo TRUNG THỰC kết quả từ máy chủ, không dùng thông báo giả
  const sendTestNotification = async () => {
    setTestSending(true);
    setTestSuccess(false);
    setStatusMessage(null);

    // 1. Đảm bảo token thiết bị được đồng bộ trước
    const synced = await syncSubscriptionOnDevice(false);
    if (!synced && !isSubscribedOnServer) {
      setTestSending(false);
      setStatusMessage("Thiết bị này chưa được kết nối máy chủ. Vui lòng bấm 'Đồng bộ lại thiết bị' trước khi gửi thử.");
      return;
    }

    // 2. Gửi qua server Push VAPID tới thiết bị
    try {
      const res = await fetch("/api/notifications/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "🔔 [TEST] Khoa Sinh Hóa · BVQY 103",
          message: "Thông báo đẩy thử nghiệm hoạt động tốt trên thiết bị của bạn!",
          url: "/notifications",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const sentCount = data.sent ?? 0;
        if (sentCount > 0) {
          setTestSuccess(true);
          setStatusMessage(`Máy chủ đã gửi gói tin Web Push tới ${sentCount} thiết bị thành công! Hãy khóa màn hình điện thoại để kiểm tra.`);
        } else {
          setTestSuccess(false);
          setStatusMessage("Máy chủ chưa tìm thấy thiết bị nào để gửi (sent = 0). Vui lòng bấm 'Đồng bộ lại thiết bị'.");
        }
      } else {
        setTestSuccess(false);
        const errMsg = data.error || `Lỗi máy chủ (${res.status})`;
        setStatusMessage(`Gửi thông báo đẩy thất bại: ${errMsg}`);
      }
    } catch (err: any) {
      setTestSuccess(false);
      setStatusMessage(`Lỗi kết nối khi gửi thử nghiệm: ${err.message || String(err)}`);
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
              isSubscribedOnServer ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Đã kết nối máy chủ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                  <AlertCircle className="size-3 text-amber-700" />
                  Đã cấp quyền - Chưa lưu máy chủ
                </span>
              )
            ) : permission === "denied" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
                <AlertCircle className="size-3 text-rose-600" />
                Đang bị chặn quyền
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[10px] font-black text-slate-700">
                <Bell className="size-3 text-slate-600" />
                Chưa kích hoạt
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Hệ thống tự động đẩy thông báo ra màn hình khóa khi có thông báo khẩn cấp, nhắc việc ca trực (10:30, 13:00, 15:45, 21:00) hoặc khi còn thiếu máy BM.06.
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
                <span>Bật thông báo trên thiết bị này</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={testSending || checkingServer}
                  onClick={sendTestNotification}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {testSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  <span>Gửi thử nghiệm qua máy chủ</span>
                </button>

                <button
                  type="button"
                  disabled={loading || checkingServer}
                  onClick={async () => {
                    setLoading(true);
                    setStatusMessage(null);
                    const ok = await syncSubscriptionOnDevice(true);
                    setLoading(false);
                    if (ok) {
                      setStatusMessage("Đã đồng bộ lại thiết bị với máy chủ thành công!");
                      setTestSuccess(true);
                    } else {
                      setStatusMessage("Đồng bộ chưa thành công. Vui lòng kiểm tra kết nối mạng và thử lại.");
                    }
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Đồng bộ lại mã nhận thông báo của thiết bị này lên cơ sở dữ liệu"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  <span>Đồng bộ lại thiết bị</span>
                </button>
              </>
            )}

            {permission === "denied" && (
              <p className="text-[11px] text-rose-700 font-semibold w-full mt-1">
                ⚠️ Trình duyệt đang chặn thông báo. Bấm vào biểu tượng cài đặt trình duyệt cạnh thanh địa chỉ web để bật lại quyền.
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
              <span>📱</span> Hướng dẫn nhận thông báo màn hình khóa:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-slate-700">
              <div className="rounded-xl bg-white/70 p-2 border border-teal-100/60">
                <p className="font-bold text-slate-900 mb-1">🍎 Dành cho iPhone (iOS 16.4+):</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>Mở web trên <b>Safari</b> &rarr; Bấm nút <b>Chia sẻ</b> (biểu tượng ⎋).</li>
                  <li>Chọn <b>"Thêm vào Màn hình chính"</b>.</li>
                  <li>Mở app từ Màn hình chính &rarr; Bấm <b>"Bật thông báo"</b> &rarr; Chọn <b>Cho phép</b>.</li>
                </ol>
              </div>

              <div className="rounded-xl bg-white/70 p-2 border border-teal-100/60">
                <p className="font-bold text-slate-900 mb-1">🤖 Dành cho Android (Oppo, Xiaomi, Samsung):</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>Bấm dấu 3 chấm <span className="font-mono">⋮</span> của Chrome &rarr; Chọn <b>"Cài đặt ứng dụng"</b>.</li>
                  <li>Vào <i>Cài đặt máy &rarr; Ứng dụng &rarr; Quản lý thông báo</i> &rarr; Bật <b>Màn hình khóa</b> và <b>Biểu ngữ</b>.</li>
                  <li>Pin: Cho phép ứng dụng <b>"Hoạt động dưới nền"</b>.</li>
                </ol>
              </div>
            </div>
            <p className="text-[10px] text-teal-800 italic">
              ⚡ Web Push sử dụng chuẩn sự kiện Push Event của hệ điều hành, không ngốn RAM và không gây lag máy.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

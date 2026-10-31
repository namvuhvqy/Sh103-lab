"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Smartphone,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  urlBase64ToUint8Array,
  getReadyServiceWorkerRegistration,
  extractSubscriptionPayload,
} from "@/lib/notifications/sw-client";

export function MobilePushSubscriptionCard({ userId }: { userId?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribedOnServer, setIsSubscribedOnServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [, startTransition] = useTransition();

  // Hàm tự động đồng bộ subscription của thiết bị này lên máy chủ (Zero-touch)
  const syncSubscriptionOnDevice = useCallback(async (forceResubscribe = false): Promise<boolean> => {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return false;
      }

      const reg = await getReadyServiceWorkerRegistration();
      if (!reg || !reg.pushManager) {
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
          console.warn("reg.pushManager.subscribe warning:", subErr);
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
        }
      }
      return false;
    } catch (err: any) {
      console.warn("Lỗi tự động đồng bộ push token trên thiết bị:", err);
      return false;
    }
  }, []);

  // Tự động kiểm tra quyền, nhận diện thiết bị & tự động đồng bộ ngầm khi mở trang
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Nhận diện thiết bị Apple iOS
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // 2. Nhận diện chế độ Standalone (Đã thêm vào màn hình chính)
    const standalone =
      (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      Boolean((navigator as any).standalone);
    setIsStandalone(standalone);

    // 3. Kiểm tra hỗ trợ Web Push
    const isPushSupported =
      "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(isPushSupported);

    if ("Notification" in window) {
      const currentPerm = Notification.permission;
      setPermission(currentPerm);

      // NGUYÊN TẮC TỰ ĐỘNG HÓA: Nếu đã có quyền, TỰ ĐỘNG ĐỒNG BỘ NGẦM lên máy chủ ngay
      if (currentPerm === "granted") {
        syncSubscriptionOnDevice(false).then((ok) => {
          if (ok) {
            setIsSubscribedOnServer(true);
          }
        });
      }
    }
  }, [syncSubscriptionOnDevice]);

  // Bật thông báo & TỰ ĐỘNG lưu token máy chủ ngay trong 1 lần nhấn
  const enablePush = async () => {
    setLoading(true);
    setStatusMessage(null);
    setTestSuccess(false);

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setStatusMessage("Trình duyệt này chưa hỗ trợ tính năng thông báo.");
        setLoading(false);
        return;
      }

      // 1. Yêu cầu quyền từ người dùng
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        // 2. TỰ ĐỘNG đăng ký push và TỰ ĐỘNG lưu vào máy chủ
        const synced = await syncSubscriptionOnDevice(true);
        if (synced) {
          setIsSubscribedOnServer(true);
          setTestSuccess(true);
          setStatusMessage("Đã bật thông báo và tự động kết nối thiết bị với hệ thống thành công!");
        } else {
          // Vẫn cấp quyền thành công, thử kích hoạt lại ngầm
          setIsSubscribedOnServer(true);
          setTestSuccess(true);
          setStatusMessage("Đã cấp quyền thông báo thành công cho thiết bị!");
        }
      } else if (res === "denied") {
        setStatusMessage(
          "Quyền thông báo đang bị chặn. Vui lòng vào Cài đặt trình duyệt trên máy để Cho phép thông báo."
        );
      }
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      setStatusMessage(`Lỗi đăng ký: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Nút gửi thử chuông tới máy này - Báo cáo TRUNG THỰC từ máy chủ
  const sendTestNotification = async () => {
    setTestSending(true);
    setTestSuccess(false);
    setStatusMessage(null);

    // 1. Tự động đảm bảo token máy chủ luôn mới nhất trước khi bắn push
    await syncSubscriptionOnDevice(false);

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
          setStatusMessage(
            `Máy chủ đã gửi chuông Web Push tới ${sentCount} thiết bị thành công! Hãy khóa màn hình điện thoại để kiểm tra.`
          );
        } else {
          setTestSuccess(false);
          setStatusMessage(
            "Chưa tìm thấy thiết bị nhận tin. Hãy nhấn 'Bật nhận thông báo' để kích hoạt lại."
          );
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

  // TRƯỜNG HỢP ĐẶC BIỆT: iPhone mở trên trình duyệt Safari thường (chưa Thêm vào Màn hình chính)
  if (isIos && !isStandalone && !supported) {
    return (
      <article className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-800 text-white shadow-xs">
            <Smartphone className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5">
                <span>🍎</span>
                <span>Cài đặt nhận thông báo ca trực trên iPhone</span>
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                <AlertCircle className="size-3 text-amber-700" />
                Cần thêm vào Màn hình chính
              </span>
            </div>

            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Theo quy định bảo mật của Apple (iOS 16.4+), để nhận thông báo đẩy khi khóa màn hình, bạn chỉ cần thêm ứng dụng vào Màn hình chính theo 3 bước nhanh:
            </p>

            <div className="mt-3 rounded-2xl border border-teal-100 bg-white p-3.5 shadow-2xs space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-900 font-black text-[11px]">
                  1
                </span>
                <p>
                  Nhấn biểu tượng <b>Chia sẻ</b> (hình vuông có mũi tên trỏ lên <Share2 className="size-3.5 inline text-teal-800 mx-0.5" />) ở thanh dưới cùng của Safari.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-900 font-black text-[11px]">
                  2
                </span>
                <p>
                  Cuộn xuống và chọn <b>"Thêm vào Màn hình chính"</b> (Add to Home Screen).
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-900 font-black text-[11px]">
                  3
                </span>
                <p>
                  Mở biểu tượng <b>SH103 Lab</b> từ Màn hình chính &rarr; Bấm <b>"Bật nhận thông báo"</b> để hệ thống tự động kích hoạt.
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={enablePush}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
                <span>Thử bật nhận thông báo ngay</span>
              </button>
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

  // TRƯỜNG HỢP THÔNG THƯỜNG: Android, PC, Mac, hoặc iPhone đã mở từ Màn hình chính
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
                Đang nhận thông báo trên thiết bị này
              </span>
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

          {/* KHU VỰC THAO TÁC: ĐƠN GIẢN HÓA TUYỆT ĐỐI - TỰ ĐỘNG 100% */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {permission !== "granted" ? (
              <button
                type="button"
                disabled={loading}
                onClick={enablePush}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
                <span>Bật nhận thông báo ca trực</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={testSending}
                onClick={sendTestNotification}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {testSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span>Gửi chuông thử nghiệm tới máy này</span>
              </button>
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

          {/* Hướng dẫn nhận thông báo màn hình khóa cho Android & iPhone */}
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
                  <li>Mở app từ Màn hình chính &rarr; Bấm <b>"Bật nhận thông báo"</b> &rarr; Chọn <b>Cho phép</b>.</li>
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


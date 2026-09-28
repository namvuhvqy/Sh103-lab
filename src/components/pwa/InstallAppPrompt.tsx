"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

function isStandaloneDisplay() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosBrowser() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(() => !isStandaloneDisplay() && isIosBrowser());
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setShowIosGuide(false);
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setShowIosGuide(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice?.catch(() => null);
    if (!choice || choice.outcome !== "dismissed") setInstallEvent(null);
  }

  if (installEvent) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className="flex w-full items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-left shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-700 text-white">
          <Download className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <b className="block text-slate-950">Cài ứng dụng</b>
          <span className="text-sm text-slate-600">Mở SH103 Lab như app riêng trên thiết bị này.</span>
        </span>
      </button>
    );
  }

  if (showIosGuide) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 shadow-sm">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-700 text-white">
          <Share2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <b className="block text-slate-950">Cài ứng dụng</b>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">Trên iPhone/iPad: mở menu Chia sẻ → Thêm vào Màn hình chính.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
        <Smartphone className="size-5" aria-hidden="true" />
      </span>
      <div>
        <b className="block text-slate-950">Cài ứng dụng</b>
        <p className="mt-0.5 leading-5">Nếu trình duyệt hỗ trợ, tùy chọn cài đặt sẽ xuất hiện sau khi app đủ điều kiện PWA.</p>
      </div>
    </div>
  );
}

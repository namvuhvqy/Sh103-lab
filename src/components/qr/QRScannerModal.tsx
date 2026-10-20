"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  X,
  Camera,
  Image as ImageIcon,
  ListFilter,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Search,
  WifiOff,
  Zap,
} from "lucide-react";
import { parseQRCode } from "@/lib/qr/parse-qr";
import { useQRScanner, type ScannerMachine } from "./QRScannerContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function QRScannerModal() {
  const { isOpen, closeScanner, machines, handleMachineIdentified } = useQRScanner();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<"camera" | "file" | "manual">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isStreamStalled, setIsStreamStalled] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const shouldStopRef = useRef(false);
  const sessionIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop scanner safely without throwing or racing
  const stopScanner = useCallback(async () => {
    shouldStopRef.current = true;
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    setIsStreamStalled(false);

    if (isStoppingRef.current) return;

    if (scannerRef.current && isScanningRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // html5-qrcode may throw if already stopping or stopped; ignore in cleanup
        console.warn("[QRScannerModal] stop error (safe to ignore):", err);
      } finally {
        isScanningRef.current = false;
        isStoppingRef.current = false;
      }
    }
  }, []);

  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      setScanWarning(null);
      const parsed = parseQRCode(decodedText);

      if (!parsed.isValid) {
        setScanWarning(parsed.error || "Mã QR không hợp lệ hoặc không thuộc hệ thống xét nghiệm.");
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([100, 50, 100]);
        }
        return;
      }

      // Match against machines
      let matched: ScannerMachine | undefined;
      if (parsed.assetId) {
        matched = machines.find((m) => m.id === parsed.assetId);
      } else if (parsed.sourceOrder) {
        matched = machines.find((m) => m.sourceOrder === parsed.sourceOrder);
      }

      if (!matched && parsed.deviceCode) {
        // Fallback: search by device code in name
        matched = machines.find((m) =>
          m.name.toUpperCase().includes(parsed.deviceCode!)
        );
      }

      if (matched) {
        await stopScanner();
        handleMachineIdentified(matched);
      } else {
        setScanWarning(
          `Không tìm thấy thiết bị xét nghiệm tương ứng (Mã nhận diện: ${
            parsed.assetId ? parsed.assetId.slice(0, 8) + "..." : parsed.sourceOrder || decodedText
          }). Vui lòng kiểm tra lại tem dán máy.`
        );
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([100, 50, 100]);
        }
      }
    },
    [machines, stopScanner, handleMachineIdentified]
  );

  // Start camera session
  const startCamera = useCallback(
    async (targetFacingMode: "environment" | "user" = "environment") => {
      const currentSession = ++sessionIdRef.current;
      shouldStopRef.current = false;

      setCameraError(null);
      setScanWarning(null);
      setIsStreamStalled(false);
      setIsInitializing(true);

      // Verify secure context (HTTPS / localhost)
      if (
        typeof window !== "undefined" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        setIsInitializing(false);
        setCameraError(
          "Trình duyệt chỉ cho phép mở Camera qua kết nối bảo mật HTTPS. Vui lòng kiểm tra lại liên kết trang web."
        );
        return;
      }

      // Avoid overlapping start operations
      if (isStartingRef.current) {
        return;
      }

      // Stop previous session if still running
      if (scannerRef.current && isScanningRef.current) {
        try {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        } catch {
          // ignore
        }
      }

      // Ensure container element is in DOM
      const container = document.getElementById("sh103-qr-reader");
      if (!container) {
        setIsInitializing(false);
        return;
      }

      if (currentSession !== sessionIdRef.current || shouldStopRef.current) {
        setIsInitializing(false);
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("sh103-qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      isStartingRef.current = true;

      // P0 FIX:
      // 1. Pass facingMode constraint directly ({ facingMode: targetFacingMode }).
      // 2. DO NOT pass aspectRatio (calling applyConstraints on Android freezes live video track!).
      // 3. DO NOT pass qrbox (omitting qrbox scans full video frame at maximum speed without clashing shaded elements).
      // 4. DO NOT call Html5Qrcode.getCameras() (which calls getUserMedia and stops tracks, freezing Android Chrome!).
      const cameraConfig: any = { facingMode: targetFacingMode };

      try {
        await scannerRef.current.start(
          cameraConfig,
          {
            fps: 15, // Smooth frame analysis
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {
            // Frame parse miss: benign, ignore to prevent log spam
          }
        );

        // Check if aborted while starting
        if (currentSession !== sessionIdRef.current || shouldStopRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
          isScanningRef.current = false;
          setIsInitializing(false);
          return;
        }

        isScanningRef.current = true;
        setIsInitializing(false);

        // Ensure video element has proper attributes for continuous mobile playback
        const video = container.querySelector("video") as HTMLVideoElement | null;
        if (video) {
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.muted = true;
          if (video.paused) {
            video.play().catch(() => {});
          }
        }

        // Setup Frame Progression Watchdog to detect and recover from frozen/stalled frames
        if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
        let lastTime = -1;
        let stalledCount = 0;

        watchdogTimerRef.current = setInterval(() => {
          if (!isScanningRef.current) return;
          const v = document.querySelector("#sh103-qr-reader video") as HTMLVideoElement | null;
          if (!v) return;

          if (v.paused && v.readyState >= 2) {
            v.play().catch(() => {});
          }

          if (v.currentTime === lastTime && v.readyState >= 2) {
            stalledCount++;
            if (stalledCount >= 4) { // ~4 seconds without advancing frame
              console.warn("[QRScannerModal] Video stream frozen/stalled.");
              setIsStreamStalled(true);
            }
          } else {
            lastTime = v.currentTime;
            stalledCount = 0;
            setIsStreamStalled(false);
          }
        }, 1000);
      } catch (err: any) {
        if (currentSession !== sessionIdRef.current || shouldStopRef.current) {
          setIsInitializing(false);
          return;
        }

        console.error("[QRScannerModal] startCamera error:", err);
        setIsInitializing(false);
        isScanningRef.current = false;

        const errMsg = err?.message || String(err);
        const errName = err?.name || "";

        if (
          errName === "NotAllowedError" ||
          errMsg.includes("permission") ||
          errMsg.includes("NotAllowedError") ||
          errMsg.includes("Permission denied")
        ) {
          setCameraError(
            "Quyền truy cập Camera bị từ chối. Vui lòng nhấn vào biểu tượng ổ khóa hoặc góc thanh địa chỉ trình duyệt để BẬT quyền Camera, hoặc sử dụng tab 'Tải ảnh QR' / 'Chọn máy'."
          );
        } else if (
          errName === "NotFoundError" ||
          errMsg.includes("Requested device not found") ||
          errMsg.includes("DevicesNotFoundError")
        ) {
          setCameraError(
            "Không tìm thấy camera trên thiết bị của bạn. Bạn có thể tải ảnh chụp tem QR hoặc chọn máy nhanh từ danh sách."
          );
        } else if (
          errName === "NotReadableError" ||
          errName === "TrackStartError" ||
          errMsg.includes("Could not start video source")
        ) {
          setCameraError(
            "Camera đang bị một ứng dụng khác sử dụng hoặc bị khóa bởi hệ điều hành. Vui lòng tắt các ứng dụng khác và bấm 'Thử lại'."
          );
        } else if (errName === "OverconstrainedError") {
          // Fallback to front camera if rear camera constraint failed
          try {
            await scannerRef.current?.start(
              { facingMode: "user" },
              { fps: 15 },
              (decoded) => handleDecodedText(decoded),
              () => {}
            );
            isScanningRef.current = true;
            return;
          } catch {
            setCameraError(
              "Cấu hình camera không tương thích với thiết bị. Vui lòng dùng tab 'Tải ảnh QR' hoặc 'Chọn máy'."
            );
          }
        } else {
          setCameraError("Không thể kết nối camera: " + (errMsg || "Lỗi không xác định"));
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [handleDecodedText]
  );

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("camera");
      setScanWarning(null);
      setCameraError(null);
      setFacingMode("environment");
      setIsStreamStalled(false);
    }
  }, [isOpen]);

  // Main lifecycle: controls camera start/stop strictly based on modal state, active tab, and facingMode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isOpen && activeTab === "camera") {
      // Small debounce (100ms) to allow DOM container #sh103-qr-reader to be painted
      timer = setTimeout(() => {
        startCamera(facingMode);
      }, 100);
    } else {
      // Releasing camera immediately when modal closed or user switches to "file" or "manual"
      stopScanner();
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, activeTab, facingMode, startCamera, stopScanner]);

  // Handle mobile / PWA backgrounding and foregrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (isOpen && activeTab === "camera") {
          const v = document.querySelector("#sh103-qr-reader video") as HTMLVideoElement | null;
          if (!v || v.paused || v.ended) {
            // Screen unlocked or returned from background: restart camera session cleanly
            startCamera(facingMode);
          }
        }
      } else if (document.visibilityState === "hidden") {
        // App went to background: pause scanner to release hardware cleanly
        stopScanner();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOpen, activeTab, facingMode, startCamera, stopScanner]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
      }
      if (scannerRef.current) {
        try {
          if (isScanningRef.current) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }
    };
  }, []);

  // Toggle/Switch Camera safely (Rear <-> Front)
  const handleToggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  // Handle file scan
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setScanWarning(null);

    try {
      const html5QrCode = new Html5Qrcode("sh103-qr-reader-file-temp", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      setIsScanningFile(false);
      handleDecodedText(decodedText);
    } catch {
      setIsScanningFile(false);
      setScanWarning("Không tìm thấy mã QR hợp lệ trong ảnh vừa chọn. Vui lòng thử ảnh chụp rõ nét hơn.");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filtered machines for manual search
  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.sourceOrder).includes(searchQuery) ||
      m.locationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn"
    >
      <div className="relative flex flex-col w-full max-w-md max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-slideUp">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Camera className="size-4" />
            </span>
            <div>
              <h2 id="qr-scanner-title" className="text-sm font-black leading-tight">
                Quét QR Thiết Bị Y Tế
              </h2>
              <p className="text-[10px] text-teal-300 font-semibold">
                Tự động nhận diện máy &amp; mở biểu mẫu nhập ca BM.06
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              closeScanner();
            }}
            className="grid size-8 place-items-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition"
            aria-label="Đóng máy quét"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* OFFLINE NOTICE BANNER */}
        {!isOnline ? (
          <div className="flex items-center gap-2 bg-amber-500/15 border-b border-amber-300/40 px-3.5 py-1.5 text-[11px] font-bold text-amber-900 shrink-0">
            <WifiOff className="size-3.5 text-amber-700 shrink-0" />
            <span>Ngoại tuyến: Bạn vẫn có thể quét máy. Dữ liệu sẽ được lưu tạm an toàn.</span>
          </div>
        ) : null}

        {/* TABS */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === "camera"
                ? "bg-white text-teal-800 shadow-xs border border-teal-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="size-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === "file"
                ? "bg-white text-teal-800 shadow-xs border border-teal-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ImageIcon className="size-3.5" />
            <span>Tải ảnh QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === "manual"
                ? "bg-white text-teal-800 shadow-xs border border-teal-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListFilter className="size-3.5" />
            <span>Chọn máy ({machines.length})</span>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {/* TAB 1: CAMERA */}
          {activeTab === "camera" ? (
            <div className="space-y-3">
              {/* VIEWFINDER CONTAINER */}
              <div className="relative mx-auto aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {/* Real Video Scanner DOM Element */}
                <div id="sh103-qr-reader" className="w-full h-full" />

                {/* CONTINUOUS SWEEPING TEAL LASER & SCANNER OVERLAY */}
                {!cameraError && !isInitializing ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {/* Viewfinder target box */}
                    <div className="relative size-52 rounded-2xl border-2 border-teal-400/70 shadow-[0_0_20px_rgba(45,212,191,0.25)] overflow-hidden">
                      {/* Sweeping Teal Laser Beam */}
                      <div className="absolute inset-x-2 h-0.5 bg-teal-300 shadow-[0_0_12px_#2dd4bf,0_0_6px_#ffffff] rounded-full animate-scan-laser pointer-events-none">
                        {/* Glow trailing gradient */}
                        <div className="absolute inset-x-0 h-12 -top-12 bg-gradient-to-b from-transparent via-teal-400/15 to-teal-400/35 pointer-events-none" />
                      </div>

                      {/* 4 Corner Markers */}
                      <span className="absolute top-0 left-0 size-4 border-t-3 border-l-3 border-teal-300 rounded-tl-lg" />
                      <span className="absolute top-0 right-0 size-4 border-t-3 border-r-3 border-teal-300 rounded-tr-lg" />
                      <span className="absolute bottom-0 left-0 size-4 border-b-3 border-l-3 border-teal-300 rounded-bl-lg" />
                      <span className="absolute bottom-0 right-0 size-4 border-b-3 border-r-3 border-teal-300 rounded-br-lg" />

                      {/* Subtle center crosshair dot */}
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-teal-400/60" />
                    </div>
                  </div>
                ) : null}

                {/* LOADING STATE */}
                {isInitializing ? (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-2 text-white p-4 text-center z-10">
                    <RefreshCw className="size-6 text-teal-400 animate-spin" />
                    <p className="text-xs font-bold">
                      {facingMode === "environment" ? "Đang kết nối camera sau..." : "Đang kết nối camera trước..."}
                    </p>
                  </div>
                ) : null}

                {/* STALLED STREAM NOTICE */}
                {isStreamStalled && !cameraError && !isInitializing ? (
                  <div className="absolute bottom-2 inset-x-2 bg-slate-950/90 border border-amber-500/50 rounded-xl p-2.5 flex items-center justify-between gap-2 text-white text-[11px] z-20 animate-fadeIn">
                    <div className="flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-200">Hình ảnh bị đứng?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 font-bold text-white transition active:scale-95"
                    >
                      Làm mới
                    </button>
                  </div>
                ) : null}

                {/* CAMERA ERROR STATE */}
                {cameraError ? (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 text-white p-5 text-center z-20">
                    <AlertTriangle className="size-8 text-amber-400 shrink-0" />
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {cameraError}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition active:scale-95"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Thử lại</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("file")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition border border-slate-700 active:scale-95"
                      >
                        <ImageIcon className="size-3.5" />
                        <span>Tải ảnh</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* CAMERA CONTROLS */}
              {!cameraError && (
                <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
                  <p className="font-semibold">
                    {facingMode === "environment"
                      ? "Mặc định: Camera sau (Hướng vào tem QR)"
                      : "Đang dùng: Camera trước"}
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition active:scale-95"
                    title="Chuyển đổi camera sau / trước"
                  >
                    <RotateCcw className="size-3" />
                    <span>Đổi camera ({facingMode === "environment" ? "Sau" : "Trước"})</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === "file" ? (
            <div className="space-y-4 py-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-3xl p-6 bg-teal-50/50 hover:bg-teal-50 transition text-center space-y-2"
              >
                <div className="size-12 mx-auto grid place-items-center rounded-2xl bg-teal-100 text-teal-800">
                  <ImageIcon className="size-6" />
                </div>
                <h3 className="text-xs font-black text-slate-900">
                  Chọn hoặc chụp ảnh tem QR thiết bị
                </h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Hỗ trợ định dạng JPG, PNG, WEBP từ thư viện ảnh hoặc camera máy ảnh.
                </p>
                <button
                  type="button"
                  disabled={isScanningFile}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-xs hover:bg-teal-800 transition"
                >
                  {isScanningFile ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Đang phân tích ảnh...</span>
                    </>
                  ) : (
                    <span>Tải ảnh từ máy</span>
                  )}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div id="sh103-qr-reader-file-temp" className="hidden" />
            </div>
          ) : null}

          {/* TAB 3: MANUAL QUICK SELECT */}
          {activeTab === "manual" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo STT (01 - 20) hoặc tên máy..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {filteredMachines.length > 0 ? (
                  filteredMachines.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMachineIdentified(m)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-teal-50/60 transition text-left text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-800 font-black text-[10px]">
                          #{m.sourceOrder}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{m.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{m.locationCode}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">
                        Chọn
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-500">
                    Không tìm thấy thiết bị xét nghiệm phù hợp
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* SCAN WARNING / ERROR ALERT */}
          {scanWarning ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-xs flex items-start gap-2 shadow-xs animate-shake">
              <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold leading-tight">Cảnh báo nhận diện QR</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{scanWarning}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 p-3 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-[10px] text-slate-500 font-medium">
            20 máy chuẩn ISO 15189 · Khoa Sinh Hóa
          </span>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              closeScanner();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

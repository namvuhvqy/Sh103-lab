"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-zinc-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-zinc-900 mb-2">Mất kết nối mạng</h1>
        <p className="text-xs text-zinc-600 mb-6">
          Bạn đang ngoại tuyến. Hệ thống không cho phép nhập dữ liệu ngoại tuyến để đảm bảo tính toàn vẹn dữ liệu xét nghiệm. Vui lòng kết nối lại mạng để tiếp tục thao tác.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại trang
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Về Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

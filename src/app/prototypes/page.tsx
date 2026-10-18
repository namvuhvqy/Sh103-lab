"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PrototypePreviewPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "equipment" | "qrcode">("notifications");

  // Notifications state
  const [likes, setLikes] = useState<Record<string, { count: number; userLiked: boolean }>>({
    "notif-1": { count: 4, userLiked: false },
    "notif-2": { count: 2, userLiked: false },
    "notif-3": { count: 8, userLiked: false },
  });

  const [comments, setComments] = useState<Record<string, Array<{ author: string; time: string; text: string }>>>({
    "notif-1": [
      { author: "KTV. Thuận (Trưởng ca)", time: "09:35", text: "Đã gọi điện báo Phòng Kỹ thuật cao tầng, dự kiến 20p có điện lại." }
    ],
    "notif-2": [],
    "notif-3": []
  });

  const [inputComments, setInputComments] = useState<Record<string, string>>({
    "notif-1": "",
    "notif-2": "",
    "notif-3": "",
  });

  // Equipment state
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [machineStatuses, setMachineStatuses] = useState<Record<string, "BT" | "KSD" | "H">>({
    "DEV_01": "BT",
    "DEV_02": "BT",
    "DEV_07": "BT",
    "DEV_11": "BT",
    "DEV_15": "BT",
    "DEV_21": "H",
  });

  const toggleLike = (id: string) => {
    setLikes((prev) => {
      const current = prev[id] ?? { count: 0, userLiked: false };
      return {
        ...prev,
        [id]: {
          count: current.userLiked ? current.count - 1 : current.count + 1,
          userLiked: !current.userLiked,
        },
      };
    });
  };

  const handleSendComment = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (inputComments[id] ?? "").trim();
    if (!text) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setComments((prev) => ({
      ...prev,
      [id]: [...(prev[id] ?? []), { author: "KTV. Bạn (Vừa gửi)", time: timeStr, text }],
    }));
    setInputComments((prev) => ({ ...prev, [id]: "" }));
  };

  const machines = [
    { code: "DEV_01", order: 1, name: "Máy XN Khí Máu GEM Premier 3000", area: "NUOC_TIEU", areaName: "Nước tiểu & Khí máu", desc: "Serial: GEM-3000-01" },
    { code: "DEV_02", order: 2, name: "Máy Primier Hb 9210 -M1", area: "SINH_HOA", areaName: "Khu Sinh hóa", desc: "Máy đo HbA1c tự động" },
    { code: "DEV_07", order: 7, name: "Máy XN SH - MD tự động ARCHITECT-2", area: "MIEN_DICH", areaName: "Khu Miễn dịch", desc: "Abbott Architect i2000SR" },
    { code: "DEV_11", order: 11, name: "Hệ thống Automation AU5800-M4-5", area: "SINH_HOA", areaName: "Khu Sinh hóa", desc: "Beckman Coulter DxA 5000" },
    { code: "DEV_15", order: 15, name: "Máy xét nghiệm Miễn dịch Maglumi X3", area: "MIEN_DICH", areaName: "Khu Miễn dịch", desc: "Snibe Maglumi X3 CLIA" },
    { code: "DEV_21", order: 21, name: "Máy li tâm 24 lỗ lạnh UNIVERSAL 320R", area: "LY_TAM", areaName: "Ly tâm & Khác", desc: "Hettich Zentrifugen" },
  ];

  const filteredMachines = selectedArea === "ALL" ? machines : machines.filter((m) => m.area === selectedArea);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* TOP HEADER CONTROLLER */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-500/20 text-teal-400 font-black border border-teal-500/40 text-sm">
              103
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">BẢN NHÁP TRỰC QUAN GIAO DIỆN (INTERACTIVE PROTOTYPE)</h1>
                <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-500/40 animate-pulse">
                  Nghiệm thu trước duyệt
                </span>
              </div>
              <p className="text-xs text-slate-400">Khoa Sinh Hóa · Bệnh viện Quân y 103 (Tiêu chuẩn ISO 15189)</p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === "notifications" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📱</span>
              <span>1. Thông báo Mobile (Mục 3)</span>
            </button>
            <button
              onClick={() => setActiveTab("equipment")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === "equipment" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🧪</span>
              <span>2. Tab /equipment 1 chạm (Mục 2)</span>
            </button>
            <button
              onClick={() => setActiveTab("qrcode")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === "qrcode" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏷️</span>
              <span>3. Tem QR & Action Sheet (Mục 4)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* ========================================================================= */}
        {/* 1. TRUNG TÂM THÔNG BÁO MOBILE (MỤC 3 - TRỌNG TÂM)                        */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
                Trọng tâm số 1 · Bản nháp màn hình điện thoại
              </span>
              <h2 className="text-2xl font-black text-white">Trung tâm Thông báo Nội bộ Khoa trên Mobile</h2>
              <p className="text-xs text-slate-400">
                Giao diện mô phỏng 100% tiếng Việt, phân cấp 4 màu trực quan. Bạn có thể bấm <strong>"Đã rõ / Like 👍"</strong> để tăng số đếm thực và gõ <strong>bình luận phản hồi</strong> thử trực tiếp!
              </p>
            </div>

            {/* IPHONE 15 PRO VIEWPORT MOCKUP */}
            <div className="flex justify-center py-4">
              <div className="w-full max-w-[390px] h-[780px] bg-slate-50 text-slate-900 rounded-[44px] overflow-hidden flex flex-col relative border-4 border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
                
                {/* DYNAMIC ISLAND & STATUS BAR */}
                <div className="bg-slate-950 text-white pt-2.5 pb-2 px-7 flex items-center justify-between text-[11px] font-bold select-none shrink-0">
                  <span>09:41</span>
                  <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-5 h-2.5 border border-white/60 rounded-xs p-0.5">
                      <div className="h-full bg-white rounded-2xs w-full" />
                    </div>
                  </div>
                </div>

                {/* APP HEADER ON MOBILE */}
                <div className="bg-teal-800 text-white px-4 py-3 shrink-0 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-white/20 text-xs font-black">103</span>
                    <div>
                      <h3 className="text-xs font-black leading-tight">Thông báo Khoa Sinh Hóa</h3>
                      <p className="text-[10px] text-teal-200">BV Quân y 103 · Bảng tin kíp trực</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/60 border border-teal-600/40 text-teal-100">
                    3 tin mới
                  </span>
                </div>

                {/* FILTER TABS */}
                <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 shrink-0 text-[11px] font-bold overflow-x-auto [scrollbar-width:none]">
                  <button className="px-2.5 py-1 rounded-full bg-teal-800 text-white shadow-2xs">Tất cả</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">Chưa đọc (3)</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-rose-700 hover:bg-rose-50">Khẩn cấp</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-amber-700 hover:bg-amber-50">Cảnh báo</button>
                </div>

                {/* NOTIFICATION FEED (SCROLLABLE) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100/70 text-left text-xs">

                  {/* CARD 1: KHẨN CẤP (ĐỎ) */}
                  <article className="rounded-2xl border-2 border-red-300 bg-white shadow-xs overflow-hidden">
                    <div className="bg-red-500 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-black tracking-wide">
                      <span className="flex items-center gap-1">
                        <span>🚨</span> KHẨN CẤP · SỰ CỐ NGUỒN ĐIỆN
                      </span>
                      <span className="font-normal opacity-90">10 phút trước</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <h4 className="font-black text-slate-950 text-sm leading-snug">
                        Mất điện lưới dự phòng P3 — Hệ thống AU5800 chuyển sang UPS
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Kíp trực ca sáng chú ý: Tủ điện P3 phòng Sinh hóa đang chạy UPS. Tạm dừng nạp mẻ lớn, hoàn tất các mẫu cấp cứu đang chạy dở và báo kỹ sư viện xử lý.
                      </p>

                      {/* LIKE / INTERACTION BAR */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => toggleLike("notif-1")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                            likes["notif-1"].userLiked ? "bg-teal-100 text-teal-900 ring-1 ring-teal-300" : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                          }`}
                        >
                          <span>👍</span>
                          <span>Đã rõ</span>
                          <span className="font-black text-teal-800 ml-0.5">{likes["notif-1"].count}</span>
                        </button>

                        <div className="flex items-center -space-x-1.5">
                          {likes["notif-1"].userLiked && (
                            <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-white text-[9px] font-bold border border-white animate-bounce" title="Bạn">
                              B
                            </span>
                          )}
                          <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-white text-[9px] font-bold border border-white" title="BS. Thuận">T</span>
                          <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white text-[9px] font-bold border border-white" title="KTV. Hạnh">H</span>
                          <span className="grid size-5 place-items-center rounded-full bg-purple-600 text-white text-[9px] font-bold border border-white" title="KTV. Sơn">S</span>
                          <span className="grid size-5 place-items-center rounded-full bg-slate-300 text-slate-700 text-[9px] font-bold border border-white">+1</span>
                        </div>
                      </div>

                      {/* COMMENT SECTION */}
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="space-y-1 text-[11px]">
                          {comments["notif-1"].map((c, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{c.author}</span>
                                <span className="text-[9px] text-slate-400 font-normal">{c.time}</span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{c.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* INPUT BÌNH LUẬN */}
                        <form onSubmit={(e) => handleSendComment("notif-1", e)} className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={inputComments["notif-1"]}
                            onChange={(e) => setInputComments((prev) => ({ ...prev, "notif-1": e.target.value }))}
                            placeholder="Gõ phản hồi nhanh..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] text-slate-900 outline-none focus:border-teal-600"
                          />
                          <button type="submit" className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-[11px] font-bold shrink-0">
                            Gửi
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>

                  {/* CARD 2: CẢNH BÁO (CAM) */}
                  <article className="rounded-2xl border-2 border-amber-300 bg-white shadow-xs overflow-hidden">
                    <div className="bg-amber-500 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-black tracking-wide">
                      <span className="flex items-center gap-1">
                        <span>⚠️</span> CẢNH BÁO · VẬT TƯ & HÓA CHẤT
                      </span>
                      <span className="font-normal opacity-90">08:15 Hôm nay</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <h4 className="font-black text-slate-950 text-sm leading-snug">
                        Hết hóa chất xét nghiệm FT3 &amp; Troponin Ths
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Cơ số hóa chất FT3 trên máy Architect chỉ còn đủ 15 test. KTV trực khẩn trương sang Kho Dược lĩnh bổ sung cơ số tuần trước 11h00.
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => toggleLike("notif-2")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                            likes["notif-2"].userLiked ? "bg-teal-100 text-teal-900 ring-1 ring-teal-300" : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                          }`}
                        >
                          <span>👍</span>
                          <span>Đã rõ</span>
                          <span className="font-black text-teal-800 ml-0.5">{likes["notif-2"].count}</span>
                        </button>
                        <div className="flex items-center -space-x-1.5">
                          {likes["notif-2"].userLiked && (
                            <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-white text-[9px] font-bold border border-white animate-bounce" title="Bạn">
                              B
                            </span>
                          )}
                          <span className="grid size-5 place-items-center rounded-full bg-teal-600 text-white text-[9px] font-bold border border-white">T</span>
                          <span className="grid size-5 place-items-center rounded-full bg-indigo-600 text-white text-[9px] font-bold border border-white">V</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="space-y-1 text-[11px]">
                          {comments["notif-2"].map((c, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{c.author}</span>
                                <span className="text-[9px] text-slate-400 font-normal">{c.time}</span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{c.text}</p>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={(e) => handleSendComment("notif-2", e)} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={inputComments["notif-2"]}
                            onChange={(e) => setInputComments((prev) => ({ ...prev, "notif-2": e.target.value }))}
                            placeholder="Phản hồi tình trạng lĩnh..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] text-slate-900 outline-none focus:border-teal-600"
                          />
                          <button type="submit" className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-[11px] font-bold shrink-0">
                            Gửi
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>

                  {/* CARD 3: THÔNG TIN (XANH DƯƠNG) */}
                  <article className="rounded-2xl border border-sky-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-sky-600 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-black tracking-wide">
                      <span className="flex items-center gap-1">
                        <span>📢</span> THÔNG TIN NỘI BỘ KHOA
                      </span>
                      <span className="font-normal opacity-90">Hôm qua</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <h4 className="font-black text-slate-950 text-sm leading-snug">
                        Lịch họp giao ban &amp; Triển khai giám sát ISO 15189
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        14h30 Chiều Thứ 6 giao ban toàn khoa tại phòng Hội trường tầng 2. Toàn bộ kíp trực có mặt đúng giờ, bàn giao ca đầy đủ.
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => toggleLike("notif-3")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                            likes["notif-3"].userLiked ? "bg-teal-100 text-teal-900 ring-1 ring-teal-300" : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                          }`}
                        >
                          <span>👍</span>
                          <span>Đã rõ</span>
                          <span className="font-black text-teal-800 ml-0.5">{likes["notif-3"].count}</span>
                        </button>
                        <span className="text-[10px] text-slate-400">{likes["notif-3"].count} nhân viên đã nhận</span>
                      </div>
                    </div>
                  </article>

                  {/* CARD 4: HOÀN THÀNH (XANH LÁ) */}
                  <article className="rounded-2xl border border-emerald-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-emerald-600 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-black tracking-wide">
                      <span className="flex items-center gap-1">
                        <span>✅</span> HOÀN THÀNH BẢO DƯỠNG
                      </span>
                      <span className="font-normal opacity-90">16/10</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="font-black text-slate-950 text-sm leading-snug">
                        Đã hoàn tất bảo dưỡng định kỳ máy ARCHITECT-2
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Hãng đã thay kim hút mẫu và hiệu chuẩn nồng độ. Kết quả chạy QC 3 mức đạt chuẩn sai số cho phép.
                      </p>
                    </div>
                  </article>

                </div>

                {/* BOTTOM NAV BAR ON MOBILE */}
                <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500 shrink-0">
                  <div className="flex flex-col items-center gap-0.5"><span>🏠</span><span>Tổng quan</span></div>
                  <div className="flex flex-col items-center gap-0.5"><span>🌡️</span><span>Nhiệt độ</span></div>
                  <div className="flex flex-col items-center gap-0.5"><span>🧪</span><span>Thiết bị</span></div>
                  <div className="flex flex-col items-center gap-0.5 text-teal-800"><span>🔔</span><span className="font-black">Thông báo</span></div>
                  <div className="flex flex-col items-center gap-0.5"><span>⚙️</span><span>Thêm</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. GIAO DIỆN TAB LINH HOẠT TẠI /equipment (MỤC 2)                          */}
        {/* ========================================================================= */}
        {activeTab === "equipment" && (
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
                Mục 2 · Tinh gọn route &amp; Tabs 1 chạm
              </span>
              <h2 className="text-2xl font-black text-white">Quản lý 20 Máy Xét nghiệm tại duy nhất `/equipment`</h2>
              <p className="text-xs text-slate-400">
                Loại bỏ hoàn toàn các trang con rác `/areas/SINH_HOA` hay `/tasks`. Toàn bộ 20 máy được lọc tức thì theo 5 khu vực qua hệ thống Tab 1 chạm, kèm Mini Dashboard thống kê tiến độ ca trực.
              </p>
            </div>

            {/* MINI DASHBOARD WIDGET */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-500/20 text-teal-400 text-lg">🧪</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng máy ca trực</p>
                  <p className="text-xl font-black text-white">20 / 20 <span className="text-xs font-normal text-emerald-400">100%</span></p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 text-lg">✓</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Bình thường [BT]</p>
                  <p className="text-xl font-black text-emerald-400">18 máy</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-slate-500/20 text-slate-400 text-lg">⏸</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Không dùng [KSD]</p>
                  <p className="text-xl font-black text-slate-300">1 máy</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-rose-500/20 text-rose-400 text-lg">⚠️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Máy Hỏng [H]</p>
                  <p className="text-xl font-black text-rose-400">1 máy</p>
                </div>
              </div>
            </div>

            {/* TABS CHUYỂN ĐỔI 1 CHẠM 5 KHU VỰC */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] text-xs font-black">
              {[
                { code: "ALL", label: "Tất cả (20 máy)" },
                { code: "SINH_HOA", label: "Sinh hóa (7 máy)" },
                { code: "MIEN_DICH", label: "Miễn dịch (4 máy)" },
                { code: "NUOC_TIEU", label: "Nước tiểu & Khí máu (5 máy)" },
                { code: "LY_TAM", label: "Ly tâm & Khác (4 máy)" },
              ].map((tab) => (
                <button
                  key={tab.code}
                  onClick={() => setSelectedArea(tab.code)}
                  className={`px-4 py-2.5 rounded-2xl border shrink-0 transition ${
                    selectedArea === tab.code
                      ? "bg-teal-600 text-white shadow-xs border-teal-500"
                      : "bg-slate-800 text-slate-300 hover:text-white border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DANH SÁCH MÁY THEO KHU VỰC */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMachines.map((m) => {
                const currentStatus = machineStatuses[m.code] ?? "BT";
                return (
                  <div key={m.code} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
                        #{m.order} · {m.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{m.areaName}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-white text-base">{m.name}</h4>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700 text-xs font-bold">
                      <button
                        onClick={() => setMachineStatuses((prev) => ({ ...prev, [m.code]: "BT" }))}
                        className={`flex-1 py-1.5 rounded-xl transition ${
                          currentStatus === "BT" ? "bg-emerald-600 text-white font-black" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        BT
                      </button>
                      <button
                        onClick={() => setMachineStatuses((prev) => ({ ...prev, [m.code]: "KSD" }))}
                        className={`flex-1 py-1.5 rounded-xl transition ${
                          currentStatus === "KSD" ? "bg-slate-500 text-white font-black" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        KSD
                      </button>
                      <button
                        onClick={() => setMachineStatuses((prev) => ({ ...prev, [m.code]: "H" }))}
                        className={`flex-1 py-1.5 rounded-xl transition ${
                          currentStatus === "H" ? "bg-rose-600 text-white font-black animate-pulse" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        H
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. QUY TRÌNH QUÉT MÃ QR CODE DÁN THIẾT BỊ (MỤC 4)                         */}
        {/* ========================================================================= */}
        {activeTab === "qrcode" && (
          <div className="space-y-8">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
                Mục 4 · Giải pháp QR Code dán thiết bị &amp; N8N
              </span>
              <h2 className="text-2xl font-black text-white">Market Tem Nhãn 40x40mm &amp; Trải Nghiệm Quét 1 Chạm</h2>
              <p className="text-xs text-slate-400">
                Kỹ thuật viên chỉ cần mở camera điện thoại quét tem dán trên máy/tủ: App tự động mở đúng trang máy đó kèm 3 nút bấm to dễ thao tác, loại trừ hoàn toàn việc nhầm máy.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* CỘT 1: MARKET TEM NHÃN 40X40MM */}
              <div className="space-y-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm">MARKET TEM NHÃN DÁN MÁY (KÍCH THƯỚC THẬT 40x40mm)</h3>
                  <span className="text-[10px] text-teal-400 font-mono font-bold">Tỷ lệ 1:1 In ấn y tế</span>
                </div>

                <div className="flex justify-center py-4">
                  <div className="w-[200px] h-[200px] bg-white text-slate-950 p-3 rounded-2xl shadow-2xl border-2 border-slate-300 flex flex-col items-center justify-between text-center select-none">
                    <div className="flex items-center gap-1.5 w-full border-b border-slate-200 pb-1">
                      <span className="grid size-5 place-items-center rounded-md bg-teal-700 text-white text-[8px] font-black">103</span>
                      <div className="text-left leading-none">
                        <p className="text-[8px] font-black text-slate-900 uppercase">BV QUÂN Y 103</p>
                        <p className="text-[7px] font-bold text-teal-700">KHOA SINH HÓA</p>
                      </div>
                      <span className="ml-auto text-[8px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">DEV_01</span>
                    </div>

                    <div className="my-1 p-1 bg-white border border-slate-200 rounded-lg">
                      <svg className="size-20" viewBox="0 0 100 100" fill="currentColor">
                        <path d="M0 0h30v30H0zm5 5v20h20V5zm5 5h10v10H10zM70 0h30v30H70zm5 5v20h20V5zm5 5h10v10H80zM0 70h30v30H0zm5 5v20h20V75zm5 5h10v10H10zM40 10h10v10H40zm10 10h10v10H50zm-10 10h10v10H40zm20-20h10v10H60zm20 30h10v10H80zm-40 10h10v10H40zm20 0h10v10H60zm-10 10h10v10H50zm20 0h10v10H70zm10 10h10v10H80zm-40 10h10v10H40zm30 0h10v10H70z"/>
                      </svg>
                    </div>

                    <div className="w-full border-t border-slate-200 pt-1 leading-tight">
                      <p className="text-[9px] font-black text-slate-900 truncate">Máy Khí Máu GEM 3000</p>
                      <p className="text-[7px] text-slate-500 font-semibold truncate">sh103-lab.vercel.app/qr/dev_01</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-teal-300 text-[11px] uppercase tracking-wide">Quy chuẩn tem vật lý:</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li><strong>Chất liệu:</strong> Decal nhựa PVC/Vinyl dẻo chống nước, chống rách.</li>
                    <li><strong>Bảo vệ:</strong> Cán màng bóng kháng cồn y tế 70° và dung dịch sát khuẩn Presept.</li>
                    <li><strong>Số lượng đợt 1:</strong> 20 tem máy xét nghiệm + 13 tem tủ lạnh/đá + 5 tem khu vực.</li>
                  </ul>
                </div>
              </div>

              {/* CỘT 2: ACTION SHEET 1 CHẠM */}
              <div className="space-y-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm">TRẢI NGHIỆM SAU QUÉT: ACTION SHEET 1 CHẠM</h3>
                  <span className="text-[10px] text-emerald-400 font-bold">Thao tác chỉ 2 giây</span>
                </div>

                <div className="w-full max-w-[340px] mx-auto bg-slate-900 text-slate-100 rounded-[36px] overflow-hidden p-4 border-2 border-slate-700 space-y-4">
                  <div className="text-center space-y-1 pt-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                      ✓ ĐÃ QUÉT THÀNH CÔNG: DEV_01
                    </span>
                    <h4 className="font-black text-white text-base">Máy Khí Máu GEM 3000</h4>
                    <p className="text-xs text-slate-400">Ca 1 - Sáng (07:00–11:30) · Kíp trực Sinh hóa</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => alert("Đã lưu thành công: Trạng thái [BT] cho Máy GEM 3000")}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-950/50 transition active:scale-98"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        <span>BÌNH THƯỜNG (BT)</span>
                      </span>
                      <span className="text-xs opacity-80 font-normal">Sẵn sàng chạy mẫu</span>
                    </button>

                    <button
                      onClick={() => alert("Đã lưu thành công: Trạng thái [KSD] cho Máy GEM 3000")}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-between border border-slate-700 transition active:scale-98"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">⏸</span>
                        <span>KHÔNG SỬ DỤNG (KSD)</span>
                      </span>
                      <span className="text-xs opacity-60 font-normal">Tắt máy / Không mẫu</span>
                    </button>

                    <button
                      onClick={() => alert("Cảnh báo: Đã ghi nhận máy [H] hỏng và gửi thông báo khẩn cấp!")}
                      className="w-full py-3.5 px-4 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-rose-950/50 transition active:scale-98"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>BÁO HỎNG (H)</span>
                      </span>
                      <span className="text-xs opacity-80 font-normal">Cần sửa chữa</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-slate-500">
                    Chỉ 1 chạm ngón tay để hoàn tất nhật ký BM.06 cho máy này.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

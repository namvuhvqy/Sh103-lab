"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Megaphone, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Clock 
} from "lucide-react";
import type { AnnouncementItem } from "@/lib/p5/queries";

interface ActiveAnnouncementsBannerProps {
  announcements: AnnouncementItem[];
}

const severityConfig: Record<
  AnnouncementItem["severity"],
  {
    icon: React.ComponentType<{ className?: string }>;
    cardClass: string;
    badgeClass: string;
    iconClass: string;
    label: string;
  }
> = {
  CRITICAL: {
    icon: AlertOctagon,
    cardClass: "border-rose-200 bg-rose-50/90 text-rose-950 shadow-xs ring-1 ring-rose-300/40",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    iconClass: "text-rose-600 bg-rose-100",
    label: "Chỉ đạo khẩn cấp",
  },
  WARNING: {
    icon: AlertTriangle,
    cardClass: "border-amber-200 bg-amber-50/90 text-amber-950 shadow-xs ring-1 ring-amber-300/40",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    iconClass: "text-amber-600 bg-amber-100",
    label: "Lưu ý vận hành",
  },
  INFO: {
    icon: Megaphone,
    cardClass: "border-sky-200 bg-sky-50/90 text-sky-950 shadow-xs ring-1 ring-sky-300/40",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    iconClass: "text-sky-600 bg-sky-100",
    label: "Thông báo nội bộ",
  },
  SUCCESS: {
    icon: CheckCircle2,
    cardClass: "border-emerald-200 bg-emerald-50/90 text-emerald-950 shadow-xs ring-1 ring-emerald-300/40",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    iconClass: "text-emerald-600 bg-emerald-100",
    label: "Thông báo",
  },
};

function formatAnnouncementTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(d);
  } catch {
    return isoString;
  }
}

export function ActiveAnnouncementsBanner({ announcements }: ActiveAnnouncementsBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const primaryItem = announcements[0];
  const remainingItems = announcements.slice(1);
  const config = severityConfig[primaryItem.severity] || severityConfig.INFO;
  const PrimaryIcon = config.icon;

  return (
    <section 
      aria-label="Thông báo nội bộ khoa" 
      className="space-y-2.5 transition-all duration-200"
    >
      {/* Thông báo chính nổi bật */}
      <article className={`rounded-3xl border p-4 sm:p-5 transition ${config.cardClass}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl border ${config.iconClass}`}>
            <PrimaryIcon className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${config.badgeClass}`}>
                  {config.label}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="size-3 text-slate-400" />
                  {formatAnnouncementTime(primaryItem.published_at || primaryItem.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/notifications"
                  className="text-xs font-black text-teal-800 hover:text-teal-950 underline underline-offset-2"
                >
                  Xem tất cả ({announcements.length}) →
                </Link>
              </div>
            </div>

            <h2 className="mt-2 text-base sm:text-lg font-black tracking-tight text-slate-950">
              {primaryItem.title}
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-800 whitespace-pre-line font-medium">
              {primaryItem.body}
            </p>

            {primaryItem.creator_profile?.full_name ? (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-2 border-t border-slate-200/60">
                <User className="size-3.5 text-slate-400" />
                <span>Người phát hành: <b className="text-slate-900">{primaryItem.creator_profile.full_name}</b></span>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {/* Nút bấm xem thêm các thông báo khác nếu có */}
      {remainingItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 py-1 px-2.5 rounded-xl hover:bg-teal-50 transition"
            >
              <span>{expanded ? "Thu gọn bớt" : `Xem thêm ${remainingItems.length} thông báo khác`}</span>
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>

          {expanded && (
            <div className="grid gap-2.5 sm:grid-cols-2 pt-1 animate-fadeIn">
              {remainingItems.map((item) => {
                const subConfig = severityConfig[item.severity] || severityConfig.INFO;
                const SubIcon = subConfig.icon;
                return (
                  <article 
                    key={item.id} 
                    className={`rounded-2xl border p-3.5 ${subConfig.cardClass}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-xl ${subConfig.iconClass}`}>
                        <SubIcon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className={`rounded-full border px-2 py-0.5 font-black uppercase ${subConfig.badgeClass}`}>
                            {subConfig.label}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {formatAnnouncementTime(item.published_at || item.created_at)}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-black text-slate-950 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {item.body}
                        </p>
                        {item.creator_profile?.full_name ? (
                          <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                            Bởi: {item.creator_profile.full_name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

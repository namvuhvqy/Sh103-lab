"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Info, MessageSquare, ThumbsUp, Send } from "lucide-react";
import type { NotificationItem, NotificationInteractionSummary } from "@/lib/p5/queries";
import { toggleNotificationLikeAction, addNotificationCommentAction, markNotificationReadAction } from "@/lib/p5/actions";

interface NotificationInteractiveFeedProps {
  items: NotificationItem[];
  initialInteractions: NotificationInteractionSummary;
  currentUserId?: string;
  currentUserName?: string;
}

export function NotificationInteractiveFeed({
  items,
  initialInteractions,
  currentUserName = "Bạn",
}: NotificationInteractiveFeedProps) {
  const [, startTransition] = useTransition();

  const [likesState, setLikesState] = useState<Record<string, { count: number; userLiked: boolean }>>(() => {
    const map: Record<string, { count: number; userLiked: boolean }> = {};
    items.forEach((item) => {
      map[item.id] = {
        count: initialInteractions.likesCount[item.id] || 0,
        userLiked: Boolean(initialInteractions.userLiked[item.id]),
      };
    });
    return map;
  });

  const [commentsState, setCommentsState] = useState<
    Record<string, Array<{ id: string; author: string; role?: string; text: string; createdAt: string }>>
  >(() => {
    return { ...initialInteractions.comments };
  });

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [readState, setReadState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    items.forEach((item) => {
      map[item.id] = Boolean(item.read_at);
    });
    return map;
  });

  const handleToggleLike = (id: string) => {
    // Optimistic update
    setLikesState((prev) => {
      const cur = prev[id] || { count: 0, userLiked: false };
      const nextLiked = !cur.userLiked;
      const nextCount = nextLiked ? cur.count + 1 : Math.max(0, cur.count - 1);
      return { ...prev, [id]: { count: nextCount, userLiked: nextLiked } };
    });

    startTransition(async () => {
      await toggleNotificationLikeAction(id);
    });
  };

  const handleSendComment = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (commentInputs[id] || "").trim();
    if (!text) return;

    const newComment = {
      id: `temp-${Date.now()}`,
      author: currentUserName,
      text,
      createdAt: new Date().toISOString(),
    };

    setCommentsState((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), newComment],
    }));
    setCommentInputs((prev) => ({ ...prev, [id]: "" }));

    startTransition(async () => {
      await addNotificationCommentAction(id, text);
    });
  };

  const handleMarkRead = (id: string) => {
    setReadState((prev) => ({ ...prev, [id]: true }));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon =
          item.severity === "CRITICAL" || item.severity === "WARNING"
            ? CircleAlert
            : item.severity === "SUCCESS"
            ? CircleCheck
            : Info;

        const severityBadgeStyle =
          item.severity === "CRITICAL"
            ? "bg-red-500 text-white border-red-600"
            : item.severity === "WARNING"
            ? "bg-amber-500 text-slate-950 border-amber-600"
            : item.severity === "SUCCESS"
            ? "bg-emerald-600 text-white border-emerald-700"
            : "bg-teal-700 text-white border-teal-800";

        const cardBorder =
          item.severity === "CRITICAL"
            ? "border-red-300 ring-1 ring-red-200 bg-red-50/15"
            : item.severity === "WARNING"
            ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/15"
            : "border-slate-200 bg-white";

        const isRead = readState[item.id];
        const likeInfo = likesState[item.id] || { count: 0, userLiked: false };
        const commentsList = commentsState[item.id] || [];
        const isCommentOpen = Boolean(openComments[item.id]);

        return (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 transition-all shadow-xs ${cardBorder} ${
              isRead ? "opacity-90" : "opacity-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-xs ${
                  item.severity === "CRITICAL"
                    ? "bg-red-600"
                    : item.severity === "WARNING"
                    ? "bg-amber-600"
                    : item.severity === "SUCCESS"
                    ? "bg-emerald-600"
                    : "bg-teal-700"
                }`}
              >
                <Icon className="size-5" />
              </span>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${severityBadgeStyle}`}
                    >
                      {item.severity === "CRITICAL"
                        ? "🚨 Khẩn cấp"
                        : item.severity === "WARNING"
                        ? "⚠️ Cảnh báo"
                        : item.severity === "SUCCESS"
                        ? "✅ Hoàn tất"
                        : "ℹ️ Thông tin"}
                    </span>
                    {item.kind ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                        {item.kind}
                      </span>
                    ) : null}
                  </div>

                  <time className="text-[11px] font-semibold text-slate-500">
                    {new Date(item.created_at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </time>
                </div>

                <h2 className="text-sm font-black text-slate-950 leading-snug">{item.title}</h2>
                <p className="text-xs leading-relaxed text-slate-700">{item.body}</p>

                {item.target_url ? (
                  <div className="pt-1">
                    <Link
                      href={item.target_url}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 underline underline-offset-4"
                    >
                      Mở liên kết chi tiết →
                    </Link>
                  </div>
                ) : null}

                {/* ACTION BAR: LIKE - COMMENT - MARK READ */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* LIKE BUTTON: STRICTLY Like according to user request a */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.id)}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all duration-150 active:scale-95 select-none ${
                        likeInfo.userLiked
                          ? "bg-teal-700 text-white shadow-xs ring-2 ring-teal-500/40"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title={likeInfo.userLiked ? "Bỏ Like" : "Bấm Like"}
                    >
                      <ThumbsUp className={`size-3.5 ${likeInfo.userLiked ? "fill-white" : ""}`} />
                      <span>Like</span>
                      {likeInfo.count > 0 ? (
                        <span
                          className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                            likeInfo.userLiked ? "bg-teal-800 text-teal-100" : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {likeInfo.count}
                        </span>
                      ) : null}
                    </button>

                    {/* COMMENT TOGGLE BUTTON */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all duration-150 active:scale-95 select-none ${
                        isCommentOpen || commentsList.length > 0
                          ? "bg-teal-50 text-teal-800 border border-teal-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Bình luận</span>
                      {commentsList.length > 0 ? (
                        <span className="ml-0.5 rounded-full bg-teal-200/80 px-1.5 py-0.2 text-[10px] font-black text-teal-900">
                          {commentsList.length}
                        </span>
                      ) : null}
                    </button>
                  </div>

                  {!isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      className="inline-flex min-h-9 items-center px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Đã đọc</span>
                  )}
                </div>

                {/* COMMENT SECTION */}
                {isCommentOpen || commentsList.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 bg-slate-50/80 -mx-4 -mb-4 p-4 rounded-b-2xl">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Ý kiến phản hồi ({commentsList.length})
                    </h4>

                    {commentsList.length > 0 ? (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {commentsList.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs shadow-2xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="flex items-center gap-1.5">
                                <span className="grid size-5 place-items-center rounded-full bg-teal-100 text-[10px] font-black text-teal-800">
                                  {c.author.slice(0, 1).toUpperCase()}
                                </span>
                                <span>{c.author}</span>
                                {c.role ? (
                                  <span className="text-[9px] font-normal text-slate-500">({c.role})</span>
                                ) : null}
                              </span>
                              <time className="text-[10px] font-normal text-slate-400">
                                {new Date(c.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </time>
                            </div>
                            <p className="text-slate-700 leading-relaxed text-[11px]">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* INPUT FORM */}
                    <form
                      onSubmit={(e) => handleSendComment(item.id, e)}
                      className="flex items-center gap-1.5 pt-1"
                    >
                      <input
                        type="text"
                        placeholder="Viết phản hồi / ghi nhận cho khoa..."
                        value={commentInputs[item.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
                      />
                      <button
                        type="submit"
                        disabled={!(commentInputs[item.id] || "").trim()}
                        className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-teal-700 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 active:scale-95 transition-all select-none"
                      >
                        <Send className="size-3.5" />
                        <span>Gửi</span>
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

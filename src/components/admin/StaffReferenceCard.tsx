"use client";

import React from "react";
import { type StaffReferenceSummary, evaluateAccountLifecycleSafety } from "@/lib/admin/staff-domain";
import { AlertCircle, ShieldAlert, ShieldCheck, Database } from "lucide-react";

export interface StaffReferenceCardProps {
  summary: StaffReferenceSummary;
  userName: string;
}

export function StaffReferenceCard({ summary, userName }: StaffReferenceCardProps) {
  const safety = evaluateAccountLifecycleSafety(summary);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-teal-700" />
          <h3 className="text-sm font-black text-slate-900">Tổng hợp dữ liệu tham chiếu ({userName})</h3>
        </div>
        {safety.canHardDelete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="size-3.5" />
            Không có dữ liệu ràng buộc
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <ShieldAlert className="size-3.5" />
            Có dữ liệu lịch sử
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[11px] font-bold text-slate-500">Bản ghi sổ</p>
          <p className="mt-1 text-xl font-black text-slate-900">{summary.records_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[11px] font-bold text-slate-500">Phê duyệt</p>
          <p className="mt-1 text-xl font-black text-slate-900">{summary.approvals_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[11px] font-bold text-slate-500">Ca trực Roster</p>
          <p className="mt-1 text-xl font-black text-slate-900">{summary.roster_assignments_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[11px] font-bold text-slate-500">Audit Logs</p>
          <p className="mt-1 text-xl font-black text-slate-900">{summary.audit_events_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[11px] font-bold text-slate-500">Sự cố</p>
          <p className="mt-1 text-xl font-black text-slate-900">{summary.incidents_count}</p>
        </div>
      </div>

      {!safety.canHardDelete ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold">Không thể xóa vĩnh viễn (Hard Delete bị khóa):</p>
              <p className="mt-0.5">{safety.blockReason}</p>
              <p className="mt-1 font-bold text-teal-900">
                → Chỉ được phép vô hiệu hóa (Deactivate) để bảo toàn tính toàn vẹn hồ sơ.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
          <p>Tài khoản chưa phát sinh bất kỳ bản ghi đo đạc, phê duyệt hay phân công ca trực nào. Có thể xóa hoặc vô hiệu hóa an toàn.</p>
        </div>
      )}
    </div>
  );
}

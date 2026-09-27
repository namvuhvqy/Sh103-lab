import React from "react";
import { Users, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { DutyRosterInfo } from "@/lib/work-session/server-context";

interface Props {
  roster: DutyRosterInfo | null;
  businessDate: string;
  slotCode: string;
  isOfficialRecordCreated: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Trưởng khoa / Phụ trách",
  DOCTOR: "Bác sĩ trực",
  TECHNICIAN: "Kỹ thuật viên trực",
};

export function WorkSessionRosterCard({
  roster,
  isOfficialRecordCreated,
}: Props) {
  return (
    <section aria-labelledby="roster-card-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <Users className="size-4" aria-hidden="true" />
          </span>
          <h2 id="roster-card-title" className="font-bold text-slate-900">
            Phân công ca trực
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {isOfficialRecordCreated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              Đã tạo hồ sơ chính thức
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
              <Clock className="size-3.5" />
              Chưa tạo hồ sơ chính thức
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        {roster && roster.members && roster.members.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {roster.members.map((member) => (
              <li key={member.user_id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-teal-500" aria-hidden="true" />
                  <span className="font-medium text-slate-900">{member.full_name}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {ROLE_LABELS[member.business_role] || member.business_role}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
            <span>Chưa có phân công ca trực được thiết lập cho phiên này.</span>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import React, { useState } from "react";
import { Users, AlertCircle, CheckCircle2, Clock, UserPlus, Edit3, X } from "lucide-react";
import type { DutyRosterInfo } from "@/lib/work-session/server-context";
import { RosterShiftEditor } from "@/components/roster/RosterShiftEditor";
import { saveDutyRosterAction } from "@/lib/roster/actions";
import type { DutyKind, RosterStaffMember } from "@/lib/roster/domain";
import { useRouter } from "next/navigation";

interface Props {
  roster: DutyRosterInfo | null;
  businessDate: string;
  slotCode: string;
  isOfficialRecordCreated: boolean;
  availableStaff?: RosterStaffMember[];
  currentUserId?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Trưởng khoa / Phụ trách",
  DOCTOR: "Bác sĩ trực",
  TECHNICIAN: "Kỹ thuật viên trực",
};

function resolveDutyKind(slotCode: string): DutyKind {
  switch (slotCode) {
    case "SHIFT_2":
      return "WEEKDAY_LUNCH";
    case "SHIFT_3":
      return "WEEKDAY_AFTERNOON";
    case "SHIFT_4":
      return "WEEKDAY_NIGHT";
    default:
      return "WEEKDAY_LUNCH";
  }
}

export function WorkSessionRosterCard({
  roster,
  businessDate,
  slotCode,
  isOfficialRecordCreated,
  availableStaff = [],
  currentUserId = null,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [localRoster, setLocalRoster] = useState<DutyRosterInfo | null>(roster);

  const isShift1 = slotCode === "SHIFT_1" || slotCode === "MORNING";
  const dutyKind = resolveDutyKind(slotCode);

  const currentMembers = localRoster?.members ?? [];
  const currentUser = availableStaff.find((staff) => staff.user_id === currentUserId);
  const canSelfAssign = Boolean(currentUser && !isShift1 && currentMembers.length === 0);
  const initialMemberIds = [
    currentMembers[0]?.user_id ?? (canSelfAssign ? currentUserId ?? "" : ""),
    currentMembers[1]?.user_id ?? "",
  ];

  const handleSelfAssign = () => {
    if (!canSelfAssign) return;
    setIsEditing(true);
  };

  const handleSaveRoster = async (payload: {
    businessDate: string;
    dutyKind: DutyKind;
    userIds: string[];
    expectedLock?: number;
  }) => {
    const result = await saveDutyRosterAction(payload);
    if (!result.success) {
      throw new Error(result.error ?? "Không thể lưu phân công ca trực");
    }

    // Update local roster view immediately
    const member1 = availableStaff.find((s) => s.user_id === payload.userIds[0]);
    const member2 = availableStaff.find((s) => s.user_id === payload.userIds[1]);
    if (member1 && member2) {
      setLocalRoster({
        roster_id: result.rosterId ?? "new-roster",
        duty_kind: payload.dutyKind,
        business_date: payload.businessDate,
        members: [
          {
            user_id: member1.user_id,
            full_name: member1.full_name,
            business_role: member1.business_role as "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN",
            member_order: 1,
            source_order: member1.source_order ?? undefined,
          },
          {
            user_id: member2.user_id,
            full_name: member2.full_name,
            business_role: member2.business_role as "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN",
            member_order: 2,
            source_order: member2.source_order ?? undefined,
          },
        ],
      });
    }

    setIsEditing(false);
    router.refresh();
  };

  return (
    <section aria-labelledby="roster-card-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
            <Users className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="roster-card-title" className="font-black text-slate-900 leading-tight">
              Phân công ca trực
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isShift1
                ? "Giờ làm việc bình thường"
                : dutyKind === "WEEKDAY_AFTERNOON"
                ? "Ca chiều: Đúng 2 nhân sự STAFF"
                : "Ca trực: Đúng 1 Bác sĩ + 1 Kỹ thuật viên"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOfficialRecordCreated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3.5" />
              Đã tạo hồ sơ chính thức
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              <Clock className="size-3.5" />
              Chưa tạo hồ sơ chính thức
            </span>
          )}

          {!isShift1 && availableStaff.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-800 hover:bg-teal-100 active:scale-95 transition"
            >
              {isEditing ? (
                <>
                  <X className="size-3.5" />
                  <span>Đóng</span>
                </>
              ) : currentMembers.length > 0 ? (
                <>
                  <Edit3 className="size-3.5" />
                  <span>Chỉnh sửa kíp trực</span>
                </>
              ) : (
                <>
                  <UserPlus className="size-3.5" />
                  <span>Phân công kíp trực</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main content or Inline Roster Editor */}
      <div className="mt-4">
        {isEditing && !isShift1 ? (
          <div className="rounded-2xl border border-teal-100 bg-slate-50/50 p-4 animate-fadeIn">
            <RosterShiftEditor
              businessDate={businessDate}
              dutyKind={dutyKind}
              availableStaff={availableStaff}
              initialMemberIds={initialMemberIds}
              expectedLock={localRoster?.lock_version}
              onSave={handleSaveRoster}
            />
          </div>
        ) : isShift1 ? (
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-xs font-medium text-teal-950">
            <p className="font-bold text-teal-900">Buổi sáng là giờ làm việc bình thường tại khoa.</p>
            <p className="mt-1 text-slate-600">
              Tất cả nhân viên có quyền nghiệp vụ phù hợp đều có thể nhập dữ liệu thuộc phần việc của mình. Không áp dụng quy tắc cứng 1 Bác sĩ + 1 KTV cho buổi sáng.
            </p>
          </div>
        ) : currentMembers.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {currentMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-600 text-xs font-black text-white">
                    {member.source_order ? `#${member.source_order}` : "✓"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">{member.full_name}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {ROLE_LABELS[member.business_role] || member.business_role}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-black text-teal-800">
                  Trong kíp
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-black text-amber-900">Chưa có phân công ca trực được thiết lập cho phiên này.</p>
                <p className="mt-0.5 text-amber-800">
                  Bác sĩ, Trưởng khoa hoặc Admin có thể bấm nút <b>Phân công kíp trực</b> để chọn nhân sự từ danh sách chính thức.
                </p>
              </div>
            </div>
            {availableStaff.length > 0 && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {canSelfAssign ? (
                  <button
                    type="button"
                    onClick={handleSelfAssign}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 transition"
                  >
                    <UserPlus className="size-3.5" />
                    <span>Tôi nhận ca này</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-white px-4 text-xs font-bold text-teal-800 hover:bg-teal-50 transition"
                >
                  <UserPlus className="size-3.5" />
                  <span>{canSelfAssign ? "Chọn người cùng ca" : "Phân công kíp trực"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

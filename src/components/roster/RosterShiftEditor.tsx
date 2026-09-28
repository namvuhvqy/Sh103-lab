"use client";

import React, { useState, useMemo } from "react";
import {
  DUTY_KINDS,
  validateRosterRequirements,
  type DutyKind,
  type RosterStaffMember,
} from "@/lib/roster/domain";
import { Users, AlertTriangle, CheckCircle2, Save } from "lucide-react";

export interface RosterShiftEditorProps {
  businessDate: string;
  dutyKind: DutyKind;
  availableStaff: RosterStaffMember[];
  initialMemberIds?: string[];
  currentUserId?: string | null;
  expectedLock?: number;
  onSave: (payload: {
    businessDate: string;
    dutyKind: DutyKind;
    userIds: string[];
    expectedLock?: number;
  }) => Promise<void> | void;
  disabled?: boolean;
}

export function RosterShiftEditor({
  businessDate,
  dutyKind,
  availableStaff,
  initialMemberIds = ["", ""],
  currentUserId = null,
  expectedLock,
  onSave,
  disabled = false,
}: RosterShiftEditorProps) {
  const eligibleStaff = useMemo(
    () => availableStaff.filter((staff) => staff.active && staff.account_kind === "STAFF"),
    [availableStaff]
  );
  const hasExistingRoster = Boolean(initialMemberIds[0] && initialMemberIds[1]);
  const firstMemberId = hasExistingRoster ? initialMemberIds[0] ?? "" : currentUserId ?? "";
  const [member2Id, setMember2Id] = useState<string>(hasExistingRoster ? initialMemberIds[1] ?? "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const definition = DUTY_KINDS[dutyKind];
  const staffMap = useMemo(() => new Map(eligibleStaff.map((staff) => [staff.user_id, staff])), [eligibleStaff]);
  const firstMember = firstMemberId ? staffMap.get(firstMemberId) : undefined;
  const firstMemberNeedsDoctor = definition.doctorRequired && (firstMember?.business_role === "TECHNICIAN");
  const firstMemberNeedsTechnician = definition.technicianRequired && (firstMember?.business_role === "DOCTOR" || firstMember?.business_role === "DEPARTMENT_HEAD");
  const secondPositionStaff = eligibleStaff.filter((staff) => {
    if (staff.user_id === firstMemberId) return false;
    if (!definition.doctorRequired && !definition.technicianRequired) return true;
    if (firstMemberNeedsDoctor) return staff.business_role === "DOCTOR" || staff.business_role === "DEPARTMENT_HEAD";
    if (firstMemberNeedsTechnician) return staff.business_role === "TECHNICIAN";
    return true;
  });
  const secondPositionLabel = !definition.doctorRequired && !definition.technicianRequired
    ? "(Nhân sự STAFF)"
    : firstMemberNeedsDoctor
    ? "(Bác sĩ / Trưởng khoa)"
    : firstMemberNeedsTechnician
    ? "(Kỹ thuật viên)"
    : "(STAFF hợp lệ còn lại)";

  const selectedStaff = useMemo(() => {
    const list: RosterStaffMember[] = [];
    if (firstMemberId && staffMap.has(firstMemberId)) list.push(staffMap.get(firstMemberId)!);
    if (member2Id && staffMap.has(member2Id)) list.push(staffMap.get(member2Id)!);
    return list;
  }, [firstMemberId, member2Id, staffMap]);

  const validation = useMemo(() => {
    if (!firstMemberId || !member2Id) {
      return { valid: false, error: "Vui lòng chọn đủ 2 nhân sự cho ca trực" };
    }
    return validateRosterRequirements(dutyKind, selectedStaff);
  }, [dutyKind, firstMemberId, member2Id, selectedStaff]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid || disabled || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setServerError(null);
      await onSave({
        businessDate,
        dutyKind,
        userIds: [firstMemberId, member2Id],
        expectedLock,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu phân công ca trực");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-teal-200 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
              {definition.timeRange}
            </span>
            <span className="text-xs text-slate-500 font-medium">Ngày: {businessDate}</span>
          </div>
          <h3 className="mt-1 text-base font-black text-slate-900">{definition.label}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{definition.description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
          <Users className="size-4 text-teal-600" />
          <span>Định mức: 2 nhân sự</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Member 1: current user or persisted roster member, readonly */}
          <div>
            <p className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Vị trí 1 {definition.doctorRequired ? "(Bác sĩ / Trưởng khoa hoặc KTV hiện tại)" : "(Nhân sự STAFF hiện tại)"}
            </p>
            <div className="mt-1.5 rounded-2xl border border-teal-200 bg-teal-50/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{firstMember?.full_name ?? "Không xác định user hiện tại"}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">
                    {firstMember?.business_role === "DEPARTMENT_HEAD" ? "Trưởng khoa / Phụ trách" : firstMember?.business_role === "DOCTOR" ? "Bác sĩ trực" : firstMember?.business_role === "TECHNICIAN" ? "Kỹ thuật viên trực" : "Chưa xác định vai trò"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-teal-800 shadow-sm">Readonly</span>
              </div>
            </div>
          </div>

          {/* Member 2 Picker */}
          <div>
            <label
              htmlFor={`roster-member-2-${dutyKind}`}
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Vị trí 2 {secondPositionLabel}
            </label>
            <select
              id={`roster-member-2-${dutyKind}`}
              value={member2Id}
              disabled={disabled || isSubmitting}
              onChange={(e) => setMember2Id(e.target.value)}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100"
            >
              <option value="">-- Chọn nhân sự --</option>
              {secondPositionStaff.map((staff) => (
                <option key={staff.user_id} value={staff.user_id}>
                  {staff.source_order ? `#${staff.source_order} ` : ""}
                  {staff.full_name} ({staff.business_role === "DEPARTMENT_HEAD" ? "Trưởng khoa" : staff.business_role === "DOCTOR" ? "Bác sĩ" : "Kỹ thuật viên"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Warning / Error */}
        {!validation.valid && firstMemberId && member2Id && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>{validation.error}</span>
          </div>
        )}

        {serverError && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-900">
            <AlertTriangle className="size-4 shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        {isSubmitting && (
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-900">
            <Save className="size-4 shrink-0 text-blue-700" />
            <span>Saving · Đang lưu kíp trực...</span>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Saved · Đã lưu phân công kíp trực</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!validation.valid || disabled || isSubmitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 px-5 text-xs font-bold text-white shadow-xs transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Lưu phân công"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  type BusinessRole,
  type AccountKind,
  type StaffProfileFormData,
  validateStaffProfilePayload,
} from "@/lib/admin/staff-domain";
import { UserCheck, AlertTriangle, UserX, Save, Lock } from "lucide-react";

export interface StaffProfileItem {
  user_id: string;
  full_name: string;
  business_role: BusinessRole;
  account_kind: AccountKind;
  is_admin: boolean;
  source_order: number | null;
  active: boolean;
}

export interface StaffManagementPanelProps {
  initialProfile: StaffProfileItem;
  authAdminAvailable: boolean;
  authAdminMissingReason?: string;
  onSaveProfile: (data: StaffProfileFormData) => Promise<void> | void;
  onDeactivate: (reason: string) => Promise<void> | void;
  disabled?: boolean;
}

export function StaffManagementPanel({
  initialProfile,
  authAdminAvailable,
  authAdminMissingReason,
  onSaveProfile,
  onDeactivate,
  disabled = false,
}: StaffManagementPanelProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [businessRole, setBusinessRole] = useState<BusinessRole>(initialProfile.business_role);
  const [accountKind, setAccountKind] = useState<AccountKind>(initialProfile.account_kind);
  const [isAdmin, setIsAdmin] = useState(initialProfile.is_admin);
  const [sourceOrder, setSourceOrder] = useState<string>(
    initialProfile.source_order !== null ? String(initialProfile.source_order) : ""
  );
  const [deactivateReason, setDeactivateReason] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    const payload: StaffProfileFormData = {
      full_name: fullName,
      business_role: businessRole,
      account_kind: accountKind,
      is_admin: isAdmin,
      source_order: sourceOrder ? parseInt(sourceOrder, 10) : null,
    };

    const validation = validateStaffProfilePayload(payload);
    if (!validation.valid) {
      setErrorMessage(validation.error ?? "Dữ liệu không hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSaveProfile(payload);
      setStatusMessage("Cập nhật thông tin và phân quyền thành công");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Lỗi khi lưu thông tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateReason.trim()) {
      setErrorMessage("Vui lòng nhập lý do vô hiệu hóa");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onDeactivate(deactivateReason);
      setShowDeactivateModal(false);
      setStatusMessage("Đã vô hiệu hóa tài khoản thành công");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Lỗi khi vô hiệu hóa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auth Admin Lifecycle Pre-requisite notice (Honest UX) */}
      {!authAdminAvailable && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <Lock className="size-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <h4 className="text-sm font-black">Khởi tạo / Đổi mật khẩu Auth bị khóa (Chế độ An toàn)</h4>
              <p className="mt-1 text-xs leading-relaxed">
                {authAdminMissingReason ??
                  "Hệ thống không phát hiện SUPABASE_SERVICE_ROLE_KEY trên server. Để bảo mật tuyệt đối, chức năng tạo/xóa tài khoản Supabase Auth trực tiếp bị khóa. Bạn vẫn có thể quản lý Hồ sơ nhân sự (Profile), Phân quyền và Vô hiệu hóa (Deactivate) qua Database an toàn."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile & Scope Form */}
      <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-teal-700" />
            <h3 className="text-sm font-black text-slate-900">Thông tin nhân sự & Phân quyền</h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
              initialProfile.active
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {initialProfile.active ? "ĐANG HOẠT ĐỘNG" : "ĐÃ VÔ HIỆU HÓA"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={disabled || isSubmitting}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              placeholder="VD: TS.BS Huỳnh Quang Thuận"
            />
          </div>

          {/* STT Phụ lục / Source Order */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              STT Phụ lục (Thứ tự hiển thị 1–25)
            </label>
            <input
              type="number"
              value={sourceOrder}
              onChange={(e) => setSourceOrder(e.target.value)}
              disabled={disabled || isSubmitting}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
              placeholder="1"
            />
          </div>

          {/* Business Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Vai trò nghiệp vụ</label>
            <select
              value={businessRole}
              onChange={(e) => setBusinessRole(e.target.value as BusinessRole)}
              disabled={disabled || isSubmitting}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD (Trưởng / Phó khoa)</option>
              <option value="DOCTOR">DOCTOR (Bác sĩ điều trị / xét nghiệm)</option>
              <option value="TECHNICIAN">TECHNICIAN (Kỹ thuật viên xét nghiệm)</option>
            </select>
          </div>

          {/* Account Kind */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Phân loại tài khoản</label>
            <select
              value={accountKind}
              onChange={(e) => setAccountKind(e.target.value as AccountKind)}
              disabled={disabled || isSubmitting}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="STAFF">STAFF (Nhân sự chính thức - Tham gia ca trực)</option>
              <option value="SYSTEM">SYSTEM (Tài khoản hệ thống)</option>
              <option value="TEST">TEST (Tài khoản thử nghiệm - Loại trừ ca trực)</option>
            </select>
          </div>
        </div>

        {/* Is Admin Checkbox with explicit invariant notice */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={disabled || isSubmitting}
              className="mt-1 size-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <div>
              <span className="text-xs font-black text-slate-900">Quyền Quản trị Kỹ thuật (is_admin = true)</span>
              <p className="mt-0.5 text-xs text-slate-600">
                Lưu ý: Quyền Admin là cờ quản trị kỹ thuật, hoàn toàn tách biệt với vai trò nghiệp vụ. Quyền Admin không cấp quyền phê duyệt biểu mẫu thay Trưởng khoa.
              </p>
            </div>
          </label>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-900">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {initialProfile.active ? (
            <button
              type="button"
              onClick={() => setShowDeactivateModal(true)}
              disabled={disabled || isSubmitting}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              <UserX className="size-4" />
              Vô hiệu hóa tài khoản (Deactivate)
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-semibold italic">Tài khoản này đã bị vô hiệu hóa.</span>
          )}

          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-800 px-6 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition focus-visible:ring-2 focus-visible:ring-teal-600 disabled:bg-slate-300"
          >
            <Save className="size-4" />
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              <h4 className="text-base font-black text-slate-900">Xác nhận Vô hiệu hóa</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vô hiệu hóa sẽ khóa quyền đăng nhập và các phân quyền của nhân sự <b>{initialProfile.full_name}</b>, đồng thời giữ nguyên toàn bộ lịch sử đo đạc, phê duyệt và phân công ca trực.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lý do vô hiệu hóa *</label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="VD: Nhân sự chuyển công tác / Nghỉ thai sản..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận vô hiệu hóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

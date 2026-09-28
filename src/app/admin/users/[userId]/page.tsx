import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StaffManagementPanel } from "@/components/admin/StaffManagementPanel";
import { StaffReferenceCard } from "@/components/admin/StaffReferenceCard";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  checkAuthAdminPrerequisites,
  fetchStaffReferenceSummary,
  updateStaffProfileAndScopesAction,
  deactivateStaffProfileAction,
} from "@/lib/admin/staff-actions";
import { type BusinessRole, type AccountKind, type StaffProfileFormData } from "@/lib/admin/staff-domain";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const { supabase } = await requireAdmin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role, account_kind, source_order, is_admin, active")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  const referenceSummary = await fetchStaffReferenceSummary(userId);
  const authPrereqs = checkAuthAdminPrerequisites();

  const handleSave = async (data: StaffProfileFormData) => {
    "use server";
    await updateStaffProfileAndScopesAction({
      userId,
      data,
    });
  };

  const handleDeactivate = async (reason: string) => {
    "use server";
    const result = await deactivateStaffProfileAction({
      userId,
      reason,
    });
    if (!result.success) throw new Error(result.error ?? "Không thể vô hiệu hóa tài khoản");
  };

  return (
    <AdminPageShell
      title={`Hồ sơ: ${profile.full_name}`}
      description="Quản lý chi tiết vai trò nghiệp vụ, cờ Admin, thứ tự hiển thị và tổng hợp ràng buộc tham chiếu."
    >
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition"
        >
          <ArrowLeft className="size-4" />
          Quay lại Danh bạ nhân sự
        </Link>
      </div>

      <div className="space-y-6">
        <StaffReferenceCard summary={referenceSummary} userName={profile.full_name} />

        <StaffManagementPanel
          initialProfile={{
            user_id: profile.user_id,
            full_name: profile.full_name,
            business_role: profile.business_role as BusinessRole,
            account_kind: profile.account_kind as AccountKind,
            is_admin: profile.is_admin,
            source_order: profile.source_order,
            active: profile.active,
          }}
          authAdminAvailable={authPrereqs.available}
          authAdminMissingReason={authPrereqs.reason}
          onSaveProfile={handleSave}
          onDeactivate={handleDeactivate}
        />
      </div>
    </AdminPageShell>
  );
}

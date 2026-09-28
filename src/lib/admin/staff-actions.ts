import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import {
  type StaffProfileFormData,
  type StaffReferenceSummary,
} from "./staff-domain";

export interface UpdateStaffParams {
  userId: string;
  data: StaffProfileFormData;
}

export interface DeactivateStaffParams {
  userId: string;
  reason: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export function checkAuthAdminPrerequisites(): {
  available: boolean;
  reason?: string;
} {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return {
      available: false,
      reason:
        "Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY hoặc NEXT_PUBLIC_SUPABASE_URL. Các thao tác trực tiếp với Supabase Auth (tạo tài khoản, đổi mật khẩu Auth, xóa Auth) bị khóa để đảm bảo an toàn.",
    };
  }

  return {
    available: true,
  };
}

export async function fetchStaffReferenceSummary(userId: string): Promise<StaffReferenceSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_reference_summary", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch staff reference summary: ${error.message}`);
  }

  return data as StaffReferenceSummary;
}

export async function updateStaffProfileAndScopesAction(
  params: UpdateStaffParams
): Promise<ActionResult> {
  const supabase = await createClient();
  const { userId, data } = params;

  const { error } = await supabase.rpc("set_staff_profile_and_scopes", {
    target_user_id: userId,
    target_full_name: data.full_name,
    target_business_role: data.business_role,
    target_is_admin: data.is_admin,
    target_account_kind: data.account_kind,
    target_source_order: data.source_order ?? null,
    target_form_template_ids: data.form_template_ids ?? null,
    target_location_ids: data.location_ids ?? null,
    target_asset_ids: data.asset_ids ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deactivateStaffProfileAction(
  params: DeactivateStaffParams
): Promise<ActionResult> {
  const { userId, reason } = params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return {
      success: false,
      error: "Vô hiệu hóa hoàn chỉnh yêu cầu SUPABASE_SERVICE_ROLE_KEY trên server để khóa đăng nhập Auth.",
    };
  }

  const adminAuthClient = createSupabaseAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: banError } = await adminAuthClient.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (banError) return { success: false, error: banError.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("deactivate_staff_profile", {
    target_user_id: userId,
    target_reason: reason,
  });
  if (error) {
    await adminAuthClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
    return { success: false, error: error.message };
  }
  await adminAuthClient.auth.admin.signOut(userId, "global");
  return { success: true };
}

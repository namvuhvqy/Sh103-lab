import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { checkAuthAdminPrerequisites } from "@/lib/admin/staff-actions";
import { validateStaffProfilePayload } from "@/lib/admin/staff-domain";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("current_is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
  }

  const prereqs = checkAuthAdminPrerequisites();
  if (!prereqs.available) {
    return NextResponse.json(
      {
        error:
          prereqs.reason ??
          "Thiếu SUPABASE_SERVICE_ROLE_KEY. Không thể tạo tài khoản Supabase Auth trực tiếp trên server.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, full_name, business_role, account_kind = "STAFF", source_order, is_admin = false } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    const validation = validateStaffProfilePayload({
      full_name,
      business_role,
      account_kind,
      is_admin,
      source_order,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Secure server-side Supabase admin client initialized only in server runtime with service role
    const adminAuthClient = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: newAuth, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError || !newAuth.user) {
      return NextResponse.json({ error: authError?.message ?? "Không thể tạo tài khoản auth" }, { status: 400 });
    }

    // Set profile in database. Roll Auth back if the profile transaction fails.
    const { error: profileError } = await supabase.rpc("set_staff_profile_and_scopes", {
      target_user_id: newAuth.user.id,
      target_full_name: full_name,
      target_business_role: business_role,
      target_is_admin: is_admin,
      target_account_kind: account_kind,
      target_source_order: source_order ?? null,
      target_form_template_ids: null,
      target_location_ids: null,
      target_asset_ids: null,
    });
    if (profileError) {
      const { error: rollbackError } = await adminAuthClient.auth.admin.deleteUser(newAuth.user.id);
      const rollbackSuffix = rollbackError
        ? `; Auth rollback failed: ${rollbackError.message}`
        : "";
      return NextResponse.json(
        { error: `Không thể tạo hồ sơ nhân sự: ${profileError.message}${rollbackSuffix}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user_id: newAuth.user.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

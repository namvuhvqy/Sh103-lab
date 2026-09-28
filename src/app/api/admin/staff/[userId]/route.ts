import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { evaluateAccountLifecycleSafety, validateStaffProfilePayload } from "@/lib/admin/staff-domain";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("current_is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
  }

  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role, account_kind, source_order, is_admin, active")
    .eq("user_id", userId)
    .single();

  if (pError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: summary, error: sError } = await supabase.rpc("staff_reference_summary", {
    target_user_id: userId,
  });

  if (sError) {
    return NextResponse.json({ error: sError.message }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    reference_summary: summary,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("current_is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { full_name, business_role, account_kind, is_admin, source_order, form_template_ids, location_ids, asset_ids } = body;

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

    const { error: rpcError } = await supabase.rpc("set_staff_profile_and_scopes", {
      target_user_id: userId,
      target_full_name: full_name,
      target_business_role: business_role,
      target_is_admin: is_admin,
      target_account_kind: account_kind,
      target_source_order: source_order ?? null,
      target_form_template_ids: form_template_ids ?? null,
      target_location_ids: location_ids ?? null,
      target_asset_ids: asset_ids ?? null,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("current_is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Vô hiệu hóa hoàn chỉnh yêu cầu SUPABASE_SERVICE_ROLE_KEY trên server để khóa đăng nhập Auth." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as { action?: string; reason?: string } | null;
  if (body?.action !== "DEACTIVATE" || !body.reason?.trim()) {
    return NextResponse.json({ error: "Action hoặc lý do vô hiệu hóa không hợp lệ" }, { status: 400 });
  }

  const adminAuthClient = createSupabaseAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: banError } = await adminAuthClient.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: `Không thể khóa đăng nhập Auth: ${banError.message}` }, { status: 502 });
  }

  const { error: deactivateError } = await supabase.rpc("deactivate_staff_profile", {
    target_user_id: userId,
    target_reason: body.reason.trim(),
  });
  if (deactivateError) {
    await adminAuthClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  await adminAuthClient.auth.admin.signOut(userId, "global");
  return NextResponse.json({ success: true, message: "Đã vô hiệu hóa hồ sơ và khóa đăng nhập" });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("current_is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
  }

  // 1. Check reference summary
  const { data: summary, error: sError } = await supabase.rpc("staff_reference_summary", {
    target_user_id: userId,
  });

  if (sError) {
    return NextResponse.json({ error: sError.message }, { status: 500 });
  }

  const safety = evaluateAccountLifecycleSafety(summary);
  if (!safety.canHardDelete) {
    return NextResponse.json(
      {
        error: `Không thể xóa vĩnh viễn: ${safety.blockReason}`,
        can_hard_delete: false,
        recommended_action: "DEACTIVATE",
      },
      { status: 409 }
    );
  }

  // If completely clean, proceed with hard delete if service key available
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      {
        error:
          "Xóa cứng Auth yêu cầu SUPABASE_SERVICE_ROLE_KEY trên server. Khuyến nghị sử dụng Deactivate thay vì xóa cứng.",
      },
      { status: 503 }
    );
  }

  try {
    const adminAuthClient = createSupabaseAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete database identity first; every provider error is blocking.
    const { error: scopeDeleteError } = await supabase
      .from("user_scope_assignments")
      .delete()
      .eq("user_id", userId);
    if (scopeDeleteError) {
      return NextResponse.json({ error: scopeDeleteError.message }, { status: 500 });
    }

    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);
    if (profileDeleteError) {
      return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
    }

    const { error: authDeleteError } = await adminAuthClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return NextResponse.json(
        { error: `Hồ sơ đã xóa nhưng Auth chưa xóa: ${authDeleteError.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Đã xóa vĩnh viễn tài khoản chưa có tham chiếu" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lỗi khi xóa tài khoản" }, { status: 500 });
  }
}

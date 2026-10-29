import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Vui lòng đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const admin = createAdminClient();

    if (endpoint) {
      let { data, error } = await admin
        .from("push_subscriptions")
        .select("id, user_id, updated_at")
        .eq("endpoint", endpoint)
        .maybeSingle();

      if (error && (error.code === "42501" || error.message?.includes("row-level security"))) {
        const fallback = await supabase
          .from("push_subscriptions")
          .select("id, user_id, updated_at")
          .eq("endpoint", endpoint)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        subscribed: !!data,
        isCurrentUser: data?.user_id === user.id,
        subscriptionId: data?.id || null,
      });
    }

    let { count, error } = await admin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error && (error.code === "42501" || error.message?.includes("row-level security"))) {
      const fallback = await supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      count = fallback.count;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Vui lòng đăng nhập để đăng ký thông báo" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, userAgent } = body;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh || subscription?.p256dh;
    const auth = subscription?.keys?.auth || subscription?.auth;

    if (!endpoint) {
      return NextResponse.json({ error: "Thiếu endpoint của Push Subscription" }, { status: 400 });
    }

    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Thiếu p256dh hoặc auth keys của Push Subscription" }, { status: 400 });
    }

    // Bảo mật: Luôn gắn với user.id đã xác thực từ session, cấm giả mạo userId từ client
    const targetUserId = user.id;
    const admin = createAdminClient();

    let { error } = await admin.from("push_subscriptions").upsert(
      {
        user_id: targetUserId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    // Fallback: nếu admin client không có service_role key hoặc gặp lỗi RLS 42501, dùng authenticated client
    if (error && (error.code === "42501" || error.message?.includes("row-level security"))) {
      console.warn("Admin upsert hit RLS error, falling back to authenticated supabase client:", error.message);
      const fallback = await supabase.from("push_subscriptions").upsert(
        {
          user_id: targetUserId,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );
      error = fallback.error;
    }

    if (error) {
      console.error("Error saving push subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Subscription registered successfully", userId: targetUserId });
  } catch (err: any) {
    console.error("Failed to register subscription:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Vui lòng đăng nhập" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const admin = createAdminClient();
    // Bảo mật quyền sở hữu: Chỉ cho phép xóa subscription của chính user đang đăng nhập
    let { error } = await admin
      .from("push_subscriptions")
      .delete()
      .match({ endpoint, user_id: user.id });

    if (error && (error.code === "42501" || error.message?.includes("row-level security"))) {
      const fallback = await supabase
        .from("push_subscriptions")
        .delete()
        .match({ endpoint, user_id: user.id });
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

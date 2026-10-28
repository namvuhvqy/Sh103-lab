import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { subscription, userAgent, userId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Missing p256dh or auth keys" }, { status: 400 });
    }

    const targetUserId = user?.id || userId || null;
    const admin = createAdminClient();

    // Upsert subscription using admin client to prevent RLS failure on mobile browsers
    const { error } = await admin.from("push_subscriptions").upsert(
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
    const admin = createAdminClient();
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

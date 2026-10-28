import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAllSubscriptions } from "@/lib/notifications/web-push";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Yêu cầu đăng nhập để gửi thông báo đẩy" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || "Khoa Sinh Hóa · Bệnh viện Quân y 103";
    const message = body.message || body.body || "Thông báo nhắc việc ca trực xét nghiệm chuẩn ISO 15189.";
    const url = body.url || "/notifications";

    const result = await sendPushToAllSubscriptions({
      title,
      body: message,
      url,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      sent: result.sent,
      failed: result.failed,
      cleaned: result.cleaned,
    });
  } catch (err: any) {
    console.error("Failed to send push notification:", err);
    return NextResponse.json({ error: err.message || "Failed to broadcast push" }, { status: 500 });
  }
}

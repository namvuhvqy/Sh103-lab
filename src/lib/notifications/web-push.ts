import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";
const privateKey = process.env.VAPID_PRIVATE_KEY || "SLw4EXxwIq_RGzA7pwytD89NGc5vnOnMz1IvXz_CHPI";
const subject = process.env.VAPID_SUBJECT || "mailto:khoasinhhoa103@hospital.vn";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

export async function sendPushToAllSubscriptions(payload: PushNotificationPayload) {
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured, skipping web push send.");
    return { sent: 0, failed: 0 };
  }

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !subs || subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/notifications",
    icon: payload.icon || "/icons/icon-192x192.png",
    tag: payload.tag || "sh103-shift-reminder",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, stringifiedPayload);
        sent++;
      } catch (err: any) {
        failed++;
        // 404 or 410 Gone means the subscription is no longer valid
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, failed, cleaned: expiredIds.length };
}

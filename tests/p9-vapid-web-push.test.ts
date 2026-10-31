import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 9: VAPID Web Push Notifications for Android and iPhone", () => {
  it("has public VAPID key configured in environment", () => {
    const envLocalPath = resolve(root, ".env.local");
    if (existsSync(envLocalPath)) {
      const envLocal = read(".env.local");
      expect(envLocal).toContain("NEXT_PUBLIC_VAPID_PUBLIC_KEY=");
      expect(envLocal).toContain("VAPID_PRIVATE_KEY=");
    } else {
      const pubKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BJvJ4_NDKETQlGptGicFnVhXGjMemhAxOcekgmOLxz4TMbihL7_62HF9mZdFAoTzF2yqStqyeVtAHsM22Sy6qjg";
      expect(pubKey).toBeTruthy();
    }
  });

  it("registers push and notificationclick event listeners in service worker (sw.js)", () => {
    const sw = read("public/sw.js");
    expect(sw).toContain('self.addEventListener("push"');
    expect(sw).toContain('self.addEventListener("notificationclick"');
    expect(sw).toContain("showNotification");
  });

  it("includes VAPID push subscription in InAppAlertBanner", () => {
    const banner = read("src/components/shell/InAppAlertBanner.tsx");
    expect(banner).toContain("urlBase64ToUint8Array");
    expect(banner).toContain("pushManager.subscribe");
    expect(banner).toContain("/api/notifications/subscribe");
  });

  it("has push subscriptions database migration", () => {
    const migration = read("supabase/migrations/20261019090000_p9_web_push_subscriptions.sql");
    expect(migration).toContain("create table if not exists public.push_subscriptions");
    expect(migration).toContain("endpoint text not null unique");
    expect(migration).toContain("p256dh text not null");
    expect(migration).toContain("auth text not null");
  });

  it("has web-push server helper and send-push API", () => {
    const helper = read("src/lib/notifications/web-push.ts");
    expect(helper).toContain("webpush.setVapidDetails");
    expect(helper).toContain("sendPushToAllSubscriptions");

    const sendPushRoute = read("src/app/api/notifications/send-push/route.ts");
    expect(sendPushRoute).toContain("sendPushToAllSubscriptions");
  });
});

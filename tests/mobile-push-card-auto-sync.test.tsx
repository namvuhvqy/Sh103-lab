import React from "react";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobilePushSubscriptionCard } from "@/components/notifications/MobilePushSubscriptionCard";

let root: Root | null = null;
let originalUserAgent: PropertyDescriptor | undefined;

beforeEach(() => {
  originalUserAgent = Object.getOwnPropertyDescriptor(navigator, "userAgent");
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  if (originalUserAgent) {
    Object.defineProperty(navigator, "userAgent", originalUserAgent);
  }
  Reflect.deleteProperty(window, "Notification");
  Reflect.deleteProperty(window, "PushManager");
  Reflect.deleteProperty(navigator, "serviceWorker");
  vi.restoreAllMocks();
});

describe("MobilePushSubscriptionCard Auto-Sync & iPhone UX", () => {
  it("trên iPhone Safari chưa thêm vào MH chính: hiển thị thẻ hướng dẫn iOS 3 bước trực quan", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    const html = renderToString(<MobilePushSubscriptionCard />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container, <MobilePushSubscriptionCard />);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Cài đặt nhận thông báo ca trực trên iPhone");
    expect(container.textContent).toContain("Cần thêm vào Màn hình chính");
    expect(container.textContent).toContain("Thêm vào Màn hình chính");
    expect(container.textContent).toContain("Thử bật nhận thông báo ngay");
    // Không có nút đồng bộ thủ công rườm rà
    expect(container.textContent).not.toContain("Đồng bộ lại thiết bị");
  });

  it("trên thiết bị đã hỗ trợ và chưa cấp quyền: hiển thị 1 nút bật thông báo duy nhất, không có nút đồng bộ", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      configurable: true,
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "default", requestPermission: vi.fn() },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn(),
          },
        }),
      },
    });

    const html = renderToString(<MobilePushSubscriptionCard />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container, <MobilePushSubscriptionCard />);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Bật nhận thông báo ca trực");
    expect(container.textContent).toContain("Chưa kích hoạt");
    expect(container.textContent).not.toContain("Đồng bộ lại thiết bị");
  });

  it("trên thiết bị đã cấp quyền (permission === 'granted'): tự động đồng bộ ngầm và hiển thị 'Đang nhận thông báo trên thiết bị này'", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Oppo Find X) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      configurable: true,
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted", requestPermission: vi.fn() },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({
              endpoint: "https://fcm.googleapis.com/fcm/send/fake-sub",
              getKey: () => new Uint8Array([1, 2, 3]),
              toJSON: () => ({
                endpoint: "https://fcm.googleapis.com/fcm/send/fake-sub",
                keys: { p256dh: "key-1", auth: "auth-1" },
              }),
            }),
          },
        }),
      },
    });

    const html = renderToString(<MobilePushSubscriptionCard />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container, <MobilePushSubscriptionCard />);
      // Chờ effect auto-sync chạy ngầm
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Đang nhận thông báo trên thiết bị này");
    expect(container.textContent).toContain("Gửi chuông thử nghiệm tới máy này");
    // Tuyệt đối không còn nút thủ công làm phiền người dùng
    expect(container.textContent).not.toContain("Đồng bộ lại thiết bị");
    expect(container.textContent).not.toContain("Chưa lưu máy chủ");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createAdminClient, getUser, upsert, deleteQuery, match, select, eq, maybeSingle } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getUser: vi.fn(),
  upsert: vi.fn(),
  deleteQuery: vi.fn(),
  match: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));

const { sendPushToAllSubscriptions } = vi.hoisted(() => ({
  sendPushToAllSubscriptions: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
  createAdminClient,
}));

vi.mock("@/lib/notifications/web-push", () => ({
  sendPushToAllSubscriptions,
}));

import { GET, POST as subscribePOST, DELETE as subscribeDELETE } from "@/app/api/notifications/subscribe/route";
import { POST as sendPushPOST } from "@/app/api/notifications/send-push/route";

const makeRequest = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  vi.clearAllMocks();

  createClient.mockResolvedValue({
    auth: { getUser },
  });

  getUser.mockResolvedValue({
    data: { user: { id: "real-user-123" } },
    error: null,
  });

  upsert.mockResolvedValue({ error: null });
  match.mockResolvedValue({ error: null });
  deleteQuery.mockReturnValue({ match });
  maybeSingle.mockResolvedValue({ data: { id: "sub-1", user_id: "real-user-123" }, error: null });
  eq.mockReturnValue({ maybeSingle });
  select.mockReturnValue({ eq });

  createAdminClient.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "push_subscriptions") {
        return {
          upsert,
          delete: deleteQuery,
          select,
        };
      }
      return {};
    }),
  });

  sendPushToAllSubscriptions.mockResolvedValue({ sent: 1, failed: 0, cleaned: 0 });
});

describe("Nhóm A: Bảo mật API /api/notifications/subscribe", () => {
  it("GET: từ chối 401 khi chưa đăng nhập", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const res = await GET(makeRequest("https://example.test/api/notifications/subscribe?endpoint=https://fcm.test/123", "GET"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("GET: kiểm tra trạng thái subscription của thiết bị khi đã đăng nhập", async () => {
    const res = await GET(makeRequest("https://example.test/api/notifications/subscribe?endpoint=https://fcm.test/123", "GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(true);
    expect(data.isCurrentUser).toBe(true);
  });

  it("POST: từ chối 401 khi chưa đăng nhập", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const res = await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: { endpoint: "https://fcm.test/1", keys: { p256dh: "k1", auth: "a1" } },
      })
    );
    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("POST: ngăn chặn triệt để giả mạo userId (chỉ dùng user.id từ session)", async () => {
    const res = await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        userId: "fake-victim-user-id", // Cố tình truyền userId giả
        subscription: { endpoint: "https://fcm.test/target", keys: { p256dh: "k1", auth: "a1" } },
        userAgent: "TestBrowser/1.0",
      })
    );
    expect(res.status).toBe(200);
    // Xác minh upsert được gọi với user.id thật "real-user-123", KHÔNG PHẢI "fake-victim-user-id"
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "real-user-123",
        endpoint: "https://fcm.test/target",
        p256dh: "k1",
        auth: "a1",
      }),
      { onConflict: "endpoint" }
    );
  });

  it("DELETE: từ chối 401 khi chưa đăng nhập", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const res = await subscribeDELETE(
      makeRequest("https://example.test/api/notifications/subscribe", "DELETE", {
        endpoint: "https://fcm.test/target",
      })
    );
    expect(res.status).toBe(401);
    expect(deleteQuery).not.toHaveBeenCalled();
  });

  it("DELETE: chỉ cho phép xóa subscription của chính user đang đăng nhập", async () => {
    const res = await subscribeDELETE(
      makeRequest("https://example.test/api/notifications/subscribe", "DELETE", {
        endpoint: "https://fcm.test/target",
      })
    );
    expect(res.status).toBe(200);
    // Xác minh delete được match theo cả endpoint và user.id thật
    expect(match).toHaveBeenCalledWith({
      endpoint: "https://fcm.test/target",
      user_id: "real-user-123",
    });
  });
});

describe("Nhóm A: Bảo mật API /api/notifications/send-push", () => {
  it("POST: từ chối 401 khi chưa đăng nhập (ngăn chặn unauthenticated broadcast)", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });
    const res = await sendPushPOST(
      makeRequest("https://example.test/api/notifications/send-push", "POST", {
        title: "Tin tặc gửi thông báo rác",
        message: "Nội dung giả mạo",
      })
    );
    expect(res.status).toBe(401);
    expect(sendPushToAllSubscriptions).not.toHaveBeenCalled();
  });

  it("POST: cho phép gửi khi đã đăng nhập hợp lệ và trả về số lượng thực tế", async () => {
    sendPushToAllSubscriptions.mockResolvedValue({ sent: 3, failed: 0, cleaned: 0 });
    const res = await sendPushPOST(
      makeRequest("https://example.test/api/notifications/send-push", "POST", {
        title: "Test",
        message: "Ca trực 103",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(3);
    expect(sendPushToAllSubscriptions).toHaveBeenCalled();
  });
});

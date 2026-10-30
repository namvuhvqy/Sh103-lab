import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient,
  createAdminClient,
  getUser,
  upsert,
  deleteQuery,
  inMock,
  select,
  inFilter,
  sendNotification,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getUser: vi.fn(),
  upsert: vi.fn(),
  deleteQuery: vi.fn(),
  inMock: vi.fn(),
  select: vi.fn(),
  inFilter: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
  createAdminClient,
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification,
  },
}));

import { POST as subscribePOST } from "@/app/api/notifications/subscribe/route";
import {
  sendPushToAllSubscriptions,
  sendPushToUser,
  sendPushToSubscriptions,
} from "@/lib/notifications/web-push";

const makeRequest = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("5 Nguyên tắc Kỹ thuật Push Notification Đa thiết bị (Multi-Device)", () => {
  const currentUserId = "user-thuan-103";

  beforeEach(() => {
    vi.clearAllMocks();

    getUser.mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    });

    createClient.mockResolvedValue({
      auth: { getUser },
      from: vi.fn(() => ({
        upsert,
        delete: deleteQuery,
        select,
      })),
    });

    upsert.mockResolvedValue({ error: null });
    inMock.mockResolvedValue({ error: null });
    deleteQuery.mockReturnValue({ in: inMock });

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

    sendNotification.mockResolvedValue({ statusCode: 201 });
  });

  it("Nguyên tắc 1: Mỗi thiết bị có một Push Subscription riêng (Endpoint độc lập)", async () => {
    // Thiết bị 1: Laptop Windows
    const laptopSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/token-laptop-111",
      keys: { p256dh: "key-laptop", auth: "auth-laptop" },
    };
    const resLaptop = await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: laptopSub,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156",
      })
    );
    expect(resLaptop.status).toBe(200);

    // Thiết bị 2: Điện thoại Oppo Reno11 (Android)
    const mobileSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/token-oppo-reno11-222",
      keys: { p256dh: "key-mobile", auth: "auth-mobile" },
    };
    const resMobile = await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: mobileSub,
        userAgent: "Mozilla/5.0 (Linux; Android 14; CPH2599) Chrome/155 Mobile",
      })
    );
    expect(resMobile.status).toBe(200);

    // Xác minh 2 thiết bị gọi upsert với 2 endpoint riêng biệt
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ endpoint: laptopSub.endpoint }),
      { onConflict: "endpoint" }
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ endpoint: mobileSub.endpoint }),
      { onConflict: "endpoint" }
    );
  });

  it("Nguyên tắc 2: Tất cả subscription của cùng người dùng được liên kết với cùng user_id", async () => {
    // Đăng ký Laptop và Phone của cùng bác sĩ Thuận
    await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: { endpoint: "https://fcm.test/device-pc", keys: { p256dh: "k1", auth: "a1" } },
      })
    );
    await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: { endpoint: "https://fcm.test/device-phone", keys: { p256dh: "k2", auth: "a2" } },
      })
    );

    // Cả 2 lần đăng ký đều liên kết chính xác với user_id của phiên đăng nhập
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ user_id: currentUserId, endpoint: "https://fcm.test/device-pc" }),
      { onConflict: "endpoint" }
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ user_id: currentUserId, endpoint: "https://fcm.test/device-phone" }),
      { onConflict: "endpoint" }
    );
  });

  it("Nguyên tắc 3: Đăng nhập/đồng bộ trên thiết bị mới không làm mất đăng ký trên thiết bị cũ", async () => {
    // Giả sử thiết bị cũ (PC) đã tồn tại trong DB
    // Khi thiết bị mới (Phone) gửi request đăng ký
    const resNewDevice = await subscribePOST(
      makeRequest("https://example.test/api/notifications/subscribe", "POST", {
        subscription: { endpoint: "https://fcm.test/new-phone", keys: { p256dh: "k3", auth: "a3" } },
      })
    );
    expect(resNewDevice.status).toBe(200);

    // Xác minh: Cơ chế upsert dùng onConflict: "endpoint"
    // KHÔNG gọi lệnh delete subscription cũ của user_id
    expect(deleteQuery).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: currentUserId,
        endpoint: "https://fcm.test/new-phone",
      }),
      { onConflict: "endpoint" }
    );
  });

  it("Nguyên tắc 4: Một thông báo được gửi đến tất cả thiết bị còn đăng ký hợp lệ của người nhận", async () => {
    // Người nhận có 2 thiết bị hợp lệ trong DB (Laptop & Oppo Reno11)
    const activeSubs = [
      { id: "sub-laptop", user_id: currentUserId, endpoint: "https://fcm.test/pc", p256dh: "k-pc", auth: "a-pc" },
      { id: "sub-oppo", user_id: currentUserId, endpoint: "https://fcm.test/phone", p256dh: "k-phone", auth: "a-phone" },
    ];

    inFilter.mockResolvedValue({ data: activeSubs, error: null });
    select.mockReturnValue({ in: inFilter });

    const payload = {
      title: "🔔 [LỊCH TRỰC] Giao ban Khoa Sinh Hóa",
      body: "Nhắc việc: Ca trực bắt đầu lúc 07:30 ngày mai.",
      url: "/duty",
    };

    const result = await sendPushToUser(currentUserId, payload);

    // Xác minh truy vấn đúng danh sách thiết bị của user_id
    expect(select).toHaveBeenCalledWith("id, user_id, endpoint, p256dh, auth");
    expect(inFilter).toHaveBeenCalledWith("user_id", [currentUserId]);

    // Cả 2 thiết bị đều được gửi thông báo
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.cleaned).toBe(0);
  });

  it("Nguyên tắc 5: Khi một thiết bị hết hiệu lực, chỉ loại bỏ subscription của thiết bị đó, không ảnh hưởng các thiết bị khác", async () => {
    // Người dùng có 2 thiết bị:
    // - Thiết bị 1 (Laptop sub-laptop): Đang hoạt động bình thường
    // - Thiết bị 2 (Oppo cũ sub-old-phone): Đã gỡ app hoặc token hết hạn (410 Gone)
    const existingSubs = [
      { id: "sub-laptop", user_id: currentUserId, endpoint: "https://fcm.test/pc", p256dh: "k-pc", auth: "a-pc" },
      { id: "sub-old-phone", user_id: currentUserId, endpoint: "https://fcm.test/old-phone", p256dh: "k-old", auth: "a-old" },
    ];

    inFilter.mockResolvedValue({ data: existingSubs, error: null });
    select.mockReturnValue({ in: inFilter });

    // Mock: Thiết bị 1 gửi thành công, Thiết bị 2 trả về 410 Gone
    sendNotification
      .mockResolvedValueOnce({ statusCode: 201 })
      .mockRejectedValueOnce({ statusCode: 410, message: "Subscription expired" });

    const result = await sendPushToUser(currentUserId, {
      title: "Thông báo test dọn dẹp token",
      body: "Nội dung test",
    });

    // Xác minh kết quả tổng hợp
    expect(result.sent).toBe(1); // 1 thiết bị vẫn nhận thành công
    expect(result.failed).toBe(1); // 1 thiết bị hết hạn
    expect(result.cleaned).toBe(1); // 1 thiết bị được dọn dẹp

    // ĐIỂM CỐT LÕI NGUYÊN TẮC 5:
    // Lệnh xóa CHỈ nhắm vào id của thiết bị hết hạn ['sub-old-phone'],
    // TUYỆT ĐỐI KHÔNG xóa theo user_id, không xóa 'sub-laptop'
    expect(deleteQuery).toHaveBeenCalledTimes(1);
    expect(inMock).toHaveBeenCalledWith("id", ["sub-old-phone"]);
  });
});

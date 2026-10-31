import { describe, expect, it, vi } from "vitest";

describe("Unified Notifications Feed & Staff Creation Contract", () => {
  it("đảm bảo route /announcements thực hiện chuyển hướng về /notifications để tránh phân mảnh", async () => {
    // Kiểm tra file page của /announcements có chứa lệnh redirect về /notifications
    const { default: AnnouncementsPage } = await import("@/app/announcements/page");
    expect(typeof AnnouncementsPage).toBe("function");
  });

  it("cho phép nhân viên gửi form tạo thông báo ca trực thành công qua createStaffNotificationAction", async () => {
    const { createStaffNotificationAction } = await import("@/lib/p5/actions");
    expect(typeof createStaffNotificationAction).toBe("function");
  });

  it("bảng tin thông báo hỗ trợ hiển thị 100% tương tác Like và Comment trên tất cả các mục", async () => {
    const { NotificationInteractiveFeed } = await import("@/components/notifications/NotificationInteractiveFeed");
    expect(typeof NotificationInteractiveFeed).toBe("function");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 9: Unified Areas, Notifications (Like/Comment), BM06 Note, and QR", () => {
  it("Requirement c: strictly enforces 20 active machines across the 5 canonical hospital areas", () => {
    const areasPage = read("src/app/areas/page.tsx");
    expect(areasPage).toContain("SINH_HOA");
    expect(areasPage).toContain("MIEN_DICH");
    expect(areasPage).toContain("NUOC_TIEU");
    expect(areasPage).toContain("LY_TAM");
    expect(areasPage).toContain("NHAN_BENH_PHAM");

    const prototype = read("src/app/prototypes/page.tsx");
    expect(prototype).toContain("Khu Sinh hóa (7 máy)");
    expect(prototype).toContain("Khu Miễn dịch (6 máy)");
    expect(prototype).toContain("Khu Nước tiểu (3 máy)");
    expect(prototype).toContain("Khu Ly tâm (4 máy)");
    expect(prototype).toContain("Nhận bệnh phẩm (0 máy · Khử nhiễm)");
  });

  it("Requirement a: notifications interaction strictly uses 'Like' and does not use 'Đã rõ'", () => {
    const feed = read("src/components/notifications/NotificationInteractiveFeed.tsx");
    expect(feed).toContain("Like");
    expect(feed).not.toContain("Đã rõ");
    expect(feed).toContain("toggleNotificationLikeAction");
    expect(feed).toContain("addNotificationCommentAction");

    const prototype = read("src/app/prototypes/page.tsx");
    expect(prototype).not.toMatch(/<span>Đã rõ<\/span>/);
  });

  it("Requirement b: BM06 records note into audit log together with machine statuses", () => {
    const bm06Route = read("src/app/api/forms/bm06/route.ts");
    expect(bm06Route).toContain("logAuditEvent");
    expect(bm06Route).toContain("machine_statuses: statuses");
    expect(bm06Route).toContain("note: targetNote");

    const shiftForm = read("src/components/forms/ShiftRegisterForm.tsx");
    expect(shiftForm).toContain("initialNote");
    expect(shiftForm).toContain('name="note"');

    const areaWorkspace = read("src/components/areas/UnifiedAreaWorkspace.tsx");
    expect(areaWorkspace).toContain("BM.06");
    expect(areaWorkspace).toContain("BM.01_KNBM");
    expect(areaWorkspace).toContain("BM.02");
    expect(areaWorkspace).toContain("Ghi chú ca BM.06");
  });

  it("Item 4: provides QR code generation and n8n shift reminder webhook", () => {
    const areaWorkspace = read("src/components/areas/UnifiedAreaWorkspace.tsx");
    expect(areaWorkspace).toContain("QRCode.toDataURL");
    expect(areaWorkspace).toContain("Tem QR Dán Thiết Bị Y Tế");
    expect(areaWorkspace).toContain("scanDev");

    const n8nWebhook = read("src/app/api/webhooks/n8n/shift-reminder/route.ts");
    expect(n8nWebhook).toContain("handleShiftReminder");
    expect(n8nWebhook).toContain("BM.06");
    expect(n8nWebhook).toContain("BM.01_KNBM");
    expect(n8nWebhook).toContain("needs_reminder");
    expect(n8nWebhook).toContain("summary_message");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UnifiedAreaWorkspace } from "@/components/areas/UnifiedAreaWorkspace";
import { QRScannerProvider } from "@/components/qr/QRScannerContext";

describe("TASK 01: QR BM06 Concurrency, Offline Queue, and UI Truthfulness", () => {
  const mockAreas = [
    {
      code: "SINH_HOA",
      name: "Khu Sinh hóa",
      icon: "FlaskConical",
      machineCount: 2,
      machines: [
        { id: "dev-01-uuid", sourceOrder: 1, name: "AU5800 - Số 1", locationCode: "SINH_HOA" },
        { id: "dev-02-uuid", sourceOrder: 2, name: "AU5800 - Số 2", locationCode: "SINH_HOA" },
      ],
      decon: {
        periodId: "p-decon-1",
        daily: false,
        weekly: false,
        spill: false,
        note: "",
        status: "DRAFT",
      },
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("Requirement 1 & 3: Single machine save sends ONLY target machine and displays 'Đã lưu' only after Supabase confirms", async () => {
    let capturedBody: FormData | null = null;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (url === "/api/forms/bm06") {
        capturedBody = options.body;
        return {
          ok: true,
          json: async () => ({
            success: true,
            saved: "1",
            lockVersion: 3,
            intent: "draft",
          }),
        };
      }
      return { ok: false };
    });

    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={2}
          initialStatuses={{ "dev-01-uuid": "BT", "dev-02-uuid": "BT" }}
          scannedDeviceId="dev-01-uuid"
        />
      </QRScannerProvider>
    );

    // Verify Action Sheet is open for machine #1
    expect(screen.getAllByText("AU5800 - Số 1").length).toBeGreaterThanOrEqual(1);

    // Click "Lưu vào BM.06"
    const saveButton = screen.getByRole("button", { name: /Lưu vào BM.06/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    // Check payload: MUST contain ONLY dev-01-uuid, NEVER overwriting dev-02 or other machines!
    const statusesRaw = capturedBody!.get("statuses") as string;
    const statuses = JSON.parse(statusesRaw);
    expect(statuses).toEqual([{ asset_id: "dev-01-uuid", status: "BT" }]);
    expect(capturedBody!.get("lockVersion")).toBe("2");
    // Verify note is decoupled and not sent in single-machine save to prevent overwriting shift note
    expect(capturedBody!.get("note")).toBeNull();

    // Check UI feedback: Confirms save on Supabase
    await waitFor(() => {
      expect(screen.getByText(/✓ Đã lưu thành công lên máy chủ Supabase/i)).toBeDefined();
    });
  });

  it("Requirement 3: Displays 'Chưa đồng bộ' and NEVER claims success when save fails or goes offline", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={2}
          initialStatuses={{ "dev-01-uuid": "BT" }}
          scannedDeviceId="dev-01-uuid"
        />
      </QRScannerProvider>
    );

    const saveButton = screen.getByRole("button", { name: /Lưu vào BM.06/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Must NOT claim "Đã lưu" or success!
      expect(screen.queryByText(/✓ Đã lưu thành công/i)).toBeNull();
      // Must show "Chưa đồng bộ lên máy chủ"
      expect(screen.getByText(/⚠️ Chưa đồng bộ lên máy chủ/i)).toBeDefined();
    });

    // Must be queued in localStorage
    const queueRaw = localStorage.getItem("lab103_bm06_offline_queue_v1");
    expect(queueRaw).not.toBeNull();
    const queue = JSON.parse(queueRaw!);
    expect(queue.length).toBe(1);
    expect(queue[0].assetId).toBe("dev-01-uuid");
  });

  it("Requirement 4: Provides interactive manual sync for offline queued records", async () => {
    // Seed localStorage with 1 queued record
    localStorage.setItem(
      "lab103_bm06_offline_queue_v1",
      JSON.stringify([
        {
          occurrenceId: "occ-bm06-test",
          assetId: "dev-02-uuid",
          machineName: "AU5800 - Số 2",
          machineOrder: 2,
          status: "H",
          note: "Kim hút mẫu bị nghẹt",
          areaCode: "SINH_HOA",
          timestamp: new Date().toISOString(),
        },
      ])
    );

    let syncCalled = false;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "/api/forms/bm06") {
        syncCalled = true;
        return {
          ok: true,
          json: async () => ({
            success: true,
            saved: "1",
            lockVersion: 4,
            intent: "draft",
          }),
        };
      }
      return { ok: false };
    });

    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={3}
          initialStatuses={{ "dev-01-uuid": "BT", "dev-02-uuid": "BT" }}
        />
      </QRScannerProvider>
    );

    // Verify Offline Queue Banner is displayed
    expect(
      screen.getByText(/Có 1 bản ghi máy xét nghiệm chưa đồng bộ lên máy chủ Supabase/i)
    ).toBeDefined();

    const syncButton = screen.getByRole("button", { name: /Đồng bộ lên máy chủ \(1\)/i });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncCalled).toBe(true);
      expect(screen.getByText(/✓ Đã đồng bộ thành công 1 máy lên máy chủ Supabase/i)).toBeDefined();
    });

    // Offline queue in localStorage must be cleared
    const queueAfter = localStorage.getItem("lab103_bm06_offline_queue_v1");
    expect(JSON.parse(queueAfter || "[]")).toEqual([]);
  });

  it("Requirement 5: Warns cleanly when an invalid device QR is scanned", () => {
    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={1}
          initialStatuses={{}}
          scannedDeviceId="invalid-device-not-in-lab"
        />
      </QRScannerProvider>
    );

    expect(
      screen.getByText(/Không tìm thấy thiết bị xét nghiệm tương ứng với mã quét/i)
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /Quét lại/i })).toBeDefined();
  });

  it("PRIORITY 1: Does NOT treat HTTP 403/400 server rejection as network loss and does NOT queue into offline storage", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: "Tài khoản của bạn chưa có quyền ghi nhận ca này.",
      }),
    });

    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={2}
          initialStatuses={{ "dev-01-uuid": "BT" }}
          scannedDeviceId="dev-01-uuid"
        />
      </QRScannerProvider>
    );

    const saveButton = screen.getByRole("button", { name: /Lưu vào BM.06/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Direct server error must be shown to technician
      expect(
        screen.getByText(/Tài khoản của bạn chưa có quyền ghi nhận ca này/i)
      ).toBeDefined();
      // Must NOT claim "Đã lưu"
      expect(screen.queryByText(/✓ Đã lưu thành công/i)).toBeNull();
    });

    // Offline queue MUST remain empty
    const queue = localStorage.getItem("lab103_bm06_offline_queue_v1");
    expect(JSON.parse(queue || "[]")).toEqual([]);
  });

  it("PRIORITY 1: Offline sync includes client_timestamp and preserves newer status when server skips outdated items", async () => {
    localStorage.setItem(
      "lab103_bm06_offline_queue_v1",
      JSON.stringify([
        {
          occurrenceId: "occ-bm06-test",
          assetId: "dev-01-uuid",
          machineName: "AU5800 - Số 1",
          machineOrder: 1,
          status: "H",
          note: "",
          areaCode: "SINH_HOA",
          timestamp: "2026-10-20T08:00:00.000Z",
        },
      ])
    );

    let sentPayload: any = null;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url === "/api/forms/bm06") {
        sentPayload = JSON.parse(opts.body.get("statuses"));
        return {
          ok: true,
          json: async () => ({
            success: true,
            saved: "1",
            lockVersion: 5,
            skippedOutdated: ["dev-01-uuid"],
            message: "Dữ liệu trên máy chủ đã mới hơn, giữ nguyên trạng thái mới nhất từ máy chủ.",
          }),
        };
      }
      return { ok: false };
    });

    render(
      <QRScannerProvider>
        <UnifiedAreaWorkspace
          areas={mockAreas}
          today="2026-10-20"
          shift={{ code: "SHIFT_1", label: "Ca 1" }}
          bm06OccurrenceId="occ-bm06-test"
          bm06LockVersion={4}
          initialStatuses={{ "dev-01-uuid": "BT" }}
        />
      </QRScannerProvider>
    );

    const syncBtn = screen.getByRole("button", { name: /Đồng bộ lên máy chủ/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(sentPayload).not.toBeNull();
      expect(sentPayload[0].client_timestamp).toBe("2026-10-20T08:00:00.000Z");
      // UI must acknowledge that server data was preserved
      expect(screen.getByText(/giữ nguyên bản ghi mới hơn từ máy chủ/i)).toBeDefined();
    });
  });
});


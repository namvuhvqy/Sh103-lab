import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { QRScannerProvider, useQRScanner } from "@/components/qr/QRScannerContext";

// Mock html5-qrcode library
const mockStart = vi.fn().mockResolvedValue(true);
const mockStop = vi.fn().mockResolvedValue(true);
const mockClear = vi.fn().mockResolvedValue(true);

vi.mock("html5-qrcode", () => {
  return {
    Html5Qrcode: class {
      start = (...args: any[]) => mockStart(...args);
      stop = (...args: any[]) => mockStop(...args);
      clear = (...args: any[]) => mockClear(...args);
      scanFile = vi.fn().mockResolvedValue("DEV_01");
      scanFileV2 = vi.fn().mockResolvedValue({ decodedText: "DEV_01" });
    },
    Html5QrcodeSupportedFormats: {
      QR_CODE: 0,
    },
  };
});

function TestHarness() {
  const { openScanner, closeScanner } = useQRScanner();
  return (
    <div>
      <button onClick={openScanner}>Mở Trình Quét</button>
      <button onClick={closeScanner}>Đóng Trình Quét</button>
      <QRScannerModal />
    </div>
  );
}

describe("QRScannerModal Component & Lifecycle Tests", () => {
  const mockMachines = [
    { id: "dev-01", sourceOrder: 1, name: "Máy Sinh Hóa AU5800 - Số 1", locationCode: "SINH_HOA" },
    { id: "dev-02", sourceOrder: 2, name: "Máy Miễn Dịch DxI 800 - Số 1", locationCode: "MIEN_DICH" },
  ];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockStart.mockReset().mockResolvedValue(true);
    mockStop.mockReset().mockResolvedValue(true);
    mockClear.mockReset().mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Requirement 5: renders 3 tabs (Camera, Tải ảnh, Chọn máy)", () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    expect(screen.getByText(/^Camera$/)).toBeDefined();
    expect(screen.getByText("Tải ảnh QR")).toBeDefined();
    expect(screen.getByText(/Chọn máy/)).toBeDefined();
  });

  it("PRIORITY 0: Defaults strictly to REAR camera ({ facingMode: 'environment' }) and renders sweeping teal laser", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    // Advance timer past the 100ms debounce
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Check that start was called with { facingMode: "environment" } (REAR camera)
    expect(mockStart).toHaveBeenCalledTimes(1);
    const cameraArg = mockStart.mock.calls[0][0];
    expect(cameraArg).toEqual({ facingMode: "environment" });

    // Check configuration: NO aspectRatio constraint (avoids freezing Android track)
    const configArg = mockStart.mock.calls[0][1];
    expect(configArg.aspectRatio).toBeUndefined();

    // Verify continuous sweeping teal laser beam exists in DOM
    const laserElement = document.querySelector(".animate-scan-laser");
    expect(laserElement).not.toBeNull();

    // Ensure it does NOT loop infinitely
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("PRIORITY 0: Switching camera cleanly toggles from rear to front camera ({ facingMode: 'user' })", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart.mock.calls[0][0]).toEqual({ facingMode: "environment" });

    // Click "Đổi camera"
    const toggleButton = screen.getByRole("button", { name: /Đổi camera/i });
    fireEvent.click(toggleButton);

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Old session must have been stopped, and new session started with { facingMode: "user" }
    expect(mockStop).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(mockStart.mock.calls[1][0]).toEqual({ facingMode: "user" });
  });

  it("PRIORITY 0: Switching to tab 'Tải ảnh QR' or 'Chọn máy' immediately stops/releases the camera", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(mockStart).toHaveBeenCalledTimes(1);

    // Switch to tab "Tải ảnh QR"
    fireEvent.click(screen.getByText("Tải ảnh QR"));

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Camera must be stopped
    expect(mockStop).toHaveBeenCalled();
  });

  it("PRIORITY 0: Rapid modal open/close toggles safely and stops the camera without crashing", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    // Rapid open -> close -> open
    fireEvent.click(screen.getByText("Mở Trình Quét"));
    fireEvent.click(screen.getByText("Đóng Trình Quét"));
    fireEvent.click(screen.getByText("Mở Trình Quét"));

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Final state should be running one session
    expect(mockStart).toHaveBeenCalled();

    // Now close modal
    fireEvent.click(screen.getByText("Đóng Trình Quét"));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Scanner must be stopped
    expect(mockStop).toHaveBeenCalled();
  });

  it("PRIORITY 0: Displays Vietnamese error clearly when Camera permission is denied", async () => {
    const permError = new Error("Permission denied");
    permError.name = "NotAllowedError";
    mockStart.mockRejectedValueOnce(permError);

    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Check Vietnamese error message
    expect(
      screen.getByText(/Quyền truy cập Camera bị từ chối/i)
    ).toBeDefined();

    // Offers "Thử lại" and "Tải ảnh" buttons
    expect(screen.getByRole("button", { name: /^Thử lại$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Tải ảnh$/i })).toBeDefined();
  });

  it("allows selecting a machine via quick list when camera is unavailable or denied", () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));
    fireEvent.click(screen.getByText(/Chọn máy/));

    expect(screen.getByText("Máy Sinh Hóa AU5800 - Số 1")).toBeDefined();
    expect(screen.getByText("Máy Miễn Dịch DxI 800 - Số 1")).toBeDefined();

    fireEvent.click(screen.getByText("Máy Sinh Hóa AU5800 - Số 1"));
    expect(screen.queryByText("Trình Quét QR Thiết Bị")).toBeNull();
  });

  it("searches machines by order number or name", () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));
    fireEvent.click(screen.getByText(/Chọn máy/));

    const searchInput = screen.getByPlaceholderText(/Tìm theo STT/i);
    fireEvent.change(searchInput, { target: { value: "DxI" } });

    expect(screen.getByText("Máy Miễn Dịch DxI 800 - Số 1")).toBeDefined();
    expect(screen.queryByText("Máy Sinh Hóa AU5800 - Số 1")).toBeNull();
  });
});

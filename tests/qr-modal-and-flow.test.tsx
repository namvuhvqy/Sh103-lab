import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { QRScannerProvider, useQRScanner } from "@/components/qr/QRScannerContext";

// Mock html5-qrcode library
const mockStart = vi.fn().mockResolvedValue(true);
const mockStop = vi.fn().mockResolvedValue(true);
const mockClear = vi.fn().mockResolvedValue(true);
const mockGetCameras = vi.fn().mockResolvedValue([]);

vi.mock("html5-qrcode", () => {
  return {
    Html5Qrcode: class {
      static getCameras = (...args: any[]) => mockGetCameras(...args);
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
    mockGetCameras.mockReset().mockResolvedValue([]);
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

  it("PRIORITY 0: Defaults strictly to REAR camera ({ facingMode: 'environment' }) and starts exactly ONCE", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    // Advance timer past the 120ms debounce
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Check that start was called with { facingMode: "environment" } (REAR camera)
    expect(mockStart).toHaveBeenCalledTimes(1);
    const cameraArg = mockStart.mock.calls[0][0];
    expect(cameraArg).toEqual({ facingMode: "environment" });

    // Ensure it does NOT start again or loop infinitely
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("PRIORITY 0: Switching to tab 'Tải ảnh QR' or 'Chọn máy' immediately stops/releases the camera", async () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    await act(async () => {
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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

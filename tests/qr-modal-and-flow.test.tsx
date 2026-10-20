import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { QRScannerProvider, useQRScanner } from "@/components/qr/QRScannerContext";

// Mock html5-qrcode library
vi.mock("html5-qrcode", () => {
  return {
    Html5Qrcode: class {
      static getCameras = vi.fn().mockResolvedValue([]);
      start = vi.fn().mockResolvedValue(true);
      stop = vi.fn().mockResolvedValue(true);
      clear = vi.fn().mockResolvedValue(true);
      scanFileV2 = vi.fn().mockResolvedValue({ decodedText: "DEV_01" });
    },
    Html5QrcodeSupportedFormats: {
      QR_CODE: 0,
    },
  };
});

function TestHarness() {
  const { openScanner } = useQRScanner();
  return (
    <div>
      <button onClick={openScanner}>Mở Trình Quét</button>
      <QRScannerModal />
    </div>
  );
}

describe("QRScannerModal Component Tests", () => {
  const mockMachines = [
    { id: "dev-01", sourceOrder: 1, name: "Máy Sinh Hóa AU5800 - Số 1", locationCode: "SINH_HOA" },
    { id: "dev-02", sourceOrder: 2, name: "Máy Miễn Dịch DxI 800 - Số 1", locationCode: "MIEN_DICH" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Requirement 5: renders 3 tabs (Camera, Tải ảnh, Chọn máy)", () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText("Mở Trình Quét"));

    // Check tabs
    expect(screen.getByText(/^Camera$/)).toBeDefined();
    expect(screen.getByText("Tải ảnh QR")).toBeDefined();
    expect(screen.getByText(/Chọn máy/)).toBeDefined();
  });

  it("allows selecting a machine via quick list when camera is unavailable or denied", () => {
    render(
      <QRScannerProvider initialMachines={mockMachines}>
        <TestHarness />
      </QRScannerProvider>
    );

    fireEvent.click(screen.getByText("Mở Trình Quét"));

    // Switch to tab 3 "Chọn máy"
    fireEvent.click(screen.getByText(/Chọn máy/));

    // Verify machine list is displayed
    expect(screen.getByText("Máy Sinh Hóa AU5800 - Số 1")).toBeDefined();
    expect(screen.getByText("Máy Miễn Dịch DxI 800 - Số 1")).toBeDefined();

    // Click on machine 1
    fireEvent.click(screen.getByText("Máy Sinh Hóa AU5800 - Số 1"));

    // Modal should close on selection
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

    // Machine 2 should remain visible, Machine 1 should be filtered out
    expect(screen.getByText("Máy Miễn Dịch DxI 800 - Số 1")).toBeDefined();
    expect(screen.queryByText("Máy Sinh Hóa AU5800 - Số 1")).toBeNull();
  });
});

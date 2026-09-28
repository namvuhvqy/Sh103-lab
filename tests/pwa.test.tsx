import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import fs from "fs";
import path from "path";

function readPngDimensions(filePath: string): [number, number] {
  const png = fs.readFileSync(filePath);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe("P1 PWA & Offline UX Requirements", () => {
  it("renders OfflineBanner with warning message when offline", () => {
    render(<OfflineBanner isOffline={true} />);
    expect(
      screen.getByText("Không có kết nối mạng. Dữ liệu chưa được đồng bộ.")
    ).toBeInTheDocument();
  });

  it("does not render OfflineBanner when online", () => {
    const { container } = render(<OfflineBanner isOffline={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("manifest.json exists, standalone display, valid theme and 192/512/maskable icons", () => {
    const manifestPath = path.resolve(__dirname, "../public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    const has192 = manifest.icons.some(
      (i: { sizes: string }) => i.sizes === "192x192"
    );
    const has512 = manifest.icons.some(
      (i: { sizes: string }) => i.sizes === "512x512"
    );
    const hasMaskable = manifest.icons.some(
      (i: { purpose?: string }) => i.purpose?.includes("maskable")
    );

    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable).toBe(true);

    for (const icon of manifest.icons as Array<{ src: string; sizes: string }>) {
      const expected = icon.sizes.split("x").map(Number) as [number, number];
      const actual = readPngDimensions(
        path.resolve(__dirname, `../public${icon.src}`)
      );
      expect(actual).toEqual(expected);
    }
  });

  it("service worker sw.js only caches static shell assets and explicitly bypasses auth/rest/rpc/admin/reports", () => {
    const swPath = path.resolve(__dirname, "../public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf-8");

    // Must check for bypass rules
    expect(swContent).toContain("/auth");
    expect(swContent).toContain("/rest");
    expect(swContent).toContain("/rpc");
    expect(swContent).toContain("/api");
    expect(swContent).toContain("/admin");
    expect(swContent).toContain("/reports");
    // P6 does not support offline working mode: no business API/mutation cache.
    expect(swContent).not.toMatch(/STATIC_ASSETS\s*=\s*\[[\s\S]*?["']\/["']/);
    expect(swContent).not.toMatch(/background\s*sync|sync\s*event|mutation\s*queue|offline\s*write/i);
  });

  it("shows compact install button and calls beforeinstallprompt on supported browsers", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    render(<InstallAppPrompt />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("beforeinstallprompt", {
          detail: undefined,
        }) as Event
      );
    });

    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    event.preventDefault = vi.fn();
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    const button = await screen.findByRole("button", { name: /Cài ứng dụng/i });
    fireEvent.click(button);
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });

  it("shows iOS Add to Home Screen guidance when native install prompt is unavailable", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      configurable: true,
    });
    render(<InstallAppPrompt />);
    expect(await screen.findByText(/Chia sẻ → Thêm vào Màn hình chính/i)).toBeInTheDocument();
  });

  it("hides install button when app is already installed", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    const { container } = render(<InstallAppPrompt />);
    expect(container.firstChild).toBeNull();
    window.matchMedia = originalMatchMedia;
  });
});

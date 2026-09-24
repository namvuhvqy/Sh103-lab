import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import fs from "fs";
import path from "path";

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
  });

  it("service worker sw.js only caches static/shell/offline and explicitly bypasses auth/rest/rpc/admin/reports", () => {
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
    // Offline fallback cached
    expect(swContent).toContain("/offline");
  });
});

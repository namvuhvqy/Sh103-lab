import React from "react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InAppAlertBanner } from "@/components/shell/InAppAlertBanner";

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  Reflect.deleteProperty(window, "Notification");
});

describe("InAppAlertBanner hydration", () => {
  it("keeps the first browser render identical to the server HTML", async () => {
    const html = renderToString(<InAppAlertBanner />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "default", requestPermission: vi.fn() },
    });
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      root = hydrateRoot(container, <InAppAlertBanner />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      await Promise.resolve();
    });

    expect(recoverableErrors).toEqual([]);
    expect(container.textContent).toContain("Bật báo đẩy");
  });
});

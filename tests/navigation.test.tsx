import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/shell/BottomNav";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("canonical P5 mobile navigation", () => {
  beforeEach(() => { pathname = "/"; });

  it("marks the actual route active", () => {
    pathname = "/temperature";
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /Nhiệt độ/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Tổng quan/ })).not.toHaveAttribute("aria-current");
  });

  it("uses More as the destination for secondary modules", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /Thêm/ })).toHaveAttribute("href", "/more");
  });
});

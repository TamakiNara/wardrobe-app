// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("lucide-react", () => ({
  LogOut: ({ className }: { className?: string }) =>
    React.createElement("svg", {
      "data-icon": "LogOut",
      className,
    }),
}));

describe("LogoutButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("ログアウトアイコン付きで描画できる", async () => {
    const { default: LogoutButton } = await import("./logout-button");

    await act(async () => {
      root.render(React.createElement(LogoutButton));
    });

    expect(container.textContent).toContain("ログアウト");
    expect(container.querySelector('[data-icon="LogOut"]')).not.toBeNull();
  });
});

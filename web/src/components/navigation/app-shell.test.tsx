// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("@/components/navigation/global-bottom-nav", () => ({
  default: () => React.createElement("nav", { "data-testid": "bottom-nav" }),
}));

describe("AppShell", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("未認証時はホーム相当の path でもボトムナビを表示しない", async () => {
    usePathnameMock.mockReturnValue("/");

    const { default: AppShell } = await import("./app-shell");

    await act(async () => {
      root.render(
        React.createElement(
          AppShell,
          {
            hasSession: false,
            children: React.createElement("main", null, "content"),
          },
          React.createElement("main", null, "content"),
        ),
      );
    });

    expect(container.querySelector('[data-testid="bottom-nav"]')).toBeNull();
  });

  it("認証済みかつ対象 path ではボトムナビを表示する", async () => {
    usePathnameMock.mockReturnValue("/purchase-candidates");

    const { default: AppShell } = await import("./app-shell");

    await act(async () => {
      root.render(
        React.createElement(
          AppShell,
          {
            hasSession: true,
            children: React.createElement("main", null, "content"),
          },
          React.createElement("main", null, "content"),
        ),
      );
    });

    expect(container.querySelector('[data-testid="bottom-nav"]')).not.toBeNull();
  });

  it("wear logs 配下でもボトムナビを表示する", async () => {
    usePathnameMock.mockReturnValue("/wear-logs/12/edit");

    const { default: AppShell } = await import("./app-shell");

    await act(async () => {
      root.render(
        React.createElement(
          AppShell,
          {
            hasSession: true,
            children: React.createElement("main", null, "content"),
          },
          React.createElement("main", null, "content"),
        ),
      );
    });

    expect(container.querySelector('[data-testid="bottom-nav"]')).not.toBeNull();
  });
});

// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();
const originalFetch = global.fetch;

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
    global.fetch = originalFetch;
  });

  it("未認証時はホーム相当の path でもボトムナビを表示しない", async () => {
    usePathnameMock.mockReturnValue("/");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthenticated." }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof fetch;

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
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "tester" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof fetch;

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
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "tester" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof fetch;

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

  it("ログイン直後に settings 配下へ遷移してもボトムナビを表示する", async () => {
    usePathnameMock.mockReturnValue("/settings");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "tester" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof fetch;

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
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      }),
    );
    expect(container.querySelector('[data-testid="bottom-nav"]')).not.toBeNull();
  });
});

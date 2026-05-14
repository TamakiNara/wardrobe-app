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
  let fetchMock: ReturnType<typeof vi.fn>;
  let alertMock: ReturnType<typeof vi.fn>;
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;

  async function renderLogoutButton() {
    const { default: LogoutButton } = await import("./logout-button");

    await act(async () => {
      root.render(React.createElement(LogoutButton));
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn();
    alertMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("alert", alertMock);
    consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    consoleErrorMock.mockRestore();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("ログアウトアイコン付きで描画できる", async () => {
    await renderLogoutButton();

    expect(container.textContent).toContain("ログアウト");
    expect(container.querySelector('[data-icon="LogOut"]')).not.toBeNull();
  });

  it("ログアウト成功時は login へ遷移して refresh する", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true } as Response);

    await renderLogoutButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("ログアウト失敗時は native alert を使わず画面内にエラーを表示する", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false } as Response);

    await renderLogoutButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    expect(alertMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("ログアウトに失敗しました。");
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("再実行時に古いエラーをクリアする", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockImplementationOnce(() => new Promise<Response>(() => undefined));

    await renderLogoutButton();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    expect(container.textContent).toContain("ログアウトに失敗しました。");

    await act(async () => {
      button?.click();
    });

    expect(container.textContent).not.toContain("ログアウトに失敗しました。");
    expect(container.textContent).toContain("ログアウト中...");
  });
});

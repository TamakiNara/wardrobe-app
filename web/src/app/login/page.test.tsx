// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapLoginErrorMessage } from "./page";

const pushMock = vi.fn();
const refreshMock = vi.fn();

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("mapLoginErrorMessage", () => {
  it("認証失敗を共通文言へ変換する", () => {
    expect(mapLoginErrorMessage("invalid credentials")).toBe(
      "メールアドレスまたはパスワードが正しくありません。",
    );
  });

  it("メールアドレス形式エラーを共通文言へ変換する", () => {
    expect(
      mapLoginErrorMessage("The email field must be a valid email address."),
    ).toBe("メールアドレスの形式が正しくありません。");
  });

  it("通信系エラーは再試行文言へまとめる", () => {
    expect(mapLoginErrorMessage("CSRF token mismatch.")).toBe(
      "通信に失敗しました。時間をおいて再度お試しください。",
    );
    expect(
      mapLoginErrorMessage("Failed to get CSRF cookie from backend."),
    ).toBe("通信に失敗しました。時間をおいて再度お試しください。");
    expect(mapLoginErrorMessage()).toBe(
      "通信に失敗しました。時間をおいて再度お試しください。",
    );
  });
});

describe("LoginPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("ログイン成功時に遷移後 refresh する", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "logged_in" }),
    } as Response);

    const { default: LoginPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(LoginPage));
    });

    const emailInput = container.querySelector("#email") as HTMLInputElement;
    const passwordInput = container.querySelector(
      "#password",
    ) as HTMLInputElement;
    const form = container.querySelector("form");

    await act(async () => {
      setInputValue(emailInput, "user@example.com");
      setInputValue(passwordInput, "password123");
    });

    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalled();
  });
});

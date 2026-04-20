// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";

const pushMock = vi.fn();
const fetchUserTposMock = vi.fn();
const createUserTpoMock = vi.fn();
const updateUserTpoMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserTpos: fetchUserTposMock,
  createUserTpo: createUserTpoMock,
  updateUserTpo: updateUserTpoMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("SettingsTposPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
        { id: 4, name: "出張", sortOrder: 4, isActive: false, isPreset: false },
      ],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("TPO 一覧を表示し、プリセットと追加 TPO を区別できる", async () => {
    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("TPO 設定");
    expect(container.textContent).toContain(
      "アイテムとコーディネートで使う TPO 候補を管理します。無効化した TPO は新規候補に出ません。",
    );
    expect(container.textContent).toContain("仕事");
    expect(container.textContent).toContain("プリセット");
    expect(container.textContent).toContain("出張");
    expect(container.textContent).toContain("無効候補");
    expect(container.textContent).toContain("編集");
    expect(
      container.querySelector('button[aria-label="仕事 を 1 つ下へ移動"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('button[aria-label="休日 を 1 つ上へ移動"]'),
    ).not.toBeNull();
  });

  it("追加と有効化の操作を API へ送る", async () => {
    createUserTpoMock.mockResolvedValue({
      message: "created",
      tpo: {
        id: 5,
        name: "在宅",
        sortOrder: 5,
        isActive: true,
        isPreset: false,
      },
    });
    updateUserTpoMock.mockResolvedValue({
      message: "updated",
      tpo: {
        id: 4,
        name: "出張",
        sortOrder: 4,
        isActive: true,
        isPreset: false,
      },
    });

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("TPO 設定");
    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]');
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    );
    const addButton = buttons.find((button) => button.textContent === "追加");
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      valueSetter?.call(input, "在宅");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      addButton?.click();
      await waitForEffects();
    });

    expect(createUserTpoMock).toHaveBeenCalledWith({ name: "在宅" });

    const activateButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "有効にする");

    await act(async () => {
      activateButton?.click();
      await waitForEffects();
    });

    expect(updateUserTpoMock).toHaveBeenCalledWith(4, { isActive: true });
  });

  it("422 validation では具体的な項目エラーを表示する", async () => {
    createUserTpoMock.mockRejectedValue(
      new ApiClientError(422, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
        errors: {
          name: ["TPO名を入力してください。"],
        },
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]');
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "追加");
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      valueSetter?.call(input, "");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      addButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain("TPO名を入力してください。");
    expect(container.textContent).not.toContain(
      "TPO設定の保存に失敗しました。時間をおいて再度お試しください。",
    );
  });

  it("一覧取得失敗でも raw message を表示しない", async () => {
    fetchUserTposMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "TPO一覧の取得に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("作成失敗でも raw message を表示しない", async () => {
    createUserTpoMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    const input =
      container.querySelector<HTMLInputElement>('input[type="text"]');
    const addButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "追加");
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      valueSetter?.call(input, "在宅");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      addButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "TPO設定の保存に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("並び順更新失敗でも raw message を表示しない", async () => {
    updateUserTpoMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    const moveDownButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="仕事 を 1 つ下へ移動"]',
    );

    await act(async () => {
      moveDownButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "TPOの並び順更新に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("状態更新失敗でも raw message を表示しない", async () => {
    updateUserTpoMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    const activateButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "有効にする");

    await act(async () => {
      activateButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "TPO設定の更新に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("名称更新失敗でも raw message を表示しない", async () => {
    updateUserTpoMock.mockRejectedValue(
      new ApiClientError(500, {
        message: "SQLSTATE[42S22]: Unknown column custom_label",
      }),
    );

    const { default: SettingsTposPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

    const customRow = Array.from(container.querySelectorAll("article")).find(
      (article) => article.textContent?.includes("出張"),
    );
    const editButton = Array.from(
      customRow?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    ).find((button) => button.textContent?.trim() === "編集");

    await act(async () => {
      editButton?.click();
      await waitForEffects();
    });

    const saveButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "保存");

    await act(async () => {
      saveButton?.click();
      await waitForEffects();
    });

    expect(container.textContent).toContain(
      "TPO設定の保存に失敗しました。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });
});

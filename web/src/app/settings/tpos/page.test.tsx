// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("追加と無効化の操作を API へ送る", async () => {
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
        isActive: false,
        isPreset: false,
      },
    });

    const { default: SettingsTposPage } = await import("./page");

    fetchUserTposMock.mockResolvedValue({
      tpos: [
        { id: 1, name: "仕事", sortOrder: 1, isActive: true, isPreset: true },
        { id: 2, name: "休日", sortOrder: 2, isActive: true, isPreset: true },
        { id: 4, name: "出張", sortOrder: 4, isActive: true, isPreset: false },
      ],
    });

    await act(async () => {
      root.render(React.createElement(SettingsTposPage));
      await waitForEffects();
    });

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
    const customRow = Array.from(container.querySelectorAll("article")).find(
      (article) => article.textContent?.includes("出張"),
    );
    const deactivateButton = Array.from(
      customRow?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    ).find((button) => button.textContent === "無効にする");

    await act(async () => {
      valueSetter?.call(input, "在宅");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      addButton?.click();
      await waitForEffects();
    });

    expect(createUserTpoMock).toHaveBeenCalledWith({ name: "在宅" });

    await act(async () => {
      deactivateButton?.click();
      await waitForEffects();
    });

    expect(updateUserTpoMock).toHaveBeenCalledWith(4, { isActive: false });
  });
});

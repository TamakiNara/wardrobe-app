// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
const fetchUserPreferencesMock = vi.fn();
const updateUserPreferencesMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/settings", () => ({
  fetchUserPreferences: fetchUserPreferencesMock,
  updateUserPreferences: updateUserPreferencesMock,
}));

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("SettingsPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchUserPreferencesMock.mockResolvedValue({
      preferences: {
        currentSeason: null,
        defaultWearLogStatus: null,
        calendarWeekStart: null,
      },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("設定トップで表示・初期値設定と各設定ページへの導線を表示できる", async () => {
    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("表示・初期値設定");
    expect(container.innerHTML).toContain('href="/settings/categories"');
    expect(container.innerHTML).toContain('href="/settings/tpos"');
    expect(container.innerHTML).toContain('href="/settings/brands"');
    expect(container.textContent).toContain("カテゴリ設定へ");
    expect(container.textContent).toContain("TPO 設定へ");
    expect(container.textContent).toContain("ブランド候補設定へ");
  });

  it("表示・初期値設定を保存できる", async () => {
    updateUserPreferencesMock.mockResolvedValue({
      message: "updated",
      preferences: {
        currentSeason: "winter",
        defaultWearLogStatus: "planned",
        calendarWeekStart: "sunday",
      },
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    const currentSeasonSelect = container.querySelector<HTMLSelectElement>("#preferences-current-season");
    const defaultStatusSelect = container.querySelector<HTMLSelectElement>("#preferences-default-wear-log-status");
    const weekStartSelect = container.querySelector<HTMLSelectElement>("#preferences-calendar-week-start");
    const saveButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "個人設定を保存",
    );

    await act(async () => {
      currentSeasonSelect!.value = "winter";
      currentSeasonSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      defaultStatusSelect!.value = "planned";
      defaultStatusSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      weekStartSelect!.value = "sunday";
      weekStartSelect!.dispatchEvent(new Event("change", { bubbles: true }));
      await waitForEffects();
    });

    await act(async () => {
      saveButton!.click();
      await waitForEffects();
    });

    expect(updateUserPreferencesMock).toHaveBeenCalledWith({
      currentSeason: "winter",
      defaultWearLogStatus: "planned",
      calendarWeekStart: "sunday",
    });
    expect(container.textContent).toContain("表示・初期値設定を保存しました。");
  });
});

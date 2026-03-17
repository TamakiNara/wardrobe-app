// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const updateCategoryVisibilitySettingsMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/categories", () => ({
  fetchCategoryGroups: fetchCategoryGroupsMock,
}));

vi.mock("@/lib/api/settings", () => ({
  fetchCategoryVisibilitySettings: fetchCategoryVisibilitySettingsMock,
  updateCategoryVisibilitySettings: updateCategoryVisibilitySettingsMock,
}));

const sampleGroups: CategoryGroupRecord[] = [
  {
    id: "tops",
    name: "トップス",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "Tシャツ", sortOrder: 10 },
      { id: "tops_shirt", groupId: "tops", name: "シャツ / ブラウス", sortOrder: 20 },
    ],
  },
];

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
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("カテゴリ表示設定の初期表示を描画できる", async () => {
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
    });

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(container.textContent).toContain("1 / 2");

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
    expect(updateCategoryVisibilitySettingsMock).not.toHaveBeenCalled();
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    const { ApiClientError } = await import("@/lib/api/client");

    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockRejectedValue(
      new ApiClientError(401, { message: "Unauthenticated." }),
    );

    const { default: SettingsPage } = await import("./page");

    await act(async () => {
      root.render(React.createElement(SettingsPage));
      await waitForEffects();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});

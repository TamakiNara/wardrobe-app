// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryGroupRecord } from "@/types/categories";

const pushMock = vi.fn();
const fetchCategoryGroupsMock = vi.fn();
const fetchCategoryVisibilitySettingsMock = vi.fn();
const updateCategoryVisibilitySettingsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
      {
        id: "tops_tshirt_cutsew",
        groupId: "tops",
        name: "Tシャツ・カットソー",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "skirts",
    name: "スカート",
    sortOrder: 20,
    categories: [
      {
        id: "skirts_skirt",
        groupId: "skirts",
        name: "スカート",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "onepiece_dress",
    name: "ワンピース・ドレス",
    sortOrder: 30,
    categories: [
      {
        id: "onepiece_dress_onepiece",
        groupId: "onepiece_dress",
        name: "ワンピース",
        sortOrder: 10,
      },
    ],
  },
  {
    id: "allinone",
    name: "オールインワン",
    sortOrder: 35,
    categories: [
      {
        id: "allinone_allinone",
        groupId: "allinone",
        name: "オールインワン",
        sortOrder: 20,
      },
    ],
  },
  {
    id: "shoes",
    name: "シューズ",
    sortOrder: 40,
    categories: [
      { id: "shoes_pumps", groupId: "shoes", name: "パンプス", sortOrder: 10 },
    ],
  },
];

async function waitForEffects() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("CategoryPresetSelectionPage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchCategoryGroupsMock.mockResolvedValue(sampleGroups);
    fetchCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: [],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("male プリセットを保存できる", async () => {
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt_cutsew"],
    });

    const { default: Page } = await import("./page");

    await act(async () => {
      root.render(React.createElement(Page));
      await waitForEffects();
    });

    const buttons = Array.from(container.querySelectorAll("button"));

    await act(async () => {
      buttons[0].click();
      await waitForEffects();
    });

    await act(async () => {
      buttons[3].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).toHaveBeenCalledWith({
      visibleCategoryIds: ["tops_tshirt_cutsew"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("custom では個別設定画面へ進める", async () => {
    const { default: Page } = await import("./page");

    await act(async () => {
      root.render(React.createElement(Page));
      await waitForEffects();
    });

    const buttons = Array.from(container.querySelectorAll("button"));

    await act(async () => {
      buttons[2].click();
      await waitForEffects();
    });

    await act(async () => {
      buttons[3].click();
      await waitForEffects();
    });

    expect(updateCategoryVisibilitySettingsMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith(
      "/settings/categories?mode=onboarding&preset=custom",
    );
  });
});

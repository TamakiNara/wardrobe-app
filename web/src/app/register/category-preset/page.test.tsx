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
    name: "????",
    sortOrder: 10,
    categories: [
      { id: "tops_tshirt", groupId: "tops", name: "T???", sortOrder: 10 },
    ],
  },
  {
    id: "bottoms",
    name: "????",
    sortOrder: 20,
    categories: [
      { id: "bottoms_skirt", groupId: "bottoms", name: "????", sortOrder: 10 },
    ],
  },
  {
    id: "dress",
    name: "?????????????",
    sortOrder: 30,
    categories: [
      { id: "dress_onepiece", groupId: "dress", name: "?????", sortOrder: 10 },
      {
        id: "dress_allinone",
        groupId: "dress",
        name: "??????? / ?????",
        sortOrder: 20,
      },
    ],
  },
  {
    id: "shoes",
    name: "????",
    sortOrder: 40,
    categories: [
      { id: "shoes_pumps", groupId: "shoes", name: "????", sortOrder: 10 },
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

  it("male ??????????????????????????", async () => {
    updateCategoryVisibilitySettingsMock.mockResolvedValue({
      visibleCategoryIds: ["tops_tshirt"],
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
      visibleCategoryIds: ["tops_tshirt"],
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("custom ???? settings ??????????", async () => {
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

// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const apiFetchMock = vi.fn();
const saveDuplicatePayloadMock = vi.fn();

class MockApiClientError extends Error {
  status: number;
  data: { message?: string } | null;

  constructor(status: number, data: { message?: string } | null = null) {
    super(data?.message ?? `status ${status}`);
    this.status = status;
    this.data = data;
  }
}

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/api/client", () => ({
  ApiClientError: MockApiClientError,
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock("@/lib/items/duplicate", () => ({
  saveItemDuplicatePayload: (...args: unknown[]) =>
    saveDuplicatePayloadMock(...args),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("ItemDuplicateActions", () => {
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

  it("色違い追加成功時に payload を保存して新規作成画面へ遷移する", async () => {
    apiFetchMock.mockResolvedValue({
      message: "color_variant_payload_ready",
      item: {
        name: "色違い元",
        category: "tops",
        shape: "tshirt",
        brand_name: "Sample",
        variant_source_item_id: 10,
        colors: [],
        seasons: [],
        tpo_ids: [],
        images: [],
        materials: [],
        is_rain_ok: false,
        price: null,
        purchase_url: null,
        memo: null,
        purchased_at: null,
        size_gender: null,
        size_label: null,
        size_note: null,
        size_details: null,
      },
    });

    const { default: ItemDuplicateActions } =
      await import("./item-duplicate-actions");

    await act(async () => {
      root.render(
        React.createElement(ItemDuplicateActions, {
          itemId: 10,
          editHref: "/items/10/edit",
          returnHref: "/items",
        }),
      );
      await waitForEffects();
    });

    const colorVariantButton = container.querySelector<HTMLButtonElement>(
      'button[data-item-action="color-variant"]',
    );

    await act(async () => {
      colorVariantButton?.click();
      await waitForEffects();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/items/10/color-variant",
      expect.objectContaining({ method: "POST" }),
    );
    expect(saveDuplicatePayloadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "色違い元",
        variant_source_item_id: 10,
      }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/items/new?source=color-variant&returnTo=%2Fitems%2F10",
    );
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("失敗時はヘッダー下段向け alert を表示し、対象ボタンだけ loading にする", async () => {
    let resolveRequest: ((value: unknown) => void) | null = null;
    apiFetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { default: ItemDuplicateActions } =
      await import("./item-duplicate-actions");

    await act(async () => {
      root.render(
        React.createElement(ItemDuplicateActions, {
          itemId: 10,
          editHref: "/items/10/edit",
          returnHref: "/items",
        }),
      );
      await waitForEffects();
    });

    const duplicateButton = container.querySelector<HTMLButtonElement>(
      'button[data-item-action="duplicate"]',
    );
    const colorVariantButton = container.querySelector<HTMLButtonElement>(
      'button[data-item-action="color-variant"]',
    );

    await act(async () => {
      duplicateButton?.click();
      await waitForEffects();
    });

    expect(duplicateButton?.disabled).toBe(true);
    expect(colorVariantButton?.disabled).toBe(false);
    expect(duplicateButton?.textContent).toContain("複製を準備中...");

    apiFetchMock.mockRejectedValueOnce(
      new MockApiClientError(500, {
        message: "SQLSTATE[42S22]: Column not found",
      }),
    );

    await act(async () => {
      resolveRequest?.({});
      await waitForEffects();
    });

    await act(async () => {
      duplicateButton?.click();
      await waitForEffects();
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain(
      "複製を開始できませんでした。時間をおいて再度お試しください。",
    );
    expect(container.textContent).not.toContain("SQLSTATE");
  });

  it("別操作を始めると前のエラーをクリアする", async () => {
    apiFetchMock
      .mockRejectedValueOnce(
        new MockApiClientError(404, {
          message: "Not Found",
        }),
      )
      .mockResolvedValueOnce({
        message: "color_variant_payload_ready",
        item: {
          name: "色違い元",
          category: "tops",
          shape: "tshirt",
          brand_name: null,
          variant_source_item_id: 10,
          colors: [],
          seasons: [],
          tpo_ids: [],
          images: [],
          materials: [],
          is_rain_ok: false,
          price: null,
          purchase_url: null,
          memo: null,
          purchased_at: null,
          size_gender: null,
          size_label: null,
          size_note: null,
          size_details: null,
        },
      });

    const { default: ItemDuplicateActions } =
      await import("./item-duplicate-actions");

    await act(async () => {
      root.render(
        React.createElement(ItemDuplicateActions, {
          itemId: 10,
          editHref: "/items/10/edit",
          returnHref: "/items",
        }),
      );
      await waitForEffects();
    });

    const duplicateButton = container.querySelector<HTMLButtonElement>(
      'button[data-item-action="duplicate"]',
    );
    const colorVariantButton = container.querySelector<HTMLButtonElement>(
      'button[data-item-action="color-variant"]',
    );

    await act(async () => {
      duplicateButton?.click();
      await waitForEffects();
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "複製を開始できませんでした。時間をおいて再度お試しください。",
    );

    await act(async () => {
      colorVariantButton?.click();
      await waitForEffects();
    });

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(pushMock).toHaveBeenCalledWith(
      "/items/new?source=color-variant&returnTo=%2Fitems%2F10",
    );
  });
});

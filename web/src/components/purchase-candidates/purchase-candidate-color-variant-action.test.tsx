// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const apiFetchMock = vi.fn();
const saveColorVariantPayloadMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/api/client", () => ({
  ApiClientError: class extends Error {
    status: number;
    data: { message?: string } | null;

    constructor(status: number, data: { message?: string } | null = null) {
      super(data?.message ?? `status ${status}`);
      this.status = status;
      this.data = data;
    }
  },
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock("@/lib/purchase-candidates/duplicate", () => ({
  savePurchaseCandidateColorVariantPayload: (...args: unknown[]) =>
    saveColorVariantPayloadMock(...args),
}));

async function waitForEffects() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("PurchaseCandidateColorVariantAction", () => {
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

  it("色違い追加成功時は source candidate id 付き初期値 payload を保存して新規作成画面へ遷移する", async () => {
    apiFetchMock.mockResolvedValue({
      message: "color_variant_payload_ready",
      purchaseCandidate: {
        name: "春コート",
        status: "considering",
        priority: "medium",
        category_id: "outerwear_coat",
        variant_source_candidate_id: 10,
        brand_name: "Sample",
        price: 14800,
        sale_price: 12800,
        sale_ends_at: null,
        purchase_url: "https://example.test/products/1",
        memo: "メモ",
        wanted_reason: "欲しい理由",
        size_gender: "women",
        size_label: "M",
        size_note: null,
        size_details: null,
        is_rain_ok: true,
        colors: [],
        seasons: [],
        tpos: [],
        materials: [],
        images: [],
      },
    });

    const { default: PurchaseCandidateColorVariantAction } =
      await import("./purchase-candidate-color-variant-action");

    await act(async () => {
      root.render(
        React.createElement(PurchaseCandidateColorVariantAction, {
          candidateId: 10,
        }),
      );
      await waitForEffects();
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await waitForEffects();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/purchase-candidates/10/color-variant",
      expect.objectContaining({ method: "POST" }),
    );
    expect(saveColorVariantPayloadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "春コート",
        variant_source_candidate_id: 10,
      }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/purchase-candidates/new?source=color-variant",
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

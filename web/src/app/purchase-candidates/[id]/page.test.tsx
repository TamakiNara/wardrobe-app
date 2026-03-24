import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const redirectMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/purchase-candidates/purchase-candidate-item-draft-action", () => ({
  default: ({ candidateId }: { candidateId: number }) =>
    React.createElement("div", { "data-testid": "item-draft-action", "data-candidate-id": candidateId }, "item-draft-action"),
}));

describe("PurchaseCandidateDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "cookie" ? "session=test" : null),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("詳細表示と item-draft 導線を描画できる", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        purchaseCandidate: {
          id: 10,
          status: "on_hold",
          priority: "medium",
          name: "ネイビーコート",
          category_id: "outer_coat",
          category_name: "コート",
          brand_name: "Brand",
          price: 14800,
          purchase_url: "https://example.test",
          memo: "メモ",
          wanted_reason: "理由",
          size_gender: "women",
          size_label: "M",
          size_note: "厚手対応",
          is_rain_ok: true,
          converted_item_id: null,
          converted_at: null,
          colors: [{ role: "main", mode: "preset", value: "navy", hex: "#1F3A5F", label: "ネイビー" }],
          seasons: ["春"],
          tpos: ["仕事"],
          images: [],
          created_at: "2026-03-24T10:00:00+09:00",
          updated_at: "2026-03-24T10:00:00+09:00",
        },
      }),
    });

    const { default: PurchaseCandidateDetailPage } = await import("./page");
    const markup = renderToStaticMarkup(
      await PurchaseCandidateDetailPage({ params: Promise.resolve({ id: "10" }) }),
    );

    expect(markup).toContain("ネイビーコート");
    expect(markup).toContain("item 追加");
    expect(markup).toContain("理由");
    expect(markup).toContain("厚手対応");
    expect(markup).toContain("item-draft-action");
    expect(markup).toContain('href="/purchase-candidates/10/edit"');
  });
});

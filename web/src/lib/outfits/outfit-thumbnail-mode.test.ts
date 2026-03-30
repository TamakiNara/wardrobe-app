import { describe, expect, it } from "vitest";
import {
  resolveOutfitThumbnailMode,
  type OutfitColorThumbnailItem,
} from "./outfit-thumbnail-mode";

function renderOutfitItem(
  id: number,
  category: string,
  options?: {
    sortOrder?: number;
    shape?: string;
    spec?: {
      bottoms?: { length_type?: string | null } | null;
      legwear?: { coverage_type?: string | null } | null;
    } | null;
  },
): OutfitColorThumbnailItem {
  return {
    id,
    item_id: id,
    sort_order: options?.sortOrder ?? id,
    item: {
      id,
      name: `item-${id}`,
      category,
      shape: options?.shape ?? "shape",
      colors: [
        {
          role: "main",
          mode: "preset",
          value: "main",
          hex: "#111111",
          label: "main",
        },
      ],
      spec: options?.spec ?? null,
    },
  };
}

describe("resolveOutfitThumbnailMode", () => {
  it("onepiece 単体は onepiece_allinone mode を返す", () => {
    const result = resolveOutfitThumbnailMode([
      renderOutfitItem(1, "onepiece_allinone", { shape: "onepiece" }),
    ]);

    expect(result.mode).toBe("onepiece_allinone");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(false);
    expect(result.representativeOnepieceAllinone?.item.shape).toBe("onepiece");
  });

  it("onepiece + bottoms は onepiece_allinone mode を返す", () => {
    const result = resolveOutfitThumbnailMode([
      renderOutfitItem(1, "onepiece_allinone", { shape: "onepiece" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);

    expect(result.mode).toBe("onepiece_allinone");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(true);
  });

  it("allinone + bottoms は standard mode を維持する", () => {
    const result = resolveOutfitThumbnailMode([
      renderOutfitItem(1, "onepiece_allinone", { shape: "allinone" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);

    expect(result.mode).toBe("standard");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(false);
  });

  it("onepiece_allinone がなければ standard mode を返す", () => {
    const result = resolveOutfitThumbnailMode([
      renderOutfitItem(1, "tops", { shape: "tshirt" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);

    expect(result.mode).toBe("standard");
    expect(result.representativeOnepieceAllinone).toBeNull();
  });
});

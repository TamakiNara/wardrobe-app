import { describe, expect, it } from "vitest";
import {
  resolveOutfitThumbnailMode,
  selectOutfitThumbnailRepresentatives,
  sortOutfitColorThumbnailItems,
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

describe("resolveOutfitThumbnailMode current 仕様境界", () => {
  it("onepiece 単体は onepiece_allinone mode を返す", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "onepiece_allinone", { shape: "onepiece" }),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const result = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    expect(result.mode).toBe("onepiece_allinone");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(false);
    expect(representatives.representativeOnepieceAllinone?.item.shape).toBe(
      "onepiece",
    );
  });

  it("bottoms がなければ allinone も onepiece_allinone mode を返す", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "onepiece_allinone", { shape: "allinone" }),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const result = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    expect(result.mode).toBe("onepiece_allinone");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(false);
    expect(representatives.representativeOnepieceAllinone?.item.shape).toBe(
      "allinone",
    );
  });

  it("onepiece + bottoms は onepiece_allinone mode を返す", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "onepiece_allinone", { shape: "onepiece" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const result = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    expect(result.mode).toBe("onepiece_allinone");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(true);
  });

  it("allinone + bottoms は standard mode を維持する", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "onepiece_allinone", { shape: "allinone" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const result = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    expect(result.mode).toBe("standard");
    expect(result.shouldRenderOnepieceWithBottomsLayer).toBe(false);
  });

  it("onepiece_allinone がなければ standard mode を返す", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "tops", { shape: "tshirt" }),
      renderOutfitItem(2, "bottoms", {
        shape: "straight",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const result = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    expect(result.mode).toBe("standard");
    expect(representatives.representativeOnepieceAllinone).toBeNull();
  });
});

describe("selectOutfitThumbnailRepresentatives current 選定", () => {
  it("onepiece_allinone 候補は sort_order が最大の item を代表にする", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "onepiece_allinone", {
        sortOrder: 20,
        shape: "onepiece",
      }),
      renderOutfitItem(2, "tops", {
        sortOrder: 10,
        shape: "tshirt",
      }),
      renderOutfitItem(3, "onepiece_allinone", {
        sortOrder: 30,
        shape: "allinone",
      }),
    ]);

    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);

    expect(representatives.representativeOnepieceAllinone?.item_id).toBe(3);
    expect(representatives.representativeOnepieceAllinone?.item.shape).toBe(
      "allinone",
    );
  });
});

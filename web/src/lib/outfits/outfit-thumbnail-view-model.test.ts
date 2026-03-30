import { describe, expect, it } from "vitest";
import {
  buildOnepieceAllinoneThumbnailViewModel,
  buildStandardOutfitThumbnailViewModel,
} from "./outfit-thumbnail-view-model";
import {
  resolveOutfitThumbnailMode,
  selectOutfitThumbnailRepresentatives,
  sortOutfitColorThumbnailItems,
  type OutfitColorThumbnailItem,
} from "./outfit-thumbnail-mode";

function renderOutfitItem(
  id: number,
  category: string,
  colors: Array<{
    role: "main" | "sub";
    hex: string;
    label: string;
  }>,
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
      colors: colors.map((color) => ({
        role: color.role,
        mode: "preset",
        value: color.label,
        hex: color.hex,
        label: color.label,
      })),
      spec: options?.spec ?? null,
    },
  };
}

describe("buildStandardOutfitThumbnailViewModel current ViewModel 組み立て", () => {
  it("tops / bottoms / others と lower-body preview をまとめる", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(1, "tops", [
        { role: "main", hex: "#ffffff", label: "白" },
      ]),
      renderOutfitItem(
        2,
        "bottoms",
        [{ role: "main", hex: "#111111", label: "黒" }],
        {
          shape: "straight",
          spec: { bottoms: { length_type: "knee" } },
        },
      ),
      renderOutfitItem(
        3,
        "legwear",
        [{ role: "main", hex: "#333333", label: "グレー" }],
        {
          shape: "socks",
          spec: { legwear: { coverage_type: "crew_socks" } },
        },
      ),
      renderOutfitItem(4, "shoes", [
        { role: "main", hex: "#224488", label: "青" },
      ]),
    ]);

    const viewModel = buildStandardOutfitThumbnailViewModel({
      sortedOutfitItems,
      skinToneColor: "#E9C29B",
    });

    expect(viewModel.layout.tops).toHaveLength(1);
    expect(viewModel.layout.bottoms).toHaveLength(1);
    expect(viewModel.layout.others).toHaveLength(1);
    expect(viewModel.layout.hasOthersBar).toBe(true);
    expect(viewModel.hasTopBottomSplit).toBe(true);
    expect(viewModel.lowerBodyPreview?.coverageType).toBe("crew_socks");
    expect(viewModel.skinToneColor).toBe("#E9C29B");
  });
});

describe("buildOnepieceAllinoneThumbnailViewModel current ViewModel 組み立て", () => {
  it("onepiece + bottoms では onepiece 主レイヤーと裾見せ lower-body を組み立てる", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(
        1,
        "onepiece_allinone",
        [
          { role: "main", hex: "#44516A", label: "ネイビー" },
          { role: "sub", hex: "#D8CBB4", label: "ベージュ" },
        ],
        { sortOrder: 1, shape: "onepiece" },
      ),
      renderOutfitItem(
        2,
        "bottoms",
        [{ role: "main", hex: "#111111", label: "黒" }],
        {
          sortOrder: 2,
          shape: "straight",
          spec: { bottoms: { length_type: "full" } },
        },
      ),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const modeResolution = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    const viewModel = buildOnepieceAllinoneThumbnailViewModel({
      sortedOutfitItems,
      representatives,
      modeResolution,
      skinToneColor: "#E9C29B",
    });

    expect(viewModel.shouldRenderOnepieceWithBottomsLayer).toBe(true);
    expect(viewModel.onepieceAllinoneHasVisibleLowerBody).toBe(true);
    expect(viewModel.onepieceAllinoneLayerStyle.bottom).toBe("12%");
    expect(viewModel.onepieceAllinoneMainColorHex).toBe("#44516A");
    expect(viewModel.onepieceAllinoneSubColorHex).toBe("#D8CBB4");
    expect(viewModel.layout.others).toHaveLength(0);
  });

  it("onepiece + bottoms + legwear でも legwear は others へ戻さず lower-body 側で扱う", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(
        1,
        "onepiece_allinone",
        [{ role: "main", hex: "#44516A", label: "ネイビー" }],
        { sortOrder: 1, shape: "onepiece" },
      ),
      renderOutfitItem(
        2,
        "bottoms",
        [{ role: "main", hex: "#111111", label: "黒" }],
        {
          sortOrder: 2,
          shape: "straight",
          spec: { bottoms: { length_type: "full" } },
        },
      ),
      renderOutfitItem(
        3,
        "legwear",
        [{ role: "main", hex: "#334155", label: "ネイビー" }],
        {
          sortOrder: 3,
          shape: "socks",
          spec: { legwear: { coverage_type: "crew_socks" } },
        },
      ),
      renderOutfitItem(4, "shoes", [
        { role: "main", hex: "#888888", label: "グレー" },
      ]),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const modeResolution = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    const viewModel = buildOnepieceAllinoneThumbnailViewModel({
      sortedOutfitItems,
      representatives,
      modeResolution,
      skinToneColor: "#E9C29B",
    });

    expect(viewModel.shouldRenderOnepieceWithBottomsLayer).toBe(true);
    expect(viewModel.onepieceAllinoneLowerBodyPreview?.coverageType).toBe(
      "crew_socks",
    );
    expect(viewModel.layout.others).toHaveLength(1);
    expect(viewModel.layout.others[0]?.id).toBe(4);
  });

  it("tops と onepiece の前後は sort_order から決まる", () => {
    const sortedOutfitItems = sortOutfitColorThumbnailItems([
      renderOutfitItem(
        1,
        "onepiece_allinone",
        [{ role: "main", hex: "#44516A", label: "ネイビー" }],
        { sortOrder: 1, shape: "onepiece" },
      ),
      renderOutfitItem(
        2,
        "tops",
        [{ role: "main", hex: "#ffffff", label: "白" }],
        { sortOrder: 2, shape: "tshirt" },
      ),
    ]);
    const representatives =
      selectOutfitThumbnailRepresentatives(sortedOutfitItems);
    const modeResolution = resolveOutfitThumbnailMode({
      sortedOutfitItems,
      representatives,
    });

    const viewModel = buildOnepieceAllinoneThumbnailViewModel({
      sortedOutfitItems,
      representatives,
      modeResolution,
      skinToneColor: "#E9C29B",
    });

    expect(viewModel.topsAreAboveOnepieceAllinone).toBe(true);
    expect(viewModel.topsAreBelowOnepieceAllinone).toBe(false);
  });
});

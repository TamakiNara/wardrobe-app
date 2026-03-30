import { describe, expect, it } from "vitest";
import type { WearLogThumbnailItem } from "@/types/wear-logs";
import {
  buildOnepieceAllinoneWearLogThumbnailViewModel,
  buildStandardWearLogThumbnailViewModel,
} from "./wear-log-thumbnail-view-model";
import {
  resolveWearLogThumbnailMode,
  selectWearLogThumbnailRepresentatives,
  sortWearLogThumbnailItems,
} from "./wear-log-thumbnail-mode";

function createThumbnailItem(
  id: number,
  params: Partial<WearLogThumbnailItem> = {},
): WearLogThumbnailItem {
  return {
    source_item_id: id,
    sort_order: id,
    category: "tops",
    shape: "tshirt",
    spec: null,
    colors: [{ role: "main", hex: "#ffffff", label: "白" }],
    ...params,
  };
}

describe("buildStandardWearLogThumbnailViewModel", () => {
  it("current の色帯レイアウトをそのまま ViewModel に載せる", () => {
    const sortedWearLogItems = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "tops",
        shape: "tshirt",
      }),
      createThumbnailItem(2, {
        category: "bottoms",
        shape: "pants",
        spec: { bottoms: { length_type: "full" } },
        colors: [{ role: "main", hex: "#111111", label: "黒" }],
      }),
      createThumbnailItem(3, {
        category: "legwear",
        shape: "socks",
        spec: { legwear: { coverage_type: "crew_socks" } },
        colors: [{ role: "main", hex: "#888888", label: "グレー" }],
      }),
    ]);
    const representatives =
      selectWearLogThumbnailRepresentatives(sortedWearLogItems);
    const modeResolution = resolveWearLogThumbnailMode({
      sortedWearLogItems,
      representatives,
    });

    const viewModel = buildStandardWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
    });

    expect(viewModel.hasTopBottomSplit).toBe(true);
    expect(viewModel.layout.tops).toHaveLength(1);
    expect(viewModel.layout.bottoms).toHaveLength(1);
    expect(viewModel.layout.others).toHaveLength(0);
    expect(viewModel.lowerBodyPreview).not.toBeNull();
    expect(viewModel.lowerBodyPreview?.representativeBottomsItemId).toBe(2);
    expect(viewModel.lowerBodyPreview?.representativeLegwearItemId).toBe(3);
  });

  it("current では onepiece_allinone も others 側のまま残す", () => {
    const sortedWearLogItems = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "onepiece_allinone",
        shape: "onepiece",
        colors: [{ role: "main", hex: "#223355", label: "ネイビー" }],
      }),
    ]);
    const representatives =
      selectWearLogThumbnailRepresentatives(sortedWearLogItems);
    const modeResolution = resolveWearLogThumbnailMode({
      sortedWearLogItems,
      representatives,
    });

    const viewModel = buildStandardWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
    });

    expect(viewModel.layout.others).toHaveLength(1);
    expect(viewModel.layout.usesFullHeightForOthers).toBe(true);
    expect(viewModel.lowerBodyPreview).toBeNull();
  });

  it("bottoms がない場合は legwear を others に戻さず lower-body preview も出さない", () => {
    const sortedWearLogItems = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "legwear",
        shape: "socks",
        spec: { legwear: { coverage_type: "crew_socks" } },
        colors: [{ role: "main", hex: "#888888", label: "グレー" }],
      }),
    ]);
    const representatives =
      selectWearLogThumbnailRepresentatives(sortedWearLogItems);
    const modeResolution = resolveWearLogThumbnailMode({
      sortedWearLogItems,
      representatives,
    });

    const viewModel = buildStandardWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
    });

    expect(viewModel.layout.others).toHaveLength(0);
    expect(viewModel.layout.usesFullHeightForOthers).toBe(false);
    expect(viewModel.lowerBodyPreview).toBeNull();
  });

  it("onepiece + bottoms は onepiece 主レイヤーの専用 ViewModel を組み立てる", () => {
    const sortedWearLogItems = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "tops",
        shape: "tshirt",
        sort_order: 1,
        colors: [{ role: "main", hex: "#ffffff", label: "白" }],
      }),
      createThumbnailItem(2, {
        category: "onepiece_allinone",
        shape: "onepiece",
        sort_order: 3,
        colors: [
          { role: "main", hex: "#223355", label: "ネイビー" },
          { role: "sub", hex: "#e5d8bd", label: "ベージュ" },
        ],
      }),
      createThumbnailItem(3, {
        category: "bottoms",
        shape: "pants",
        sort_order: 4,
        spec: { bottoms: { length_type: "full" } },
        colors: [{ role: "main", hex: "#111111", label: "黒" }],
      }),
      createThumbnailItem(4, {
        category: "legwear",
        shape: "socks",
        sort_order: 5,
        spec: { legwear: { coverage_type: "crew_socks" } },
        colors: [{ role: "main", hex: "#888888", label: "グレー" }],
      }),
    ]);
    const representatives =
      selectWearLogThumbnailRepresentatives(sortedWearLogItems);
    const modeResolution = resolveWearLogThumbnailMode({
      sortedWearLogItems,
      representatives,
    });

    const viewModel = buildOnepieceAllinoneWearLogThumbnailViewModel({
      sortedWearLogItems,
      representatives,
      modeResolution,
    });

    expect(viewModel.layout.tops).toHaveLength(1);
    expect(viewModel.layout.bottoms).toHaveLength(1);
    expect(viewModel.layout.others).toHaveLength(0);
    expect(viewModel.onepieceAllinoneMainColorHex).toBe("#223355");
    expect(viewModel.onepieceAllinoneSubColorHex).toBe("#e5d8bd");
    expect(viewModel.topsAreBelowOnepieceAllinone).toBe(true);
    expect(viewModel.topsAreAboveOnepieceAllinone).toBe(false);
    expect(viewModel.onepieceAllinoneLayerStyle.bottom).toBe("12%");
    expect(
      viewModel.onepieceAllinoneLowerBodyPreview?.representativeBottomsItemId,
    ).toBe(3);
  });
});

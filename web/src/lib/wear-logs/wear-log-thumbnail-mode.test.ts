import { describe, expect, it } from "vitest";
import type { WearLogThumbnailItem } from "@/types/wear-logs";
import {
  resolveWearLogThumbnailMode,
  selectRepresentativeWearLogBottoms,
  selectRepresentativeWearLogLegwear,
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

describe("wear log thumbnail mode helpers", () => {
  it("sort_order 昇順で wear_log_items を並べ替える", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, { sort_order: 3 }),
      createThumbnailItem(2, { sort_order: 1 }),
      createThumbnailItem(3, { sort_order: 2 }),
    ]);

    expect(sorted.map((item) => item.sort_order)).toEqual([1, 2, 3]);
  });

  it("onepiece_allinone representative は sort_order 最大の候補を返す", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "onepiece_allinone",
        shape: "onepiece",
        sort_order: 2,
      }),
      createThumbnailItem(2, {
        category: "tops",
        shape: "cardigan",
        sort_order: 3,
      }),
      createThumbnailItem(3, {
        category: "onepiece_allinone",
        shape: "allinone",
        sort_order: 4,
      }),
    ]);

    const representatives = selectWearLogThumbnailRepresentatives(sorted);

    expect(representatives.representativeOnepieceAllinone?.source_item_id).toBe(
      3,
    );
  });

  it("bottoms / legwear representative も wear_log_items 正本で選ぶ", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "bottoms",
        shape: "pants",
      }),
      createThumbnailItem(2, {
        category: "bottoms",
        shape: "pants",
        spec: { bottoms: { length_type: "midi" } },
      }),
      createThumbnailItem(3, {
        category: "legwear",
        shape: "socks",
      }),
      createThumbnailItem(4, {
        category: "legwear",
        shape: "socks",
        spec: { legwear: { coverage_type: "crew_socks" } },
      }),
    ]);

    expect(selectRepresentativeWearLogBottoms(sorted)?.source_item_id).toBe(2);
    expect(selectRepresentativeWearLogLegwear(sorted)?.source_item_id).toBe(4);
  });

  it("onepiece + bottoms のときだけ onepiece_allinone mode に入る", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "onepiece_allinone",
        shape: "onepiece",
      }),
      createThumbnailItem(2, {
        category: "bottoms",
        shape: "pants",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);
    const representatives = selectWearLogThumbnailRepresentatives(sorted);

    const resolution = resolveWearLogThumbnailMode({
      sortedWearLogItems: sorted,
      representatives,
    });

    expect(resolution.mode).toBe("onepiece_allinone");
    expect(resolution.shouldRenderOnepieceWithBottomsLayer).toBe(true);
  });

  it("allinone + bottoms は standard mode を維持する", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "onepiece_allinone",
        shape: "allinone",
      }),
      createThumbnailItem(2, {
        category: "bottoms",
        shape: "pants",
        spec: { bottoms: { length_type: "full" } },
      }),
    ]);
    const representatives = selectWearLogThumbnailRepresentatives(sorted);

    expect(
      resolveWearLogThumbnailMode({
        sortedWearLogItems: sorted,
        representatives,
      }).mode,
    ).toBe("standard");
  });

  it("bottoms がない onepiece は current では standard mode のまま", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "onepiece_allinone",
        shape: "onepiece",
      }),
    ]);
    const representatives = selectWearLogThumbnailRepresentatives(sorted);

    expect(
      resolveWearLogThumbnailMode({
        sortedWearLogItems: sorted,
        representatives,
      }).mode,
    ).toBe("standard");
  });

  it("selectWearLogThumbnailRepresentatives に bottoms / legwear representative も含める", () => {
    const sorted = sortWearLogThumbnailItems([
      createThumbnailItem(1, {
        category: "bottoms",
        shape: "pants",
        spec: { bottoms: { length_type: "full" } },
      }),
      createThumbnailItem(2, {
        category: "legwear",
        shape: "socks",
        spec: { legwear: { coverage_type: "crew_socks" } },
      }),
    ]);

    const representatives = selectWearLogThumbnailRepresentatives(sorted);

    expect(representatives.representativeBottoms?.source_item_id).toBe(1);
    expect(representatives.representativeLegwear?.source_item_id).toBe(2);
  });
});

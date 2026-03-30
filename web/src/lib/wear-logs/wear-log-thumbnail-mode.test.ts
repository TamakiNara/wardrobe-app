import { describe, expect, it } from "vitest";
import type { WearLogThumbnailItem } from "@/types/wear-logs";
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

  it("current では onepiece_allinone があっても standard mode を維持する", () => {
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

    expect(
      resolveWearLogThumbnailMode({
        sortedWearLogItems: sorted,
        representatives,
      }).mode,
    ).toBe("standard");
  });
});

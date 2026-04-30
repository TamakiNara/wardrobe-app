import type { ItemCareStatus, ItemStatus } from "@/types/items";
import type { ItemFormColor } from "@/types/items";
import type { ItemSpec } from "@/types/items";
import type {
  WearLogFeedbackTag,
  WearLogItemSourceType,
  WearLogOverallRating,
  WearLogRecord,
  WearLogTemperatureFeel,
  WearLogUpsertPayload,
} from "@/types/wear-logs";

export type WearLogSelectableItem = {
  id: number;
  name: string | null;
  status: ItemStatus;
  care_status?: ItemCareStatus | null;
  category?: string | null;
  shape?: string | null;
  colors?: ItemFormColor[];
  seasons?: string[];
  tpos?: string[];
};

export type WearLogSelectableOutfit = {
  id: number;
  name: string | null;
  status: "active" | "invalid";
  seasons?: string[];
  tpos?: string[];
  itemCount?: number;
  outfitItems?: Array<{
    id: number;
    item_id: number;
    sort_order: number;
    item: {
      id: number;
      name: string | null;
      category: string;
      shape: string;
      colors: ItemFormColor[];
      spec?: ItemSpec | null;
    };
  }>;
};

export type SelectedWearLogItem = {
  sourceItemId: number;
  itemSourceType: WearLogItemSourceType;
};

export function mergeWearLogItemCandidates(
  candidates: WearLogSelectableItem[],
  wearLog: WearLogRecord | null,
): WearLogSelectableItem[] {
  const currentWearLogItems =
    wearLog === null
      ? []
      : wearLog.items
          .filter((item) => item.source_item_id !== null)
          .map((item) => ({
            id: item.source_item_id as number,
            name: item.item_name,
            status: item.source_item_status ?? "active",
            care_status: null,
            category: null,
            shape: null,
            colors: [],
            seasons: [],
            tpos: [],
          }));

  return [...currentWearLogItems, ...candidates].reduce<
    WearLogSelectableItem[]
  >((carry, item) => {
    if (carry.some((current) => current.id === item.id)) {
      return carry;
    }

    return [...carry, item];
  }, []);
}

export function mergeWearLogOutfitCandidates(
  candidates: WearLogSelectableOutfit[],
  wearLog: WearLogRecord | null,
): WearLogSelectableOutfit[] {
  if (wearLog === null || wearLog.source_outfit_id === null) {
    return candidates;
  }

  const currentSourceOutfit: WearLogSelectableOutfit = {
    id: wearLog.source_outfit_id,
    name: wearLog.source_outfit_name,
    status: wearLog.source_outfit_status ?? "active",
    seasons: [],
    tpos: [],
    itemCount: 0,
  };

  if (candidates.some((candidate) => candidate.id === currentSourceOutfit.id)) {
    return candidates;
  }

  return [currentSourceOutfit, ...candidates];
}

export function buildSelectedWearLogItems(
  wearLog: WearLogRecord | null,
): SelectedWearLogItem[] {
  if (wearLog === null) {
    return [];
  }

  return wearLog.items
    .filter((item) => item.source_item_id !== null)
    .sort((left, right) => left.sort_order - right.sort_order)
    .reduce<SelectedWearLogItem[]>((carry, item) => {
      const sourceItemId = item.source_item_id as number;

      if (carry.some((current) => current.sourceItemId === sourceItemId)) {
        return carry;
      }

      return [
        ...carry,
        {
          sourceItemId,
          itemSourceType: item.item_source_type,
        },
      ];
    }, []);
}

export function buildWearLogPayload(params: {
  status: "planned" | "worn";
  eventDate: string;
  displayOrder: number;
  sourceOutfitId: number | null;
  memo: string;
  outdoorTemperatureFeel: WearLogTemperatureFeel | null;
  indoorTemperatureFeel: WearLogTemperatureFeel | null;
  overallRating: WearLogOverallRating | null;
  feedbackTags: WearLogFeedbackTag[] | null;
  feedbackMemo: string;
  selectedItems: SelectedWearLogItem[];
}): WearLogUpsertPayload {
  return {
    status: params.status,
    event_date: params.eventDate,
    display_order: params.displayOrder,
    source_outfit_id: params.sourceOutfitId,
    memo: params.memo,
    outdoor_temperature_feel: params.outdoorTemperatureFeel,
    indoor_temperature_feel: params.indoorTemperatureFeel,
    overall_rating: params.overallRating,
    feedback_tags:
      params.feedbackTags && params.feedbackTags.length > 0
        ? params.feedbackTags
        : null,
    feedback_memo: params.feedbackMemo,
    items: params.selectedItems.map((item, index) => ({
      source_item_id: item.sourceItemId,
      sort_order: index + 1,
      item_source_type: item.itemSourceType,
    })),
  };
}

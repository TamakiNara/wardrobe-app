import type { OutfitDuplicatePayload } from "@/types/outfits";

const DUPLICATE_STORAGE_KEY = "outfit-duplicate-payload";

export type DuplicateUnavailableItem = {
  itemId: number;
  sortOrder: number;
  note: string;
};

export type OutfitDuplicateDraft = {
  name: string;
  memo: string;
  seasons: string[];
  tpos: string[];
  selectedItemIds: number[];
  unavailableItems: DuplicateUnavailableItem[];
};

export function saveOutfitDuplicatePayload(payload: OutfitDuplicatePayload) {
  window.sessionStorage.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify(payload));
}

export function loadOutfitDuplicatePayload(): OutfitDuplicatePayload | null {
  const raw = window.sessionStorage.getItem(DUPLICATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as OutfitDuplicatePayload;
  } catch {
    return null;
  }
}

export function clearOutfitDuplicatePayload() {
  window.sessionStorage.removeItem(DUPLICATE_STORAGE_KEY);
}

export function mapOutfitDuplicatePayloadToDraft(
  payload: OutfitDuplicatePayload,
): OutfitDuplicateDraft {
  const sortedItems = [...payload.items].sort((left, right) => {
    return left.sort_order - right.sort_order;
  });

  return {
    name: payload.name ?? "",
    memo: payload.memo ?? "",
    seasons: payload.seasons,
    tpos: payload.tpos,
    selectedItemIds: sortedItems
      .filter((item) => item.selectable)
      .map((item) => item.item_id),
    unavailableItems: sortedItems
      .filter((item) => !item.selectable)
      .map((item) => ({
        itemId: item.item_id,
        sortOrder: item.sort_order,
        note: item.note ?? "現在は利用できないため、初期選択から除外しました。",
      })),
  };
}

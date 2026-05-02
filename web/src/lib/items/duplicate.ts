import type { ItemDuplicatePayload } from "@/types/items";

const ITEM_DUPLICATE_STORAGE_KEY = "item-duplicate-payload";

export function saveItemDuplicatePayload(payload: ItemDuplicatePayload) {
  window.sessionStorage.setItem(
    ITEM_DUPLICATE_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function loadItemDuplicatePayload(): ItemDuplicatePayload | null {
  const raw = window.sessionStorage.getItem(ITEM_DUPLICATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ItemDuplicatePayload;
  } catch {
    return null;
  }
}

export function clearItemDuplicatePayload() {
  window.sessionStorage.removeItem(ITEM_DUPLICATE_STORAGE_KEY);
}

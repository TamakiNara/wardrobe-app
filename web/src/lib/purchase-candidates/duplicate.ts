import type { PurchaseCandidateDuplicatePayload } from "@/types/purchase-candidates";

const DUPLICATE_STORAGE_KEY = "purchase-candidate-duplicate-payload";

export function savePurchaseCandidateDuplicatePayload(
  payload: PurchaseCandidateDuplicatePayload,
) {
  window.sessionStorage.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPurchaseCandidateDuplicatePayload(): PurchaseCandidateDuplicatePayload | null {
  const raw = window.sessionStorage.getItem(DUPLICATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PurchaseCandidateDuplicatePayload;
  } catch {
    return null;
  }
}

export function clearPurchaseCandidateDuplicatePayload() {
  window.sessionStorage.removeItem(DUPLICATE_STORAGE_KEY);
}

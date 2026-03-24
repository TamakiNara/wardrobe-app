import type {
  PurchaseCandidateImageRecord,
  PurchaseCandidateItemDraftResponse,
} from "@/types/purchase-candidates";

const ITEM_DRAFT_STORAGE_KEY = "purchase-candidate-item-draft";

export type PurchaseCandidateItemDraft = {
  name: string;
  sourceCategoryId: string;
  category: string;
  shape: string;
  colors: PurchaseCandidateItemDraftResponse["item_draft"]["colors"];
  seasons: string[];
  tpos: string[];
  images: PurchaseCandidateImageRecord[];
  candidateSummary: PurchaseCandidateItemDraftResponse["candidate_summary"];
};

export function savePurchaseCandidateItemDraft(
  payload: PurchaseCandidateItemDraftResponse,
) {
  window.sessionStorage.setItem(ITEM_DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPurchaseCandidateItemDraft():
  | PurchaseCandidateItemDraftResponse
  | null {
  const raw = window.sessionStorage.getItem(ITEM_DRAFT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PurchaseCandidateItemDraftResponse;
  } catch {
    return null;
  }
}

export function clearPurchaseCandidateItemDraft() {
  window.sessionStorage.removeItem(ITEM_DRAFT_STORAGE_KEY);
}

export function mapPurchaseCandidateItemDraft(
  payload: PurchaseCandidateItemDraftResponse,
): PurchaseCandidateItemDraft {
  return {
    name: payload.item_draft.name ?? "",
    sourceCategoryId: payload.item_draft.source_category_id,
    category: payload.item_draft.category,
    shape: payload.item_draft.shape,
    colors: payload.item_draft.colors,
    seasons: payload.item_draft.seasons,
    tpos: payload.item_draft.tpos,
    images: payload.images,
    candidateSummary: payload.candidate_summary,
  };
}

import type {
  PurchaseCandidateImageRecord,
  PurchaseCandidateItemDraftResponse,
} from "@/types/purchase-candidates";

const ITEM_DRAFT_STORAGE_KEY = "purchase-candidate-item-draft";

export type PurchaseCandidateItemDraft = {
  sourceCandidateId: number;
  name: string;
  sourceCategoryId: string;
  category: string;
  shape: string;
  brandName: string | null;
  price: number | null;
  purchaseUrl: string | null;
  memo: string | null;
  sizeGender: "women" | "men" | "unisex" | null;
  sizeLabel: string | null;
  sizeNote: string | null;
  purchasedAt: string | null;
  sizeDetails: string | null;
  isRainOk: boolean;
  colors: PurchaseCandidateItemDraftResponse["item_draft"]["colors"];
  seasons: string[];
  tpos: string[];
  images: PurchaseCandidateImageRecord[];
  spec: Record<string, unknown> | null;
  candidateSummary: PurchaseCandidateItemDraftResponse["candidate_summary"];
};

export function savePurchaseCandidateItemDraft(
  payload: PurchaseCandidateItemDraftResponse,
) {
  window.sessionStorage.setItem(
    ITEM_DRAFT_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function loadPurchaseCandidateItemDraft(): PurchaseCandidateItemDraftResponse | null {
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
    sourceCandidateId: payload.candidate_summary.id,
    name: payload.item_draft.name ?? "",
    sourceCategoryId: payload.item_draft.source_category_id,
    category: payload.item_draft.category,
    shape: payload.item_draft.shape,
    brandName: payload.item_draft.brand_name,
    price: payload.item_draft.price,
    purchaseUrl: payload.item_draft.purchase_url,
    memo: payload.item_draft.memo,
    sizeGender: payload.item_draft.size_gender,
    sizeLabel: payload.item_draft.size_label,
    sizeNote: payload.item_draft.size_note,
    purchasedAt: payload.item_draft.purchased_at,
    sizeDetails: payload.item_draft.size_details,
    isRainOk: payload.item_draft.is_rain_ok,
    colors: payload.item_draft.colors,
    seasons: payload.item_draft.seasons,
    tpos: payload.item_draft.tpos,
    images: payload.images,
    spec: payload.item_draft.spec,
    candidateSummary: payload.candidate_summary,
  };
}

import type { ItemSizeDetails } from "@/types/items";

export type PurchaseCandidateStatus =
  | "considering"
  | "on_hold"
  | "purchased"
  | "dropped";

export type PurchaseCandidatePriority = "high" | "medium" | "low";

export type PurchaseCandidateColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

export type PurchaseCandidateImageRecord = {
  id: number;
  purchase_candidate_id: number;
  disk: string | null;
  path: string | null;
  url: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  sort_order: number;
  is_primary: boolean;
};

export type PurchaseCandidateListItem = {
  id: number;
  status: PurchaseCandidateStatus;
  priority: PurchaseCandidatePriority;
  name: string;
  category_id: string;
  category_name: string | null;
  price: number | null;
  sale_price: number | null;
  sale_ends_at: string | null;
  converted_item_id: number | null;
  converted_at: string | null;
  primary_image: PurchaseCandidateImageRecord | null;
  updated_at: string | null;
};

export type PurchaseCandidateRecord = {
  id: number;
  status: PurchaseCandidateStatus;
  priority: PurchaseCandidatePriority;
  name: string;
  category_id: string;
  category_name: string | null;
  brand_name: string | null;
  price: number | null;
  sale_price: number | null;
  sale_ends_at: string | null;
  purchase_url: string | null;
  memo: string | null;
  wanted_reason: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  is_rain_ok: boolean;
  converted_item_id: number | null;
  converted_at: string | null;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
  images: PurchaseCandidateImageRecord[];
  created_at: string | null;
  updated_at: string | null;
};

export type PurchaseCandidatesResponse = {
  purchaseCandidates: PurchaseCandidateListItem[];
  meta: {
    total: number;
    totalAll: number;
    page: number;
    lastPage: number;
  };
};

export type PurchaseCandidateDetailResponse = {
  purchaseCandidate: PurchaseCandidateRecord;
};

export type PurchaseCandidateUpsertPayload = {
  status: PurchaseCandidateStatus;
  priority: PurchaseCandidatePriority;
  name: string;
  category_id: string;
  brand_name: string | null;
  price: number | null;
  sale_price: number | null;
  sale_ends_at: string | null;
  purchase_url: string | null;
  memo: string | null;
  wanted_reason: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  is_rain_ok: boolean;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
};

export type PurchaseCandidateMutationResponse = {
  message: string;
  purchaseCandidate: PurchaseCandidateRecord;
};

export type PurchaseCandidateItemDraftPayload = {
  name: string;
  source_category_id: string;
  category: string;
  shape: string;
  brand_name: string | null;
  price: number | null;
  purchase_url: string | null;
  memo: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  purchased_at: string | null;
  size_details: ItemSizeDetails | null;
  spec: Record<string, unknown> | null;
  is_rain_ok: boolean;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
};

export type PurchaseCandidateItemDraftResponse = {
  message: string;
  item_draft: PurchaseCandidateItemDraftPayload;
  candidate_summary: {
    id: number;
    status: PurchaseCandidateStatus;
    priority: PurchaseCandidatePriority;
    name: string;
    converted_item_id: number | null;
    converted_at: string | null;
  };
  images: PurchaseCandidateImageRecord[];
};

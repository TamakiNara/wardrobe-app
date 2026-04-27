import type {
  ItemMaterialRecord,
  ItemSheerness,
  ItemSizeDetails,
  ItemSpec,
} from "@/types/items";

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
  custom_label?: string | null;
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

export type PurchaseCandidateGroupCandidate = {
  id: number;
  status: PurchaseCandidateStatus;
  name: string;
  price: number | null;
  release_date?: string | null;
  sale_price: number | null;
  sale_ends_at?: string | null;
  discount_ends_at?: string | null;
  group_order: number | null;
  is_current: boolean;
  colors: PurchaseCandidateColor[];
};

export type PurchaseCandidateListItem = {
  id: number;
  status: PurchaseCandidateStatus;
  priority: PurchaseCandidatePriority;
  name: string;
  category_id: string;
  shape?: string | null;
  category_name: string | null;
  brand_name: string | null;
  price: number | null;
  release_date?: string | null;
  sale_price: number | null;
  sale_ends_at?: string | null;
  discount_ends_at?: string | null;
  purchase_url: string | null;
  group_id: number | null;
  group_order: number | null;
  colors: PurchaseCandidateColor[];
  converted_item_id: number | null;
  converted_at: string | null;
  primary_image: PurchaseCandidateImageRecord | null;
  images: PurchaseCandidateImageRecord[];
  updated_at: string | null;
};

export type PurchaseCandidateRecord = {
  id: number;
  status: PurchaseCandidateStatus;
  priority: PurchaseCandidatePriority;
  name: string;
  category_id: string;
  shape?: string | null;
  category_name: string | null;
  brand_name: string | null;
  price: number | null;
  release_date?: string | null;
  sale_price: number | null;
  sale_ends_at?: string | null;
  discount_ends_at?: string | null;
  purchase_url: string | null;
  memo: string | null;
  wanted_reason: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  size_details: ItemSizeDetails | null;
  alternate_size_label: string | null;
  alternate_size_note: string | null;
  alternate_size_details: ItemSizeDetails | null;
  spec: ItemSpec | null;
  is_rain_ok: boolean;
  sheerness?: ItemSheerness | null;
  group_id: number | null;
  group_order: number | null;
  group_candidates: PurchaseCandidateGroupCandidate[];
  converted_item_id: number | null;
  converted_at: string | null;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
  materials: ItemMaterialRecord[];
  images: PurchaseCandidateImageRecord[];
  created_at: string | null;
  updated_at: string | null;
};

export type PurchaseCandidateListEntry =
  | {
      type: "single";
      candidate: PurchaseCandidateListItem;
    }
  | {
      type: "group";
      group_id: number;
      representative_candidate_id: number | null;
      candidates: PurchaseCandidateListItem[];
    };

export type PurchaseCandidatesResponse = {
  purchaseCandidateEntries: PurchaseCandidateListEntry[];
  purchaseCandidates?: PurchaseCandidateListItem[];
  availableBrands?: string[];
  meta: {
    total: number;
    totalAll: number;
    per_page?: number;
    current_page?: number;
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
  shape?: string | null;
  variant_source_candidate_id?: number | null;
  brand_name: string | null;
  save_brand_as_candidate?: boolean;
  price: number | null;
  release_date?: string | null;
  sale_price: number | null;
  sale_ends_at?: string | null;
  discount_ends_at?: string | null;
  purchase_url: string | null;
  memo: string | null;
  wanted_reason: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  size_details: ItemSizeDetails | null;
  alternate_size_label: string | null;
  alternate_size_note: string | null;
  alternate_size_details: ItemSizeDetails | null;
  spec: ItemSpec | null;
  is_rain_ok: boolean;
  sheerness?: ItemSheerness | null;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
  materials?: ItemMaterialRecord[];
  duplicate_images?: {
    source_image_id: number;
    sort_order?: number;
    is_primary?: boolean;
  }[];
};

export type PurchaseCandidateMutationResponse = {
  message: string;
  purchaseCandidate: PurchaseCandidateRecord;
};

export type PurchaseCandidateDuplicateImageRecord =
  PurchaseCandidateImageRecord & {
    source_image_id: number;
  };

export type PurchaseCandidateDuplicatePayload = Omit<
  PurchaseCandidateUpsertPayload,
  "duplicate_images"
> & {
  images: PurchaseCandidateDuplicateImageRecord[];
};

export type PurchaseCandidateDuplicateResponse = {
  message: string;
  purchaseCandidate: PurchaseCandidateDuplicatePayload;
};

export type PurchaseCandidateColorVariantResponse = {
  message: string;
  purchaseCandidate: PurchaseCandidateDuplicatePayload;
};

export type PurchaseCandidateItemDraftPayload = {
  name: string;
  source_category_id: string;
  category: string;
  subcategory?: string | null;
  shape: string;
  brand_name: string | null;
  price: number | null;
  release_date?: string | null;
  sale_price?: number | null;
  sale_ends_at?: string | null;
  discount_ends_at?: string | null;
  purchase_url: string | null;
  memo: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  purchased_at: string | null;
  size_details: ItemSizeDetails | null;
  spec: ItemSpec | null;
  is_rain_ok: boolean;
  sheerness?: ItemSheerness | null;
  colors: PurchaseCandidateColor[];
  seasons: string[];
  tpos: string[];
  materials: ItemMaterialRecord[];
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

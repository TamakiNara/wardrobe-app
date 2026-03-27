export type ItemFormColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

export type ItemCareStatus = "in_cleaning";

export type TopsSpec = {
  shape: string;
  sleeve?: string | null;
  length?: string | null;
  neck?: string | null;
  design?: string | null;
  fit?: string | null;
};

export type ItemSpec = {
  tops?: TopsSpec | null;
};

export type ItemImageRecord = {
  id?: number;
  item_id?: number;
  disk: string | null;
  path: string | null;
  url?: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  sort_order: number;
  is_primary: boolean;
};

export type CreateItemPayload = {
  name: string;
  purchase_candidate_id?: number | null;
  care_status?: ItemCareStatus | null;
  brand_name: string | null;
  save_brand_as_candidate?: boolean;
  price: number | null;
  purchase_url: string | null;
  memo: string | null;
  purchased_at: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  size_details: {
    note: string | null;
  } | null;
  is_rain_ok: boolean;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
  spec?: ItemSpec | null;
  images: ItemImageRecord[];
};

export type ItemStatus = "active" | "disposed";

export type ItemRecord = {
  id: number;
  name: string | null;
  status: ItemStatus;
  care_status?: ItemCareStatus | null;
  brand_name?: string | null;
  price?: number | null;
  purchase_url?: string | null;
  memo?: string | null;
  purchased_at?: string | null;
  size_gender?: "women" | "men" | "unisex" | null;
  size_label?: string | null;
  size_note?: string | null;
  size_details?: {
    note?: string | null;
  } | null;
  is_rain_ok?: boolean;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
  spec?: ItemSpec | null;
  images?: ItemImageRecord[];
};

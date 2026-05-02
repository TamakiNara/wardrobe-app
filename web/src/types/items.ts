export type ItemFormColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
  custom_label?: string | null;
};

export type ItemCareStatus = "in_cleaning";
export type ItemSheerness = "none" | "slight" | "high";

export type TopsSpec = {
  sleeve?: string | null;
  length?: string | null;
  neck?: string | null;
  design?: string | null;
  fit?: string | null;
};

export type BottomsSpec = {
  length_type?: string | null;
  rise_type?: string | null;
};

export type SkirtSpec = {
  length_type?: string | null;
  material_type?: string | null;
  design_type?: string | null;
};

export type LegwearSpec = {
  coverage_type?: string | null;
};

export type StructuredSizeFieldName =
  | "shoulder_width"
  | "body_width"
  | "body_length"
  | "sleeve_length"
  | "sleeve_width"
  | "cuff_width"
  | "neck_circumference"
  | "waist"
  | "hip"
  | "rise"
  | "inseam"
  | "hem_width"
  | "thigh_width"
  | "total_length"
  | "skirt_length"
  | "underbust"
  | "top_bust"
  | "height"
  | "width"
  | "depth";

export type ItemSizeDetailValue = {
  value?: number | null;
  min?: number | null;
  max?: number | null;
  note?: string | null;
};

export type ItemStructuredSizeDetails = Partial<
  Record<StructuredSizeFieldName, ItemSizeDetailValue>
>;

export type ItemCustomSizeField = {
  label: string;
  value?: number | null;
  min?: number | null;
  max?: number | null;
  note?: string | null;
  sort_order: number;
};

export type ItemSizeDetails = {
  structured?: ItemStructuredSizeDetails;
  custom_fields?: ItemCustomSizeField[];
};

export type ItemSpec = {
  tops?: TopsSpec | null;
  bottoms?: BottomsSpec | null;
  skirt?: SkirtSpec | null;
  legwear?: LegwearSpec | null;
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

export type ItemMaterialRecord = {
  part_label: string;
  material_name: string;
  ratio: number;
};

export type CreateItemPayload = {
  name: string;
  purchase_candidate_id?: number | null;
  variant_source_item_id?: number | null;
  care_status?: ItemCareStatus | null;
  sheerness?: ItemSheerness | null;
  brand_name: string | null;
  save_brand_as_candidate?: boolean;
  price: number | null;
  purchase_url: string | null;
  memo: string | null;
  purchased_at: string | null;
  size_gender: "women" | "men" | "unisex" | null;
  size_label: string | null;
  size_note: string | null;
  size_details: ItemSizeDetails | null;
  is_rain_ok: boolean;
  category: string;
  subcategory?: string | null;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos?: string[];
  tpo_ids: number[];
  spec?: ItemSpec | null;
  materials?: ItemMaterialRecord[];
  images: ItemImageRecord[];
};

export type ItemStatus = "active" | "disposed";

export type ItemRecord = {
  id: number;
  group_id?: number | null;
  group_order?: number | null;
  name: string | null;
  status: ItemStatus;
  care_status?: ItemCareStatus | null;
  sheerness?: ItemSheerness | null;
  brand_name?: string | null;
  price?: number | null;
  purchase_url?: string | null;
  memo?: string | null;
  purchased_at?: string | null;
  size_gender?: "women" | "men" | "unisex" | null;
  size_label?: string | null;
  size_note?: string | null;
  size_details?: ItemSizeDetails | null;
  is_rain_ok?: boolean;
  category: string;
  subcategory?: string | null;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
  tpo_ids?: number[];
  spec?: ItemSpec | null;
  materials?: ItemMaterialRecord[];
  images?: ItemImageRecord[];
  group_items?: ItemGroupMemberRecord[];
};

export type ItemGroupMemberRecord = {
  id: number;
  group_order?: number | null;
  name: string | null;
  status: ItemStatus;
  category: string;
  subcategory?: string | null;
  shape: string;
  colors: ItemFormColor[];
  images?: ItemImageRecord[];
  is_current?: boolean;
};

export type ItemDuplicatePayload = Omit<
  CreateItemPayload,
  "purchase_candidate_id" | "care_status"
>;

export type ItemDuplicateResponse = {
  message: string;
  item: ItemDuplicatePayload;
};

export type ItemColorVariantResponse = {
  message: string;
  item: ItemDuplicatePayload;
};

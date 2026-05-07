export type ShoppingMemoStatus = "draft" | "closed";

export type ShoppingMemoGroupType = "domain" | "brand" | "uncategorized";

export type ShoppingMemoListItem = {
  id: number;
  name: string;
  memo: string | null;
  status: ShoppingMemoStatus;
  item_count: number;
  group_count: number;
  subtotal: number;
  has_price_unset: boolean;
  nearest_deadline: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ShoppingMemosListResponse = {
  shoppingMemos: ShoppingMemoListItem[];
};

export type ShoppingMemoCreateRequest = {
  name: string;
  memo?: string | null;
};

export type ShoppingMemoGroupItem = {
  shopping_memo_item_id: number;
  purchase_candidate_id: number;
  name: string;
  brand: string | null;
  purchase_url: string | null;
  status: string;
  price: number | null;
  sale_price: number | null;
  unit_price: number | null;
  quantity: number;
  line_total: number | null;
  is_total_included: boolean;
  sale_ends_at: string | null;
  discount_ends_at: string | null;
  memo: string | null;
  priority: string | null;
  sort_order: number;
};

export type ShoppingMemoGroup = {
  type: ShoppingMemoGroupType;
  key: string;
  display_name: string;
  subtotal: number;
  has_price_unset: boolean;
  nearest_deadline: string | null;
  items: ShoppingMemoGroupItem[];
};

export type ShoppingMemoDetail = ShoppingMemoListItem & {
  groups: ShoppingMemoGroup[];
};

export type ShoppingMemoMutationResponse = {
  message: string;
  shoppingMemo: ShoppingMemoListItem;
};

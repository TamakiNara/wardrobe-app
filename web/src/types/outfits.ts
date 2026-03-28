export type OutfitSelectedItem = {
  item_id: number;
  sort_order: number;
};

export type OutfitDuplicateItem = {
  item_id: number;
  sort_order: number;
  selectable: boolean;
  note: string | null;
};

export type OutfitDuplicatePayload = {
  name: string | null;
  memo: string | null;
  seasons: string[];
  tpos: string[];
  tpo_ids: number[];
  items: OutfitDuplicateItem[];
};

export type OutfitDuplicateResponse = {
  message: string;
  outfit: OutfitDuplicatePayload;
};

export type CreateOutfitPayload = {
  name: string;
  memo: string;
  seasons: string[];
  tpo_ids: number[];
  items: OutfitSelectedItem[];
};

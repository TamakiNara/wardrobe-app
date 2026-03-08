export type OutfitSelectedItem = {
  item_id: number;
  sort_order: number;
};

export type CreateOutfitPayload = {
  name: string;
  memo: string;
  seasons: string[];
  tpos: string[];
  items: OutfitSelectedItem[];
};

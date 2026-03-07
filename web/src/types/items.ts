export type ItemFormColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

export type CreateItemPayload = {
  name: string;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
};

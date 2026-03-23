export type ItemFormColor = {
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
};

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

export type CreateItemPayload = {
  name: string;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
  spec?: ItemSpec | null;
};

export type ItemStatus = "active" | "disposed";

export type ItemRecord = {
  id: number;
  name: string | null;
  status: ItemStatus;
  category: string;
  shape: string;
  colors: ItemFormColor[];
  seasons: string[];
  tpos: string[];
  spec?: ItemSpec | null;
};

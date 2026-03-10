export const TOPS_DESIGNS = [
  { value: "raglan", label: "ラグラン" },
] as const;

export type TopsDesignValue =
  (typeof TOPS_DESIGNS)[number]["value"];

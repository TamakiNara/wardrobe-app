export const TOPS_NECKS = [
  { value: "crew", label: "クルーネック" },
  { value: "v", label: "Vネック" },
  { value: "turtle", label: "タートルネック" },
  { value: "mock", label: "モックネック" },
] as const;

export type TopsNeckValue =
  (typeof TOPS_NECKS)[number]["value"];

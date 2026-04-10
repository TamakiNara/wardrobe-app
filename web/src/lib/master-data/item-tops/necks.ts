export const TOPS_NECKS = [
  { value: "crew", label: "クルーネック" },
  { value: "v", label: "Vネック" },
  { value: "square", label: "スクエアネック" },
  { value: "turtle", label: "タートルネック" },
  { value: "mock", label: "モックネック" },
  { value: "collar", label: "襟" },
] as const;

export type TopsNeckValue = (typeof TOPS_NECKS)[number]["value"];

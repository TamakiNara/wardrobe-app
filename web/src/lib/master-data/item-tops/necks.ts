export const TOPS_NECKS = [
  { value: "crew", label: "クルーネック" },
  { value: "v", label: "Vネック" },
  { value: "u", label: "Uネック" },
  { value: "square", label: "スクエアネック" },
  { value: "boat", label: "ボートネック" },
  { value: "henley", label: "ヘンリーネック" },
  { value: "highneck", label: "ハイネック" },
  { value: "camisole_neck", label: "キャミネック" },
  { value: "halter", label: "ホルターネック" },
  { value: "turtle", label: "タートルネック" },
  { value: "mock", label: "モックネック" },
  { value: "collar", label: "襟" },
] as const;

export type TopsNeckValue = (typeof TOPS_NECKS)[number]["value"];

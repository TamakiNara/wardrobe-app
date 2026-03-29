export const TOPS_LENGTHS = [
  { value: "short", label: "短め" },
  { value: "normal", label: "標準" },
  { value: "long", label: "長め" },
] as const;

export type TopsLengthValue = (typeof TOPS_LENGTHS)[number]["value"];

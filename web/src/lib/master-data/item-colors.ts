export const ITEM_COLOR_GROUPS = [
  { value: "basic", label: "ベーシックカラー" },
  { value: "vivid", label: "ビビッドカラー" },
  { value: "pale", label: "ペールカラー" },
  { value: "deep", label: "ディープカラー" },
  { value: "earth", label: "アースカラー" },
] as const;

export type ItemColorGroupValue = (typeof ITEM_COLOR_GROUPS)[number]["value"];

export const ITEM_COLORS = [
  { value: "white", label: "ホワイト", hex: "#ECECEC", group: "basic" },
  { value: "off_white", label: "オフホワイト", hex: "#F5F3EE", group: "basic" },
  { value: "gray", label: "グレー", hex: "#9AA0A6", group: "basic" },
  { value: "navy", label: "ネイビー", hex: "#2F4058", group: "basic" },
  { value: "black", label: "ブラック", hex: "#1F1F1F", group: "basic" },
  { value: "ivory", label: "アイボリー", hex: "#F1E8D8", group: "basic" },
  { value: "beige", label: "ベージュ", hex: "#D3C0A4", group: "basic" },
  { value: "greige", label: "グレージュ", hex: "#A79B8B", group: "basic" },
  { value: "mocha", label: "モカ", hex: "#8A6F5A", group: "basic" },
  { value: "brown", label: "ブラウン", hex: "#704E3E", group: "basic" },

  { value: "red", label: "レッド", hex: "#E53935", group: "vivid" },
  { value: "orange", label: "オレンジ", hex: "#FF8A00", group: "vivid" },
  { value: "yellow", label: "イエロー", hex: "#FFD400", group: "vivid" },
  { value: "lime", label: "ライム", hex: "#A8D61D", group: "vivid" },
  { value: "green", label: "グリーン", hex: "#00A65A", group: "vivid" },
  { value: "teal", label: "ティール", hex: "#00A7A0", group: "vivid" },
  { value: "blue", label: "ブルー", hex: "#0077D9", group: "vivid" },
  { value: "purple", label: "パープル", hex: "#7B3FE4", group: "vivid" },
  { value: "magenta", label: "マゼンタ", hex: "#C900A7", group: "vivid" },
  { value: "rose", label: "ローズ", hex: "#FF4F8B", group: "vivid" },

  { value: "pale_red", label: "ペールレッド", hex: "#F3C8C3", group: "pale" },
  { value: "peach", label: "ピーチ", hex: "#F5D7C7", group: "pale" },
  {
    value: "pale_yellow",
    label: "ペールイエロー",
    hex: "#F6EDB8",
    group: "pale",
  },
  { value: "pistachio", label: "ピスタチオ", hex: "#E1E9C8", group: "pale" },
  { value: "mint", label: "ミント", hex: "#D6EADF", group: "pale" },
  { value: "sky", label: "スカイ", hex: "#DDECF8", group: "pale" },
  { value: "pale_blue", label: "ペールブルー", hex: "#D7E7F4", group: "pale" },
  {
    value: "powder_gray",
    label: "パウダーグレー",
    hex: "#E3E7EC",
    group: "pale",
  },
  { value: "lavender", label: "ラベンダー", hex: "#DDD2F0", group: "pale" },
  { value: "pale_pink", label: "ペールピンク", hex: "#F2D0D8", group: "pale" },

  { value: "copper", label: "カッパー", hex: "#8A4E2D", group: "deep" },
  { value: "wine", label: "ワイン", hex: "#7A233A", group: "deep" },
  { value: "bordeaux", label: "ボルドー", hex: "#6E2F42", group: "deep" },
  { value: "plum", label: "プラム", hex: "#5B375E", group: "deep" },
  {
    value: "deep_purple",
    label: "ディープパープル",
    hex: "#4F3E68",
    group: "deep",
  },
  { value: "midnight", label: "ミッドナイト", hex: "#24324A", group: "deep" },
  {
    value: "deep_blue",
    label: "ディープブルー",
    hex: "#2D4F7C",
    group: "deep",
  },
  {
    value: "deep_teal",
    label: "ディープティール",
    hex: "#1F5C63",
    group: "deep",
  },
  {
    value: "deep_green",
    label: "ディープグリーン",
    hex: "#2F5D46",
    group: "deep",
  },
  { value: "forest", label: "フォレスト", hex: "#43522A", group: "deep" },

  { value: "terracotta", label: "テラコッタ", hex: "#B96F4E", group: "earth" },
  { value: "rust", label: "ラスト", hex: "#A8563A", group: "earth" },
  { value: "camel", label: "キャメル", hex: "#B98B58", group: "earth" },
  { value: "mustard", label: "マスタード", hex: "#B6923E", group: "earth" },
  { value: "sand", label: "サンド", hex: "#D2BE98", group: "earth" },
  { value: "khaki", label: "カーキ", hex: "#8B8A5A", group: "earth" },
  { value: "moss", label: "モス", hex: "#4F6B3B", group: "earth" },
  { value: "olive", label: "オリーブ", hex: "#66714A", group: "earth" },
  {
    value: "slate_blue",
    label: "スレートブルー",
    hex: "#61758C",
    group: "earth",
  },
  { value: "cocoa", label: "ココア", hex: "#6D4C41", group: "earth" },
] as const;

export const ITEM_COLORS_BY_GROUP = ITEM_COLOR_GROUPS.map((group) => ({
  ...group,
  colors: ITEM_COLORS.filter((color) => color.group === group.value),
}));

export type ItemColorValue = (typeof ITEM_COLORS)[number]["value"];

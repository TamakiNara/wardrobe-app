export type ForecastAreaOption = {
  code: string;
  label: string;
  prefecture: string;
};

export const FORECAST_AREA_OPTIONS: readonly ForecastAreaOption[] = [
  { code: "011000", label: "稚内", prefecture: "北海道" },
  { code: "012010", label: "旭川", prefecture: "北海道" },
  { code: "012020", label: "留萌", prefecture: "北海道" },
  { code: "013010", label: "網走", prefecture: "北海道" },
  { code: "013020", label: "北見", prefecture: "北海道" },
  { code: "013030", label: "紋別", prefecture: "北海道" },
  { code: "014010", label: "根室", prefecture: "北海道" },
  { code: "014020", label: "釧路", prefecture: "北海道" },
  { code: "014030", label: "帯広", prefecture: "北海道" },
  { code: "015010", label: "室蘭", prefecture: "北海道" },
  { code: "015020", label: "浦河", prefecture: "北海道" },
  { code: "016010", label: "札幌", prefecture: "北海道" },
  { code: "016020", label: "岩見沢", prefecture: "北海道" },
  { code: "016030", label: "倶知安", prefecture: "北海道" },
  { code: "017010", label: "函館", prefecture: "北海道" },
  { code: "017020", label: "江差", prefecture: "北海道" },
  { code: "020010", label: "青森", prefecture: "青森県" },
  { code: "020020", label: "むつ", prefecture: "青森県" },
  { code: "020030", label: "八戸", prefecture: "青森県" },
  { code: "030010", label: "盛岡", prefecture: "岩手県" },
  { code: "030020", label: "宮古", prefecture: "岩手県" },
  { code: "030030", label: "大船渡", prefecture: "岩手県" },
  { code: "040010", label: "仙台", prefecture: "宮城県" },
  { code: "040020", label: "白石", prefecture: "宮城県" },
  { code: "050010", label: "秋田", prefecture: "秋田県" },
  { code: "050020", label: "横手", prefecture: "秋田県" },
  { code: "060010", label: "山形", prefecture: "山形県" },
  { code: "060020", label: "米沢", prefecture: "山形県" },
  { code: "060030", label: "酒田", prefecture: "山形県" },
  { code: "060040", label: "新庄", prefecture: "山形県" },
  { code: "070010", label: "福島", prefecture: "福島県" },
  { code: "070020", label: "小名浜", prefecture: "福島県" },
  { code: "070030", label: "若松", prefecture: "福島県" },
  { code: "080010", label: "水戸", prefecture: "茨城県" },
  { code: "080020", label: "土浦", prefecture: "茨城県" },
  { code: "090010", label: "宇都宮", prefecture: "栃木県" },
  { code: "090020", label: "大田原", prefecture: "栃木県" },
  { code: "100010", label: "前橋", prefecture: "群馬県" },
  { code: "100020", label: "みなかみ", prefecture: "群馬県" },
  { code: "110010", label: "さいたま", prefecture: "埼玉県" },
  { code: "110020", label: "熊谷", prefecture: "埼玉県" },
  { code: "110030", label: "秩父", prefecture: "埼玉県" },
  { code: "120010", label: "千葉", prefecture: "千葉県" },
  { code: "120020", label: "銚子", prefecture: "千葉県" },
  { code: "120030", label: "館山", prefecture: "千葉県" },
  { code: "130010", label: "東京", prefecture: "東京都" },
  { code: "130020", label: "大島", prefecture: "東京都" },
  { code: "130030", label: "八丈島", prefecture: "東京都" },
  { code: "130040", label: "父島", prefecture: "東京都" },
  { code: "140010", label: "横浜", prefecture: "神奈川県" },
  { code: "140020", label: "小田原", prefecture: "神奈川県" },
  { code: "150010", label: "新潟", prefecture: "新潟県" },
  { code: "150020", label: "長岡", prefecture: "新潟県" },
  { code: "150030", label: "高田", prefecture: "新潟県" },
  { code: "150040", label: "相川", prefecture: "新潟県" },
  { code: "160010", label: "富山", prefecture: "富山県" },
  { code: "160020", label: "伏木", prefecture: "富山県" },
  { code: "170010", label: "金沢", prefecture: "石川県" },
  { code: "170020", label: "輪島", prefecture: "石川県" },
  { code: "180010", label: "福井", prefecture: "福井県" },
  { code: "180020", label: "敦賀", prefecture: "福井県" },
  { code: "190010", label: "甲府", prefecture: "山梨県" },
  { code: "190020", label: "河口湖", prefecture: "山梨県" },
  { code: "200010", label: "長野", prefecture: "長野県" },
  { code: "200020", label: "松本", prefecture: "長野県" },
  { code: "200030", label: "飯田", prefecture: "長野県" },
  { code: "210010", label: "岐阜", prefecture: "岐阜県" },
  { code: "210020", label: "高山", prefecture: "岐阜県" },
  { code: "220010", label: "静岡", prefecture: "静岡県" },
  { code: "220020", label: "網代", prefecture: "静岡県" },
  { code: "220030", label: "三島", prefecture: "静岡県" },
  { code: "220040", label: "浜松", prefecture: "静岡県" },
  { code: "230010", label: "名古屋", prefecture: "愛知県" },
  { code: "230020", label: "豊橋", prefecture: "愛知県" },
  { code: "240010", label: "津", prefecture: "三重県" },
  { code: "240020", label: "尾鷲", prefecture: "三重県" },
  { code: "250010", label: "大津", prefecture: "滋賀県" },
  { code: "250020", label: "彦根", prefecture: "滋賀県" },
  { code: "260010", label: "京都", prefecture: "京都府" },
  { code: "260020", label: "舞鶴", prefecture: "京都府" },
  { code: "270000", label: "大阪", prefecture: "大阪府" },
  { code: "280010", label: "神戸", prefecture: "兵庫県" },
  { code: "280020", label: "豊岡", prefecture: "兵庫県" },
  { code: "290010", label: "奈良", prefecture: "奈良県" },
  { code: "290020", label: "風屋", prefecture: "奈良県" },
  { code: "300010", label: "和歌山", prefecture: "和歌山県" },
  { code: "300020", label: "潮岬", prefecture: "和歌山県" },
  { code: "310010", label: "鳥取", prefecture: "鳥取県" },
  { code: "310020", label: "米子", prefecture: "鳥取県" },
  { code: "320010", label: "松江", prefecture: "島根県" },
  { code: "320020", label: "浜田", prefecture: "島根県" },
  { code: "320030", label: "西郷", prefecture: "島根県" },
  { code: "330010", label: "岡山", prefecture: "岡山県" },
  { code: "330020", label: "津山", prefecture: "岡山県" },
  { code: "340010", label: "広島", prefecture: "広島県" },
  { code: "340020", label: "庄原", prefecture: "広島県" },
  { code: "350010", label: "下関", prefecture: "山口県" },
  { code: "350020", label: "山口", prefecture: "山口県" },
  { code: "350030", label: "柳井", prefecture: "山口県" },
  { code: "350040", label: "萩", prefecture: "山口県" },
  { code: "360010", label: "徳島", prefecture: "徳島県" },
  { code: "360020", label: "日和佐", prefecture: "徳島県" },
  { code: "370000", label: "高松", prefecture: "香川県" },
  { code: "380010", label: "松山", prefecture: "愛媛県" },
  { code: "380020", label: "新居浜", prefecture: "愛媛県" },
  { code: "380030", label: "宇和島", prefecture: "愛媛県" },
  { code: "390010", label: "高知", prefecture: "高知県" },
  { code: "390020", label: "室戸岬", prefecture: "高知県" },
  { code: "390030", label: "清水", prefecture: "高知県" },
  { code: "400010", label: "福岡", prefecture: "福岡県" },
  { code: "400020", label: "八幡", prefecture: "福岡県" },
  { code: "400030", label: "飯塚", prefecture: "福岡県" },
  { code: "400040", label: "久留米", prefecture: "福岡県" },
  { code: "410010", label: "佐賀", prefecture: "佐賀県" },
  { code: "410020", label: "伊万里", prefecture: "佐賀県" },
  { code: "420010", label: "長崎", prefecture: "長崎県" },
  { code: "420020", label: "佐世保", prefecture: "長崎県" },
  { code: "420030", label: "厳原", prefecture: "長崎県" },
  { code: "420040", label: "福江", prefecture: "長崎県" },
  { code: "430010", label: "熊本", prefecture: "熊本県" },
  { code: "430020", label: "阿蘇乙姫", prefecture: "熊本県" },
  { code: "430030", label: "牛深", prefecture: "熊本県" },
  { code: "430040", label: "人吉", prefecture: "熊本県" },
  { code: "440010", label: "大分", prefecture: "大分県" },
  { code: "440020", label: "中津", prefecture: "大分県" },
  { code: "440030", label: "日田", prefecture: "大分県" },
  { code: "440040", label: "佐伯", prefecture: "大分県" },
  { code: "450010", label: "宮崎", prefecture: "宮崎県" },
  { code: "450020", label: "延岡", prefecture: "宮崎県" },
  { code: "450030", label: "都城", prefecture: "宮崎県" },
  { code: "450040", label: "高千穂", prefecture: "宮崎県" },
  { code: "460010", label: "鹿児島", prefecture: "鹿児島県" },
  { code: "460020", label: "鹿屋", prefecture: "鹿児島県" },
  { code: "460030", label: "種子島", prefecture: "鹿児島県" },
  { code: "460040", label: "名瀬", prefecture: "鹿児島県" },
  { code: "471010", label: "那覇", prefecture: "沖縄県" },
  { code: "471020", label: "名護", prefecture: "沖縄県" },
  { code: "471030", label: "久米島", prefecture: "沖縄県" },
  { code: "472000", label: "南大東", prefecture: "沖縄県" },
  { code: "473000", label: "宮古島", prefecture: "沖縄県" },
  { code: "474010", label: "石垣島", prefecture: "沖縄県" },
  { code: "474020", label: "与那国島", prefecture: "沖縄県" },
] as const;

export function findForecastAreaByCode(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  return FORECAST_AREA_OPTIONS.find((area) => area.code === code) ?? null;
}

export function formatForecastAreaOptionLabel(
  area: ForecastAreaOption,
  includeCode = true,
) {
  return includeCode ? `${area.label}（${area.code}）` : area.label;
}

export function buildForecastAreaOptionsWithFallback(
  codes: Array<string | null | undefined>,
): ForecastAreaOption[] {
  const options = [...FORECAST_AREA_OPTIONS];
  const seen = new Set(options.map((area) => area.code));

  for (const code of codes) {
    if (!code || seen.has(code)) {
      continue;
    }

    options.push({
      code,
      label: "設定済みのコード",
      prefecture: "その他",
    });
    seen.add(code);
  }

  return options;
}

export function groupForecastAreasByPrefecture(
  options: readonly ForecastAreaOption[],
) {
  const groups = new Map<string, ForecastAreaOption[]>();

  for (const option of options) {
    const current = groups.get(option.prefecture) ?? [];
    current.push(option);
    groups.set(option.prefecture, current);
  }

  return Array.from(groups.entries()).map(([prefecture, areas]) => ({
    prefecture,
    areas,
  }));
}

# Item Spec: Tops

## 概要

トップスは、通常の item 情報に加えて `spec.tops` を持てます。
現在の実装では以下の 6 項目を扱います。

- `shape`
- `sleeve`
- `length`
- `neck`
- `design`
- `fit`

この spec は次の用途で使います。

- 新規作成画面の入力
- 編集画面での再編集
- 詳細画面での仕様表示
- 一覧画面 / 詳細画面での SVG プレビュー

---

## データ構造

```ts
type TopsSpec = {
  shape: string;
  sleeve?: string | null;
  length?: string | null;
  neck?: string | null;
  design?: string | null;
  fit?: string | null;
};
```

`items.spec` 全体は次の形を想定します。

```ts
type ItemSpec = {
  tops?: TopsSpec | null;
};
```

### 例

```json
{
  "tops": {
    "shape": "tshirt",
    "sleeve": "short",
    "length": "normal",
    "neck": "crew",
    "design": "raglan",
    "fit": "normal"
  }
}
```

---

## 各属性

### shape

トップスのベース形状です。

許可値:

- `tshirt`
- `shirt`
- `blouse`
- `polo`
- `sweatshirt`
- `hoodie`
- `knit`
- `cardigan`
- `vest`
- `camisole`
- `tanktop`

備考:

- SVG 表示では shape を起点にベース形状を切り替えます
- 現在は `tshirt / shirt / blouse / polo / sweatshirt / hoodie / knit / cardigan / vest / camisole / tanktop` の SVG プレビューと shape 連動に対応しています
- 現行実装では `spec.tops.shape` に種類名を持っていますが、カテゴリ再編の方針としては、種類名として定着しているものは中分類へ寄せ、`spec` 側は首元・袖・fit・丈などの補助属性へ整理していく前提です

### sleeve

袖の種類です。

許可値:

- `short`
- `five`
- `seven`
- `long`
- `sleeveless`
- `french`
- `camisole`

意味:

- `short`: 半袖
- `five`: 五分袖
- `seven`: 七分袖
- `long`: 長袖
- `sleeveless`: ノースリーブ
- `french`: フレンチスリーブ
- `camisole`: キャミソール肩紐

### length

丈の種類です。

許可値:

- `short`
- `normal`
- `long`

意味:

- `short`: 短め / クロップド寄り
- `normal`: 標準丈
- `long`: 長め

### neck

首元の種類です。

許可値:

- `crew`
- `v`
- `u`
- `square`
- `boat`
- `henley`
- `highneck`
- `camisole_neck`
- `halter`
- `turtleneck`
- `mockneck`
- `turtle`
- `mock`
- `collar`

意味:

- `crew`: クルーネック
- `v`: V ネック
- `u`: Uネック
- `square`: スクエアネック
- `boat`: ボートネック
- `henley`: ヘンリーネック
- `highneck`: ハイネック
- `camisole_neck`: キャミネック
- `halter`: ホルターネック
- `turtleneck`: タートルネック
- `mockneck`: モックネック
- `turtle`: タートルネック (旧値)
- `mock`: モックネック (旧値)
- `collar`: 襟
- `square`: スクエアネック
- `turtle`: タートルネック
- `mock`: モックネック
- `collar`: 襟

### design

追加デザインです。

現状の item 入力 UI では、候補が 1 つのみのため `design` は表示していません。
データ構造としては `raglan` を保持できます。
### fit

シルエットです。

許可値:

- `normal`
- `oversized`

意味:

- `normal`: 標準シルエット
- `oversized`: オーバーサイズ

デフォルト:

- 未指定時は `normal`

---

## shape ごとの許可組み合わせ

実装上は `TOPS_RULES` で shape ごとの許可値を定義しています。
UI ではこのルールに従って選択肢を絞り込みます。

代表例:

### tshirt

- sleeve: `short` `five` `seven` `long` `sleeveless` `french`
- length: `short` `normal` `long`
- neck: `crew` `v` `u` `square` `boat` `henley` `turtle` `mock`
- fit: `normal` `oversized`
- design: UI では非表示

### shirt / blouse / polo

- shirt length: `short` `normal` `long`
- shirt neck: `collar` `crew` `v`
- blouse neck: `collar` `crew` `v` `mock` `square`
- polo sleeve: `short` `five` `seven` `long`
- polo length: `short` `normal` `long`
- polo neck: `collar`
- shirt / blouse / polo は `collar` を既定値として扱う

### sweatshirt / hoodie / vest

- sweatshirt shape は `sweatshirt` を使い、sleeve / length は `short` を含む
- hoodie shape は `hoodie` を使い、sleeve / length は `short` を含む / `sleeveless` も選べるが neck は選択しない
- vest shape は `vest` を使い、sleeve は選択しない / neck は `crew` `v` `boat` `turtle`

### camisole / tanktop

- camisole neck: `camisole_neck` `square` `v` `halter`
- camisole の既定 neck は `camisole_neck`
- tanktop neck: `crew` `square` `highneck` `mock` `boat` `u` `v` `halter`
- camisole / tanktop とも sleeve は選択しない
- tanktop fit はデータ保持のまま UI では非表示
- camisole の既定 neck は `camisole_neck`
- tanktop neck: `crew` `square` `highneck` `mock` `boat` `u` `v` `halter`
- camisole / tanktop とも sleeve は選択しない
- tanktop fit はデータ保持のまま UI では非表示
- design: UI では非表示

### shirt / blouse / polo

- shirt neck: `collar` `crew` `v`
- blouse neck: `collar` `crew` `v` `mock` `square`
- polo neck: `collar` `crew`
- shirt / blouse / polo は `collar` を既定値として扱う

### sweatshirt / hoodie / vest

- sweatshirt shape は `sweatshirt` を使う
- hoodie shape は `hoodie` を使い、neck は選択しない
- vest shape は `vest` を使い、sleeve は選択しない

### camisole / tanktop

- camisole は neck を未選択から選べる
- tanktop neck は `crew` `square` を使い、`v` は含めない
- camisole / tanktop とも sleeve は選択しない

---

## 現状の実装メモ

- 保存先は `items.spec` JSON
- フロント型は `web/src/types/items.ts`
- master-data は `web/src/lib/master-data/item-tops/`
- 入力 UI は `web/src/app/items/new/page.tsx` と `web/src/app/items/[id]/edit/page.tsx`
- プレビューは `web/src/components/items/item-preview-card.tsx` と `web/src/components/items/preview-svg/`
- 表示ラベル共通化は `web/src/lib/master-data/item-tops/display.ts` で対応済み

今後の拡張候補:

- tops SVG の形状差分をさらに細かくする
- 一覧カードに tops 仕様の要約表示を出すか検討する
- OpenAPI への `spec.tops` 反映

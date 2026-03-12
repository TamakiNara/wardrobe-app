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
- `knit`
- `cardigan`
- `camisole`
- `tanktop`

備考:

- SVG 表示では shape を起点にベース形状を切り替えます
- 現状で SVG 実装が進んでいるのは `tshirt` が中心です

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
- `turtle`
- `mock`

意味:

- `crew`: クルーネック
- `v`: V ネック
- `turtle`: タートルネック
- `mock`: モックネック

### design

追加デザインです。

許可値:

- `raglan`

意味:

- `raglan`: ラグランスリーブ

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
- neck: `crew` `v` `mock`
- fit: `normal` `oversized`
- design: `raglan`

### shirt

- sleeve: `short` `five` `seven` `long`
- length: `normal` `long`
- neck: `crew` `v`
- fit: `normal` `oversized`
- design: なし

### camisole / tanktop

- sleeve は肩紐系のみ、または sleeve 選択肢が強く制限される
- neck / design は shape に応じて制約される

---

## 現状の実装メモ

- 保存先は `items.spec` JSON
- フロント型は `web/src/types/items.ts`
- master-data は `web/src/lib/master-data/item-tops/`
- 入力 UI は `web/src/app/items/new/page.tsx` と `web/src/app/items/[id]/edit/page.tsx`
- プレビューは `web/src/components/items/item-preview-card.tsx` と `web/src/components/items/preview-svg/`

今後の拡張候補:

- `shirt` / `blouse` / `knit` などの SVG 実装拡張
- 表示ラベルと保存値のマッピング整理
- OpenAPI への `spec.tops` 反映
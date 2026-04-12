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
- `tops + other` の shape はドメイン上は「未指定」として扱います
- 現在は DB の `items.shape` が non-nullable のため、保存時は `""` を使っています
- `""` は正規の shape 値ではなく、未指定を表す暫定的な保存表現です

### sleeve

袖の種類です。

許可値:

- `short`
- `five`
- `seven`
- `long`
- `sleeveless`
- `french`

意味:

- `short`: 半袖
- `five`: 五分袖
- `seven`: 七分袖
- `long`: 長袖
- `sleeveless`: ノースリーブ
- `french`: フレンチスリーブ

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
- `camisole_neck`: キャミソールネック
- `halter`: ホルターネック
- `turtle`: タートルネック
- `mock`: モックネック
- `collar`: 襟


### design

追加デザインです。

- データ構造としては `raglan` を保持できます
- 現状の item 入力 UI では、候補が 1 つのみのため `design` は表示していません

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

実装上は `TOPS_RULES` を正本とします。
UI ではこのルールに従って選択肢を絞り込み、候補が 1 件以下の項目は表示しません。

### tshirt

- sleeve: `short` `five` `seven` `long` `sleeveless` `french`
- length: `short` `normal` `long`
- neck: `crew` `v` `u` `square` `boat` `henley` `turtle` `mock`
- fit: `normal` `oversized`
- defaults: sleeve=`short` length=`normal` neck=`crew` fit=`normal`
- design: UI では非表示

### shirt

- sleeve: `short` `five` `seven` `long`
- length: `short` `normal` `long`
- neck: `collar` `crew` `v`
- fit: `normal` `oversized`
- defaults: sleeve=`long` length=`normal` neck=`collar` fit=`normal`
- design: UI では非表示

### blouse

- sleeve: `short` `five` `seven` `long` `sleeveless` `french`
- length: `short` `normal` `long`
- neck: `collar` `crew` `v` `mock` `square`
- fit: `normal` `oversized`
- defaults: sleeve=`short` length=`normal` neck=`collar` fit=`normal`
- design: UI では非表示

### polo

- sleeve: `short` `five` `seven` `long`
- length: `short` `normal` `long`
- neck: `collar`
- fit: `normal`
- defaults: sleeve=`short` length=`normal` neck=`collar` fit=`normal`
- design: UI では非表示

### sweatshirt

- sleeve: `short` `five` `seven` `long`
- length: `short` `normal` `long`
- neck: `crew`
- fit: `normal` `oversized`
- defaults: sleeve=`long` length=`normal` neck=`crew` fit=`normal`
- design: UI では非表示

### hoodie

- sleeve: `short` `five` `seven` `long` `sleeveless`
- length: `short` `normal` `long`
- neck: なし
- fit: `normal` `oversized`
- defaults: sleeve=`long` length=`normal` fit=`normal`
- design: UI では非表示

### knit

- sleeve: `short` `five` `seven` `long` `sleeveless`
- length: `short` `normal` `long`
- neck: `crew` `v` `square` `turtle` `mock`
- fit: `normal` `oversized`
- defaults: sleeve=`long` length=`normal` neck=`crew` fit=`normal`
- design: UI では非表示

### cardigan

- sleeve: `short` `seven` `long`
- length: `short` `normal` `long`
- neck: `v` `crew`
- fit: `normal` `oversized`
- defaults: sleeve=`long` length=`normal` neck=`v` fit=`normal`
- design: UI では非表示

### vest

- sleeve: なし
- length: `short` `normal` `long`
- neck: `crew` `v` `boat` `turtle`
- fit: `normal` `oversized`
- defaults: length=`normal` neck=`crew` fit=`normal`
- design: UI では非表示

### camisole

- sleeve: なし
- length: `short` `normal` `long`
- neck: `camisole_neck` `square` `v` `halter`
- fit: `normal`
- defaults: length=`normal` neck=`camisole_neck` fit=`normal`
- design: UI では非表示

### tanktop

- sleeve: なし
- length: `short` `normal` `long`
- neck: `crew` `square` `highneck` `mock` `boat` `u` `v` `halter`
- fit: `normal` `oversized`
- defaults: length=`normal` neck=`crew` fit=`normal`
- fit はデータ保持のまま UI では非表示
- design: UI では非表示

---

### 未指定 shape の扱い

- frontend では `web/src/lib/items/item-shape.ts` の `isBlankItemShape()` / `normalizeItemShapeValue()` で空文字を未指定として扱います
- backend では `api/app/Support/ItemInputRequirementSupport.php` の `normalizeShape()` が空文字を `null` に正規化し、`tops + other` の保存時だけ暂定表現として `""` を返します
- 一覧系では `api/app/Support/ListQuerySupport.php` が falsy な shape を未指定として扱います
- read model では `web/src/lib/items/current-item-read-model.ts` が blank shape を未指定として扱い、`tops + other` は subcategory から復元します

### 将来の検討事項

- `items.shape` カラムの nullable 化
- 未指定の表現を `null` または未送信に統一するかの再検討
- backend / read model / validation を含めた未指定の正式扱いの整理
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

## TODO（直近課題）

### 仕様検討
- `tops + other` の shape 未指定を `""` で持つ現状をどうするか（`nullable` / `null` 統一検討）

### UI / 文言改善
- 特になし（現時点では大きな違和感は解消済み）

### 技術的負債 / 将来対応
- 旧 `turtleneck / mockneck` を今後完全に無視してよいか
- read model で tops spec（特に neck）を個別正規化しない構造のままでよいか
- edit 初期復元を直接保証するテストを追加するか


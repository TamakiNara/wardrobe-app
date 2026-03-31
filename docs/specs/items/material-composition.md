# 素材・混率管理 仕様メモ

## 目的

item に対して、素材と混率を扱えるようにする。  
単一文字列ではなく、後続の表示・引き継ぎ・将来拡張に耐えやすいよう、複数明細で管理する。

本メモは、素材・混率管理の最小仕様を整理するものであり、候補管理画面・検索・分析などの後続機能は対象外とする。

---

## 関連資料

- 優先順位と planning は `docs/specs/planning/next-features.md` を参照する
- item / purchase candidate の保存方針は `docs/data/database.md` を参照する
- current API schema は `docs/api/openapi.yaml` を参照し、materials 反映は実装タイミングで判断する
- purchase candidate 側の仕様正本は `docs/specs/purchase-candidates.md` を参照する
- current 実装メモは `docs/project/implementation-notes.md` を参照する

---

## 結論

- 素材入力は任意とする
- item は複数の素材明細を持てる
- 各明細は `区分 / 素材名 / 混率` を持つ
- 保存正本は明細構造とする
- DB は明細テーブル前提とする
- 混率は整数のみとする
- **区分ごとに合計 100% 必須** とする
- **同一区分内で同素材重複不可** とする
- 区分はデフォルト候補 + 自由入力とする
- 素材名は共通候補 + 自由入力とする
- item 作成 / 編集で入力し、詳細画面で表示する
- item 一覧には表示しない
- purchase candidate にも同じ構造を持たせ、item 化時に引き継ぐ

---

## 対象範囲

このメモで扱う対象:

- item の素材・混率入力
- item 詳細での素材表示
- purchase candidate 側への横展開前提
- item 化時の素材引き継ぎ方針
- API / DB / バリデーションの最小方針

このメモで扱わない対象:

- 素材候補の settings 管理
- 検索条件への追加
- 分析・可視化
- 素材マスタ化
- 同義語吸収
- 小数混率
- 品質表示全文保存

---

## 用語

### 区分
素材明細のまとまりを表す単位。  
例: `本体`, `裏地`, `別布`, `リブ`

### 素材明細
1 件の素材情報。  
`区分 / 素材名 / 混率` の 3 要素を持つ。

### 混率
素材の割合。  
整数値のみを扱う。

---

## 画面仕様

### 入力画面

対象画面:

- item 作成
- item 編集

素材セクションで、複数行の素材明細を入力できるようにする。

各行の入力項目:

- 区分
- 素材名
- 混率

### 区分入力

区分は、以下のデフォルト候補を選択できるようにする。

- 本体
- 裏地
- 別布
- リブ

加えて、自由入力も許可する。

方針:

- `その他` は置かない
- 候補にないものは自由入力で対応する

### 素材名入力

素材名は、主要素材の候補を選択できるようにする。  
加えて、自由入力も許可する。

初期候補例:

- 綿
- ポリエステル
- レーヨン
- ナイロン
- アクリル
- 毛
- ポリウレタン
- 麻
- 再生繊維
- 合成皮革

候補は入力補助であり、保存正本ではない。  
候補にない素材は自由入力で保存できるようにする。

### 混率入力

- 整数のみ
- 1 以上 100 以下
- 区分ごとに合計 100 であること

### 行追加・削除

- 素材明細は複数行追加できる
- 不要な行は削除できる
- 空行は保存前に除去する

---

## 表示仕様

対象画面:

- item 詳細

表示方針:

- 区分ごとにまとめて表示する
- item 一覧には表示しない
- item 作成 / 編集では入力 UI を表示する
- item 詳細では表示のみとする

表示例:

- 本体: 綿 80%、ポリエステル 20%
- 裏地: ポリエステル 100%

### 表示順

#### 区分順

1. 本体
2. 裏地
3. 別布
4. リブ
5. 自由入力区分（名前順）

#### 区分内の並び順

- `ratio desc`
- 同率の場合は `material_name asc`

`sort_order` は持たない。

---

## バリデーション方針

### 基本

- 素材入力自体は任意
- `materials` 未指定または空配列は許可
- 素材明細を送る場合は、1 行ごとに必要項目をすべて持つこと

### 1 行ごとの必須項目

- `part_label`
- `material_name`
- `ratio`

### 混率

- 整数のみ
- 1 以上 100 以下

### 合計ルール

- **区分ごとに合計 100% 必須**

例:

- 本体: 綿 80 / ポリエステル 20 → 可
- 裏地: ポリエステル 100 → 可
- 本体: 綿 70 / ポリエステル 20 → 不可

### 重複ルール

- **同一区分内で同素材重複不可**
- 区分が異なれば同素材は可

例:

- 本体: 綿 50 / 綿 50 → 不可
- 本体: 綿 100 / 裏地: 綿 100 → 可

### 空行

- frontend で除去する
- backend でも空明細は不正として扱う

---

## API 方針

### 基本

item と purchase candidate で、同じ構造を使う前提とする。  
これにより、purchase candidate から item 化する際の引き継ぎを単純にできるようにする。

### request / response の形

```json
{
  "materials": [
    {
      "part_label": "本体",
      "material_name": "綿",
      "ratio": 80
    },
    {
      "part_label": "本体",
      "material_name": "ポリエステル",
      "ratio": 20
    },
    {
      "part_label": "裏地",
      "material_name": "ポリエステル",
      "ratio": 100
    }
  ]
}
```

### API キー名

- `materials`
- `part_label`
- `material_name`
- `ratio`

### API 方針補足

- `materials` は任意
- 未入力時は `[]` を許可
- 単一文字列ではなく、**明細配列を正本**とする
- purchase candidate でも同じ key 名を使う

---

## DB 方針

### item 側

テーブル案:

### `item_materials`

- `id`
- `item_id`
- `part_label`
- `material_name`
- `ratio`
- `created_at`
- `updated_at`

方針:

- 1 item : N item_materials
- `part_label` は文字列で保存
- `material_name` は文字列で保存
- 素材マスタ FK は持たない
- `sort_order` は持たない

### purchase candidate 側

テーブル案:

### `purchase_candidate_materials`

- `id`
- `purchase_candidate_id`
- `part_label`
- `material_name`
- `ratio`
- `created_at`
- `updated_at`

方針:

- item 側と同じ構造を基本とする
- item 化時に素材明細を引き継げるようにする
- candidate と item は別テーブルで管理する

---

## 候補データの考え方

### 区分候補

デフォルト候補:

- 本体
- 裏地
- 別布
- リブ

方針:

- 候補は入力補助
- 自由入力可
- current では settings 管理しない
- 保存正本は文字列

### 素材候補

初期候補例:

- 綿
- ポリエステル
- レーヨン
- ナイロン
- アクリル
- 毛
- ポリウレタン
- 麻
- 再生繊維
- 合成皮革

方針:

- 候補は入力補助
- 自由入力可
- current では settings 管理しない
- 保存正本は文字列

---

## purchase candidate との関係

- purchase candidate にも同じ素材・混率構造を持たせる
- purchase candidate の item 化時に、素材明細を item へ引き継ぐ
- item 側と candidate 側で API shape は揃える
- item と candidate は別テーブル管理とする

---

## テスト観点

### 正常系

- 素材未入力で item 保存可
- 本体のみ 100% で保存可
- 本体 + 裏地で、各区分 100% なら保存可
- 自由入力区分で保存可
- 自由入力素材で保存可
- purchase candidate → item で素材明細を引き継げる

### 異常系

- 区分内合計が 100 でない
- 同一区分内で同素材重複
- `ratio` が整数でない
- `ratio` が 1 未満
- `ratio` が 100 超
- `part_label` 欠落
- `material_name` 欠落
- `ratio` 欠落
- 空明細を送った場合

---

## 要確認事項

- `part_label` の保存値は current では自由文字列前提だが、将来コード化するかは未確定
- 区分候補・素材候補は入力補助として書くに留め、settings 管理や master 管理へ広げるかは後続判断
- purchase candidate 側への実装タイミングと、item 化時にどこまで無変換で引き継ぐかは別途確認が必要
- OpenAPI / `docs/data/database.md` には、実装着手の段階で current 反映する。現時点では planned 扱いに留める
- validation は spec で業務ルールを示し、OpenAPI は request / response の最小説明、実装メモは current 挙動補足に留める

---

## 今回固定すること

- 素材・混率は明細構造で扱う
- item / purchase candidate で同じ shape を使う
- 区分ごとに 100% 必須
- 同一区分内で同素材重複不可
- 区分候補は `本体 / 裏地 / 別布 / リブ`
- `その他` は置かない
- 素材候補は入力補助として扱う
- current では settings 管理しない
- DB は明細テーブル前提
- `sort_order` は持たない

---

## 今は保留でよいこと

- 候補管理画面
- 素材マスタ化
- 区分コード化
- FK 化
- 同義語吸収
- 小数混率
- 検索条件への追加
- 分析・可視化
- 区分ごとの補助メモ
- 品質表示全文保存
- 候補の並び替え / 有効無効設定

---

## 補足

この仕様は、まず item / purchase candidate の入力と保存を安定させるための最小構成である。  
検索・分析・候補管理などは、この構造を前提に後続で拡張する。

# 固定実寸

## 概要

- 固定実寸の正本は `web/src/lib/items/size-details.ts`
- item / purchase candidate は同じ fixed size resolver を使う
- 固定実寸は `category + shape` から決まる
- 対応がない場合は、自由項目の実寸で補う
- API / import-export は既存の固定実寸キーをそのまま使う

## 固定実寸キー

現在の固定実寸キーは次の 20 個です。

- 肩幅
- 身幅
- 着丈
- 袖丈
- 袖幅
- 袖口幅
- 襟周り
- ウエスト
- ヒップ
- 股上
- 股下
- 裾幅
- わたり
- 総丈
- スカート丈
- アンダーバスト
- トップバスト
- 高さ（H）
- 幅（W）
- マチ（D）

## 実寸値の保存形式

- item / purchase candidate / import-export は同じ `size_details` 構造を使う
- 固定実寸の `structured` と自由実寸の `custom_fields` は、どちらも `value / min / max / note` を持てる
- 単一値は `value` を使い、範囲値は `min` / `max` を使う
- `note` は `ヌード寸` / `約` / `後ろ約` などの補足注記で、表示時は値の前に付ける
- 単位は cm 固定で、保存値には単位を含めない
- 既存の単一数値データは、互換読み込み時に `value` として扱う

例:

```json
{
  "structured": {
    "waist": {
      "value": null,
      "min": 63,
      "max": 67,
      "note": "ヌード寸"
    },
    "total_length": {
      "value": 83.5,
      "min": null,
      "max": null,
      "note": null
    }
  },
  "custom_fields": [
    {
      "label": "裾スリット",
      "value": 26,
      "min": null,
      "max": null,
      "note": "後ろ約",
      "sort_order": 1
    }
  ]
}
```

## 現在の対応範囲

### tops

| shape                      | 固定実寸                           |
| -------------------------- | ---------------------------------- |
| `tshirt` (`tshirt_cutsew`) | 肩幅 / 身幅 / 着丈 / 袖丈          |
| `shirt`                    | 肩幅 / 身幅 / 着丈 / 袖丈 / 襟周り |
| `blouse`                   | 肩幅 / 身幅 / 着丈 / 袖丈          |
| `knit`                     | 肩幅 / 身幅 / 着丈 / 袖丈          |
| `cardigan`                 | 肩幅 / 身幅 / 着丈 / 袖丈          |
| `sweatshirt`               | 肩幅 / 身幅 / 着丈 / 袖丈          |
| `hoodie`                   | 肩幅 / 身幅 / 着丈 / 袖丈          |

### pants

| shape      | 固定実寸                                        |
| ---------- | ----------------------------------------------- |
| `pants`    | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `straight` | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `tapered`  | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `wide`     | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `culottes` | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `jogger`   | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `skinny`   | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |
| `gaucho`   | ウエスト / ヒップ / 股上 / 股下 / 裾幅 / わたり |

### skirts

| shape     | 固定実寸                              |
| --------- | ------------------------------------- |
| `skirt`   | ウエスト / ヒップ / 総丈 / スカート丈 |
| `tight`   | ウエスト / ヒップ / 総丈 / スカート丈 |
| `flare`   | ウエスト / ヒップ / 総丈 / スカート丈 |
| `a_line`  | ウエスト / ヒップ / 総丈 / スカート丈 |
| `narrow`  | ウエスト / ヒップ / 総丈 / スカート丈 |
| `mermaid` | ウエスト / ヒップ / 総丈 / スカート丈 |
| `pleated` | ウエスト / ヒップ / 総丈 / スカート丈 |

- `skirts / other` は shape なしで扱うため、固定実寸グループの対象外
- `skirts / other` でも `spec.skirt` は使用可
- `skirts / other` の実寸が必要な場合は、自由項目の実寸で補う

注記:

- `pleated` は現行 master data には見当たらないが、旧データ互換のため resolver 側に残している
- `total_length` は `総丈`、`skirt_length` は `スカート丈` として別項目で扱う

### outerwear

| shape            | 固定実寸                                  |
| ---------------- | ----------------------------------------- |
| `jacket`         | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `blouson`        | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `down_padded`    | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `mountain_parka` | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `tailored`       | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `no_collar`      | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |
| `blazer`         | 肩幅 / 身幅 / 着丈 / 袖丈 / 袖幅 / 袖口幅 |

### onepiece_dress

| shape      | 固定実寸                  |
| ---------- | ------------------------- |
| `onepiece` | 肩幅 / 身幅 / 袖丈 / 総丈 |
| `dress`    | 肩幅 / 身幅 / 袖丈 / 総丈 |

### underwear

| shape    | 固定実寸                      |
| -------- | ----------------------------- |
| `bra`    | アンダーバスト / トップバスト |
| `shorts` | ウエスト / ヒップ / 股上      |

- `shapewear` / `undershirt` / `other` は初期実装では固定実寸グループの対象外
- `C70` / `D75` のようなブラサイズは固定実寸ではなく `サイズ表記` で扱う
- 次の項目は初期実装では自由項目で扱う
  - ブラ: カップ深さ / ストラップ長さ / ワイヤー有無 / パッド有無 / ホック段数
  - ショーツ: サイド幅 / 脚ぐり / クロッチ幅 / フィット感

### bags

| shape         | 固定実寸                        |
| ------------- | ------------------------------- |
| `bag`         | 高さ（H） / 幅（W） / マチ（D） |
| `tote`        | 高さ（H） / 幅（W） / マチ（D） |
| `shoulder`    | 高さ（H） / 幅（W） / マチ（D） |
| `boston`      | 高さ（H） / 幅（W） / マチ（D） |
| `rucksack`    | 高さ（H） / 幅（W） / マチ（D） |
| `hand`        | 高さ（H） / 幅（W） / マチ（D） |
| `body`        | 高さ（H） / 幅（W） / マチ（D） |
| `waist-pouch` | 高さ（H） / 幅（W） / マチ（D） |
| `messenger`   | 高さ（H） / 幅（W） / マチ（D） |
| `clutch`      | 高さ（H） / 幅（W） / マチ（D） |
| `sacoche`     | 高さ（H） / 幅（W） / マチ（D） |
| `pochette`    | 高さ（H） / 幅（W） / マチ（D） |
| `drawstring`  | 高さ（H） / 幅（W） / マチ（D） |
| `basket-bag`  | 高さ（H） / 幅（W） / マチ（D） |
| `briefcase`   | 高さ（H） / 幅（W） / マチ（D） |
| `marche-bag`  | 高さ（H） / 幅（W） / マチ（D） |
| `other`       | 高さ（H） / 幅（W） / マチ（D） |

### bags の運用メモ

- current
  - bagsでも共通構造上は `value / min / max / note` を持てる
  - ただし `高さ（H） / 幅（W） / マチ（D）` は、通常は単一値で入力する想定
- planned
  - `持ち手高さ` や `持ち手長さ` は、実データの必要性を見ながら追加候補として検討する
- 要再判断
  - bags の UI で `min / max` を前面に出すかどうか
  - `ショルダー長さ` など持ち手以外のバッグ固有実寸をどこまで fixed size に含めるか

## 固定実寸グループ未対応

次のカテゴリは、現時点では固定実寸グループ未対応です。

- `allinone`
- `inner`
- `legwear`
- `shoes`
- `fashion_accessories`
- `swimwear`
- `kimono`

これらは必要に応じて自由項目の実寸で補う。

## 今回追加した対応

今回の拡張で、既存の固定実寸対応に次を追加した。

- tops: `knit` / `cardigan` / `sweatshirt` / `hoodie`
- outerwear: `tailored` / `no_collar` / `blazer`
- pants: `jogger` / `skinny` / `gaucho`
- skirts: `narrow`
- skirts: `mermaid`
- onepiece_dress: `dress`

## 今回見送った範囲

### outerwear coat 系

対象:

- `coat`
- `trench`
- `chester`
- `stainless`

理由:

- 既存キーだけでも対応可能だが、`総丈` をどう扱うかなど coat 用グループを分ける判断が必要
- jacket グループ流用だと少し雑になりやすいため、今回は見送り

### shoes

理由:

- shoes は `ヒール高 / アウトソール長 / 足幅 / 筒丈` など、新しい固定実寸キー追加が必要になりやすい

## 関連 docs

- item form 全体の構成: [form-structure.md](./form-structure.md)
- purchase candidate の入力仕様: [../purchase-candidates.md](../purchase-candidates.md)

# Database Design

## Overview

Wardrobe App は現在、主に `users` `items` `outfits` `outfit_items` を中心に構成しています。
認証は Laravel の Session Authentication を利用します。

---

## Current Tables

- `users`
- `items`
- `outfits`
- `outfit_items`

---

## items

ユーザーが登録した服アイテムを保持するテーブルです。

### Columns

| column | type | description |
|---|---|---|
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| name | string nullable | アイテム名 |
| category | string | カテゴリ |
| shape | string | 形 |
| colors | json | 色情報 |
| seasons | json nullable | 季節配列 |
| tpos | json nullable | TPO配列 |
| spec | json nullable | tops などの詳細仕様 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### items.colors

`colors` は JSON 配列です。

```json
[
  {
    "role": "main",
    "mode": "preset",
    "value": "navy",
    "hex": "#1F3A5F",
    "label": "ネイビー"
  },
  {
    "role": "sub",
    "mode": "custom",
    "value": "#D9D9D9",
    "hex": "#D9D9D9",
    "label": "カスタムカラー"
  }
]
```

補足:

- `role` は `main` / `sub`
- `mode` は `preset` / `custom`
- `value` は保存値
- `hex` は表示用カラーコード
- `label` は表示名

### items.seasons

`seasons` は JSON 配列です。

```json
["春", "秋"]
```

### items.tpos

`tpos` は JSON 配列です。

```json
["仕事", "休日"]
```

### items.spec

`spec` は JSON オブジェクトです。
現在は `tops` の詳細仕様を保存します。

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

補足:

- `spec` は nullable
- tops 以外のカテゴリでは `null` のままでもよい
- 詳細仕様の定義は `docs/item-spec-tops.md` を参照

---

## outfits

コーディネート情報を保持するテーブルです。

主な項目:

- `name`
- `memo`
- `seasons`
- `tpos`

## outfit_items

outfit と item の関連テーブルです。

主な項目:

- `outfit_id`
- `item_id`
- `sort_order`

---

## Current Design Policy

現在は MVP を優先し、色・季節・TPO・spec を JSON で保持しています。
今後必要になれば正規化を検討しますが、現時点では次を重視します。

- 実装速度
- UI / API / DB の整合性
- 新規作成から一覧表示までを少ないコストで通すこと
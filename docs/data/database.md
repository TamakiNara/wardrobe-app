# Database Design

## Overview

Wardrobe App は現在、主に `users` `items` `outfits` `outfit_items` を中心に構成しています。
認証は Laravel の Session Authentication を利用します。

カテゴリ表示設定と分類プリセット用の master data は、`category_groups` `category_master` `category_presets` `category_preset_categories` で管理します。

---

## Current Tables

- `users`
- `items`
- `outfits`
- `outfit_items`
- `category_groups`
- `category_master`
- `category_presets`
- `category_preset_categories`

---

## users

認証ユーザーと、ユーザー単位の設定値を保持するテーブルです。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| name | string | ユーザー名 |
| email | string unique | メールアドレス |
| password | string | ハッシュ化済みパスワード |
| visible_category_ids | json nullable | 表示対象の中分類ID配列 |
| email_verified_at | timestamp nullable | メール確認日時 |
| remember_token | string nullable | Remember Me 用トークン |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- `visible_category_ids` は [`category-settings.md`](../specs/settings/category-settings.md) の `visible_category_ids` を保存する
- DB 上の初期値は `null` とする
- `null` の場合は、API / 画面表示では active な中分類をすべて表示対象として扱う
- 空配列 `[]` を保存した場合は「すべてOFF」として扱う
- 保存値は中分類ID配列であり、大分類状態は保存しない
- 大分類の `ON / 一部ON / OFF` は、画面側で中分類の件数から算出する

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
- 詳細仕様の定義は `docs/specs/items/tops.md` を参照
- カテゴリ設定の仕様は `docs/specs/settings/category-settings.md` を参照

### Future Candidates (TODO)

未採用の仮案として、items に次の項目追加を検討している。

| column | type | note |
| --- | --- | --- |
| category_id | bigint | category master 連携時の移行候補 |
| brand_name | string nullable | ブランド名 |
| memo | text nullable | アイテムメモ |
| price | integer nullable | 購入金額 |
| purchase_url | text nullable | 商品ページ URL |
| size_gender | string nullable | メンズ / ウィメンズ |
| size_label | string nullable | S / M / L / FREE など |
| weather_tags | json nullable | 天気対応タグ |
| size_details | json nullable | 実寸詳細 |

あわせて、画像管理用の `item_images` テーブルも未採用の仮案として検討する。

### item_images (future TODO)

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| item_id | bigint | 対象 item ID |
| url | text | 画像 URL または保存先 |
| is_primary | boolean | 優先表示画像フラグ |
| sort_order | unsigned int | 表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- このセクションは TODO の仮案であり、現行 migration にはまだ反映していない
- `is_primary = true` の画像がある場合は、アイコン表示で SVG より画像を優先する想定
- 視覚表現の仮案として、item の素材感や透け感を SVG の `opacity` で表現する案も未検討項目とする

---

## category_groups

大分類カテゴリの master table です。

### Columns

| column | type | description |
|---|---|---|
| id | string | 大分類ID |
| name | string | 表示名 |
| sort_order | unsigned int | 表示順 |
| is_active | boolean | 有効フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Example Records

- `tops`
- `outer`
- `bottoms`
- `dress`
- `inner`
- `shoes`
- `bags`
- `accessories`

---

## category_master

中分類カテゴリの master table です。

### Columns

| column | type | description |
|---|---|---|
| id | string | 中分類ID |
| group_id | string | 親の大分類ID |
| name | string | 表示名 |
| sort_order | unsigned int | 表示順 |
| is_active | boolean | 有効フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Notes

- DB では `group_id` を使う
- API / フロントの JSON では `groupId` を使う
- `group_id` は `category_groups.id` を参照する

### Example Records

- `tops_tshirt`
- `tops_shirt`
- `tops_knit`
- `tops_hoodie`
- `tops_cardigan`
- `tops_vest`

---

## category_presets

ユーザー登録時に使う分類プリセットの master table です。

### Columns

| column | type | description |
|---|---|---|
| id | string | プリセットID |
| name | string | 表示名 |
| sort_order | unsigned int | 表示順 |
| is_active | boolean | 有効フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Example Records

- `male`
- `female`

補足:

- `custom` は UI ロジックで扱い、DB には保存しない

---

## category_preset_categories

分類プリセットと中分類カテゴリの対応テーブルです。

### Columns

| column | type | description |
|---|---|---|
| id | bigint | 主キー |
| category_preset_id | string | プリセットID |
| category_id | string | 中分類ID |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- unique(`category_preset_id`, `category_id`)
- `category_preset_id` は `category_presets.id` を参照する
- `category_id` は `category_master.id` を参照する

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
カテゴリ表示設定に必要な分類 master は DB に持ち、初期投入は seeder で管理します。
今後必要になれば正規化を検討しますが、現時点では次を重視します。

- 実装速度
- UI / API / DB の整合性
- 新規作成から一覧表示までを少ないコストで通すこと

## Seeder運用メモ

カテゴリ master 系 Seeder は、再実行しても同じ ID を基準に更新される前提で実装する。

- master table への投入は `updateOrCreate` を使い、ID を不変キーとして扱う
- 対応テーブルへの紐付けは `sync` などの冪等な更新を使う
- 既存レコードの主キーを変えない
- Seeder 追加時も `DB は snake_case / JSON は camelCase` の方針を崩さない
- 表示名は更新可能だが、ID はリリース後に変更しない

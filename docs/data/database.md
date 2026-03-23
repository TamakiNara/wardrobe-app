# Database Design

## Overview

Wardrobe App は現在、主に `users` `items` `outfits` `outfit_items` を中心に構成しています。  
認証は Laravel の Session Authentication を利用します。

カテゴリ表示設定と分類プリセット用の master data は、`category_groups` `category_master` `category_presets` `category_preset_categories` で管理します。

wear logs は未実装ですが、将来テーブル案として本資料内に定義します。

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
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| status | string default 'active' | アイテム状態 (`active` / `disposed`) |
| name | string nullable | アイテム名 |
| category | string | カテゴリ |
| shape | string | 形 |
| colors | json | 色情報 |
| seasons | json nullable | 季節配列 |
| tpos | json nullable | TPO配列 |
| is_rain_ok | boolean default false | 雨対応フラグ |
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
- `is_rain_ok` は正式項目として持ち、初期値は `false` とする
- 雨対応はまず boolean で表現し、`weather_tags` のような拡張は後回しにする
- 詳細仕様の定義は `docs/specs/items/tops.md` を参照
- item status の状態管理は `docs/specs/items/status-management.md` を参照
- カテゴリ設定の仕様は `docs/specs/settings/category-settings.md` を参照
- `status` は `active` / `disposed` を持つ
- `disposed` は「手放した / 現在所持していない」状態を表す
- `disposed` item は通常一覧や wear log / outfit の選択候補から除外する
- wear logs や過去の参照の都合上、物理削除より `disposed` を優先する
- API schema は `docs/api/openapi.yaml` の `ItemRecord` / `ItemUpsertRequest` を参照

### Future Candidates (TODO)

未採用の仮案として、items に次の項目追加を検討している。

| column | type | note |
| --- | --- | --- |
| category_id | bigint | category master 連携時の移行候補 |
| brand_name | string nullable | ブランド名 |
| memo | text nullable | アイテムメモ |
| price | integer nullable | 購入金額 |
| purchase_url | text nullable | 商品ページ URL |
| purchased_at | date nullable | 購入日 |
| last_worn_at | timestamp nullable | 最終着用日時 |
| wear_count | unsigned int nullable | 着用回数 |
| is_favorite | boolean nullable | お気に入り |
| is_rain_ok | boolean default false | 雨対応フラグ |
| size_gender | string nullable | メンズ / ウィメンズ |
| size_label | string nullable | S / M / L / FREE など |
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
- `last_worn_at` と `wear_count` は軽量な集計用途の候補であり、履歴カレンダーまで扱う場合は `wear_logs` など別テーブル化も検討余地がある
- タグ機能は別テーブルで持つ方針とし、`weather_tags` のような items 側 JSON 拡張は後回しにする
- 視覚表現の仮案として、item の素材感や透け感を SVG の `opacity` で表現する案も未検討項目とする

---

## outfits

コーディネート情報を保持するテーブルです。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| status | string default 'active' | コーデ状態 (`active` / `invalid`) |
| name | string nullable | コーデ名 |
| memo | text nullable | メモ |
| seasons | json nullable | 季節配列 |
| tpos | json nullable | TPO配列 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### 補足

- `status` は `active` / `invalid` を持つ
- `invalid` は、構成 item の状態などにより通常利用できないことを表す
- `invalid` outfit は通常一覧や wear log の `source_outfit_id` 候補から除外する
- `invalid` outfit は別途一覧で確認し、手動復帰または複製して新規 outfit 化する前提とする
- 通常の作成 / 更新では `status=active` 前提で扱い、保存 payload に `status` は含めない
- 保存条件は `active` な item を 1 件以上含むことを前提とする
- 詳細仕様は `docs/specs/outfits/create-edit.md` を参照
- `future API` の schema は `docs/api/openapi.yaml` の `/api/outfits/invalid` `/api/outfits/{id}/restore` `/api/outfits/{id}/duplicate` を参照

---

## outfit_items

outfit と item の関連テーブルです。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| outfit_id | bigint | 対象 outfit ID |
| item_id | bigint | 対象 item ID |
| sort_order | unsigned int | outfit 内の表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- `outfit_id` は `outfits.id` を参照する
- `item_id` は `items.id` を参照する
- `sort_order` は outfit 内での表示順として使う

### 補足

- outfit 作成時は item を複数持てる
- `sort_order` は UI 上の並び順と対応する
- 同一 outfit 内で同一 `item_id` の重複は許可しない
- `sort_order` は `1, 2, 3...` の連番を前提とする
- item が `disposed` になった場合、その item を含む outfit は `invalid` に遷移する前提とする
- 他 outfit と同一 item 構成であっても登録は許可する

---

## category_groups

大分類カテゴリの master table です。

### Columns

| column | type | description |
| --- | --- | --- |
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
| --- | --- | --- |
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
| --- | --- | --- |
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
| --- | --- | --- |
| id | bigint | 主キー |
| category_preset_id | string | プリセットID |
| category_id | string | 中分類ID |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- `category_preset_id` は `category_presets.id` を参照する
- `category_id` は `category_master.id` を参照する
- 同一 `category_preset_id` と `category_id` の重複は不可

---

## tags (future)

ユーザー単位の補助分類タグを保持する将来テーブル案です。  
共通タグは持たず、タグはユーザーごとに管理する。

前提方針:

- タグは `category / TPO / seasons / weather` の正式項目の代替にしない
- 補助分類やメモ的なラベルとして使う
- 保存値に `#` は含めない
- UI 表示では `#` を付けてもよい

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| name | string | タグ名 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- unique(`user_id`, `name`)
- `user_id` は `users.id` を参照する

---

## item_tags (future)

item と tag の多対多関連テーブル案です。

### Columns

| column | type | description |
| --- | --- | --- |
| item_id | bigint | 対象 item ID |
| tag_id | bigint | 対象 tag ID |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- unique(`item_id`, `tag_id`)
- `item_id` は `items.id` を参照する
- `tag_id` は `tags.id` を参照する

### Model Notes

- `Item` は `belongsToMany(Tag::class)` を持つ想定
- `Tag` は `belongsToMany(Item::class)` を持つ想定

---

## outfit_tags (future)

outfit と tag の多対多関連テーブル案です。

### Columns

| column | type | description |
| --- | --- | --- |
| outfit_id | bigint | 対象 outfit ID |
| tag_id | bigint | 対象 tag ID |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- unique(`outfit_id`, `tag_id`)
- `outfit_id` は `outfits.id` を参照する
- `tag_id` は `tags.id` を参照する

### Model Notes

- `Outfit` は `belongsToMany(Tag::class)` を持つ想定
- `Tag` は `belongsToMany(Outfit::class)` を持つ想定

---

## Current Design Policy

現在は MVP を優先し、色・季節・TPO・spec を JSON で保持しています。  
カテゴリ表示設定に必要な分類 master は DB に持ち、初期投入は seeder で管理します。  
今後必要になれば正規化を検討しますが、現時点では次を重視します。

- 実装速度
- UI / API / DB の整合性
- 新規作成から一覧表示までを少ないコストで通すこと

---

## Seeder運用メモ

カテゴリ master 系 Seeder は、再実行しても同じ ID を基準に更新される前提で実装する。

- master table への投入は `updateOrCreate` を使い、ID を不変キーとして扱う
- 対応テーブルへの紐付けは `sync` などの冪等な更新を使う
- 既存レコードの主キーを変えない
- Seeder 追加時も `DB は snake_case / JSON は camelCase` の方針を崩さない
- 表示名は更新可能だが、ID はリリース後に変更しない

---

## wear_logs (future)

着用履歴 / 着用予定を扱う将来テーブル案です。  
MVP では snapshot を持たず、最終的な item 群と参照先 current data を組み合わせて扱う前提とします。

### wear_logs

#### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| status | string | 着用状態 (`planned` / `worn`) |
| event_date | date | 着用イベント日 |
| display_order | unsigned int | 同日内の表示順 |
| source_outfit_id | bigint nullable | ベースにした outfit ID |
| memo | text nullable | メモ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

#### Constraints / Notes

- `user_id` は `users.id` を参照する
- `source_outfit_id` は `outfits.id` を参照する
- `status` は `planned` / `worn`
- 同一ユーザー・同一 `event_date` に対して `display_order` は重複不可
- `source_outfit_id` は「完全一致したコーデ」ではなく、「ベースにした outfit」を表す
- outfit の詳細仕様は `docs/specs/outfits/create-edit.md` を参照
- API schema は `docs/api/openapi.yaml` の `WearLogUpsertRequest` / `WearLogListItem` / `WearLogDetailResponse` を参照

### wear_log_items

#### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| wear_log_id | bigint | 対象 wear log ID |
| source_item_id | bigint nullable | 元 item ID |
| item_source_type | string | item の由来 (`outfit` / `manual`) |
| sort_order | unsigned int | wear log 内の表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

#### Constraints / Notes

- `wear_log_id` は `wear_logs.id` を参照する
- `source_item_id` は `items.id` を参照する
- `item_source_type` は `outfit` / `manual`
- 同一 wear log 内で同一 `source_item_id` の重複は不可
- `sort_order` は `1, 2, 3...` の連番を前提とする
- wear logs 全体の詳細仕様は `docs/specs/wears/wear-logs.md` を参照

### Design Notes

- `planned` / `worn` は同一レコードで管理する
- `worn -> planned -> worn` のような再変更も許可し、常に最終保存状態を正とする
- 1 wear log = 1着用イベント
- 同日複数件を許容する
- 時刻は持たず、`event_date + display_order` で順序を表現する
- outfit を選択した場合でも、保存時は最終的な item 群を `wear_log_items` に持つ
- MVP では snapshot カラムは持たない
- `disposed` item や `invalid` outfit は新規登録・更新時の候補から除外する
- `current status` は履歴の主表示ではなく補助情報として扱う
- 詳細は `docs/specs/wears/wear-logs.md` を参照

---

## event_logs (future)

重要な状態変化や副作用のある操作を記録する将来テーブル案。
MVP ではアプリケーションログとイベントログを分けて考え、ここではイベントログを想定する。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| event_type | string | イベント種別 |
| user_id | bigint | 実行ユーザーID |
| resource_type | string | 対象リソース種別 |
| resource_id | bigint | 対象リソースID |
| payload_json | json nullable | 補助情報 |
| created_at | timestamp | 作成日時 |

### Notes

- MVP では重要な状態変化のみを対象とする
- 例: `item_disposed` `item_reactivated` `outfit_invalidated` `outfit_restored` `outfit_duplicated`
- 軽微な編集や一覧閲覧は対象外とする
- 詳細方針は `docs/specs/logging/logging-policy.md` を参照
- `user_id` はイベントを発生させた実行ユーザーIDを表す
- `resource_type` は MVP では `item` / `outfit` / `wear_log` を想定する
- `payload_json` は完全な before / after 保存ではなく、理由・関連ID・補助情報を最小限で持つ方針とする

---

## Tagging Design Summary (future)

今回の草案で決めたこと:

- タグは共通マスタではなく、ユーザー単位で持つ
- タグは補助分類として使い、カテゴリ / TPO / 季節 / 天気の正式項目の代替にはしない
- 雨対応は `items.is_rain_ok` を先に持ち、`weather_tags` のような拡張は後回しにする
- タグ保存値に `#` は含めず、UI 表示だけで `#` を付けてもよい

将来の拡張ポイント:

- `outfit_log_tags` を追加する場合は `tags` を再利用し、着用履歴にも同じタグ体系を適用できるようにする
- モデルは `Item / Outfit / Tag` の `belongsToMany` を前提に整理すると拡張しやすい

# Database Design

## Overview

Wardrobe App は現在、主に `users` `items` `outfits` `outfit_items` を中心に構成しています。  
認証は Laravel の Session Authentication を利用します。

カテゴリ表示設定と分類プリセット用の master data は、`category_groups` `category_master` `category_presets` `category_preset_categories` で管理します。

wear logs も本資料の対象とし、その保存方針を定義します。

---

## Current Tables

- `users`
- `items`
- `item_images`
- `item_materials`
- `outfits`
- `outfit_items`
- `wear_logs`
- `wear_log_items`
- `purchase_candidates`
- `purchase_candidate_colors`
- `purchase_candidate_seasons`
- `purchase_candidate_tpos`
- `purchase_candidate_images`
- `user_preferences`
- `user_tpos`
- `user_brands`
- `category_groups`
- `category_master`
- `category_presets`
- `category_preset_categories`

## Purchase Review Tables (`purchase_candidates` / 購入検討)

`purchase_candidates` 系は購入検討用の schema で、`docs/specs/purchase-candidates.md` を正本とします。  
比較ロジックの詳細は後続検討としつつ、現時点の実装では candidate 保存・画像管理・item 昇格を支える構造まで含みます。
素材・混率は 現時点で `purchase_candidate_materials` まで実装済みとし、保存 shape・validation・item 化時引き継ぎの正本は `docs/specs/items/material-composition.md` を参照します。

### `purchase_candidates`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| status | string | `considering` / `on_hold` / `purchased` / `dropped` |
| priority | string default `medium` | `high` / `medium` / `low` |
| name | string | 候補名 |
| category_id | string | category master の中分類ID |
| brand_name | string nullable | ブランド名 |
| price | integer nullable | 想定価格 |
| sale_price | integer nullable | セール時の参考価格 |
| sale_ends_at | timestamp nullable | セール終了予定日時 |
| purchase_url | text nullable | 商品ページ URL |
| memo | text nullable | 自由メモ |
| wanted_reason | text nullable | 欲しい理由 |
| size_gender | string nullable | `women` / `men` / `unisex` |
| size_label | string nullable | S / M / L / FREE など |
| size_note | string nullable | サイズ感・着用感の補足メモ |
| size_details | json nullable | `structured` / `custom_fields` を持つ構造化実寸 |
| is_rain_ok | boolean default false | 雨対応フラグ |
| converted_item_id | bigint nullable | item 化された先の ID |
| converted_at | timestamp nullable | item 化日時 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- `dropped` は見送り履歴を残す状態であり、DELETE とは別概念とする
- candidate の `price` は想定価格、item の `price` は実購入価格として意味を分ける
- `sale_price` / `sale_ends_at` は candidate 専用であり、item には保存しない
- `size_note` はサイズ感・着用感の補足メモ、`size_details` は `structured` / `custom_fields` を持つ構造化実寸とする
- candidate から item へは既存 record を変換せず、新規 item 作成で昇格する
- 現時点の実装では、`purchase_candidate_id` 付きの item 作成成功時に `status=purchased`、`converted_item_id`、`converted_at` を更新する
- 現時点の実装では、candidate 複製時に画像も新 candidate 用保存先へ物理コピーして別 record として保持する
- 現時点の実装では、`purchased` の candidate 更新は履歴メモ用途に限定し、item 側の正本は更新しない

### `purchase_candidate_materials`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| purchase_candidate_id | bigint | 対象 purchase candidate ID |
| part_label | string | 区分名（`本体` / `裏地` / `別布` / `リブ` または自由入力） |
| material_name | string | 素材名 |
| ratio | unsigned tiny integer | 混率（1〜100 の整数） |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- 保存正本は purchase candidate に紐づく複数明細で、単一文字列カラムは持たない
- `part_label` / `material_name` は文字列保存とし、素材マスタ FK は持たない
- 現時点の実装では create / update 時に purchase candidate 側明細を全置換する
- validation は item 側と揃え、区分ごとの合計 100%、同一区分内の同素材重複不可を 現在のルールとする
- item-draft と item 作成 UI を介して、candidate の素材明細を item 側 `item_materials` へ引き継ぐ

### `purchase_candidate_colors`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| purchase_candidate_id | bigint | 対象 candidate ID |
| role | string | `main` / `sub` |
| mode | string | `preset` / `custom` |
| value | string | 保存値 |
| hex | string | 表示用カラーコード |
| label | string | 表示名 |
| sort_order | unsigned int | 表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### `purchase_candidate_seasons`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| purchase_candidate_id | bigint | 対象 candidate ID |
| season | string | 季節 |
| sort_order | unsigned int | 表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### `purchase_candidate_tpos`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| purchase_candidate_id | bigint | 対象 candidate ID |
| tpo | string | TPO |
| sort_order | unsigned int | 表示順 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### `user_preferences`

| column | type | description |
| --- | --- | --- |
| user_id | bigint | 主キー兼 user FK |
| current_season | string nullable | item / outfit 一覧の初期季節 |
| default_wear_log_status | string nullable | wear log 新規作成時の初期 status |
| calendar_week_start | string nullable | wear log カレンダーの週開始 |
| skin_tone_preset | string default `neutral_medium` | item サムネイルの肌色 preset |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- 1 user = 1 record を前提とする
- `current_season` は `spring / summer / autumn / winter / null`
- `default_wear_log_status` は `planned / worn / null`
- `calendar_week_start` は `monday / sunday / null`
- `skin_tone_preset` は `pink_light / pink_medium / pink_deep / neutral_light / neutral_medium / neutral_deep / yellow_light / yellow_medium / yellow_deep`
- `current_season` は URL に季節条件がないときの item 一覧 / コーディネート一覧初期表示にのみ使う
- `default_wear_log_status` は wear log 新規作成画面の初期値にのみ使い、edit 画面では使わない
- `calendar_week_start` は wear log カレンダーの週開始にのみ使い、未設定時は月曜始まりを既定とする
- `skin_tone_preset` は Phase 2-2 時点では item サムネイルの肌色表現にのみ使う

### `purchase_candidate_images`

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| purchase_candidate_id | bigint | 対象 candidate ID |
| disk | string | 保存先 disk |
| path | string | 保存パス |
| original_filename | string nullable | 元ファイル名 |
| mime_type | string nullable | MIME type |
| file_size | integer nullable | バイト数 |
| sort_order | unsigned int | 表示順 |
| is_primary | boolean | 代表画像フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- `purchase_candidate_images` と `item_images` は別テーブルで持ち、同一 image record を共有しない
- candidate から item へは全画像を初期値として引き継ぐが、item 保存時に item 用保存先へ物理コピーし、item 側画像とは別管理で確定する
- 画像上限は item / candidate ともに 5 枚を前提とする

### purchase_candidate_images と item_images の関係

- `purchase_candidate_images` は購入判断材料を保持するための画像テーブル
- `item_images` は所持品管理用の画像テーブル
- candidate -> item 昇格時は、candidate 側画像の `disk + path` をそのまま使い回さず、item 保存時に item 用保存先へ物理コピーする
- item 側ではコピー先の `disk + path` を `item_images` に保存し、candidate 側画像削除の影響を受けないようにする
- 保存後の candidate 画像と item 画像は自動同期しない
- 代表画像切り替えと並び替え UI は後続対応とし、現時点の実装では `is_primary` と `sort_order` を保存済みデータとして扱う

## user_brands

ブランド候補をユーザー単位で保持するテーブルです。item の正本は `items.brand_name` のままとし、`user_brands` とは FK で結びません。

仕様正本は `docs/specs/settings/brand-candidates.md` を参照します。

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| name | string | 候補ブランド名 |
| kana | string nullable | 読み仮名 |
| normalized_name | string | 重複判定用ブランド名 |
| normalized_kana | string nullable | 読み仮名重複判定用 |
| is_active | boolean default true | 候補有効フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- 重複判定の基本は `user_id + normalized_name`
- `kana` がある場合は `normalized_kana` も重複判定に利用する
- 候補の変更や無効化で既存 `items.brand_name` は更新しない


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
- current の思想整理では、`visible_category_ids` は「表示対象の種類 ID 配列」として読む
- 現時点では現行実装を維持するが、カテゴリ表示設定の保存責務を `users.visible_category_ids` に増やし続ける前提にはしない
- `user_preferences` は全体設定の正本とし、カテゴリ表示設定は将来的に `user_category_settings` のような専用テーブルへ分離する方向を第一候補とする

---

## user_tpos

ユーザーごとの TPO 選択肢正本を保持するテーブルです。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| name | string | TPO 名 |
| sort_order | unsigned int | 表示順 |
| is_active | boolean default true | 有効フラグ |
| is_preset | boolean default false | プリセット由来フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- Phase 1 では settings / item / outfit の TPO 選択肢正本を `user_tpos` とする
- プリセットは `仕事 / 休日 / フォーマル`
- inactive TPO は新規候補に出さない
- 既存データに含まれる inactive TPO は表示・保持できる前提を採る
- プリセット TPO は名称変更不可、並び替え UI は上下移動を採用する

---

## items

ユーザーが登録した服アイテムを保持するテーブルです。
素材・混率は 現時点で `item_materials` テーブルへ明細保存し、詳細 API / create / edit UI でも同じ明細構造を扱います。仕様正本は `docs/specs/items/material-composition.md` を参照します。

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| status | string default 'active' | アイテム状態 (`active` / `disposed`) |
| care_status | string nullable | 補助ケア状態 (`in_cleaning`) |
| name | string nullable | アイテム名 |
| category | string | 大分類 |
| shape | string | 形 |
| colors | json | 色情報 |
| seasons | json nullable | 季節配列 |
| tpos | json nullable | 互換表示用の TPO 名配列 |
| tpo_ids | json nullable | 保存正本の TPO ID 配列 |
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

`tpos` は JSON 配列です。現時点の実装では `tpo_ids` を現在のユーザーの TPO 名へ解決した表示用配列として返します。

```json
["仕事", "休日"]
```

### items.tpo_ids

`tpo_ids` は JSON 配列です。Phase 1 では item 側の保存正本として扱います。

```json
[1, 2]
```

### items.spec

`spec` は JSON オブジェクトです。  
現在は `tops` の詳細仕様に加えて、`bottoms.length_type` と `legwear.coverage_type` を保存します。

```json
{
  "tops": {
    "shape": "tshirt",
    "sleeve": "short",
    "length": "normal",
    "neck": "crew",
    "design": "raglan",
    "fit": "normal"
  },
  "bottoms": {
    "length_type": "full"
  },
  "legwear": {
    "coverage_type": "tights"
  }
}
```

補足:

- 現行の item データモデルは `category + subcategory + shape + spec` を保存する
- `items.subcategory` は nullable な独立カラムとして段階導入済みで、型は `string`、default なし、非 unique とする
- index は `category` と `subcategory` の複合 index を持ち、`subcategory` 単独での一意性は前提にしない
- `spec` は nullable
- Phase 1 では bottoms は `spec.bottoms.length_type`、legwear は `spec.legwear.coverage_type` を持てる
- 現時点の役割分担では、`category` は大分類、`subcategory` は種類名として定着した下位分類、`shape` は同じ `category` / `subcategory` 内の見た目・構造・型の差、`spec` は丈・覆い方・機能・補助属性の保存領域として扱う
- `subcategory` の保存値は `pants_denim` のような中分類 ID そのものではなく、`denim`、`slacks`、`hoodie` のような単体値を第一候補とし、意味は `category` と組み合わせて読む
- settings 側の中分類 ID とは、`pants_denim` ⇔ `category = pants` かつ `subcategory = denim` のように対応づけて扱う
- `subcategory` を正式導入する場合も、categories 設定の ON / OFF 対象は `category` 直下の種類 ID までに留め、`shape` / `spec` は設定対象に広げない前提を優先する
- 一覧・検索で独立して使いたい粒度は、原則として `shape` より `subcategory` へ上げる候補として扱う。current では `bags`、`fashion_accessories`、`shoes` を `subcategory` 厚めへ寄せ始めており、`legwear`、`roomwear_inner` は将来の filter 粒度と categories 設定の説明をそろえるための次候補とする
- item 側では `roomwear_inner` も現在のカテゴリ `inner` として `subcategory = roomwear / underwear / pajamas / other` を主導線にし、`shape` は同名1件の候補を自動補完する薄い補助値として扱う
- `roomwear_inner` 系の対応は、現時点では settings / master と item データで次のように読む

| 層 | 値 | 役割 |
| --- | --- | --- |
| settings / master | `roomwear_inner_roomwear` など | `visible_category_ids` に保存する表示対象の種類 ID |
| item | `category = inner` | item モデル上の current category |
| item | `subcategory = roomwear / underwear / pajamas / other` | item で主導線として扱う種類名 |
| legacy bridge | `inner_roomwear` など | 旧 map・旧データ互換のために読む値 |

- つまり `roomwear_inner_*` は表示設定用 ID、`inner + subcategory` は item 側の正本概念、`inner_*` は legacy bridge として役割を分けて読む
- 変換規則の正本化方針としては、item 実データの意味づけは backend 側に寄せ、frontend 側は表示用の派生として読む第一候補を維持する
- 第一候補の責務分担は次のとおり

| 区分 | 主な正本 / 派生先 | 読み方 |
| --- | --- | --- |
| item `subcategory` の値一覧と正規化 | `ItemSubcategorySupport` | backend の正本 |
| item `shape` の候補、必須条件、自動補完 | `ItemInputRequirementSupport` | backend の正本 |
| settings 用 ID と item 実データの橋渡し | `ListQuerySupport` | backend の正本寄り。将来は上記正本から導出できる形へ寄せる |
| purchase candidate → item 変換 | `PurchaseCandidateCategoryMap` | 境界専用の派生 |
| frontend のラベル、並び、UI 制御 | `item-subcategories.ts` / `item-shapes.ts` | backend 正本の派生 |
| frontend の settings / visible helper | `web/src/lib/api/categories.ts` | backend 正本の読み替え |

- current の backend 実装では、`subcategory -> visible_category_id` は `ItemSubcategorySupport` を優先し、`shape` 候補・既定 shape・fallback shape は `ItemInputRequirementSupport` を優先して読む第一段まで寄せている
- `ListQuerySupport` は visible 判定用の query map や current category bridge をまだ持つが、`subcategory` 側の visible ID は `ItemSubcategorySupport` を参照する読み方へ寄せ始めている
- `PurchaseCandidateCategoryMap` は category master ID から item draft への境界変換表を維持しつつ、戻り値の `subcategory` 正規化と `shape` 解決は backend の正本寄り helper に通す第一段へ寄せている

- 実コード上の重複棚卸しとしては、`subcategory` 値一覧、`subcategory` 必須カテゴリ、`category + subcategory -> shape` 候補、default / fallback shape、settings 用 ID と item 実データの橋渡しが backend / frontend の複数箇所に残っている
- 次に一本化を優先する対象は、backend の `ItemSubcategorySupport` と `ItemInputRequirementSupport` を正本として読む領域であり、frontend 側はラベル・並び・UI 制御へ責務をさらに寄せる第一候補を維持する
- staged rollout 互換のため、legacy bridge と purchase candidate 境界変換は当面残してよいが、将来の追加時に『まず backend の正本 helper を直す』導線を崩さないことを優先する

- current の backend 実装では、`subcategory -> visible_category_id` は `ItemSubcategorySupport` の公開面を正本寄りに読み、`PurchaseCandidateCategoryMap` は shape が backend default と一致する行から順に省略して `ItemInputRequirementSupport` の解釈へ寄せ始めている
- `ListQuerySupport` の query map も、現行の `category + subcategory` 条件は `ItemSubcategorySupport` を正本寄りに読んで組み立て、shape ベースの固定表は段階導入互換用の橋渡しとして切り分け始めている
- まだ `ListQuerySupport` の現行 category 橋渡し・旧 shape 橋渡し、`PurchaseCandidateCategoryMap` の境界変換表自体は残っているため、今回は『橋渡し重複を減らす第二段』として扱う
- 現行 category を持つ旧 item の shape 橋渡しは `subcategory_null = true` 付きの互換条件として扱い、`accessories` や `bottoms` のような旧 category 橋渡しとは別ブロックで読む形へ寄せている
- その結果、`ListQuerySupport` では現行の `category + subcategory` 条件生成と旧仕様 / 橋渡し条件を最低限読み分けられるようになり、削減対象も現行 category 橋渡し / 旧 shape 橋渡し / frontend 側の参照用ヘルパーの順で追いやすくなった
- 現在の frontend 実装でも、現行 / 旧仕様の category・shape 正規化は `web/src/lib/items/current-item-read-model.ts` の共通参照用ヘルパーに寄せ、`web/src/lib/api/categories.ts`、`item-subcategories.ts`、`item-shapes.ts` はそれを参照する派生ヘルパーとして読む第一段へ進めている
- ただし visible ID 解決や UI 表示用の subcategory / shape 対応表は段階導入互換のためまだ frontend に残しており、次に減らす対象は `web/src/lib/api/categories.ts` の橋渡し / visible 用ヘルパーと `item-subcategories.ts` / `item-shapes.ts` の意味づけ寄り対応表である

- 次に減らす対象の優先順位は、1. `ListQuerySupport` の query map に残る橋渡し条件、2. 現行 category 橋渡し、3. 旧 shape 橋渡し、4. frontend 側の橋渡し / 参照用ヘルパー重複、の順を第一候補とする

- つまり、将来の追加や再編では「backend の正本ヘルパーを先に直し、frontend は表示と UI 制御の追随をする」という順で読むのが第一候補である
- migration 時の旧データ互換では、安全に補完できるものだけデータ補完し、補完できないものは `subcategory = null` を許容する
- `items.shape` は引き続き nullable にしない前提を維持しつつ、現時点の staged rollout では `shape` が任意寄りのカテゴリで backend が代表 shape を補完して保存する
- `subcategory = other` は subcategory 側の受け皿として扱い、shape 側の `other` は新規入力の主導線には追加しない
- UI の主表示は `subcategory` 優先とし、`null` や未移行データでは現行の bridge で補助ラベルを出す
- lower-body 系では、丈は原則 `spec` に寄せ、テーパード / フレアのような型差は `shape` に寄せる前提を優先する
- `pants` の `spec.bottoms.length_type` は、まず `mini / short / half / cropped / full` を候補とし、短さの違いは category ではなく spec で持つ前提を優先する
- `tops` は現行実装では `spec.tops.shape` に種類名が含まれるが、カテゴリ再編の方針としては種類名として定着したものを中分類に寄せ、首元・袖・fit・丈を `shape / spec` 側へ寄せる方向で整理する
- `is_rain_ok` は正式項目として持ち、初期値は `false` とする
- 雨対応はまず boolean で表現し、`weather_tags` のような拡張は後回しにする
- 詳細仕様の定義は `docs/specs/items/tops.md` と `docs/specs/items/thumbnail-skin-exposure.md` を参照
- item status の状態管理の正本は `docs/specs/items/status-management.md` を参照
- カテゴリ設定の仕様は `docs/specs/settings/category-settings.md` を参照
- `status` は `active` / `disposed` を持つ
- `care_status` は nullable で、現時点の実装では `in_cleaning` のみを持つ
- `disposed` は「手放した / 現在所持していない」状態を表す
- `disposed` item は通常一覧や wear log / outfit の選択候補から除外する
- `care_status` は補助状態であり、候補除外や invalid 化の主制御には使わない
- wear logs や過去の参照の都合上、物理削除より `disposed` を優先する
- 通常の UI 導線では物理削除を主操作に置かず、所有状態の変更は `active` / `disposed` で扱う
- `outfit_items` や `wear_log_items` から参照されている item は物理削除せず、`disposed` への状態変更を優先する
- TPO の選択肢正本は `user_tpos` で、item 側の保存正本は `tpo_ids`
- `tpos` は API / 画面表示用の resolved name として扱い、旧保存構造との互換も残す
- API schema は `docs/api/openapi.yaml` の `ItemRecord` / `ItemUpsertRequest` を参照

### purchase_candidates 受け皿として追加した項目

| column | type | note |
| --- | --- | --- |
| brand_name | string nullable | ブランド名 |
| price | integer nullable | 購入金額 |
| purchase_url | text nullable | 商品ページ URL |
| purchased_at | date nullable | 購入日 |
| is_rain_ok | boolean default false | 雨対応フラグ |
| size_gender | string nullable | メンズ / ウィメンズ |
| size_label | string nullable | S / M / L / FREE など |
| size_note | string nullable | サイズ感・着用感の補足メモ |
| size_details | json nullable | 実寸の構造化情報 |

### item_materials

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| item_id | bigint | 対象 item ID |
| part_label | string | 区分名（`本体` / `裏地` / `別布` / `リブ` または自由入力） |
| material_name | string | 素材名 |
| ratio | unsigned tiny integer | 混率（1〜100 の整数） |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- 保存正本は item に紐づく複数明細で、単一文字列カラムは持たない
- `part_label` / `material_name` は文字列保存とし、素材マスタ FK は持たない
- 現時点の実装では create / update 時に item 側明細を全置換する
- validation は API 側で行い、区分ごとの合計 100%、同一区分内の同素材重複不可を 現在のルールとする
- 表示順は `本体 -> 裏地 -> 別布 -> リブ -> 自由入力区分（名前順）`、区分内は `ratio desc -> material_name asc` を正本とする


補足:

- `brand_name / price / purchase_url / purchased_at` は purchase_candidates 由来の初期値を item 側で確認・補正して保存できるようにした
- `brand_name` は item の正本であり、候補保存時も `user_brands` への参照は持たない
- `size_note` はサイズ感・着用感の補足メモとして使う
- `size_details` は `structured` と `custom_fields` を持つ JSON で保存する
- `structured` は category / shape ごとの固定実寸項目を持ち、単位は cm 固定、小数可、未入力キーは保存しない
- `custom_fields` は `{ label, value, sort_order }` を持つ自由実寸項目配列で、`value` は cm の数値、並び順の正本は `sort_order` とする
- 旧 `size_details.note` は 現時点では廃止する
- 現状の固定実寸セット:
  - ジャケット: `shoulder_width`(肩幅) / `body_width`(身幅) / `body_length`(着丈) / `sleeve_length`(袖丈) / `sleeve_width`(袖幅) / `cuff_width`(袖口幅)
  - シャツ・Yシャツ: `shoulder_width`(肩幅) / `body_width`(身幅) / `body_length`(着丈) / `sleeve_length`(袖丈) / `neck_circumference`(襟周り)
  - Tシャツ: `shoulder_width`(肩幅) / `body_width`(身幅) / `body_length`(着丈) / `sleeve_length`(袖丈)
  - ブラウス: `shoulder_width`(肩幅) / `body_width`(身幅) / `body_length`(着丈) / `sleeve_length`(袖丈)
  - パンツ: `waist`(ウエスト) / `hip`(ヒップ) / `rise`(股上) / `inseam`(股下) / `hem_width`(裾幅) / `thigh_width`(わたり幅)
  - スカート: `waist`(ウエスト) / `hip`(ヒップ) / `total_length`(総丈)
  - ワンピース: `shoulder_width`(肩幅) / `body_width`(身幅) / `sleeve_length`(袖丈) / `total_length`(総丈)

### item_images

item 側の画像管理は `purchase_candidate_images` と別テーブルで持つ。

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| item_id | bigint | 対象 item ID |
| disk | string | 保存先 disk |
| path | string | 保存パス |
| original_filename | string nullable | 元ファイル名 |
| mime_type | string nullable | MIME type |
| file_size | integer nullable | バイト数 |
| sort_order | unsigned int | 表示順 |
| is_primary | boolean | 優先表示画像フラグ |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

補足:

- DB には `disk + path` を保存し、表示用 URL は API / BFF 側で生成する
- 複数画像対応とし、`is_primary` と `sort_order` を持つ
- 上限は 5 枚を前提とする
- candidate 画像を item に引き継ぐ場合も、item 保存時に item 用ディレクトリへ物理コピーして item 側画像として別管理にする
- `purchase_candidate_images` と共通テーブルにはせず、item 側専用テーブルとして持つ
- 現在は item 作成時に purchase_candidates 由来画像を `item_images` として確定できる状態まで実装済み
- item 作成 / 編集画面で画像 upload / delete UI を持ち、編集画面では並び替えと代表画像切り替えも扱う

### purchase_candidate_images (今後対応)

`purchase_candidate_images` の基本構造は、前半の「Planned Tables (`purchase_candidates`)」節にある定義を正本とする。

補足:

- `item_images` とは別テーブルで持つ
- DB には `disk + path` を保存し、表示用 URL は API / BFF 側で生成する
- 複数画像対応とし、`is_primary` と `sort_order` を持つ
- 上限は 5 枚を前提とする
- candidate -> item では全画像を初期値として引き継ぐが、item 保存時に item 用保存先へ物理コピーし、保存後は item 側画像と自動同期しない
- `item_images` と共通テーブルにはせず、candidate 側専用テーブルとして持つ

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
| tpos | json nullable | 互換表示用の TPO 名配列 |
| tpo_ids | json nullable | 保存正本の TPO ID 配列 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### 補足

- `status` は `active` / `invalid` を持つ
- `invalid` は、構成 item の状態などにより通常利用できないことを表す
- `invalid` outfit は通常一覧や wear log の `source_outfit_id` 候補から除外する
- `invalid` outfit は別途一覧で確認し、手動復帰または複製して新規 outfit 化する前提とする
- 通常の作成 / 更新では `status=active` 前提で扱い、保存 payload に `status` は含めない
- 保存条件は `active` な item を 1 件以上含むことを前提とする
- TPO の選択肢正本は `user_tpos` で、outfit 側の保存正本は `tpo_ids`
- `tpos` は API / 画面表示用の resolved name として扱い、旧保存構造との互換も残す
- 詳細仕様は `docs/specs/outfits/create-edit.md` を参照
- invalid outfit 関連 API の schema は `docs/api/openapi.yaml` の `/api/outfits/invalid` `/api/outfits/{id}/restore` `/api/outfits/{id}/duplicate` を参照

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
- `onepiece_allinone`
- `inner`
- `legwear`
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



### 再編時の注意

- `category_groups` / `category_master` は現時点の 2 階層正本だが、大分類・中分類の追加や改名は seed だけの変更では済まない
- `users.visible_category_ids` は中分類 ID を直接保持するため、中分類 ID の改名や統合は settings 保存値と onboarding プリセットの再投入方針を同時に決める必要がある
- purchase candidate は `category_id` を正本として持ち、Laravel 側で item の `category` / `shape` へ変換しているため、category master 再編時は `PurchaseCandidateCategoryMap` と frontend 側 category map の更新が必須になる
- item 側では `bags`・`fashion_accessories`・`swimwear`・`kimono` を現在のカテゴリとして扱い始め、category master の責務差をそのまま item 側の現在カテゴリにも反映する
- item 側では `legwear` も現在のカテゴリとして `subcategory = socks / stockings / tights / leggings / other` を主導線にし、`spec.legwear.coverage_type` を補助情報として維持する
- 次回の大分類再編では、`outer` → `outerwear`、`bottoms` → `pants` / `skirts`、`onepiece_allinone` → `onepiece_dress` / `allinone`、`accessories` → `bags` / `fashion_accessories` を第一候補とする
- 実装第1弾では `swimwear` と `kimono` も含めて `visible_category_ids` と category master の新しい中分類 ID を導入し、item の `category` / `shape` は `bags`・`fashion_accessories`・`swimwear`・`kimono` を新案側へ進めつつ、それ以外は必要な箇所だけ対応表で橋渡しする
- 実装第2弾では item の現在カテゴリも `pants`・`skirts`・`outerwear`・`onepiece_dress`・`allinone` を正本寄りに扱い始め、一覧のカテゴリ候補・表示対象判定・purchase candidate の item-draft 生成で新しい category 値を優先する
- `swimwear` と `kimono` は独立大分類として settings と onboarding で ON / OFF を持てる前提にする
- TODO: category / subcategory / shape の変換規則は backend / frontend の複数 helper に分散しているため、将来の category 再編や filter 拡張に備えて正本化または責務整理を後続で検討する


### Example Records

- `tops_tshirt`
- `tops_shirt`
- `tops_knit`
- `tops_hoodie`
- `tops_cardigan`
- `tops_vest`
- `legwear_socks`

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

## user_category_settings (将来対応)

カテゴリ表示設定を行単位で持つ将来テーブル案です。  
現時点では未実装で、現行実装は `users.visible_category_ids` を使います。

前提方針:

- `user_settings` / `user_preferences` にはカテゴリ個別設定を増やさない
- category master の階層は `category_groups` / `category_master` を正本とする
- ユーザー側では `user_id + category_id` 単位で表示可否を持つ
- onboarding のプリセット適用も、最終的にはこの行データの初期投入で表現する方向を優先する

### Columns

| column | type | description |
| --- | --- | --- |
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| category_id | string | 中分類ID |
| is_visible | boolean | 表示可否 |
| sort_order_override | unsigned int nullable | 将来の表示順上書き用。現時点では未実装想定 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### Constraints

- unique(`user_id`, `category_id`)
- `user_id` は `users.id` を参照する
- `category_id` は `category_master.id` を参照する

補足:

- 大分類状態は行データ群から算出し、専用列は持たない
- 表示順上書きが不要な段階では `sort_order_override` を持たない縮小案でもよい
- 表記ゆれや onboarding プリセット差分は、保存形式ではなく初期投入ルールで吸収する方向を優先する

---

## tags (将来対応)

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

## item_tags (将来対応)

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

## outfit_tags (将来対応)

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

## 現在の設計方針

現在は初期実装範囲を優先し、色・季節・TPO・spec を JSON で保持しています。  
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

## wear_logs

着用履歴 / 着用予定を扱うテーブルです。  
初期実装範囲では snapshot を持たず、最終的な item 群と参照先の現在のデータを組み合わせて扱う前提とします。

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
- `source_outfit_id` は由来参照であり、wear log 内 item 構成の正本ではない
- outfit の詳細仕様は `docs/specs/outfits/create-edit.md` を参照
- API schema は `docs/api/openapi.yaml` の `WearLogUpsertRequest` / `WearLogListItem` / `WearLogDetail` を参照

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
- `source_item_id` は `items.id` を参照し、snapshot なし継続の間は現在の item 参照を前提とする
- `source_item_id` は nullable のままにし、物理削除が入った場合も履歴 record 自体は残せる退避余地を持つ
- `item_source_type` は request のバリデーション上 `outfit` / `manual` に固定する
- 同一 wear log 内で同一 `source_item_id` の重複は不可
- 同一 wear log 内で同一 `sort_order` の重複は不可
- `sort_order` は `1, 2, 3...` の連番を前提とする
- 現行実装では frontend が `sort_order` を `1, 2, 3...` で採番して送信し、backend は欠番のない連番であることと重複がないことを確認して受け取った値を保存する
- `wear_log_id` は `wear_logs.id` への FK 連動削除を持ち、wear log 削除時に孤児化しない
- wear logs 全体の詳細仕様は `docs/specs/wears/wear-logs.md` を参照

### Design Notes

- `planned` / `worn` は同一レコードで管理する
- `worn -> planned -> worn` のような再変更も許可し、常に最終保存状態を正とする
- 1 wear log = 1着用イベント
- 同日複数件を許容する
- 時刻は持たず、`event_date + display_order` で順序を表現する
- outfit は任意で、item なしの記録も許可する
- item を指定した場合、保存時は最終的な item 群を `wear_log_items` に持ち、これを wear log 内 item 構成の正本とする
- 初期実装範囲では snapshot カラムは持たない
- snapshot なし継続のため、item は原則物理削除せず `disposed` を優先して現在の item 参照を維持する
- `disposed` item や `invalid` outfit は新規登録・更新時の候補から除外する
- 編集時は、既存 record に含まれる現在候補外の item / outfit を同一 record の再保存に限り保持できる
- `current status` は履歴の主表示ではなく補助情報として扱う
- 詳細は `docs/specs/wears/wear-logs.md` を参照

---

## event_logs (将来対応)

重要な状態変化や副作用のある操作を記録する将来テーブル案。
初期実装範囲ではアプリケーションログとイベントログを分けて考え、ここではイベントログを想定する。

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

- 初期実装範囲では重要な状態変化のみを対象とする
- 例: `item_disposed` `item_reactivated` `outfit_invalidated` `outfit_restored` `outfit_duplicated`
- 軽微な編集や一覧閲覧は対象外とする
- 詳細方針は `docs/specs/logging/logging-policy.md` を参照
- `user_id` はイベントを発生させた実行ユーザーIDを表す
- `resource_type` は初期実装範囲では `item` / `outfit` / `wear_log` を想定する
- `payload_json` は完全な before / after 保存ではなく、理由・関連ID・補助情報を最小限で持つ方針とする

---

## Tagging Design Summary (将来対応)

今回の草案で決めたこと:

- タグは共通マスタではなく、ユーザー単位で持つ
- タグは補助分類として使い、カテゴリ / TPO / 季節 / 天気の正式項目の代替にはしない
- 雨対応は `items.is_rain_ok` を先に持ち、`weather_tags` のような拡張は後回しにする
- タグ保存値に `#` は含めず、UI 表示だけで `#` を付けてもよい

将来の拡張ポイント:

- `outfit_log_tags` を追加する場合は `tags` を再利用し、着用履歴にも同じタグ体系を適用できるようにする
- モデルは `Item / Outfit / Tag` の `belongsToMany` を前提に整理すると拡張しやすい

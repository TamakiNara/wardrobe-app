# Item Duplicate / Color Variant

item 詳細画面から行う「複製」「色違い追加」の仕様を整理する。  
共通概念の正本は `docs/specs/duplicate-color-variant.md` とし、この資料では item 固有の API / DB / UI / 引き継ぎ項目 / テスト観点を扱う。

関連資料:

- 共通方針: `docs/specs/duplicate-color-variant.md`
- item 詳細 UI: `docs/specs/items/detail-status-ui.md`
- item form: `docs/specs/items/form-structure.md`
- item 一覧: `docs/specs/items/list-filters.md`
- item status: `docs/specs/items/status-management.md`
- API: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`

---

## 目的

- item 詳細画面から既存 item を元に新規 item draft を作れるようにする
- 「複製」と「色違い追加」の操作概念を purchase candidate 側とそろえる
- ただし item は実物管理であるため、一覧 UI までは purchase candidate と完全一致させない

---

## current / planned / 要再判断

### current

- item 詳細画面には `複製` / `色違い追加` 導線がない
- item 側に color variant group 概念はない
- item 作成画面は purchase candidate 由来の初期値受け取りを持つが、item duplicate / color-variant draft 受け取りは持たない
- item 保存時は、元画像の path をそのまま参照し続けず、新 item 用保存先へ物理コピーできる既存実装がある
- `care_status` は item 個体の運用状態として扱っている
- item 一覧 API は group-aware response ではなく、1 item 1 record 表示を前提としている

### planned

- item 詳細画面から `複製` / `色違い追加` を実行できるようにする
- `POST /api/items/{id}/duplicate` / `POST /api/items/{id}/color-variant` で draft payload を返す
- item 側にも `item_groups` / `items.group_id` / `items.group_order` を追加する
- 色違い追加保存時は `variant_source_item_id` を使って group を解決する
- item 詳細画面で同じ group の item 一覧を表示する
- 新規作成画面で注意カードと確認推奨バッジを表示する

### 要再判断

- item 一覧で group 折りたたみ表示を行うか
- item 一覧カードに「色違いあり」バッジを出すか
- group_order 並び替え UI を初期実装に含めるか
- 色違い group の解除 / 統合 / 分割 UI をいつ扱うか
- group 名を持たせるか
- 「同型別素材」まで同一 group とみなすか

推奨方針:

- 初回実装では item 一覧の group 折りたたみ表示は行わない
- 将来検討として「色違いあり」バッジ程度は許容する

---

## item 側で purchase candidate 側とそろえる範囲

- 詳細画面起点であること
- draft payload を返すだけで即保存しないこと
- 色違い追加では色項目を空にすること
- 通常複製では group を引き継がないこと
- 色違い追加では保存時に group を解決すること
- 画像を draft に含め、保存時は新データ用保存先へ物理コピーすること
- 注意カードと確認推奨バッジで、引き継いだ値の再確認を促すこと

### item 側で差を許容する範囲

- item 一覧は group-aware 折りたたみ表示にしない
- item は実体として所持数に直結するため、色違いでも一覧では 1 件ずつ独立表示を維持する
- 詳細画面では同じ group の item を見せるが、一覧 API の response shape までは purchase candidate と統一しない

---

## UI 方針

### 詳細画面

- item 詳細画面に `複製` と `色違い追加` を置く
- `手放す` / `クローゼットに戻す` / 削除系操作と近づけすぎず、誤操作しにくい位置に置く
- 同じ group の item がある場合は、詳細下部または関連情報領域に表示する
- ラベル候補:
  - `同じ色違いグループのアイテム`
  - `色違い一覧`
  - `同じ商品の別カラー`

### 新規作成画面

- duplicate / color-variant 起点の item new 画面では、元データを引き継いだことを示す注意カードを画面上部に表示する
- 画像 / price / purchased_at / memo は確認推奨項目として扱い、各項目にもバッジを表示する
- 色違い追加では画像も仮引き継ぎとして扱い、差し替え推奨の文言を表示する

#### 注意カード文言例

- `元データの情報を引き継いでいます。画像・価格・購入日は、実際の内容に合わせて必要に応じて修正してください。`

#### 画像注意文言例

- `元アイテムの画像を仮で引き継いでいます。実際のアイテムに合わせて必要に応じて差し替えてください。`

#### アイコン候補

- 第一候補: `TriangleAlert`
- 代替候補: `CircleAlert`
- 情報寄り: `Info`

補足:

- 実装時には `lucide-react` の export 名を確認する
- 現時点では保存前モーダルは不要とする

---

## API 方針

### draft 生成 API

- `POST /api/items/{id}/duplicate`
- `POST /api/items/{id}/color-variant`

### 役割

- どちらも item を保存せず、item 作成画面に渡す draft payload を返すだけとする
- source item を更新しない
- 実際の保存は既存の `POST /api/items` で行う
- color-variant draft には `variant_source_item_id` を含める
- `variant_source_item_id` は保存時の一時入力値としてのみ扱い、items table 永続カラム前提にはしない

### 期待 payload 方針

- 現在の item create payload と互換の初期値を返す
- duplicate / color-variant 起点であることを frontend が判断できる補助情報を返してよい
- 注意表示対象項目を frontend 側で再計算できるなら、専用フラグを必須にはしない

---

## DB 方針

### 第一候補

- `item_groups`
- `items.group_id`
- `items.group_order`

### 保存時の色違い group 解決

- 元 item に `group_id` がある場合、新 item も同じ `group_id` に所属させる
- 元 item に `group_id` がない場合、新規 group を作成する
- その場合、元 item と新 item を同じ group に所属させる
- `group_order` は初回実装では source item の末尾追加を第一候補とする
- group は user をまたがない
- 他ユーザーの item を `variant_source_item_id` に指定できないようにする

### status との関係

- 元 item が `disposed` でも、color-variant 保存後の新 item は `active` で開始する
- 元 item の `disposed` 状態は変更しない
- 通常複製でも新 item は `active` 開始とする

---

## 引き継ぎルール

### 複製・色違い追加の両方で draft に引き継ぐ項目

- category
- brand
- shape
- spec
- size_gender
- size_label
- size_note
- size_details
- materials
- seasons
- tpo_ids
- tpos（表示名の互換値。current の新規 form 初期選択は `tpo_ids` を正本として復元する）
- sheerness
- is_rain_ok
- purchase_url
- price
- purchased_at
- memo
- images

### planned 扱いで引き継ぎ対象に含める項目

- shop / purchase shop
- tags

補足:

- `shop / purchase shop` は item 現行 schema / form に未実装のため planned 扱いとする
- `tags` も item 側は将来追加予定であり、現時点では draft 引き継ぎ仕様だけを先に定義する
- 同じ商品やまとめ買いを起点に複製するケースを想定し、`price` と `purchased_at` は draft に含める
- `price` / `purchased_at` / `memo` / `images` は個体差が出やすいため、確認推奨項目とする

### 色違い追加で空にする項目

- main color
- sub color
- main color custom label
- sub color custom label
- custom color mode
- custom color hex
- その他、色に紐づく表示・補助項目

### 引き継がない項目

- id
- group_id
- group_order
- created_at
- updated_at
- disposed 状態
- disposed_at
- disposed_reason
- care_status
- outfit links
- wear logs
- wear_count
- last_worn_at
- その他、その個体の運用状態・履歴に属するもの

補足:

- `group_id` は duplicate draft には含めない
- color-variant でも draft には `group_id` を含めず、保存時に `variant_source_item_id` から解決する
- `care_status` は商品属性ではなく個体運用状態なので、複製・色違い追加のどちらでも引き継がない

---

## 画像方針

- item 側の複製・色違い追加では画像を draft に含める
- 保存時は元画像を参照し続けず、新 item 用保存先へ物理コピーする
- 元 item 側の画像削除が新 item 側へ影響しないようにする
- color-variant では画像が実物と異なる可能性が高いため、差し替え推奨文言を必ず出す

---

## 一覧・詳細表示方針

### item 一覧

- 初回実装では group-aware 折りたたみ表示を行わない
- 色違いでも 1 item 1 record として一覧表示する
- 理由:
  - item は実体として存在する所持品であり、色違いでも独立表示の方が自然
  - カテゴリ / 季節 / TPO / 色 / 下着分離 / disposed などの既存絞り込みと group 折りたたみを同時に入れると複雑になる
  - 所持数の直感とずれやすい
  - 一覧 API 変更影響が大きい

### item 詳細

- 同じ group の item を表示する
- `disposed` item を source にして作られた active item も同 group として見える前提でよい
- 通常一覧に出さない `disposed` item を詳細の同 group ナビに含めるかは実装時の UI 容量に応じて判断してよい
- 初期推奨は、詳細では `disposed` を含めて見せられる方が関係理解に役立つ

---

## テスト観点

### 複製

- draft が返る
- DB に新規 item が作成されない
- `group_id` が引き継がれない
- 色項目は通常複製では引き継がれる
- 画像が draft に含まれる
- price が draft に含まれる
- purchased_at が draft に含まれる
- memo が draft に含まれる
- care_status は引き継がれない
- outfit links / wear logs は引き継がれない
- 他ユーザーの item では生成できない
- disposed item からでも draft 生成できる

### 色違い追加

- draft が返る
- DB に新規 item が作成されない
- 色項目が空になる
- 画像が draft に含まれる
- price が draft に含まれる
- purchased_at が draft に含まれる
- memo が draft に含まれる
- 注意表示対象として扱われる
- 保存時に同じ group に所属する
- 元データに group がない場合は group が作成される
- 元データに group がある場合は同じ group に所属する
- 元 item が disposed でも新 item は active 開始になる
- 他ユーザーの item を source に指定できない

### 画像

- draft に画像情報が含まれる
- 保存時に新 item 用保存先へコピーされる
- 元画像を参照し続けない
- 元 item 側の画像削除が新 item 側に影響しない

### UI

- 詳細画面に `複製` / `色違い追加` を表示できる
- 新規作成画面に注意カードが表示される
- 画像 / price / purchased_at / memo に確認推奨バッジを表示できる
- 詳細画面に同じ色違いグループの item を表示できる

---

## 実装時に影響しそうなファイル

### docs

- `docs/specs/duplicate-color-variant.md`
- `docs/specs/items/duplicate-color-variant.md`
- `docs/specs/items/detail-status-ui.md`
- `docs/specs/items/form-structure.md`
- `docs/specs/items/list-filters.md`
- `docs/specs/items/status-management.md`
- `docs/specs/purchase-candidates.md`
- `docs/api/openapi.yaml`
- `docs/data/database.md`
- `docs/project/implementation-notes.md`

### frontend

- `web/src/app/items/[id]/page.tsx`
- `web/src/app/items/new/page.tsx`
- `web/src/lib/api/items.ts`
- `web/src/types/items.ts`
- item detail / item form 関連 component 群

### backend

- `api/routes/web.php`
- `api/app/Http/Controllers/ItemsController.php`
- `api/app/Http/Requests/ItemUpsertRequest.php`
- `api/app/Services/Items/ItemStoreService.php`
- `api/app/Support/ItemImageSync.php`
- `api/app/Support/ItemsIndexQuery.php`
- item group 追加時の migration / model / support 群

### tests

- `api/tests/Feature/ItemsEndpointsTest.php`
- `web/src/app/items/[id]/page` 周辺 test
- `web/src/app/items/new/page` 周辺 test

---

## 未決事項・将来検討

- item 一覧での group 折りたたみ表示
- group の代表 item の決め方
- group_order の並び替え UI
- 色違い group の解除 / 統合 / 分割
- group 名を持つか
- 「同型別素材」まで group に含めるか
- 一覧カードで「色違いあり」バッジを出すか

推奨方針:

- 初回実装では detail 中心で関係表示し、一覧は独立表示を維持する
- group はまず薄い関連付けとして導入し、編集 UI は後続検討とする

# 買い物メモ

## 概要

買い物メモは、複数の purchase candidate を一時的にまとめて比較するための機能である。

- 本物の EC カートではない
- 購入確定機能ではない
- ネット注文だけでなく、実店舗で探す候補まとめにも使える
- 複数の purchase candidate を一時的に束ねる検討単位として扱う

例:

- UNIQLO 店舗で見る候補
- ZOZO で比較する候補
- 春夏セール候補
- 今月買うか迷っているもの
- 旅行前に買う候補
- 駅ビルで探す候補

## 用語

- purchase candidate:
  - 1 商品ごとの購入候補
- 買い物メモ:
  - 複数の purchase candidate をまとめる一時的な比較単位
- group:
  - 買い物メモ詳細で候補をまとめて表示する単位
  - current では `domain` / `brand` / `uncategorized`

## current 機能範囲

current では以下が実装済み、または current 方針として確定している。

- 買い物メモ一覧
- 買い物メモ作成
- 買い物メモ詳細
- 購入検討一覧から既存買い物メモへ追加
- 買い物メモ詳細から購入検討詳細へ遷移
- 購入検討詳細から元の買い物メモ詳細へ戻る導線
- 買い物メモ詳細で候補をメモから外す
- domain / brand / 未分類 group 表示
- 商品小計 / group 小計 / memo 小計
- セール価格・期限表示
- 価格未設定表示
- `purchased` / `dropped` は合計対象外

## MVP でやること / やらないこと

### current でやること

- 買い物メモを作成する
- 買い物メモ一覧を見る
- 買い物メモ詳細を見る
- 購入検討一覧から複数候補を既存買い物メモへ追加する
- 買い物メモ詳細で候補をメモから外す
- 候補を domain / brand / 未分類でグループ表示する
- 商品小計 / group 小計 / memo 小計を表示する
- セール価格・期限・価格未設定を表示する
- 購入検討詳細へ遷移する

### current でやらないこと

- 送料
- クーポン
- `shopping_memo_group_adjustments`
- manual group
- import / export
- 新規買い物メモを作成して即追加
- 買い物メモ詳細内で候補検索して追加
- 購入検討詳細から単体で追加
- 購入検討自体の削除

## DB 設計

### shopping_memos

fields:

- `id`
- `user_id`
- `name`
- `memo`
- `status`
- `created_at`
- `updated_at`

current 方針:

- `name` は required
- `memo` は nullable
- `status` は `draft` / `closed`
- default は `draft`
- user ごとの name 重複は許可
- `closed_at` は未実装
- soft delete は未実装

index:

- `user_id`
- `status`
- `user_id, status`

### shopping_memo_items

fields:

- `id`
- `shopping_memo_id`
- `purchase_candidate_id`
- `quantity`
- `priority`
- `memo`
- `sort_order`
- `created_at`
- `updated_at`

current 方針:

- `quantity` は required、default `1`
- MVP UI では quantity は基本 `1`
- `priority` は nullable
- `memo` は nullable
- `sort_order` は required、default `0`
- `shopping_memo_id + purchase_candidate_id` は unique

index / constraint:

- index: `shopping_memo_id`
- index: `purchase_candidate_id`
- unique: `shopping_memo_id, purchase_candidate_id`
- index: `shopping_memo_id, sort_order`

削除方針:

- memo 削除時は `shopping_memo_items` も cascade
- purchase candidate 削除は restrict 方針

### planned

- `shopping_memo_group_adjustments`
  - 送料 / クーポン / manual group を入れる段階で追加を再判断する

## API

current API:

- `GET /api/shopping-memos`
- `POST /api/shopping-memos`
- `GET /api/shopping-memos/{id}`
- `PATCH /api/shopping-memos/{id}`
- `DELETE /api/shopping-memos/{id}`
- `POST /api/shopping-memos/{id}/items`
- `DELETE /api/shopping-memos/{id}/items/{itemId}`

### `GET /api/shopping-memos`

用途:

- 買い物メモ一覧表示

主な response:

- `id`
- `name`
- `memo`
- `status`
- `item_count`
- `group_count`
- `subtotal`
- `has_price_unset`
- `nearest_deadline`
- `created_at`
- `updated_at`

### `POST /api/shopping-memos`

用途:

- 買い物メモ作成

request:

- `name`
- `memo`

### `GET /api/shopping-memos/{id}`

用途:

- 買い物メモ詳細表示

response:

- memo 本体
- `groups[]`
- `items[]`

item には少なくとも以下を含む:

- `shopping_memo_item_id`
- `purchase_candidate_id`
- `name`
- `status`
- `price`
- `sale_price`
- `unit_price`
- `line_total`
- `sale_ends_at`
- `discount_ends_at`

### `PATCH /api/shopping-memos/{id}`

用途:

- メモ名 / memo / status 更新

### `DELETE /api/shopping-memos/{id}`

用途:

- 買い物メモ削除

### `POST /api/shopping-memos/{id}/items`

用途:

- bulk add
- 購入検討一覧から複数候補を既存メモへ追加する

request:

- `purchase_candidate_ids: number[]`

current 挙動:

- duplicate は skip
- `purchased` / `dropped` は invalid status として skip
- 他 user の candidate や存在しない candidate は skip
- partial success を返す

主な response:

- `added_count`
- `skipped_count`
- `duplicate_count`
- `invalid_status_count`

### `DELETE /api/shopping-memos/{id}/items/{itemId}`

用途:

- 買い物メモと購入検討の紐づきを外す

注意:

- `{itemId}` は `shopping_memo_items.id`
- `purchase_candidate_id` ではない

### ownership check

current backend は以下を前提にする。

- shopping memo は user ごとのデータ
- 他 user の shopping memo は参照不可
- 他 user の purchase candidate は追加不可
- remove item でも memo owner を確認する
- 削除対象 item が該当 memo に属していることを確認する

## 画面

current frontend:

- `/shopping-memos`
- `/shopping-memos/new`
- `/shopping-memos/[id]`
- `/purchase-candidates` から買い物メモ追加
- `/purchase-candidates/underwear` からも買い物メモ追加

navigation:

- shopping-memos 配下は bottom nav 表示対象
- bottom nav の active は購入検討扱い
- bottom nav に買い物メモ項目は追加しない
- 購入検討一覧ヘッダーから `/shopping-memos` への導線を置く
- 買い物メモ画面のパンくずから `/purchase-candidates` へ戻れる

## 購入検討一覧からの追加導線

current:

- 購入検討一覧で選択モードに入る
- 追加先買い物メモを先に選ぶ
- 候補を checkbox で選択する
- 既存 draft メモへ追加する
- 追加先未選択または候補未選択の間は追加ボタンを disabled にする

追加先メモ:

- 追加先は既存 `draft` メモのみ
- `closed` メモは追加先に出さない

メモがない場合:

- draft メモがない場合は作成リンクを表示する
- fetch 失敗と draft 0 件は文言を分ける

候補選択 UI:

- 単体候補:
  - 右側情報欄上部の軽い checkbox
- 色違い / 複数候補:
  - 候補ごとの選択枠
- 画像左上 checkbox は使わない

選択範囲:

- 同一ページ内選択が基本
- ページまたぎ選択はしない
- filter / sort / pagination 変更時は選択解除前提

status:

- `considering` / `on_hold` を追加対象にする
- `purchased` / `dropped` は checkbox disabled
- backend response の `invalid_status_count` も結果表示に反映する

未実装:

- 既に追加済みの候補を一覧上で分かるようにする

## 買い物メモ詳細表示

### 上部

- 買い物メモ名
- status badge
- memo
- summary
  - 候補数
  - group 数
  - 小計
  - `一番近い期限`
  - `has_price_unset`

`一番近い期限` は、各 item の `sale_ends_at` / `discount_ends_at` のうち最も近い日時を代表期限として集計したものを指す。

### group 表示

current:

- group 名を主表示
- `サイト` / `ブランド` / `未分類` の強い visible label は出さない
- group 小計は複数 item group のみ表示
- group 小計は card 下部右側に `小計` として表示
- 1件 group では group 小計を出さない
- `グループ小計` という文言は使わない

### item 表示

current:

- item は強い card ではなく軽い list item 寄せ
- 画像は軽いサムネイル表示
- 商品名を主表示
- 商品名行の右側に CircleX icon-only の `買い物メモから外す` 操作を置く
- 価格は右側表示
- セール価格優先
- 通常価格は控えめな打ち消し
- item 内の期限表示は代表期限 1 本だけ
- `期限間近` / `期限切れ` badge を表示する
- quantity `1` は表示しない
- quantity `2` 以上の表示余地は残す
- `行小計` は出さない
- item card は `lg` 以上で 2 列表示
- `購入検討詳細を見る` を表示する
- `商品ページ` を表示する

期限の扱い:

- `sale_ends_at`
  - user-facing では `販売終了日`
- `discount_ends_at`
  - user-facing では `セール終了日`
- 買い物メモ詳細では、比較しやすさを優先して両者を個別表示せず、item ごとに最も近い日時だけを `期限` として表示する
- 上部 summary の `一番近い期限` も同じ代表期限ロジックを使う

### 候補をメモから外す

current:

- icon-only button で候補をメモから外せる
- 購入検討自体は削除しない
- `aria-label="買い物メモから外す"` を付ける
- confirm を出す
  - `この候補を買い物メモから外しますか？`
  - `購入検討一覧には残ります。`
- 成功時:
  - `買い物メモから外しました。`
- 失敗時:
  - `買い物メモから外せませんでした。`
- 削除成功後は detail を再取得し、group / subtotal / item_count / nearest_deadline を更新する
- 候補が 0 件になった場合は empty state を表示する
- current backend 実装に合わせて `closed` memo でも外せる

## 買い物メモ詳細から購入検討詳細への遷移

current:

- 買い物メモ詳細から購入検討詳細へ遷移するとき、query で戻り元を渡す
- query parameter:
  - `from_shopping_memo_id`
- 購入検討詳細側では、この query が有効な場合だけ `買い物メモへ戻る` を表示する
- 通常の購入検討詳細アクセスでは表示しない
- metadata は query によって変えない

## 金額計算

current:

- `unit_price = sale_price ?? price`
- quantity は DB にあるが、MVP UI では基本 `1`
- `considering` / `on_hold` は合計対象
- `purchased` / `dropped` は合計対象外
- price unset は合計対象外
- `has_price_unset` を表示する
- group subtotal / memo subtotal を表示する

## group resolution

current:

- `purchase_url` が有効なら domain group
- URL がない / 不正で `brand_name` があれば brand group
- どちらもなければ uncategorized
- host は lowercase
- `www.` は除外
- それ以外の subdomain は別 group
- group sort は `domain -> brand -> uncategorized`

注意:

- 初期の設計案では `brand_id` 仮説があった
- current 実装は `brand_name` ベースである

## status / edge cases

current:

- 追加対象:
  - `considering`
  - `on_hold`
- 追加対象外:
  - `purchased`
  - `dropped`
- `purchased` / `dropped` は detail 表示には残す
- ただし合計対象外とする
- price unset は detail に表示しつつ、合計対象外にする
- invalid / duplicate / skipped は add items response で返す

closed memo:

- current backend 実装では item remove を禁止していない
- closed 全体の編集制御方針は未整理

## import / export 方針

current:

- MVP 初回では import/export 対象外

planned:

- 将来対象にする場合、restore 順序は `purchase_candidates` の後
- 対象候補:
  - `shopping_memos`
  - `shopping_memo_items`
  - 将来 `shopping_memo_group_adjustments`

## 未実装 / planned

- 既に買い物メモに追加済みの購入検討を一覧上で分かるようにする
- 買い物メモ追加モードで現在選択中の候補を見える化するか検討する
- 買い物メモ詳細内で候補を追加する UI
- 購入検討詳細から単体で買い物メモへ追加する導線
- 新規買い物メモを作成して即追加する導線
- closed memo の編集制御方針
- 送料 / クーポン
- `shopping_memo_group_adjustments`
- manual group
- import / export
- 買い物メモ確認用 seed
- 買い物メモ詳細のさらなる表示改善

## 後続タスク

優先度が比較的高い後続候補:

- 既追加候補の見える化
- 買い物メモ詳細内の候補追加
- 購入検討詳細からの単体追加
- closed memo 編集制御の整理

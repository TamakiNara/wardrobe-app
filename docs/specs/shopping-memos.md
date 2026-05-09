# 買い物メモ

## 概要

- 機能名は `買い物メモ`
- EC サイトの本物のカートではなく、`purchase_candidates` を一時的にまとめる比較・検討単位
- ネット注文候補だけでなく、実店舗で探したい候補の整理にも使う

## 用語

- `shopping_memos`
  - 買い物メモ本体
- `shopping_memo_items`
  - 買い物メモと purchase candidate の紐づき
- `代表期限`
  - 買い物メモ上で比較用に 1 本へ畳んで見せる期限
  - `sale_ends_at` と `discount_ends_at` のうち近い方

## current 機能範囲

- 買い物メモ一覧
- 買い物メモ作成
- 買い物メモ詳細
- 購入検討一覧から既存買い物メモへ追加
- 購入検討一覧から既存買い物メモ内の候補を追加 / 解除で調整
- 買い物メモ詳細から購入検討詳細へ遷移
- 購入検討詳細から元の買い物メモ詳細へ戻る導線
- 買い物メモ詳細で候補をメモから外す
- `domain / brand / 未分類` group 表示
- 商品小計 / group 小計 / memo 小計
- セール価格・期限表示
- 価格未設定表示
- `purchased / dropped` は合計対象外
- `shopping_memos` / `shopping_memo_items` の import / export

## MVP でやること / やらないこと

### やること

- 買い物メモを作成する
- 購入検討一覧から複数候補を既存メモへ追加する
- 買い物メモ一覧を見る
- 買い物メモ詳細を見る
- 候補をメモから外す
- group 表示する
- 小計と全体合計を表示する
- 期限を確認する

### やらないこと

- 送料
- クーポン
- `shopping_memo_group_adjustments`
- manual group
- seed 追加
- import/export 用 UI

## DB 設計

### `shopping_memos`

fields:

- `id`
- `user_id`
- `name`
- `memo`
- `status`
- `created_at`
- `updated_at`

制約 / index:

- `user_id` index
- `status` index
- `user_id, status` index

方針:

- `name` は required
- `memo` は nullable
- `status` は `draft | closed`
- default は `draft`
- `user_id` は export しない

### `shopping_memo_items`

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

制約 / index:

- `shopping_memo_id` index
- `purchase_candidate_id` index
- unique `shopping_memo_id + purchase_candidate_id`
- `shopping_memo_id, sort_order` index

方針:

- `quantity` は required、default `1`
- MVP UI では quantity は基本 `1`
- `priority` / `memo` は nullable
- memo 削除時は `shopping_memo_items` も cascade
- purchase candidate 削除は restrict 方針

### 未実装

- `shopping_memo_group_adjustments`

## API

current API:

- `GET /api/shopping-memos`
  - 一覧取得
- `POST /api/shopping-memos`
  - 作成
- `GET /api/shopping-memos/{id}`
  - 詳細取得
- `PATCH /api/shopping-memos/{id}`
  - name / memo / status 更新
- `DELETE /api/shopping-memos/{id}`
  - memo 削除
- `POST /api/shopping-memos/{id}/items`
  - 既存 memo への bulk add
- `DELETE /api/shopping-memos/{id}/items/{itemId}`
  - memo item 削除

補足:

- add items は bulk add
- duplicate / invalid status / skipped を返す
- remove item の `{itemId}` は `shopping_memo_items.id`
- すべて ownership check 前提
- bulk add / remove には Laravel structured log を導入済み
  - `shopping_memo.items.add.start`
  - `shopping_memo.items.add.completed`
  - `shopping_memo.items.add.failed`
  - `shopping_memo.items.remove.completed`
  - `shopping_memo.items.remove.failed`
- log には `result / count / elapsed_ms / shopping_memo_id / shopping_memo_item_id / purchase_candidate_id` を含める
- shopping memo memo 本文や purchase candidate 名は log に出さない

## 画面

current frontend:

- `/shopping-memos`
- `/shopping-memos/new`
- `/shopping-memos/[id]`
- `/purchase-candidates`
- `/purchase-candidates/underwear`

navigation:

- `shopping-memos` 配下は bottom nav 表示対象
- bottom nav の active は購入検討扱い
- bottom nav に `買い物メモ` 項目は追加しない

## 購入検討一覧からの追加導線

current:

- 購入検討一覧で選択モードに入る
- 追加先買い物メモを先に選ぶ
- 候補を checkbox で選ぶ
- 反映ボタンで追加 / 解除をまとめて反映する
- draft メモがない場合は作成リンクを表示する
- fetch 失敗と draft 0 件は文言を分ける
- 単体候補は右側情報欄上部の軽い checkbox
- 色違い / 複数候補は候補ごとの選択枠
- 画像左上 checkbox は使わない
- 同一ページ内選択が基本

### 選択中 memo に対する所属表示

- 追加済み候補は checked で表示する
- disabled にはしない
- チェックを外すと `解除予定`
- 未追加候補をチェックすると `追加予定`
- 件数表示は `追加 N件 / 解除 N件`
- 未追加の `purchased / dropped` は追加不可
- 追加済みの `purchased / dropped` は解除可能

## 買い物メモ詳細表示

### 全体

- group 名を主表示
- `サイト / ブランド / 未分類` の強い visible label は出さない
- item は強い card ではなく軽い list item 寄せ
- 画像は軽いサムネイル表示
- 価格は右側表示
- セール価格優先
- 通常価格は控えめな打ち消し
- item 内の期限表示は 1 本だけ
- `期限間近` / `期限切れ` badge を表示
- quantity `1` は表示しない
- quantity `2` 以上の表示余地は残す
- 複数 item group のみ下部右側に `小計` を表示
- 1 件 group では group 小計を出さない
- `行小計` は出さない
- `グループ小計` の文言は使わない
- item card は `lg` 以上で 2 列表示

### item action

- `商品ページ`
- `購入検討詳細を見る`
- 商品名行の右側に CircleX icon-only の `買い物メモから外す`
- confirm:
  - `この候補を買い物メモから外しますか？`
  - `購入検討一覧には残ります。`
- success:
  - `買い物メモから外しました。`
- failure:
  - `買い物メモから外せませんでした。`

### 買い物メモ詳細から購入検討詳細への遷移

- 買い物メモ詳細から購入検討詳細へ行くとき、query parameter で戻り元を渡す
- query name は `from_shopping_memo_id`
- 購入検討詳細側では、戻り元がある場合だけ `買い物メモへ戻る` を表示する
- 通常の購入検討詳細アクセスでは表示しない

## 金額計算

- `unit_price = sale_price ?? price`
- quantity は DB にあるが、MVP UI では基本 `1`
- `considering / on_hold` は合計対象
- `purchased / dropped` は合計対象外
- price unset は合計対象外
- `has_price_unset` を表示する
- group subtotal / memo subtotal を表示する

## group resolution

current:

1. `purchase_url` が有効なら domain group
2. URL がない / 不正で `brand_name` があれば brand group
3. どちらもなければ uncategorized

補足:

- host は lowercase
- `www.` は除外
- それ以外の subdomain は別 group
- sort は `domain -> brand -> uncategorized`

注意:

- 初期案には `brand_id` 仮説があったが、current 実装は `brand_name` ベース

## status / edge cases

### current backend API

- `PATCH /api/shopping-memos/{id}` は存在する
- `DELETE /api/shopping-memos/{id}` は存在する
- `POST /api/shopping-memos/{id}/items` は `closed` で 422
- `DELETE /api/shopping-memos/{id}/items/{itemId}` は current backend では `closed` でも通る
- import/export では `draft / closed` の status を保持する

### current frontend UI

- 買い物メモ一覧は実装済み
- 買い物メモ作成は実装済み
- 買い物メモ詳細は実装済み
- 購入検討一覧から既存 memo への候補追加 / 解除は実装済み
- 買い物メモ詳細で候補をメモから外す UI は実装済み
- 買い物メモ名 / memo 本文の編集 UI は未実装
- status を `closed` にする UI は未実装
- `closed` を `draft` に戻す UI は未実装
- 買い物メモ自体を削除する UI は未実装
- 購入検討一覧の追加先候補には `draft` memo だけを表示する

### current の意味

- `draft`
  - current UI で日常的に使う通常の買い物メモ
- `closed`
  - backend / seed / import-export 上は存在する status
  - current frontend では詳細表示できる
  - current frontend では追加先候補には出さない
  - ただし current frontend には `closed` へ変更する UI も、`draft` に戻す UI もまだない
  - そのため current では「完全な編集不可状態」とまでは確定していない

### 推奨する意味

- `draft`
  - 比較中のアクティブな買い物メモ
  - 候補追加 / 候補解除 / 将来の memo 編集の対象
- `closed`
  - 比較終了後の参照用メモ
  - 日常導線では追加先候補から外す
  - ただし、編集 / 削除 / reopen をどう扱うかは UI を作る前に決める

### 操作可否表

| 操作                            | backend API current | frontend UI current    | 推奨 / 後続                   |
| ------------------------------- | ------------------- | ---------------------- | ----------------------------- |
| 一覧表示                        | 可                  | 可                     | 維持                          |
| 詳細表示                        | 可                  | 可                     | 維持                          |
| 作成                            | 可                  | 可                     | 維持                          |
| name / memo 更新                | API は可            | UI 未実装              | 後続判断                      |
| status 更新 (`draft -> closed`) | API は可            | UI 未実装              | 終了操作を作る前に方針確定    |
| status 更新 (`closed -> draft`) | API は可            | UI 未実装              | reopen を許可するか要判断     |
| 買い物メモ削除                  | API は可            | UI 未実装              | 後続判断                      |
| 候補追加                        | `closed` は不可     | `draft` のみ追加先表示 | 維持                          |
| 候補解除                        | API は可            | UI 実装済み            | `closed` で許可するか後続判断 |
| 購入検討一覧の追加先候補に出す  | API 上は可能        | `draft` のみ表示       | 維持                          |
| import/export                   | 可                  | UI では直接操作対象外  | 維持                          |
| seed / demo data                | 可                  | `closed` seed あり     | 維持                          |

### UI 方針

- 一覧では `draft` を `検討中`、`closed` を `終了` として badge 表示する
- 詳細でも `終了` badge を表示する
- `closed` memo は購入検討一覧の追加先候補に出さない
- current frontend には `closed` へ変更する UI、`draft` に戻す UI、memo 削除 UI はまだない
- 将来 `closed` の編集制御を入れる場合は、詳細で「終了済みのメモです」の補足を出し、候補解除や memo 編集を隠す / disabled にする案を第一候補とする
- `closed -> draft` の reopen 導線が必要かは後続判断に残す

### backend 方針

- `POST /api/shopping-memos/{id}/items`
  - current でも `closed` は 422
  - この方針を維持する
- `DELETE /api/shopping-memos/{id}/items/{itemId}`
  - current では `closed` でも許可している
  - 将来 `closed` で禁止するか、UI とセットで判断する
- `PATCH /api/shopping-memos/{id}`
  - current では `name / memo / status` を status に関係なく更新できる
  - 将来は `closed` の編集可能範囲を絞るかを判断する
- `DELETE /api/shopping-memos/{id}`
  - current では `draft` / `closed` ともに許可できる
  - UI を作るかどうかは別判断

### current 実装との差分

- current backend には `PATCH` / `DELETE` API があるが、current frontend には対応 UI がまだない
- current backend は `closed` memo の item remove をまだ禁止していない
- current frontend でも `closed` detail 上の候補解除操作は残っている
- 一方で、購入検討一覧の追加先候補から `closed` memo を外す挙動、item add を拒否する挙動、status を import/export で保持する挙動は current と整理方針が一致している

### edge cases

- duplicate add は backend 側で skip
- 他 user の purchase candidate は追加不可
- `purchased / dropped` の新規追加は不可
- 価格未設定は合計対象外
- memo item remove は `shopping_memo_items.id` 指定
- `closed` memo の編集制御は backend API current と frontend UI current を分けて整理し、後続タスクとして扱う

## import / export 方針

current:

- `shopping_memos` は import/export 対象
- `shopping_memo_items` も import/export 対象
- `shopping_memo_group_adjustments` は未実装なので対象外

export payload:

- `shopping_memos`
  - `id`
  - `name`
  - `memo`
  - `status`
  - `created_at`
  - `updated_at`
- `shopping_memo_items`
  - `shopping_memo_id`
  - `purchase_candidate_id`
  - `quantity`
  - `priority`
  - `memo`
  - `sort_order`
  - `created_at`
  - `updated_at`

restore 順序:

1. `purchase_candidates`
2. `shopping_memos`
3. `shopping_memo_items`

restore 方針:

- `shopping_memos.id` は export 上の old id として保持し、restore 時の memo id mapping に使う
- `shopping_memo_items` は old `shopping_memo_id` と old `purchase_candidate_id` を new id に mapping して復元する
- mapping できない `purchase_candidate` に紐づく item は skip する
- `shopping_memo_id + purchase_candidate_id` の unique を前提に upsert する

seed との関係:

- 買い物メモ seed は import/export 対応後に追加する方が安全
- local / backup / restore / 環境移行で同じデータを再現しやすくなる

## demo / test seed

current:

- `standard-user@example.com` に画面確認用の買い物メモ seed を用意する
- `春夏物`
  - `draft`
  - domain group / 価格未設定 / 一番近い期限 / 複数 item group の小計を確認できる
- `店舗で見る候補`
  - `draft`
  - URL なし + `brand_name` ありの brand group を確認できる
- `見送り済み比較`
  - `closed`
  - closed memo の一覧 / 詳細表示と、購入検討一覧の追加先候補に出ないことを確認できる
- これらの memo は画面確認用の sample data であり、本番仕様そのものではない
- import/export 対応後の seed として追加し、backup / restore 方針と矛盾しない状態を保つ

## 未実装 / planned

- 既に買い物メモに追加済みの候補を一覧上でさらに分かりやすくする
- 買い物メモ追加モードで現在選択中の候補を見える化するか検討する
- 買い物メモ詳細内で候補を追加する UI
- 購入検討詳細から単体で買い物メモへ追加する導線
- 新規買い物メモを作成して即追加する導線
- closed memo の編集制御実装
- 送料 / クーポン
- `shopping_memo_group_adjustments`
- manual group
- `sale_ends_at / discount_ends_at` internal name 見直し後に必要なら期限表示を再調整する
- 買い物メモ詳細のさらなる表示改善

## 後続タスク

- 買い物メモ詳細内で候補を追加する UI
- 購入検討詳細からの単体追加
- closed memo 編集制御の実装
- `shopping_memo_group_adjustments`

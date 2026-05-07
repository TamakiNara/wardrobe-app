# 買い物メモ

買い物メモは、複数の purchase candidate を一時的にまとめて、金額・セール期限・ショップ / ブランド単位の条件を見ながら比較するための機能案である。

本物の EC カートではなく、購入確定機能でもない。ネット注文だけでなく、実店舗で探す候補をまとめる用途も含む。

例:

- UNIQLO 店舗で見る候補
- ZOZO で比較する候補
- 春夏セール候補
- 今月買うか迷っているもの
- 旅行前に買う候補
- 駅ビルで探す候補

---

## current / planned / 要再判断

### current

- 実装なし
- purchase candidate は 1 商品単位の購入候補として管理する
- `price` / `sale_price` / `sale_ends_at` / `discount_ends_at` / `brand_id` / `purchase_url` など、買い物メモで再利用できる情報は purchase candidate 側に存在する

### planned

- purchase candidate を複数まとめる「買い物メモ」機能を追加する
- 一覧チェック選択から複数候補をまとめて追加する導線を MVP の第一候補にする
- グループごとの送料 / クーポン / 合計金額 / セール期限確認を行えるようにする

### 要再判断

- 名称を `買い物メモ` で確定するか、`購入プラン` を採るか
- MVP で manual group を入れるか
- `purchased` / `dropped` になった candidate を合計に含めるか
- backup / restore を MVP から含めるか

---

## 機能名の比較

### 買い物メモ

長所:

- EC の本物のカートと誤解されにくい
- 実店舗で探す用途にも自然
- 一時的な比較・整理の雰囲気がある
- 一覧 / 詳細 / 追加ボタンの文言にしやすい

短所:

- 金額計算や送料調整を持つと「メモ」より少し機能的に見える可能性がある

### 購入プラン

長所:

- 「買うかどうかを決めるための単位」として意味が明確
- 実店舗用途にも比較的合う

短所:

- 少し堅く、日常的な導線では重く見える
- 1 回限りの比較メモより、長期計画っぽく見える

### 検討セット

長所:

- 候補をまとめるだけの印象が強い

短所:

- UI ラベルとして少し不自然
- 買い物の文脈が弱い

### 買い物リスト

長所:

- 実店舗用途に自然

短所:

- 既に買うものが確定している印象がやや強い
- 単純な checklist に見えやすい

### 仮カート

長所:

- EC 比較用途では直感的

短所:

- 本物のカートと誤解されやすい
- 実店舗用途に合いにくい

### 比較リスト

長所:

- 比較機能としては分かりやすい

短所:

- 実店舗で探す候補の束ね方や「今月買うか迷っているもの」には少し硬い
- 送料やクーポンを持つと、比較だけではない

### 推奨

第一候補は **買い物メモ** とする。

理由:

- EC の本物のカートと誤解しにくい
- ネット注文と実店舗の両方に使いやすい
- purchase candidate を一時的にまとめる機能として自然
- 「買い物メモへ追加」「買い物メモ一覧」「買い物メモ詳細」の文言に展開しやすい

`購入プラン` は第 2 候補とし、より計画寄りの機能へ拡張する場合の代替案として残す。

---

## 機能の位置づけ

- purchase candidate
  - 1 商品ごとの購入候補
- 買い物メモ
  - 複数の purchase candidate をまとめる一時的な検討単位

前提:

- 本物の EC カートではない
- 購入確定処理ではない
- ネット注文だけでなく、実店舗で探す候補のまとめにも使う
- item 自動登録や注文連携は MVP 範囲外

---

## やりたいこと

- 購入サイトを横断して購入候補を一時的にまとめる
- 実店舗で探す候補もまとめる
- セール価格やセール終了日を見ながら比較する
- 合計金額を確認する
- 購入前の優先順位や組み合わせを検討する
- URL から同じ domain のものをまとめる
- `brand_id` を使ってブランド単位でまとめる
- URL がない候補も扱えるようにする
- group ごとに送料 / クーポンを考慮する

---

## MVP 案の比較

### 案A: 最小メモ機能

含める:

- `shopping_memos`
- `shopping_memo_items`
- 買い物メモ一覧
- 買い物メモ詳細
- 購入検討一覧から複数選択して追加
- メモから候補を外す
- 商品小計
- セール価格 / セール終了日の表示

含めない:

- `shopping_memo_group_adjustments`
- domain / brand の group 表示
- 送料
- クーポン
- group ごとの調整
- import / export

長所:

- 実装量が最も軽い
- DB と API が小さい
- test しやすい

短所:

- 「ショップ横断で比較する」価値がまだ弱い
- 買い物メモ固有の見どころが薄く、単なる候補束ねに寄りやすい

### 案B: group 表示まで含める MVP

含める:

- 案A の内容
- domain / brand / 未分類の自動グループ表示
- group ごとの小計

含めない:

- `shopping_memo_group_adjustments`
- 送料
- クーポン
- group ごとの調整
- import / export

長所:

- 「複数候補をまとめて、shop / brand ごとに見る」価値が出る
- DB は 2 テーブルで済みやすい
- 将来の送料 / クーポン拡張に繋げやすい

短所:

- 案A より表示ロジックは増える
- group order や未分類の見せ方を決める必要がある

### 案C: 送料・クーポンまで含める MVP

含める:

- 案B の内容
- `shopping_memo_group_adjustments`
- group ごとの送料
- group ごとのクーポン
- 調整後合計

長所:

- 当初イメージに近い
- group 単位の買い物判断まで初回でできる

短所:

- DB / API / UI / test が一気に増える
- 初回実装としては重い
- import / export を後で足す場合も整合確認が増える

### 推奨 MVP

推奨は **案B** とする。

理由:

- 「複数候補をまとめる」
- 「domain / brand 単位で見る」
- 「商品小計を見る」
- 「セール期限を確認する」

までできれば、初回でも使う価値が明確である。

一方で、

- `shopping_memo_group_adjustments`
- 送料
- クーポン
- import / export

は、初回から入れると DB / API / UI の重さが増えやすく、後続へ分離しやすい。

---

## MVP 範囲

### MVP でやること

- 買い物メモを作成する
- 購入検討一覧で複数候補をチェックして買い物メモへ追加する
- 買い物メモから候補を外す
- 買い物メモ詳細で候補一覧を確認する
- domain または brand ベースでグループ表示する
- 商品小計を出す
- group ごとの小計を表示する
- 全体の候補小計を表示する
- セール終了日が近い候補を目立たせる
- 購入検討詳細へ遷移できる

### MVP の優先導線

第一候補:

- 購入検討一覧で checkbox 選択
- 選択数表示
- `買い物メモへ追加`
- 既存メモに追加

第二候補:

- 購入検討詳細から単体追加

第三候補:

- 買い物メモ詳細内で候補検索して追加

推奨:

- MVP では **第一候補を必須**
- 新規メモ作成は先に買い物メモ一覧 / 作成画面で行う
- 余力があれば **第二候補も追加**
- 第三候補は planned

### MVP ではやらないこと

- `shopping_memo_group_adjustments`
- 送料入力
- クーポン入力
- group ごとの調整後合計
- EC サイト連携
- 価格の自動取得
- 在庫の自動確認
- 送料無料条件の自動判定
- クーポンの複数管理
- ショップマスタの本格管理
- 購入確定処理
- item 自動登録
- 通知
- 共有機能
- 実店舗の在庫管理

---

## データ設計案

### shopping_memos

候補 fields:

- `id`
- `user_id`
- `name`
- `memo`
- `status`
- `created_at`
- `updated_at`

status 候補:

- `draft`
- `closed`

planned 候補:

- `archived`

`decided` は purchase / order の確定機能に見えやすいため、MVP では採らず `closed` を第一候補とする。

### shopping_memo_items

候補 fields:

- `id`
- `shopping_memo_id`
- `purchase_candidate_id`
- `quantity`
- `priority`
- `memo`
- `sort_order`
- `created_at`
- `updated_at`

MVP:

- `quantity` は field を持ってもよいが、初回 UI は 1 固定を第一候補とする
- `priority` / `memo` は初回実装では未使用でもよい
- 将来拡張を見越して column を持つ案はあるが、実装時に再判断する

### shopping_memo_group_adjustments

候補 fields:

- `id`
- `shopping_memo_id`
- `group_type`
- `group_key`
- `display_name_snapshot`
- `shipping_fee`
- `coupon_discount`
- `memo`
- `created_at`
- `updated_at`

`group_type` 候補:

- `domain`
- `brand`
- `manual`

`group_key` 例:

- domain 文字列
- `brand:{brand_id}`
- manual key

`display_name_snapshot` は、brand 名変更や domain 解決不能時の履歴表示安定化のために持つ余地がある。

初回実装:

- **作らない**
- 送料 / クーポン / manual group 調整を入れる段階で追加を再判断する

---

## グループ化方針

### 選択肢

#### domain ベース

- `purchase_url` から domain を抽出
- ネット通販では自然
- URL がない候補には使えない

#### brand ベース

- `brand_id` を使う
- 実店舗で探す用途に合いやすい
- 同じブランドでも EC サイトが異なる場合にまとめられる

#### manual group

- ユーザーが任意にグループ名を付ける
- `駅ビルで見る` `UNIQLO 店舗` `旅行前` のような使い方に向く
- 柔軟だが、MVP では UI とデータ調整が増える

### 推奨

MVP の第一候補は **自動グループ化** とする。

優先順:

1. `purchase_url` がある場合は domain
2. URL がないが `brand_id` がある場合は brand
3. どちらもない場合は `未分類`

manual group は planned とする。ただし data model では `manual` を置けるようにしておく案が自然である。

初回実装では、group 情報を DB に保存せず **表示時に導出** する第一候補を採る。

導出ルール:

- `purchase_url` があれば domain
- URL がなく `brand_id` があれば brand
- どちらもなければ `未分類`

補足:

- domain は表示時に URL から都度計算する
- brand 名は purchase candidate response に含まれる `brand_id` と表示名を使う
- group order は `domain -> brand -> 未分類` を第一候補とし、同種内は表示名順でよい
- 将来 `shopping_memo_group_adjustments` を追加しても、導出 group を base にして拡張しやすい

理由:

- ネット通販と実店舗用途の両方を最小コストで扱える
- current の purchase candidate 情報だけで自動 group しやすい
- 初期実装で過度な UI 複雑化を避けられる

---

## 金額計算方針

### 価格の正本

- `sale_price` があれば `sale_price`
- なければ `price`
- どちらもなければ未設定

### line total

- `line_total = unit_price * quantity`

MVP:

- `quantity = 1` 固定を第一候補とする

### group subtotal

- 初回は `group_subtotal = item_totals`

### memo total

- 初回は `memo_total = group_subtotal` の合計

### 未設定価格

- 金額未設定の候補は一覧に残す
- 小計 / 合計では除外、または `未設定あり` を表示する

推奨:

- MVP では **未設定価格は合計に含めない**
- 代わりに `価格未設定` バッジや summary を表示する
- 送料 / クーポンは後続に回す

---

## セール情報の扱い

買い物メモ詳細では次を見られるようにする案を採る。

- セール価格
- `sale_ends_at`
- `discount_ends_at`
- 期限切れ候補
- セール終了が近い候補

MVP:

- 期限表示と強調まで
- 通知はやらない

期限の強調例:

- 期限切れ
- 24 時間以内
- 3 日以内

詳細なしきい値は実装時に要再判断。

---

## purchase candidate status との関係

### 追加可能な status

第一候補:

- `considering`
- `on_hold`

通常除外:

- `purchased`
- `dropped`

### 後から status が変わった場合

推奨:

- 買い物メモ内には残す
- `purchased` / `dropped` の状態バッジを表示する
- 合計は **active な candidate のみ含める** を第一候補とする

理由:

- 過去に比較していた履歴は残したい
- すでに買った / 見送った候補が合計に残ると current の判断を邪魔しやすい

要再判断:

- active total と all total を両方出すか

---

## 画面案

### 買い物メモ一覧

表示候補:

- memo name
- item count
- group count
- subtotal
- earliest `sale_ends_at`
- status

### 買い物メモ詳細

表示候補:

- memo summary
- group list
- purchase candidate cards
- `price` / `sale_price`
- `sale_ends_at` / `discount_ends_at`
- group subtotal
- memo subtotal
- memo
- candidate detail link

### 購入検討一覧からの追加

表示候補:

- checkbox
- selected count
- `買い物メモへ追加`
- 既存メモに追加
- 既に入っている候補の badge / checked 表示

初回実装の第一候補:

- 一覧で checkbox 選択
- 既存メモへ追加
- 新規メモ作成は別画面

後回し:

- 新規メモ作成して追加
- 買い物メモ詳細内で候補検索して追加
- 購入検討詳細から単体追加

---

## API 案

名称は `shopping-memos` を第一候補とする。

候補:

- `GET /api/shopping-memos`
- `POST /api/shopping-memos`
- `GET /api/shopping-memos/{id}`
- `PATCH /api/shopping-memos/{id}`
- `DELETE /api/shopping-memos/{id}`
- `POST /api/shopping-memos/{id}/items`
- `DELETE /api/shopping-memos/{id}/items/{itemId}`

補足:

- 初回実装では `group-adjustments` API は作らない第一候補とする
- group は response 側で導出表示する

---

## MVP 初回の DB schema 詳細設計

### shopping_memos

#### fields

- `id`
- `user_id`
- `name`
- `memo`
- `status`
- `created_at`
- `updated_at`

#### 推奨仕様

- `name`
  - 必須
  - user ごとの重複は許可
- `memo`
  - nullable
- `status`
  - `draft | closed`
  - 初期値は `draft`
- `closed`
  - 今回の比較・追加を止めたメモ
  - 履歴参照はできるが、新規 item 追加は不可を第一候補とする
- `display_order`
  - MVP では不要
- `closed_at`
  - MVP では不要
- soft delete
  - MVP では不要

#### 削除方針

- 物理削除を第一候補とする
- `shopping_memo_items` は memo 削除時に cascade で削除する案が自然
- `closed` は論理削除ではなく「運用を閉じる状態」として扱う

### shopping_memo_items

#### fields

- `id`
- `shopping_memo_id`
- `purchase_candidate_id`
- `quantity`
- `priority`
- `memo`
- `sort_order`
- `created_at`
- `updated_at`

#### 推奨仕様

- `quantity`
  - DB には持つ
  - null 不可
  - 初期値は `1`
  - MVP UI では 1 固定
- `priority`
  - nullable
  - MVP では未使用でもよい
- `memo`
  - nullable
  - MVP では未使用でもよい
- `sort_order`
  - 持つ
  - 一覧追加順を維持するために使う第一候補
- 同一 memo 内の同一 candidate
  - **一意**
  - `shopping_memo_id + purchase_candidate_id` unique

#### purchase_candidate 削除時

MVP の第一候補:

- `purchase_candidate_id` は FK で参照整合を維持する
- 参照中の candidate は削除不可、または先に memo から外す必要がある
- cascade delete は採らない

理由:

- 買い物メモが purchase candidate の派生比較機能である以上、候補が消えると比較文脈も崩れやすい
- 初回から snapshot テーブルを足さずに整合を保ちやすい

---

## 制約 / index 案

### shopping_memos

推奨:

- PK: `id`
- index: `user_id`
- index: `status`
- index: `user_id, status`
- 一覧並びは `updated_at desc` または `created_at desc` を第一候補とする

補足:

- user 単位の一覧取得が主用途なので `user_id` index は必須
- `user_id + status` は `draft` 一覧や `closed` 一覧を将来出す場合に有効

### shopping_memo_items

推奨:

- PK: `id`
- index: `shopping_memo_id`
- index: `purchase_candidate_id`
- unique: `shopping_memo_id, purchase_candidate_id`
- index: `shopping_memo_id, sort_order`

補足:

- 詳細画面は memo 単位で取得するので `shopping_memo_id` index は必須
- `sort_order` は memo 内表示順を安定させるための補助

---

## 権限 / 所有者チェック

- shopping memo は user ごとのデータ
- 他 user の shopping memo は参照不可
- 他 user の purchase candidate は追加不可
- item 追加時は `shopping_memo.user_id === purchase_candidate.user_id` を必須条件にする
- 更新 / 削除 / item remove 時も user_id を確認する

MVP の第一候補:

- controller / service 層で memo と candidate を user スコープで引く
- request body の id をそのまま信用しない

---

## purchase candidate status との関係

### 追加時

追加可能:

- `considering`
- `on_hold`

追加不可:

- `purchased`
- `dropped`

推奨:

- API 側で `purchased / dropped` を弾く
- frontend でも追加導線上は選択対象から外す、または選択時に skip 扱いにする

### 追加後に status が変わった場合

- memo 内には残す
- `purchased` / `dropped` の状態バッジを表示する
- 小計は **active (`considering` / `on_hold`) のみ含める** を第一候補とする
- inactive item は `合計対象外` と分かる UI を想定する

---

## group resolution 詳細仕様

### 解決ルール

1. `purchase_url` があり、有効な URL として host を取れる
   - domain group
2. URL がない、または無効 URL で `brand_id` がある
   - brand group
3. どちらもない
   - `未分類`

### domain 抽出

推奨:

- helper は purchase candidate 一覧 / 詳細 / 買い物メモ詳細から再利用しやすい場所に置く
  - 例: `web/src/lib/purchase-candidates/...` か shared util
- host は lower-case
- `www.` は除外
- 無効 URL は `未分類`

例:

- `https://www.uniqlo.com/jp/ja/products/...`
  - `uniqlo.com`
- `https://faq.uniqlo.com/...`
  - `faq.uniqlo.com`
- `https://www.gu-global.com/jp/ja/...`
  - `gu-global.com`

補足:

- `www.` だけは表示ノイズなので除外する
- それ以外の subdomain は別 group として扱う第一候補にする

### brand group 表示名

- purchase candidate response に含まれる brand 表示名を使う
- brand 名が解決できない場合は `ブランド未設定` ではなく `未分類` に寄せる第一候補にする

### group sort order

推奨:

- `domain`
- `brand`
- `uncategorized`

同 type 内:

- display name 昇順

---

## 金額計算仕様

### unit price

- `sale_price` があれば `sale_price`
- なければ `price`
- どちらもなければ未設定

### quantity

- DB では null 不可
- 初期値 1
- MVP UI では編集不可、1 固定

### line total

- `line_total = unit_price * quantity`

### subtotal

- group subtotal = 合計対象 line_total の合計
- memo total = group subtotal の合計

### status との関係

推奨:

- `considering / on_hold`
  - 合計対象
- `purchased / dropped`
  - 合計対象外
  - ただし list には残す

### price unset

- 合計から除外
- item には `価格未設定` を表示
- group / memo summary には `未設定あり` を出す第一候補にする

---

## セール期限表示仕様

### 表示対象

- `sale_price`
- `sale_ends_at`
- `discount_ends_at`

### セール期限の定義

推奨:

- item ごとの期限表示は
  - `sale_ends_at`
  - `discount_ends_at`
    のうち、存在するものを両方見せてもよい
- memo summary / list の `nearest_deadline` は
  - active item の `sale_ends_at` / `discount_ends_at` の最短値

### 表示状態

- 期限切れ
  - `expired` badge
- 24 時間以内
  - warning
- 3 日以内
  - caution

詳細なしきい値は実装時に要再判断としつつ、docs ではこの基準を第一候補にする。

---

## API 契約詳細案

名称は `shopping-memos` を第一候補とする。

### GET /api/shopping-memos

用途:

- 買い物メモ一覧

response 候補:

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

補足:

- `group_count` / `subtotal` / `nearest_deadline` は server 側で集計して返す第一候補

### POST /api/shopping-memos

用途:

- 買い物メモ作成

request:

- `name`
- `memo`

response:

- 作成した memo の summary

validation 第一候補:

- `name`: required, string, max 100
- `memo`: nullable, string

### GET /api/shopping-memos/{id}

用途:

- 買い物メモ詳細

response 構造候補:

- `id`
- `name`
- `memo`
- `status`
- `subtotal`
- `has_price_unset`
- `nearest_deadline`
- `groups`

`groups[]` 候補:

- `group_type`
- `group_key`
- `display_name`
- `subtotal`
- `has_price_unset`
- `nearest_deadline`
- `items`

`items[]` 候補:

- `shopping_memo_item_id`
- `purchase_candidate_id`
- candidate summary
  - `name`
  - `brand`
  - `status`
  - `price`
  - `sale_price`
  - `sale_ends_at`
  - `discount_ends_at`
  - `purchase_url`
  - `image`
- derived
  - `unit_price`
  - `line_total`
  - `is_price_unset`
  - `is_total_included`

### PATCH /api/shopping-memos/{id}

用途:

- メモ名 / memo / status 更新

request:

- `name`
- `memo`
- `status`

validation 第一候補:

- `status`: `draft | closed`

### DELETE /api/shopping-memos/{id}

用途:

- 買い物メモ削除

推奨:

- item があっても削除可能
- memo 削除時に `shopping_memo_items` も削除する
- 物理削除を第一候補

### POST /api/shopping-memos/{id}/items

用途:

- 購入検討一覧から複数候補を追加

request:

- `purchase_candidate_ids: number[]`

response 候補:

- `added_count`
- `skipped_count`
- `duplicate_count`
- `invalid_status_count`
- `closed_memo_count`

挙動第一候補:

- duplicate は skip
- `purchased / dropped` は invalid status として skip
- 他 user candidate は 404 または権限エラー扱い
- `closed` memo には追加不可

### DELETE /api/shopping-memos/{id}/items/{itemId}

用途:

- memo から item を外す

推奨:

- path parameter は `shopping_memo_item.id` を使う

理由:

- 同一 candidate が将来別 schema で複数回入る可能性に備えやすい
- API と DB の責務が明確

---

## frontend 画面 / BFF 案

### 画面候補

- `/shopping-memos`
  - 買い物メモ一覧
- `/shopping-memos/new`
  - 買い物メモ作成
- `/shopping-memos/[id]`
  - 買い物メモ詳細
- 購入検討一覧
  - checkbox 選択
  - 既存買い物メモへ追加

### BFF

第一候補:

- 既存 app 構成に合わせて route handler / server action 経由で backend API を呼ぶ
- ただし MVP では purchase candidate 一覧導線との整合を優先し、既存 BFF パターンに寄せる

---

## 購入検討一覧からの追加導線詳細

推奨:

- checkbox は **選択モード時のみ表示** を第一候補
- selected count を固定表示
- `買い物メモへ追加`
- 追加先は既存メモ選択

MVP の簡略化方針:

- 同一ページ内選択のみ
- ページまたぎ選択はしない
- filter / sort 変更時の選択維持はしない第一候補
- already added は badge や disabled ではなく、追加時に duplicate skip でもよい
- ただし UX 上は `追加済み` 表示を後続候補として残す

---

## import / export 方針

- MVP 初回では対象外
- 将来対象にする場合、restore 順序は `purchase_candidates` の後
- 対象候補:
  - `shopping_memos`
  - `shopping_memo_items`
  - 後続で必要なら `shopping_memo_group_adjustments`

---

## edge cases

- purchase candidate が存在しない
  - add items API で skip または 404
- 他 user の purchase candidate
  - 追加不可
- `purchased / dropped` を追加しようとした
  - skip
- duplicate 追加
  - skip
- shopping memo が `closed`
  - add items 不可
- 価格未設定
  - 合計対象外
- URL 不正
  - `未分類`
- brand 未設定
  - URL がなければ `未分類`
- candidate が後から削除された
  - MVP では参照整合を優先し、削除前に memo から外す運用を第一候補
- memo 削除時
  - item も一緒に削除

---

## 初回実装順の詳細

1. `shopping_memos` / `shopping_memo_items` schema を確定する
2. 権限チェック付き CRUD API を作る
3. add items / remove item API を作る
4. group resolution helper を作る
5. subtotal / deadline 集計を作る
6. 買い物メモ一覧 / 詳細画面を作る
7. 購入検討一覧の選択モードと追加導線を作る
8. 後続タスクとして
   - `shopping_memo_group_adjustments`
   - 送料 / クーポン
   - import / export
     を planned に切り出す

---

## import / export 影響

### 候補

#### MVP から対象にする

長所:

- ユーザーの検討データを backup / restore できる
- purchase candidate と同じ「ユーザー作成データ」として自然

短所:

- restore 順序を考える必要がある
- `purchase_candidate_id` 解決や group adjustment の整合確認が増える

#### 初期は対象外

長所:

- MVP 実装を軽くできる

短所:

- ユーザーの検討メモが backup されない
- アプリの一貫性としては弱い

### 推奨

設計としては **将来 backup / restore 対象にできる形を意識する** のが自然である。

ただし **MVP 初回実装では後回し** を第一候補とする。

理由:

- 初回の価値はメモ作成・一覧追加・group 表示・小計表示で十分出る
- import / export を同時に入れると API / test / restore 順序の検討が増える
- `shopping_memo_group_adjustments` を入れない初回とは分けた方が整理しやすい

将来含める場合の前提:

- restore 順序は `purchase_candidates` の後
- `shopping_memos`
- `shopping_memo_items`
- 後続で必要なら `shopping_memo_group_adjustments`

---

## 次に実装する場合のステップ

1. 機能名を `買い物メモ` で確定する
2. 初回 MVP を案Bで確定する
3. DB schema を確定する
   - `shopping_memos`
   - `shopping_memo_items`
4. group resolution ルールを確定する
   - domain
   - brand
   - 未分類
5. 購入検討一覧からの追加導線を確定する
   - checkbox 選択
   - 既存メモへ追加
6. 金額計算ロジックを定義する
   - `sale_price ?? price`
   - group subtotal
   - memo subtotal
7. API 契約を決める
8. 買い物メモ一覧 / 詳細 / 追加 UI を設計する
9. 後続として `shopping_memo_group_adjustments` / import-export を planned に切り出す

---

## 要再判断メモ

- `買い物メモ` と `購入プラン` の最終確定
- 詳細から単体追加を MVP に含めるか
- `quantity` field を初回 schema に持つか
- `purchased` / `dropped` を合計から除外する基準
- import / export をどのタイミングで入れるか

## current backend foundation (2026-05-07)

### current

- Laravel backend に shopping memo MVP の土台を追加済み
- migration は `shopping_memos` / `shopping_memo_items` の 2 テーブル
- backend API は以下を current とする
  - `GET /api/shopping-memos`
  - `POST /api/shopping-memos`
  - `GET /api/shopping-memos/{id}`
  - `PATCH /api/shopping-memos/{id}`
  - `DELETE /api/shopping-memos/{id}`
  - `POST /api/shopping-memos/{id}/items`
  - `DELETE /api/shopping-memos/{id}/items/{itemId}`
- add items は partial success を採用し、`added_count` / `skipped_count` / `duplicate_count` / `invalid_status_count` を返す
- `closed` memo には item 追加不可
- memo 削除は物理削除、`shopping_memo_items` は cascade 削除
- `purchase_candidate_id` FK は参照整合優先で `restrictOnDelete` を採用

### current: group resolution

- group は DB 保存せず、detail / list response 生成時に導出する
- current backend では `brand_id` ではなく **`brand_name`** を使って brand group を解決する
- ルール:
  1. `purchase_url` から有効 host を取れれば `domain`
  2. URL が無効または未設定で `brand_name` があれば `brand`
  3. どちらもなければ `uncategorized`
- host は lower-case、`www.` は除外
- sort order は `domain -> brand -> uncategorized`、同 type 内は display name 昇順

### current: subtotal / deadline

- `unit_price = sale_price ?? price`
- `line_total = unit_price * quantity`
- subtotal 対象 status は `considering / on_hold`
- `purchased / dropped` は detail には残すが subtotal には含めない
- price 未設定の active item があれば `has_price_unset = true`
- `nearest_deadline` は active item の `sale_ends_at` / `discount_ends_at` の最短を返す
- API の datetime は current backend の serialize に合わせて ISO 8601 を返す

### current: ownership / scope

- shopping memo は user scope
- 他 user の memo は list / detail / update / delete 不可
- add items でも memo owner と candidate owner の一致が前提
- 他 user candidate や存在しない candidate は skipped 扱い

### current: MVP scope note

- backend only の土台まで実装済み
- frontend UI / BFF / import-export / group adjustments / 送料 / クーポンは未実装
- docs 内の `brand_id` 前提の案は planned メモとして残すが、current backend は `brand_name` 基準で実装している

---

## current frontend phase 1 (2026-05-07)

### current

- Next.js frontend の第1段として **一覧画面** と **作成画面** を実装
- 追加した画面:
  - `/shopping-memos`
  - `/shopping-memos/new`
- 追加した frontend API / BFF:
  - `GET /api/shopping-memos`
  - `POST /api/shopping-memos`
- 一覧画面では current backend の summary response を使って以下を表示する
  - メモ名
  - メモ本文（ある場合のみ）
  - status
  - item_count
  - group_count
  - subtotal
  - has_price_unset
  - nearest_deadline
  - updated_at
- empty state では `買い物メモを作成` 導線を表示
- 作成画面では `name` 必須 / `memo` 任意で `POST /api/shopping-memos` を呼ぶ
- 作成成功後は **詳細画面ではなく一覧画面** (`/shopping-memos?message=created`) に遷移する

### current: navigation

- 通常ナビゲーションにはまだ追加していない
- 理由:
  - 詳細画面が未実装
  - 購入検討一覧からの追加導線も未実装
  - MVP 第1段では直接アクセス可能なルート追加までに留めるため

### planned next

- `/shopping-memos/[id]` 詳細画面
- 購入検討一覧からの checkbox 選択 + 既存メモへの追加導線
- 候補追加 / 削除 UI
- group 詳細表示の frontend

---

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

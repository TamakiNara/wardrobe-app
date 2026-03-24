# Wear Logs Specification

着用履歴・着用予定（wear logs）を扱うための仕様書。  
この資料では、wear log の基本概念、登録・更新ルール、item / outfit との関係、invalid / disposed の影響、一覧・詳細表示方針を定義する。

---

## 概要

wear logs は、クローゼット系Webアプリにおける **「いつ・何を着たか / 着る予定か」** を記録する機能とする。  
MVP では、厳密な監査履歴よりも、**予定管理・振り返り・再利用に実用的であること** を優先する。

関連資料:

- outfit 仕様: `docs/specs/outfits/create-edit.md`
- DB: `docs/data/database.md`
- API: `docs/api/openapi.yaml`

---

## 基本方針

- `planned` / `worn` は **同一レコード** で管理する
- UI は **トグル切替**
- `cancelled` / `skipped` は持たない
- 不要になった予定・誤登録は **削除** で対応する
- wear log は **1レコード = 1着用イベント**
- 状態変更履歴は保持せず、**常に最新保存内容を正** とする

### 状態切替に関する明示仕様

- `worn` から `planned` への差し戻しを許可する
- 再度 `worn` に戻すことも許可する
- `planned -> worn -> planned -> worn` のような再変更があっても、履歴は残さず **最終保存状態を正** とする

---

## 記録単位

- 1 wear log = 1着用イベント
- 同日複数件を許容する
- 時刻は持たず、**`event_date + display_order`** で順序を表現する

### 並び順

一覧初期並び順は以下とする。

- `event_date desc`
- `display_order asc`

---

## 入力ルール

### 基本

- `source_outfit_id` は **0件または1件**
- `items` は **複数指定可**
- `source_outfit_id` と `items` の **両方未指定は不可**

### 許可する入力パターン

#### パターンA

- outfit あり
- items あり

→ outfit をベースにしつつ、**最終的な item 群は items 正本** とする

#### パターンB

- outfit なし
- items あり

→ item 単独構成として記録する

補足:

- outfit を選択した場合でも、保存時は **最終的な item 群を `items` として持つ**
- outfit のみを送ってサーバ側で暗黙展開する前提にはしない

---

## `source_outfit_id` の意味

`source_outfit_id` は **「完全一致したコーデ」** ではなく、  
**「この wear log を作成する際にベースにした outfit」** を表す。

そのため、以下の場合でも `source_outfit_id` は残す。

- outfit ベースで1点追加した場合
- outfit ベースで一部削除した場合
- outfit ベースで差し替えた場合

### 役割整理

#### outfit の役割

- 元コーデを示す
- 初期 item 群の候補を供給する
- 集計や再利用の基点になる

#### wear_log_items の役割

- 実際に着た item 群を表す
- 履歴表示の正本
- 集計の正本

---

## outfit 選択時の item 展開仕様

### 初期展開

- outfit 選択時、`outfit_items.sort_order` 順で初期展開する

### 手動追加

- 手動追加 item は末尾に追加する
- `sort_order` は既存最大値 + 1

### 手動削除

- 対象 `wear_log_item` を削除する
- 残りの `sort_order` を詰め直す

### 保存タイミング

MVP では、編集途中の操作ごとに即時保存せず、**保存時に全体更新** する方針とする。

---

## item 重複時の挙動

1つの wear log 内では、**同一 item の重複を許可しない**。

### 対象ケース

- outfit 展開で含まれている item を手動追加しようとした場合
- `items` 配列内で同一 `source_item_id` が複数含まれている場合

### 方針

- UI 上で重複追加を抑止する
- API 側でも重複を許可しない
- MVP では **既存 item をそのまま保持し、新規追加しない**
- 既存の `item_source_type` も変更しない

---

## `item_source_type`

`wear_log_items` には、item の由来を表す項目を持つ。

### 値

- `outfit`
- `manual`

### 意味

- `outfit`: outfit 展開で入った item
- `manual`: 手動追加で入った item

### 補足

`item_source_type` は **操作履歴** ではなく、  
**その wear log の最終構成における主たる由来** を表す。

そのため、outfit 由来 item を再度手動追加しようとしても、

- 重複なので追加しない
- `item_source_type` も変更しない

一方で、outfit 由来 item を一度削除し、手動で再追加した場合は `manual` とする。

---

## snapshot 方針

### 現時点の合意

- MVP では **snapshot なし** で始める
- `worn` になった時点でも snapshot を固定保存しない
- まずは `source_item_id` / `source_outfit_id` と構成情報を正本にする

### 理由

- item 情報は outfit ほど頻繁に変わらない想定
- 更新後の item 情報を正とみなしてよい場面が多い
- `source_item_id` が分かれば多くの集計は可能
- カテゴリ変更はレアケースであり、MVP で強く守る優先度が低い

### 将来拡張の余地

必要になった場合、将来以下を追加する余地は残す。

- `item_name_snapshot`
- `category_id_snapshot`
- `category_name_snapshot`
- `outfit_name_snapshot`

現時点では未採用。

### 今は未実装でよい理由

- 現時点の wear logs は MVP の最小実用を優先し、**current データ参照ベース**で一覧・登録・更新を成立させる
- item / outfit の `current status` を補助表示できれば、現時点の確認導線としては十分であり、snapshot 導入を前提にしなくても基本運用は始められる
- snapshot を先に固定すると、保存契機・保存対象・表示責務を先に確定する必要があり、MVP 段階では実装コストに対して得られる効果がまだ小さい

### 将来決めること

snapshot を導入する場合は、少なくとも以下を後で決める。

- 保存タイミング: 新規登録時に固定するか、`planned -> worn` になった時点で固定するか、両方で持つか
- 保存対象: item 名、カテゴリ、色、spec、source outfit 名、構成 item などのどこまでを保存するか
- 表示用途: 一覧・詳細・編集画面で「当時の内容」と「current データ」をどう並べて見せるか
- 集計用途: 将来の集計で current データではなく snapshot を正本として使うか、補助用途に留めるか
- 既存データ移行: snapshot 導入前に登録済みの wear logs へ backfill するか、導入後レコードのみ対象にするか

### 導入時の影響範囲

snapshot を導入する場合、少なくとも以下に影響する。

- DB: `wear_logs` / `wear_log_items` のカラム追加または別テーブル追加
- API: 一覧・詳細・登録・更新 response の項目追加、場合によっては request / validation の見直し
- UI: 一覧・詳細・編集での表示文言、current データとの差分表示、補助バッジの整理
- 集計 / 移行: snapshot 基準の集計ロジック、既存データへの backfill 方針、移行時の運用手順


---

## 日付・順序

### 採択内容

- `event_date` 必須
- `display_order` 必須
- 時刻カラムは持たない

### `display_order` の想定

- 同日内で 1, 2, 3... の順序を持つ
- 新規作成時は自動採番を基本とする
- 編集時は **上下移動 UI** で変更可能とする
- 日付変更時は、その日付内で末尾に再採番する

---

## 一覧表示

### 基本

wear logs 一覧は、一覧共通仕様に従う。  
ただし wear logs は日付中心の閲覧が主目的であるため、初期並び順は `event_date desc, display_order asc` とする。

- 一覧画面は確認・遷移を主責務とし、主導線は詳細画面への遷移とする

### クエリ

- `page`
- `keyword`
- `sort`
- `status`
- `date_from`
- `date_to`

### `sort`

- `date_desc`（初期値）
- `date_asc`

### `status` フィルタ

- 全件
- `planned`
- `worn`

### 空状態 / エラー状態

- データ未登録:
  - `着用履歴がまだありません`
- 条件一致なし:
  - `条件に一致する着用履歴はありません`
- エラー:
  - `着用履歴の取得に失敗しました`

---

## 詳細表示

### 基本

詳細画面では、wear log の構成 item 群と基本情報を表示する。  
wear log の主表示は **当時の記録内容** とし、`current status` は補助表示とする。

- 詳細画面は確認専用とし、編集責務は持たせすぎない
- 削除導線は共通方針に従い、現時点では編集画面側に置く

### current status の扱い

#### 一覧

- `current status` は原則表示しない
- 必要なら軽い警告バッジのみ表示可

例:

- `一部アイテム利用不可`
- `元コーデ利用不可`

#### 詳細

- item ごとの `current status` を補助表示してよい
- source outfit の `current status` を補助表示してよい

例:

- `白シャツ（手放したアイテム）`
- `通勤セット（現在は利用不可）`

補足:

- snapshot なし前提のため、`current status` は **現在時点の補助情報** であり、履歴正本ではない

---

## items 側の状態管理との関係

### item.status

items は非表示ではなく **状態管理** とする。

#### 値

- `active`
- `disposed`

#### 意味

- `active`: 現在所持・通常利用可能
- `disposed`: 手放した / 現在所持していない

### disposed item の扱い

- 通常 item 一覧には出さない
- wear log 登録時の選択候補にも出さない
- 別途 **disposed item 一覧** を持つ方向

### item 削除時の扱い

item 削除時、wear logs で参照されている場合は **警告を出す**。

想定メッセージ例:

- `このアイテムは着用履歴で使用されています`
- `削除すると、履歴上の参照整合に影響する可能性があります`

MVP では、wear logs 参照がある item は安易に物理削除させず、  
**`disposed` への状態変更を優先誘導** する。

---

## outfits 側の状態管理との関係

### outfit.status

outfits も状態管理を持つ。

#### 値

- `active`
- `invalid`

#### 意味

- `active`: 通常利用可能
- `invalid`: 構成 item の状態により通常利用できない

### 命名補足

Item 側は `disposed`、Outfit 側は `invalid` とし、  
**両方とも `status` 列で管理する思想は揃えるが、意味が異なるため状態値は無理に統一しない**。

### invalid outfit の扱い

- 通常 outfit 一覧には出さない
- invalid outfit 一覧で参照する
- wear log の `source_outfit_id` 候補には出さない

補足:

- Outfit 自体の作成 / 編集 / invalid / 複製仕様の正本は `docs/specs/outfits/create-edit.md`

---

## disposed item を含む outfit の扱い

item を `disposed` にした際、その item を含む outfit がある場合は警告を出す。

### 想定挙動

- 該当 outfit があることを通知
- item を `disposed` にした場合、それらの outfit は `invalid` に遷移させる

### 理由

そのまま通常一覧に残すと、

- 使えないコーデが混ざる
- wear log / 予定登録で不整合が起きる
- 利用可能かどうかが曖昧になる

ため。

---

## invalid outfit 一覧との関係

### 役割

- 通常利用導線から外れた outfit を確認する
- 復旧や再利用の起点にする

### MVP で最低限持ちたい機能

- 一覧表示
- 検索
- 詳細確認
- 手動復帰（可能な場合のみ）
- **複製して新規 outfit 化**

### 手動復帰

復帰は、以下の条件を満たす場合のみ可能とする想定。

- 構成 item がすべて `active`
- 他に invalid 理由がない

### 複製して新規 outfit 化

invalid outfit を参考にしつつ、新しい active outfit を作るための導線。  
wear log 自体の仕様ではないが、`source_outfit_id` の再利用や invalid 運用に関係するため、関連仕様として扱う。

---

## API 方針

### 一覧

`GET /api/wear-logs`

#### クエリ候補

- `page`
- `keyword`
- `sort`
- `status`
- `date_from`
- `date_to`

### 詳細

`GET /api/wear-logs/{id}`

### 作成

`POST /api/wear-logs`

### 更新

`PUT /api/wear-logs/{id}`

### 削除

`DELETE /api/wear-logs/{id}`

### payload 方針

`POST` / `PUT` は同形 payload とする。

```json
{
  "status": "planned",
  "event_date": "2026-03-21",
  "display_order": 2,
  "source_outfit_id": 10,
  "memo": "雨だったので1枚追加",
  "items": [
    {
      "source_item_id": 101,
      "sort_order": 1,
      "item_source_type": "outfit"
    },
    {
      "source_item_id": 102,
      "sort_order": 2,
      "item_source_type": "outfit"
    },
    {
      "source_item_id": 205,
      "sort_order": 3,
      "item_source_type": "manual"
    }
  ]
}
```

### 重要方針

- フロントでは `source_outfit_id` と `items` を独立に扱い、必要な item だけを送る
- `source_outfit_id` だけ送ってサーバ側で暗黙展開する前提にはしない
- 更新時は明細込み **全体更新** を前提とする

---

## バリデーション方針

### 必須

- `status` は許可値のみ
- `event_date` 必須
- `display_order` 必須
- `source_outfit_id` と `items` の両方未指定は不可
- 指定した outfit / items は自分のデータのみ可

### `source_outfit_id`

- nullable
- 指定時は自分の outfit のみ
- `status=active` の outfit のみ選択可
- `invalid` outfit は不可

### `items`

- 配列
- outfit を指定する場合は 0 件を許可する
- item 単独記録や outfit + item 記録では 1 件以上

#### 各要素

- `source_item_id`: 必須
- `sort_order`: 必須
- `item_source_type`: 必須

### item 選択条件

- 自分の item のみ
- `status=active` の item のみ選択可
- `disposed` item は不可

### 重複制御

- 同一 wear log 内で、同一 `source_item_id` 重複不可

### sort_order

- `1, 2, 3...` の連番を前提とする

### display_order

- 1以上の整数
- 同一ユーザー・同一 `event_date` に対して重複不可

---

## 保存・更新処理の考え方

### 作成

1. `source_outfit_id` の妥当性確認
2. `items[]` の妥当性確認
3. item 重複チェック
4. `display_order` の妥当性確認
5. wear_logs 作成
6. wear_log_items 一括作成

### 更新

1. 対象 wear log が自分のものか確認
2. ヘッダ妥当性確認
3. `items[]` 妥当性確認
4. item 重複チェック
5. wear_logs 更新
6. 既存 `wear_log_items` 削除
7. 新しい `items[]` で再作成

### 方針

MVP では、差分更新ではなく **明細込み全置換** で十分とする。

---

## エラー方針

### 分類

- 入力不正: 422
- 未認証: 401
- 権限違反 / 他人データ指定: 403 or 404 方針で統一
- 予期せぬ保存失敗: 500

### メッセージ例

#### item 重複

- `同じアイテムを重複して登録することはできません`

#### invalid outfit 指定

- `使用できないコーデは選択できません`

#### disposed item 指定

- `手放したアイテムは選択できません`

#### `source_outfit_id` と `items` 両方未指定

- `コーデまたはアイテムを1件以上指定してください`

---

## データ設計（概要）

### `wear_logs`

- `id`
- `user_id`
- `status` (`planned` / `worn`)
- `event_date`
- `display_order`
- `source_outfit_id` nullable
- `memo` nullable
- `created_at`
- `updated_at`

### `wear_log_items`

- `id`
- `wear_log_id`
- `source_item_id` nullable
- `item_source_type` (`outfit` / `manual`)
- `sort_order`
- `created_at`
- `updated_at`

補足:

- MVP では snapshot カラムは持たない
- 表示や集計の正本は、`wear_logs` + `wear_log_items` + 参照先 current data の組み合わせで扱う

---

## テスト観点

### 一覧

- 未認証は 401
- 自分のデータのみ返る
- status で絞れる
- date range で絞れる
- 初期並び順 `event_date desc, display_order asc`
- keyword で絞れる

### 登録

- outfit のみで登録できる
- items のみで登録できる
- outfit + items で登録できる
- outfit は1件まで
- items は複数指定可
- event_date 必須
- display_order 必須
- `source_outfit_id` / `items` 両方未指定はエラー
- 他人の item / outfit は指定不可
- 同一 item 重複はエラー
- `invalid` outfit は指定不可
- `disposed` item は指定不可

### 更新

- `planned <-> worn` を同一レコードで切り替えられる
- `worn -> planned -> worn` でも最終保存内容が正となる
- items 全置換できる
- `item_source_type` を保持できる
- `invalid` outfit / `disposed` item は更新時も不可

### 削除

- 自分のデータのみ削除可
- 明細も削除される
- 削除導線は共通方針に従い、編集画面からのみ提供し、一覧画面には出さない
- 削除前には誤操作防止の confirm を前提とする
- 削除時に他 record の `display_order` 自動再採番は行わない

---

## 今後の拡張候補

以下は将来検討とし、MVP では扱わない。

- snapshot 導入
- status 変更履歴の監査保存
- wear logs へのタグ連携
- 複雑な sort 値追加
- 時刻カラム追加
- 部分更新 API
- invalid 理由カラム
- `current status` を利用した高度な絞り込み

---

## 現時点のまとめ

wear logs は、MVP では以下の思想で進める。

- **履歴監査より実用性重視**
- **同一レコード更新でシンプルに扱う**
- **最終的な item 群を正本にする**
- **snapshot は後から必要に応じて追加**
- **item / outfit は status 管理で整合性を保つ**
- **`current status` は補助情報として扱う**
- **invalid outfit は除外ではなく再利用可能な非通常データとして扱う**

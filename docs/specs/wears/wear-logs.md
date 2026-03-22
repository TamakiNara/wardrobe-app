# Wear Logs Specification

着用履歴（今日 / 明日のコーデ登録）を扱うための仕様書。
この資料では、Item 単位 / outfit 単位の登録、状態管理、登録導線、スナップショット保存、一覧表示、今後の拡張方針を定義する。

---

## 概要

本機能では、ユーザーが日ごとのコーディネートまたは item を記録・管理できるようにする。

単なる履歴管理ではなく、以下を目的とする。

- 日々の服選びの効率化
- コーディネートの再利用
- item 起点でのコーデ検索

---

## 基本概念

着用履歴は以下 2 種類の単位で登録可能とする。

- outfit 単位（コーディネート）
- item 単位（単体アイテム）

wear log は 1 件の記録を表し、少なくとも次を持つ。

- `wear_date`
- `status`
- `outfit_id` nullable
- `items[]`
- `memo`

---

## 状態管理

着用履歴には以下の状態を持たせる。

| value | 意味 |
| --- | --- |
| `planned` | 着用予定 |
| `worn` | 実際に着用した |

補足:

- 初期仕様は `planned / worn` の 2 値を正本とする
- `planned -> worn` への変更を許可する
- 将来的な候補状態などは拡張で追加可能とする

---

## 登録方法

着用履歴は複数の導線から登録可能とする。

### 1. outfit から登録

- outfit 詳細または一覧から登録する
- `今日着る` `明日着る` などの操作で登録する
- 初期状態は `planned` とする
- 保存時は outfit の現在の item 構成をスナップショットとして保持する

### 2. item から登録

#### フロー

1. item を選択する
2. その item を含む outfit を検索する
3. outfit を選択して登録する

#### 検索仕様

- 指定 item を 1 つ以上含む outfit を対象とする
- 自分が作成した有効な outfit のみを対象とする
- 並び順は更新日時または作成日時の新しい順を基本とする

### 3. outfit が存在しない場合

item に紐づく outfit が存在しない場合、以下の選択肢を提示する。

- item のみで着用履歴を登録する
- その item を使って新しい outfit を作成する

### 4. 着用履歴画面から登録

#### 日付先行型

1. 日付を選択する
2. outfit または item を選択する
3. 状態（`planned / worn`）を選択する

---

## 表示仕様

### 一覧

- 日付ごとに表示する
- 同日に複数登録可能とする

表示内容例:

- 日付
- outfit 名 または item 名
- 状態（`planned / worn`）

### 詳細

- outfit または item の構成を表示する
- 状態変更（`planned -> worn`）を可能にする
- 記録時点の item 構成を参照できるようにする

---

## 検索・選択仕様

### item 起点検索

#### 目的

`このアイテムを使ったコーディネートを探す` ために使う。

#### 条件

- 指定 item を含む outfit を抽出する
- 非表示・削除済み outfit は除外する

#### 初期仕様

- 単一 item 指定のみ対応する
- 複数 item 検索は将来拡張とする

---

## 制約・ルール

- 同一日に複数の着用履歴を登録可能とする
- 同一 outfit を複数日に登録可能とする
- item 単体の履歴登録も許可する
- item 単位登録時、カテゴリ制約は設けない
- 同じ item を同日に複数回登録できるようにする
- 削除された item / outfit は履歴には影響しない前提とする
  - 記録時点のスナップショットを正本とする

---

## データ設計（概要）

### `wear_logs`

- `id`
- `user_id`
- `wear_date`
- `status` (`planned / worn`)
- `outfit_id` nullable
- `memo` nullable
- `created_at`
- `updated_at`

### `wear_log_items`

- `id`
- `wear_log_id`
- `item_id`
- `snapshot_name`
- `snapshot_color`
- `snapshot_category`
- `created_at`
- `updated_at`

補足:

- 初期実装では `items_snapshot` JSON に寄せる案も候補だが、複数 item の扱いや将来の集計を考えると `wear_logs` と `wear_log_items` の分離も有力
- どちらの保存方式でも、表示や集計の正本はスナップショット側とする

---

## スナップショット設計

履歴は記録時点の状態を保持する。

理由:

- 後から item や outfit が変更されても履歴が変わらないようにするため
- `Outfit A を明日着る予定で登録 -> その後 Outfit A の中身を編集` のようなケースでも、登録時点の内容を正しく再現するため

---

## 編集・取消

- 登録後に編集可能とする
- 削除可能とする
- `planned -> worn` の変更を可能にする
- 将来的に `wear_date` や `memo` の更新も可能にする

---

## 一覧や集計で見たいもの

- カレンダー表示
- 最近着た item
- 着用回数
- しばらく着ていない item

補足:

- 将来的には `wear_logs` を履歴正本、`items.last_worn_at` や `wear_count` を補助集計値として持つ構成も考えられる

---

## 詳細検討メモ（2026-03）

### 基本方針

- `planned / worn` は同一レコードで管理する
- UI はトグル切替を想定する
- `cancelled` / `skipped` は MVP では持たない
- 不要な予定や誤登録は削除で対応する
- 状態変更履歴は保持せず、最終保存内容を正とする
- `worn -> planned -> worn` のような再変更も許可し、最新状態だけを扱う

### 記録単位と順序

- `1 wear log = 1着用イベント` とする
- 同日複数件を許可する
- 時刻は持たず、`event_date + display_order` で順序を表現する
- 一覧初期並び順は `event_date desc, display_order asc` とする

### outfit / item の扱い

- `source_outfit_id` は 0件または 1件を許可する
- `items` は複数指定可とする
- `source_outfit_id` と `items` の両方未指定は不可とする
- outfit あり / items なし、outfit なし / items あり、outfit あり / items ありの 3 パターンを許可する
- `source_outfit_id` は「完全一致したコーデ」ではなく、ベースにした outfit を示す参照とする
- outfit を基に item を追加 / 削除 / 差し替えした場合でも `source_outfit_id` は残す
- 実際に着た item 群の正本は `wear_log_items` とし、集計や表示はそちらを基準にする

### outfit 選択時の item 展開

- outfit 選択時は `outfit_items.sort_order` 順で item を初期展開する
- 手動追加 item は末尾に追加し、`sort_order` は既存最大値 + 1 とする
- 手動削除時は残りの `sort_order` を詰め直す
- MVP では編集途中の即時保存はせず、保存時に全体更新する

### item 重複と source type

- 1つの wear log 内で同一 item の重複は許可しない
- UI で重複追加を抑止し、API 側でも重複を許可しない
- MVP では既存 item をそのまま保持し、新規追加しない
- `item_source_type` は `outfit` / `manual` を正式候補とし、wear_log_items で保持する前提で整理する

### snapshot 方針

- MVP では snapshot なしで始める
- `worn` への状態変更時点でも snapshot を固定保存しない
- まずは `source_item_id` / `source_outfit_id` と構成情報を正本とする
- 将来必要になった場合は `item_name_snapshot` `category_id_snapshot` `category_name_snapshot` `outfit_name_snapshot` などの追加を検討する

### item / outfit の status 方針

- item は非表示ではなく `status` で管理し、`active` / `disposed` を候補とする
- `disposed` item は通常 item 一覧と wear log 登録候補から除外する
- outfit も `status` で管理し、`active` / `invalid` を候補とする
- `disposed` item を含む outfit は `invalid` へ遷移させる方向とする
- invalid outfit は通常導線から外し、別一覧で確認 / 復帰 / 複製できるようにする

### invalid outfit / current status

- invalid outfit は通常利用導線からは外すが、別一覧で確認 / 復帰 / 複製ができる前提とする
- invalid outfit からの複製は専用 API を作らず、詳細取得 -> フロントで初期値生成 -> 通常の outfit 作成 API を利用する
- wear logs は履歴を正とし、`disposed` / `invalid` は補助情報として扱う
- 一覧では current status の詳細を出しすぎず、必要なら小さな警告バッジに留める
- 詳細では item 単位の `source_item_status` や `source_outfit_status` を補助表示してよい

### status 変更時副作用 / 実装責務

- item を `disposed` にすると、その item を含む `active` outfit を `invalid` に更新する
- ただし wear logs は過去履歴として残し、item / outfit status の変更で内容を書き換えない
- item を `active` に戻しても、関連 outfit は自動で `active` へは戻さず、別途復帰判定を行う
- これらの状態変更と副作用は、モデルイベントに寄せすぎず、サービス層 / ユースケース層で一元管理する

### API / バリデーション / テスト観点

- 一覧 API は `GET /api/wear-logs` を想定し、`status` `date_from` `date_to` `keyword` `sort=date_desc` などをクエリ候補とする
- 登録 / 更新では `status` `event_date` `display_order` を必須とし、`source_outfit_id` と `items` の両方未指定はエラーにする
- 指定する outfit / item は自分のデータのみ可とする
- 同一 wear log 内の同一 item 重複は API 側でもエラーとする
- テストでは一覧フィルタ、`planned <-> worn` 切替、他人データ拒否、item / outfit status 連動を重点確認項目とする

## 今後の拡張

以下は将来的に追加可能とする。

- 複数 item 指定での outfit 検索
- よく使うコーディネートの優先表示
- 最近着たコーディネートの表示
- 着用頻度の分析
- カレンダー表示の強化
- 天気連携

---

## 未対応（現時点）

- 監査ログ（変更履歴の完全保存）
- 差分管理
- ログ閲覧 UI

---

## まとめ

本機能は単なる履歴ではなく、

- `何を着たか` だけでなく
- `何を着るかを決める`

ための機能として設計する。

## 関連資料

- `docs/data/database.md`
- `docs/project/implementation-notes.md`
- `docs/architecture/screen-flows.md`
- `docs/specs/discovery/search-filter-sort.md`
- `docs/specs/wears/wear-logs-invalid-status-handoff.md`

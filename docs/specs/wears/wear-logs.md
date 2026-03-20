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

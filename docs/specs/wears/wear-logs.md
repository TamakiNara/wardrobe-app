# Wear Logs Specification

着用履歴（今日 / 明日のコーデ登録）を扱うための仕様書。
この資料では、Item 単位 / outfit 単位の登録、スナップショット保存、カレンダー表示・集計の前提となるデータ構造を定義する。

---

## 概要

- 着用記録は 1 日複数件登録できる
- 1 件の記録は `wear_date` と `status` を持ち、その中に `outfit_id` と `items[]` を持つ
- `outfit_id` は nullable とし、outfit を使わず Item 単位でも登録できる
- `items[]` は outfit 由来の場合も含めて、登録時点の内容をスナップショットとして保持する
- 1 件ごとにメモを持てる

---

## 想定ユースケース

- 今日実際に着た服を記録する
- 明日着る予定を登録する
- 候補として複数の記録を仮置きする
- 後から planned → worn へ変更する
- カレンダーや集計で、最近着た item や着用回数を確認する

---

## 記録単位

着用記録は **wear log （1件の記録）** を単位とする。

各記録は次を持つ:

- `wear_date` (日付のみ)
- `status`
- `outfit_id` (nullable)
- `items[]`
- `memo`

### `wear_date`

- 日付のみを持つ `date` 型
- 時刻は持たない
- 1 日に複数件登録可能とする

### `status`

記録の意味を表す值。初期仕様では次を扱う。

| value | 意味 |
| --- | --- |
| `planned` | 予定 |
| `worn` | 実際に着た |
| `candidate` | 候補 |
| `log` | 過去ログ |

補足:

- `planned` から `worn` への変更を許可する
- 後から status を編集できるようにする

### `outfit_id`

- outfit 由来の登録である場合に保持する
- Item 単位登録の場合は `null` でよい
- outfit を参照していても、表示や集計はスナップショットを正本とする

### `items[]`

- Item 単位 / outfit 単位どちらでも最終的にはここに登録時点の item 一覧を保存する
- Item 単位登録時はカテゴリ制約は設けない
- 同じ item を同日に複数回登録できるよう許可する

保存想定例:

```json
{
  "outfit_id": 12,
  "items": [
    { "item_id": 101 },
    { "item_id": 203 }
  ]
}
```

### `memo`

- 1 件ごとにメモを持つ
- 当日の補足、着た感想、予定の理由などを残せる

---

## 登録方式

### Item 単位登録

- item を 1 件以上選び、wear log を作成する
- カテゴリ制約は設けない
- 同じ item の重複も許可する

### outfit 単位登録

- outfit を 1 件選び、その時点の item 構成を `items[]` に展開して保存する
- 登録後に outfit の中身が変わっても、wear log 側の内容は登録時点のスナップショットを維持する

---

## 編集・取消

- 登録後に編集可能
- 削除可能
- `planned` → `worn` への変更可能
- item 構成、memo、status、wear_date を後から見直せるようにする

---

## 一覧・集計で見たいもの

- カレンダー表示
- 最近着た item
- 着用回数
- しばらく着ていない item

補足:

- これらの集計は `wear_logs` を正本として行い、`items.last_worn_at` や `wear_count` は補助値として扱う方が自然

---

## データ保存方針

将来的には `wear_logs` テーブルを正本として持ち、必要に応じて `wear_log_items` のような子テーブルを分ける構成を想定する。

最低限必要な項目例:

- `id`
- `user_id`
- `wear_date`
- `status`
- `outfit_id` nullable
- `items_snapshot` json
- `memo` nullable
- `created_at`
- `updated_at`

補足:

- `items_snapshot` に登録時点の item 構成を保持することで、outfit 編集後でも過去記録の意味が変わらない
- 重複許可のため、`wear_date + item_id` の一意制約は設けない

---

## 未確定メモ

- `candidate` と `log` を初期リリースから出すか、まずは `planned / worn` のみに絞るか
- item スナップショットにどこまで情報を含めるか（item_id のみ / 表示名・カテゴリも含めるか）
- カレンダー UI を `planned` と `worn` でどう色分けするか

## 関連資料

- `docs/data/database.md`
- `docs/project/implementation-notes.md`
- `docs/architecture/screen-flows.md`
# docs 表現ガイドライン

docs に追記するときは、実装範囲・保留事項・現状説明の表現を次の方針でそろえる。

## 基本方針

- 実装範囲は `今回実装する` `今回は実装しない` `今回の対象範囲` `将来タスクとして残す` のように書く
- 現在状態は `現状の実装` `現時点では` `現在の仕様` `今の挙動` のように書く
- `current 実装` は使わない
- `planned` を単独で使わない
- `MVP` のような略語は避け、`最小構成` `初期実装範囲` `初回対応範囲` など、意味がすぐ伝わる言い方を優先する

## 補足

- API フィールド名や状態値として意味を持つ `current_*` `current status` `planned / worn` などは、そのままでよい
- 一括置換ではなく、前後の文脈に合う自然な日本語へ直す
- planning / spec / implementation-notes / database / OpenAPI の役割分担は崩さない

## docs 表記・命名ルール

### 基本方針

docs の本文・見出し・分類名は、原則として日本語で書く。

ただし、以下は英語またはコード上の名称をそのまま使う。

- file path
- route
- API field
- DB column
- status 値
- TypeScript / PHP の型名
- OpenAPI などの正式名称
- import/export など、既に機能名として定着している語

英語を使う場合は、読み手が「仕様上の用語」なのか「コード上の名前」なのか分かるようにする。

### 機能名

機能名は日本語を主にする。必要な場合だけ、英語の内部名を括弧で補足する。

例:

- アイテム（items）
- コーディネート（outfits）
- 着用履歴（wear logs）
- 購入検討（purchase candidates）
- 買い物メモ（shopping memos）
- 設定（settings）
- import/export

本文中では、特別な理由がない限り日本語名を使う。

よい例:

- 着用履歴登録後に、振り返り登録へ進める導線を追加する。
- コーディネート一覧では、使用アイテムで絞り込める。

避けたい例:

- wear log create 後に reflection へ遷移する。
- outfit list で item filter を使う。

ただし、route や API endpoint を説明する場合は英語名を使ってよい。

例:

- `/wear-logs/{id}/reflection` へ遷移する。
- `GET /api/outfits?item_id={id}` を使う。

### 画面名

画面名は日本語を主にし、必要な場合だけ route を括弧で補足する。

例:

- 着用履歴登録画面（`/wear-logs/new`）
- 着用履歴詳細画面（`/wear-logs/{id}`）
- 着用履歴振り返り画面（`/wear-logs/{id}/reflection`）
- コーディネート一覧画面（`/outfits`）
- コーディネート作成画面（`/outfits/new`）
- コーディネート編集画面（`/outfits/{id}/edit`）
- 購入検討詳細画面（`/purchase-candidates/{id}`）
- 買い物メモ詳細画面（`/shopping-memos/{id}`）

### コード上の名称

API field、DB column、file path、route、status 値、型名は、コード上の名前を backtick で囲んで書く。

例:

- `sale_ends_at`
- `discount_ends_at`
- `tpo_ids`
- `purchase_candidate_tpos.tpo`
- `status = "worn"`
- `docs/api/openapi.yaml`
- `WearLogForm`

コード上の名称を日本語へ無理に訳さない。

### current / planned / legacy の扱い

見出しでは、原則として英語の `current` / `planned` / `legacy` を使わない。

代わりに以下を使う。

- `現在の仕様`
- `対応済み`
- `今後対応`
- `残件`
- `要再判断`
- `旧仕様`
- `旧仕様（legacy）`

`legacy` を使う場合は、初回だけ `旧仕様（legacy）` のように併記する。

### task-backlog での扱い

`task-backlog.md` は、仕様正本ではなく、残件・優先度・判断メモ・試行結果を置く場所とする。

実装済みの詳細仕様は、できるだけ個別 spec に寄せる。

task-backlog に残すもの:

- まだ実装していないこと
- 今後対応
- 要再判断
- 優先度
- 試行して採用しなかった判断
- 個別 spec に移す前の一時メモ

task-backlog に長く残しすぎない方がよいもの:

- 実装済み仕様の詳細
- API field の詳細説明
- DB schema の詳細
- 画面ごとの細かい current 表示仕様

### 正本と補助資料の使い分け

docs では、同じ情報を複数箇所に詳しく書きすぎない。

基本方針:

- 機能仕様は `docs/specs/**`
- API 契約は `docs/api/openapi.yaml`
- API 方針は `docs/api/api-overview.md`
- DB schema / 保存責務は `docs/data/database.md`
- import/export は `docs/specs/import-export.md`
- 残件・優先度・試行結果は `docs/specs/task-backlog.md`
- 作業ログ・引き継ぎは `docs/project/implementation-notes.md`
- 旧資料は `docs/archive/**`

重複する場合は、片方を正本にし、もう片方はリンクや要約に留める。

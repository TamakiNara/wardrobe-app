# docs 役割マップ

## 目的

このファイルは、`docs/` 配下の資料を読むための構造マップです。

- docs 全体の大まかな分類を示す
- 正本、補助資料、タスク管理、作業メモ、旧資料を見分ける
- 機能ごとに、どの資料を確認すればよいかを案内する

このファイル自体は機能仕様の正本ではありません。各機能の最新仕様は、個別の仕様書、OpenAPI、DB docs を確認します。

## docs の役割分類

### 入口 / 索引

- `docs/README.md`
  - docs 全体の入口
- `docs/specs/README.md`
  - 機能仕様書の入口

### 正本

- 機能仕様: `docs/specs/**`
  - 個別機能の仕様
    - アイテム: `docs/specs/items/*`
    - コーディネート: `docs/specs/outfits/*`
    - 着用履歴: `docs/specs/wears/wear-logs.md`
    - 購入検討: `docs/specs/purchase-candidates.md`
    - 買い物メモ: `docs/specs/shopping-memos.md`
    - 設定: `docs/specs/settings/*`
  - 横断仕様
    - import/export: `docs/specs/import-export.md`
  - 機能ごとの現在の仕様、画面、API、DB、テスト観点を整理する中心
- API 契約: `docs/api/openapi.yaml`
  - endpoint、リクエスト / レスポンスの schema、HTTP status code、field description を機械可読な形で定義する
- DB schema / 保存責務: `docs/data/database.md`
  - migration との差分確認を前提に、テーブル構造と保存方針を整理する

### 補助資料

- `docs/api/api-overview.md`
  - API 方針、payload / データ構造、命名、画面側との対応を補足する
- `docs/architecture/**`
  - システム構成、認証、画面遷移などの設計説明
- `docs/decisions/**`
  - 設計判断の理由
- `docs/ui/**`
  - UI 方針や空状態などの横断メモ

### タスク管理

- `docs/specs/task-backlog.md`
  - 残件、優先度、判断メモ、試行結果、要再判断を置く
- `docs/specs/planning/next-features.md`
  - 計画メモ
  - `task-backlog.md` と一部重複しているため、扱いは今後整理する

### 作業メモ

- `docs/project/implementation-notes.md`
  - 作業ログ、引き継ぎ、実装済み内容のメモ
- `docs/project/docs-writing-guidelines.md`
  - docs の書き方、表記方針、命名ルール

### 旧資料 / 保管資料

- `docs/archive/**`
  - 現在の仕様としては参照しない旧資料や退避資料

### 要整理

- weather 系 docs
  - 天気機能の現在の仕様、設計メモ、旧 API 検討メモが複数ファイルに分かれている
- thumbnail 系 docs
  - サムネイルの現在の仕様、分析メモ、色サムネイル方針が複数ファイルに分かれている

## 機能別の正本マップ

### アイテム

- 仕様: `docs/specs/items/*`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- import/export: `docs/specs/import-export.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### コーディネート

- 仕様: `docs/specs/outfits/create-edit.md`, `docs/specs/outfits/list-filters.md`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### 着用履歴

- 仕様: `docs/specs/wears/wear-logs.md`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- 関連: `docs/specs/settings/tpos.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### 購入検討

- 仕様: `docs/specs/purchase-candidates.md`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- import/export: `docs/specs/import-export.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### 買い物メモ

- 仕様: `docs/specs/shopping-memos.md`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### 設定

- 仕様: `docs/specs/settings/*`
- API 契約: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

### import/export

- 仕様: `docs/specs/import-export.md`
- API 契約: `docs/api/openapi.yaml`
- DB 参照: `docs/data/database.md`
- 残件・判断メモ: `docs/specs/task-backlog.md`

## 全体マップ

### 入口

- `docs/README.md`
  - 分類: 入口 / 索引
  - 役割: docs 全体の短い入口
  - 主な内容: 目的別の参照先、docs map / 表記ルールへのリンク
- `docs/docs-map.md`
  - 分類: 補助資料
  - 役割: docs 全体の役割マップ
  - 主な内容: docs の分類、正本ルール案、機能別の参照先
- `docs/specs/README.md`
  - 分類: 入口 / 索引
  - 役割: 機能仕様書の入口
  - 主な内容: アイテム、コーディネート、着用履歴、設定、共通仕様へのリンク

### タスク管理 / 計画メモ

- `docs/specs/task-backlog.md`
  - 分類: タスク管理
  - 役割: 残件、優先度、判断メモ、試行結果の管理
  - 主な内容: UI 改善、設計整理、機能追加、docs 整理などのタスク一覧
- `docs/specs/planning/next-features.md`
  - 分類: 未確定
  - 役割: 計画メモ
  - 主な内容: 次機能候補、優先順位メモ

### API / DB / import-export

- `docs/api/openapi.yaml`
  - 分類: 正本
  - 役割: API 契約の正本
  - 主な内容: endpoint、リクエスト / レスポンスの schema、field description
- `docs/api/api-overview.md`
  - 分類: 補助資料
  - 役割: API 方針・payload / データ構造の補足
  - 主な内容: API の読み方、payload / データ構造の意味、画面との対応
- `docs/data/database.md`
  - 分類: 正本
  - 役割: DB schema と保存方針
  - 主な内容: table、column、relation、保存責務
- `docs/specs/import-export.md`
  - 分類: 正本
  - 役割: import/export 仕様
  - 主な内容: バックアップ / リストア、portable な値、旧仕様（legacy）fallback

### 主要機能の仕様書

- `docs/specs/purchase-candidates.md`
  - 分類: 正本
  - 役割: 購入検討仕様
  - 主な内容: 状態管理、アイテム化、画像、素材、TPO、期限項目
- `docs/specs/shopping-memos.md`
  - 分類: 正本
  - 役割: 買い物メモ仕様
  - 主な内容: 買い物メモ詳細画面、グループ / アイテム行、代表期限、価格計算
- `docs/specs/wears/wear-logs.md`
  - 分類: 正本
  - 役割: 着用履歴仕様
  - 主な内容: 予定 / 着用済みの状態管理、アイテム / コーディネート選択、振り返り、天気、候補表示上限
- `docs/specs/outfits/create-edit.md`
  - 分類: 正本
  - 役割: コーディネート作成 / 編集仕様
  - 主な内容: アイテム選択、保存条件、利用可否状態、複製、写真サムネイル
- `docs/specs/outfits/list-filters.md`
  - 分類: 正本
  - 役割: コーディネート一覧の絞り込み仕様
  - 主な内容: キーワード、季節、TPO、使用アイテム絞り込み、種類絞り込み、使用アイテム簡易表示

### アイテム

- `docs/specs/items/*`
  - 分類: 正本
  - 役割: アイテムのカテゴリ・状態・素材・一覧・削除方針の仕様
  - 主な内容: トップス / 下着 / 靴などのカテゴリ仕様、状態、削除、素材

### 設定

- `docs/specs/settings/*`
  - 分類: 正本
  - 役割: 設定系仕様
  - 主な内容: カテゴリ表示設定、ブランド候補、TPO、天気地域設定

### project / policy

- `docs/project/implementation-notes.md`
  - 分類: 作業メモ
  - 役割: 実装ログ・引き継ぎ
  - 主な内容: 実装済み内容、次作業、調査メモ
- `docs/project/docs-writing-guidelines.md`
  - 分類: 正本
  - 役割: docs の表記・命名ルール
  - 主な内容: 日本語見出し、英語見出しを避ける方針、コード上の名称の扱い

### architecture / decisions / ui

- `docs/architecture/**`
  - 分類: 補助資料
  - 役割: アーキテクチャ説明
  - 主な内容: system overview、auth flow、screen flows
- `docs/decisions/**`
  - 分類: 補助資料
  - 役割: 設計判断の理由
  - 主な内容: architecture decisions
- `docs/ui/**`
  - 分類: 補助資料
  - 役割: 横断 UI 方針
  - 主な内容: empty state など

### 旧資料 / 保管資料

- `docs/archive/**`
  - 分類: 旧資料
  - 役割: 旧資料・退避資料
  - 主な内容: 過去資料

## 正本ルール案

- 機能仕様の正本は `docs/specs/**`
- API 契約の正本は `docs/api/openapi.yaml`
- API 方針・命名・payload / データ構造の補足は `docs/api/api-overview.md`
- DB schema / 保存責務は `docs/data/database.md`
- import/export は `docs/specs/import-export.md`
- 残件 / 優先度 / 試行結果は `docs/specs/task-backlog.md`
- 実装ログ・引き継ぎは `docs/project/implementation-notes.md`
- 古い資料は `docs/archive/**`

このルールはまだ確定ではありません。docs 整理の各作業で、正本と補助資料の境界を見直します。

## 表記・命名ルールの参照

詳細な表記・命名ルールは、`docs/project/docs-writing-guidelines.md` を正本として扱います。
この map では、次の点だけを前提にします。

- docs の本文・見出し・分類名は、原則として日本語に寄せる
- file path、route、API field、DB column、status 値、型名、OpenAPI などはコード上の名称をそのまま使う
- 英語見出しは、今後の整理時に `現在の仕様` / `今後対応` / `旧仕様（legacy）` などへ寄せる
- 表記ルールを更新する場合は、この map ではなく `docs/project/docs-writing-guidelines.md` を更新する

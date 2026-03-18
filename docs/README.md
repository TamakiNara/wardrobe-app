# Docs README

## 目的

この README は、`docs/` 配下にある資料の入口です。
役割ごとに資料を分け、正本と作業メモの境界を分かりやすく保つことを目的にしています。

---

## 使い分けの基本方針

- 実装の現況や次にやることを知りたいときは `project/implementation-notes.md`
- API の概要を見たいときは `api/api-overview.md`
- OpenAPI の正本を見たいときは `api/openapi.yaml`
- API docs の分類方針を見たいときは、`api/openapi.yaml` の tag を「認証系 / 設定系 / 参照マスタ / 実装単位」で追う
- DB 構造を見たいときは `data/database.md`
- 認証の流れを確認したいときは `architecture/auth-flow.md`
- 画面遷移図を見たいときは `architecture/screen-flows.md`
- アーキテクチャ全体を見たいときは `architecture/system-overview.md`
- 設計判断の理由を見たいときは `decisions/architecture-decisions.md`
- セキュリティの現状と課題を見たいときは `security/web-security.md`
- tops の詳細仕様を見たいときは `specs/items/tops.md`
- カテゴリ表示設定の仕様を見たいときは `specs/settings/category-settings.md`
- 新規登録直後のカテゴリプリセット選択を見たいときは `specs/settings/category-preset-selection.md`
- アプリ全体の共通ナビ仕様を見たいときは `specs/navigation/global-navigation.md`

---

## 資料一覧

### `project/implementation-notes.md`

役割:

- 実装の進捗共有
- 引き継ぎメモ
- 次にやることの整理

補足:

- 設計の正本というより、運用中の作業ログ・引き継ぎ資料

### `architecture/system-overview.md`

役割:

- システム全体の責務分割を説明する

### `architecture/auth-flow.md`

役割:

- 認証フローの説明
- Cookie / CSRF / Session の流れの整理

### `architecture/screen-flows.md`

役割:

- 主要画面の画面遷移図を Mermaid でまとめる
- ログイン 〜 ログアウト、新規登録 〜 カテゴリ設定 〜 items / outfits 登録の導線を整理する

### `api/api-overview.md`

役割:

- API の一覧と payload の概要整理

### `api/openapi.yaml`

役割:

- API schema の機械可読な定義
- docs 上では `Auth` `Settings` `ReferenceMasters` を役割分類の軸にし、`Items` `Outfits` は実装単位の API 群として整理する

### `data/database.md`

役割:

- DB テーブル構造と保存方針の整理

### `security/web-security.md`

役割:

- IPA の観点をベースにセキュリティ対策の現状を整理する
- 実装済み対策、未対応事項、優先度付き課題をまとめる

### `specs/items/tops.md`

役割:

- tops の spec 定義をまとめる

### `specs/settings/category-settings.md`

役割:

- カテゴリ表示設定や設定系仕様をまとめる

補足:

- 現在はカテゴリ表示設定の仕様を整理している
- 今後、設定系仕様を増やすときの配置先として使う


### `specs/settings/category-preset-selection.md`

役割:

- 新規登録直後のカテゴリプリセット選択導線を整理する
- 内部値 `male / female / custom` と UI 表示 `Men / Women / Custom` の初回設定フローを定義する

### `specs/navigation/global-navigation.md`

役割:

- アプリ全体で共通利用するナビゲーションの仕様を整理する
- 初期のボトムナビ方針と、将来の PC 上部ナビ方針を定義する
- 実装時の推奨配置場所を残す

### `decisions/architecture-decisions.md`

役割:

- 設計判断の理由を残す

### `archive/`

役割:

- 現在の構成では正本ではない旧資料や退避ファイルを保管する

---

## 更新ルールの目安

### 実装を変えたとき

最低限、次を確認する:

- `project/implementation-notes.md`
- `api/api-overview.md`
- `data/database.md`

### 設計判断をしたとき

必要に応じて更新する:

- `decisions/architecture-decisions.md`
- `architecture/system-overview.md`

### item spec を変えたとき

必ず確認する:

- `specs/items/tops.md`
- `api/api-overview.md`
- `data/database.md`
- `project/implementation-notes.md`

### 認証まわりを変えたとき

必ず確認する:

- `architecture/auth-flow.md`
- `api/api-overview.md`
- `architecture/system-overview.md`
- `project/implementation-notes.md`

---

## おすすめの読み順

新しく状況を把握するときは、次の順が分かりやすいです。

1. `project/implementation-notes.md`
2. `architecture/system-overview.md`
3. `api/api-overview.md`
4. `data/database.md`
5. 必要に応じて個別仕様 (`specs/items/tops.md` など)

---

## 今後の整理候補

- `api/openapi.yaml` と `api/api-overview.md` の整合強化
- item spec 資料を tops 以外にも拡張
- `openapi.yaml` の対象拡張
- 各文書の相互参照強化
  - 各文書末尾に「関連資料」を追加

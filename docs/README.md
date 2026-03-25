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
- テスト用 seed ユーザー方針を見たいときは `data/test-seed-users.md`
- 認証の流れを確認したいときは `architecture/auth-flow.md`
- 画面遷移図を見たいときは `architecture/screen-flows.md`
- アーキテクチャ全体を見たいときは `architecture/system-overview.md`
- 設計判断の理由を見たいときは `decisions/architecture-decisions.md`
- セキュリティの現状と課題を見たいときは `security/web-security.md`
- tops の詳細仕様を見たいときは `specs/items/tops.md`
- item status の状態管理を見たいときは `specs/items/status-management.md`
- item 詳細画面での status 操作 UI を見たいときは `specs/items/detail-status-ui.md`
- カテゴリ表示設定の仕様を見たいときは `specs/settings/category-settings.md`
- ブランド候補の仕様正本を見たいときは `specs/settings/brand-candidates.md`
- 新規登録直後のカテゴリプリセット選択を見たいときは `specs/settings/category-preset-selection.md`
- アプリ全体の共通ナビ仕様を見たいときは `specs/navigation/global-navigation.md`
- Outfit の作成・編集・invalid/複製方針を見たいときは `specs/outfits/create-edit.md`
- wear logs の `source_outfit_id` / `item_source_type` / `current status` 方針を見たいときは `specs/wears/wear-logs.md`
- 購入検討の仕様正本と item 昇格前提を見たいときは `specs/purchase-candidates.md`
- specs の索引から主要仕様へ辿りたいときは `specs/README.md`

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

### `data/test-seed-users.md`

役割:

- テスト用ユーザーとサンプルデータの seed 方針を整理する
- 確認用アカウントの種類、sample data の中身、再実行手順をまとめる

### `data/er-diagram.md`

役割:

- README から参照する簡略 ER 図をまとめる
- 読み手向けに、主要テーブル同士の関係だけを把握しやすい粒度で整理する

### `setup.md`

役割:

- 開発環境のセットアップ手順を README から分離してまとめる
- Backend / Frontend の起動方法、env、seed、確認用アカウントを整理する

### `security/web-security.md`

役割:

- IPA の観点をベースにセキュリティ対策の現状を整理する
- 実装済み対策、未対応事項、優先度付き課題をまとめる

### `specs/items/tops.md`

役割:

- tops の spec 定義をまとめる

### `specs/items/status-management.md`

役割:

- item status の状態管理と副作用を整理する
- `active / disposed`、delete との役割分担、outfit / wear logs への影響をまとめる

### `specs/items/detail-status-ui.md`

役割:

- item 詳細画面での status 操作 UI を整理する
- 「手放す」「所持品に戻す」、確認ダイアログ、成功 / 失敗メッセージ方針をまとめる

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

### `specs/discovery/search-filter-sort.md`

役割:

- 一覧画面で共通利用する検索・絞り込み・並び順の基本方針を整理する
- アイテム一覧 / コーディネート一覧 / 着用履歴一覧の対象画面を横断してそろえる
- 0件時の空状態を「未登録」と「絞り込み結果なし」で分ける前提を定義する

### `specs/discovery/list-common-guidelines.md`

役割:

- 一覧画面の URL クエリ、フィルタ、並び順、ページング、状態別 UI の共通方針を整理する
- items / outfits / wear logs を横断した API / UI / テスト方針の基準をまとめる

### `specs/discovery/list-pagination.md`

役割:

- items / outfits 一覧で件数が増えたときの表示方針を整理する
- `もっと見る` UI と API ページング方針の対応を定義する

### `specs/wears/wear-logs.md`

役割:

- 着用履歴と明日着る予定の登録仕様を整理する
- outfit 起点 / item 起点 / 日付起点の登録導線、`planned / worn` の状態管理を定義する
- item 検索経由での outfit 選択、スナップショット保存、一覧・集計の前提となるデータ構造を整理する

### `specs/outfits/create-edit.md`

役割:

- Outfit の作成・編集・保存条件を整理する
- `active / invalid` の状態管理、複製、invalid 一覧の扱いを定義する
- `outfits` / `outfit_items` と API payload の前提をまとめる

### `specs/purchase-candidates.md`

役割:

- 購入検討の責務、状態管理、item への昇格、画像方針を整理する
- `purchase_candidate_images` / `item_images` の分離、`item-draft` API、比較結果の扱いをまとめる

補足:

- 比較ロジックの詳細は後続検討とする
- `dropped` と DELETE の役割分離や、candidate から item への昇格前提を含む

### `specs/README.md`

役割:

- items / outfits / wear logs / 購入検討 など、主要 spec の入口をまとめる
- 別スレッドや git 履歴からでも仕様の正本へ辿りやすくする

補足:

- 購入検討の仕様確認は `specs/README.md` -> `specs/purchase-candidates.md` の順でも辿れる
- 購入検討の API は `api/api-overview.md`、DB 保存方針は `data/database.md`、実装メモは `project/implementation-notes.md` を併せて確認する


### `specs/logging.md`

役割:

- アプリ全体で共通利用するログ出力方針を整理する
- 何を残すか、何を残さないか、ログレベル、将来の監査ログ拡張方針を定義する

### `specs/error-message-guidelines.md`

役割:

- アプリ全体のエラーメッセージの文体・情報量・案内方針を整理する
- 重要画面で漏れなく検討したいエラー場面をまとめる

### `ui/empty-state.md`

役割:

- 空状態画面で「何を伝え、次に何をしてもらうか」の基本方針を整理する
- アイテム一覧 / コーディネート一覧 / 設定 / ホーム の空状態論点をまとめる

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

- `specs/items/status-management.md`
- `specs/items/detail-status-ui.md`
- `specs/items/tops.md`
- `api/api-overview.md`
- `data/database.md`
- `project/implementation-notes.md`

### 購入検討 仕様を変えたとき

必ず確認する:

- `specs/purchase-candidates.md`
- `api/api-overview.md`
- `api/openapi.yaml`
- `data/database.md`
- `project/implementation-notes.md`

必要に応じて確認する:

- `architecture/screen-flows.md`
- `ui/empty-state.md`

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

# Docs README

このディレクトリは、wardrobe-app の仕様、API、DB、設計メモ、作業メモを置く場所です。
初めて docs を読むときは、この README から目的に合う資料へ進んでください。

## まず読むもの

- docs 全体の構造を知りたい: [docs/docs-map.md](docs-map.md)
- docs の書き方を確認したい: [docs/project/docs-writing-guidelines.md](project/docs-writing-guidelines.md)
- 機能仕様を探したい: [docs/specs/README.md](specs/README.md)
- API 契約を確認したい: [docs/api/openapi.yaml](api/openapi.yaml)
- API 方針や payload / データ構造の補足を確認したい: [docs/api/api-overview.md](api/api-overview.md)
- DB 構造を確認したい: [docs/data/database.md](data/database.md)
- 残件や判断メモを確認したい: [docs/specs/task-backlog.md](specs/task-backlog.md)
- 実装ログや引き継ぎを確認したい: [docs/project/implementation-notes.md](project/implementation-notes.md)

## 目的別の入口

### 機能仕様を確認する

- アイテム: [docs/specs/items/](specs/items/)
- コーディネート: [docs/specs/outfits/](specs/outfits/)
- 着用履歴: [docs/specs/wears/wear-logs.md](specs/wears/wear-logs.md)
- 購入検討: [docs/specs/purchase-candidates.md](specs/purchase-candidates.md)
- 買い物メモ: [docs/specs/shopping-memos.md](specs/shopping-memos.md)
- 設定: [docs/specs/settings/](specs/settings/)
- import/export: [docs/specs/import-export.md](specs/import-export.md)

### API / DB を確認する

- API 契約の正本: [docs/api/openapi.yaml](api/openapi.yaml)
- API 方針の補助資料: [docs/api/api-overview.md](api/api-overview.md)
- DB schema / 保存責務: [docs/data/database.md](data/database.md)

### docs 整理や作業状況を確認する

- docs 全体の地図: [docs/docs-map.md](docs-map.md)
- docs の表記・命名ルール: [docs/project/docs-writing-guidelines.md](project/docs-writing-guidelines.md)
- 残件・優先度・判断メモ: [docs/specs/task-backlog.md](specs/task-backlog.md)
- 作業ログ・引き継ぎ: [docs/project/implementation-notes.md](project/implementation-notes.md)

## 更新時の基本方針

- 実装変更がある場合は、必要に応じて個別仕様書、OpenAPI、DB docs、test を合わせて更新する。
- 仕様の正本はできるだけ個別 spec に寄せ、task-backlog は残件・判断メモ・試行結果を置く場所として扱う。
- docs の本文・見出し・分類名は、原則として日本語で書く。
- API field、DB column、route、file path、型名などのコード上の名称は backtick で囲んで書く。

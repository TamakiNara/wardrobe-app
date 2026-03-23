# 実装着手前チェックリスト

このファイルは、ここまで整理した docs を、実装順と副作用の観点で見返しやすくするためのチェックリストです。  
docs 上の整合確認は概ね完了しており、本書では「確認済み / 実装未着手」の観点を中心に整理します。  
大きな仕様変更は行わず、正本として `docs/specs/` `docs/data/database.md` `docs/api/openapi.yaml` を優先して参照します。

---

## 決定済み仕様

- item status は `active` / `disposed` を採用する
- `disposed` は「手放した / 現在所持していない」状態を表し、物理削除より優先する
- `disposed` item は通常一覧、outfit の選択候補、wear logs の選択候補から除外する
- 正本: `docs/data/database.md`, `docs/api/openapi.yaml`

- outfit status は `active` / `invalid` を採用する
- 通常の create / update では `status` を payload に含めず、内部状態として扱う
- `invalid` outfit は通常一覧と wear log の `source_outfit_id` 候補から除外する
- 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- wear logs は future の対象だが、仕様方針自体は決定済みとする
- `source_outfit_id` は「完全一致したコーデ」ではなく「ベースにした outfit」を表す
- 最終的な item 構成は `items` / `wear_log_items` を正本とする
- `item_source_type` は `outfit` / `manual`
- `current status` は履歴の主表示ではなく補助情報として扱う
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- event_logs は future テーブル案として整理済み
- MVP では重要な状態変化を優先対象とし、`disposed / invalid / restore / duplicate` を残す方針とする
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

---

## 未実装

- docs 上の仕様・DB・OpenAPI 反映は概ね確認済みであり、以下は主に実装未着手の項目です

- wear logs 本体は未実装
- 対象: API、DB テーブル、UI、validation、transaction、一覧・詳細・登録・更新・削除
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- invalid outfit 向けの補助導線は未実装
- 対象: invalid 一覧、手動 `restore`、`duplicate`
- 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`

- event_logs は未実装
- 対象: テーブル、発火ポイント、payload 設計、記録対象の絞り込み
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

---

## future API

- `GET /api/outfits/invalid`
- `POST /api/outfits/{id}/restore`
- `POST /api/outfits/{id}/duplicate`
- `GET /api/wear-logs`
- `GET /api/wear-logs/{id}`
- `POST /api/wear-logs`
- `PUT /api/wear-logs/{id}`
- `DELETE /api/wear-logs/{id}`
- 正本: `docs/api/openapi.yaml`

---

## 副作用あり

- item を `disposed` にすると、その item を含む `active` outfit は `invalid` に遷移する
- outfit は item が `active` に戻っても自動 `restore` しない
- 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- `disposed` item と `invalid` outfit は wear logs の新規登録・更新候補から除外する
- wear logs では `current status` を補助表示に留め、履歴正本とは分けて扱う
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- `duplicate` は `active` / `invalid` 共通機能だが、invalid outfit では再利用の主導線になる
- invalid outfit の `duplicate` では `disposed` item を通常選択状態にしない
- 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`

- event_logs を実装する場合、`item_disposed` `item_reactivated` `outfit_invalidated` `outfit_restored` `outfit_duplicated` などのイベント種別設計が連動する
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

---

## 実装順候補

1. item status の実装着手
   - `active / disposed` の docs 整合確認は概ね完了しているため、保存・更新・候補除外・削除方針の実装へ進む
   - 理由: outfit invalid 化と wear logs 候補除外の前提になるため
2. outfit status と invalid 化副作用の実装着手
   - `active / invalid`、通常保存時の `status` 非包含、item `disposed` に伴う invalid 化は docs に反映済みのため、実装を揃える
   - 理由: invalid outfit future API と wear logs の前提になるため
3. invalid outfit future API の実装着手
   - 対象: invalid 一覧、`restore`、`duplicate`
   - 理由: outfit status 運用が固まった後なら、再利用導線を独立して実装しやすいため
4. wear logs の実装着手
   - 対象: DB、API、UI、validation、一覧共通仕様との接続
   - 理由: `source_outfit_id`、`item_source_type`、候補除外、副作用の前提を利用するため
5. event_logs の実装着手
   - 対象: テーブル、発火ポイント、記録対象の絞り込み
   - 理由: item / outfit / wear logs の主要状態変化が固まってからの方が event_type と payload を固定しやすいため

---

## 実装前の確認メモ

- 仕様確認は `docs/specs/` を優先し、保存方針は `docs/data/database.md`、API schema は `docs/api/openapi.yaml` を優先する
- 実装時に docs と差異が出た場合は、このチェックリストではなく正本側を更新する
- `docs/project/implementation-notes.md` は進捗共有と引き継ぎメモ、`implementation-checklist.md` は実装前確認の整理用として使い分ける

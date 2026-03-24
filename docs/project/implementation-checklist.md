# 実装着手前チェックリスト

このファイルは、ここまで整理した docs を、実装順と副作用の観点で見返しやすくするためのチェックリストです。  
docs 上の整合確認は概ね完了しており、本書では「確認済み / 実装未着手」の観点を中心に整理します。  
大きな仕様変更は行わず、正本として `docs/specs/` `docs/data/database.md` `docs/api/openapi.yaml` を優先して参照します。
item status 変更仕様は `docs/specs/items/status-management.md` を起点に確認します。
item 詳細画面での status 操作 UI は `docs/specs/items/detail-status-ui.md` を参照します。

---

## 決定済み仕様

- item status は `active` / `disposed` を採用する
- `disposed` は「手放した / 現在所持していない」状態を表し、物理削除より優先する
- `disposed` item は通常一覧、outfit の選択候補、wear logs の選択候補から除外する
- 正本: `docs/specs/items/status-management.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- outfit status は `active` / `invalid` を採用する
- 通常の create / update では `status` を payload に含めず、内部状態として扱う
- `invalid` outfit は通常一覧と wear log の `source_outfit_id` 候補から除外する
- 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- wear logs は一覧 / 詳細 / 登録 / 更新 / 削除まで実装済み
- `source_outfit_id` は「完全一致したコーデ」ではなく「ベースにした outfit」を表す
- 最終的な item 構成は `items` / `wear_log_items` を正本とする
- `item_source_type` は `outfit` / `manual`
- `current status` は履歴の主表示ではなく補助情報として扱う
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- 一覧画面は原則として「確認・遷移」を主責務とする
- 削除導線は原則として一覧には置かず、詳細画面または編集画面に置く
- 詳細画面が未実装の機能は、当面編集画面に削除導線を置く
- 誤操作防止の confirm を前提とし、高頻度削除が必要な機能だけ例外扱いにする
- 正本: `docs/project/implementation-notes.md`, `docs/specs/wears/wear-logs.md`

- event_logs は future テーブル案として整理済み
- MVP では重要な状態変化を優先対象とし、`disposed / invalid / restore / duplicate` を残す方針とする
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

---

## 未実装

- docs 上の仕様・DB・OpenAPI 反映は概ね確認済みであり、以下は主に実装未着手の項目です

- wear logs は最小実用フローまで実装済み
- 実装済み: DB テーブル、一覧・詳細・登録・更新・削除、status / candidate exclusion / `event_date + display_order`
- 一覧は確認・遷移、詳細は確認、編集は変更・削除の責務で分ける
- 削除導線は編集画面からのみとし、一覧 / 詳細には出さない
- 未実装: snapshot、高度な候補補助
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- wear logs snapshot は **未実装の保留論点** として残す
- 現時点では current データ参照ベースで進め、snapshot なしでも一覧・登録・更新の最小実用は成立している
- 未完了タスク: 保存タイミング、保存対象、表示用途、集計用途、既存データ移行の方針整理
- 導入時の影響範囲: DB schema、API response、wear logs 一覧 / 編集 / 将来詳細 UI、集計ロジック

- purchase_candidates の MVP は CRUD / 画像 / item-draft まで実装済み
- 実装済み: 一覧・詳細・作成・更新・削除、画像追加 / 削除、`POST /api/purchase-candidates/{id}/item-draft`
- `item-draft` は `source_category_id` を保持しつつ current item API 互換の `category` / `shape` と配列項目を返す
- 未実装: 比較ロジックの高度化、item 保存成功時の `purchased` 反映自動化、item 画像保存側との本接続
- 正本: `docs/specs/purchase-candidates.md`, `docs/data/database.md`, `docs/api/openapi.yaml`


- invalid outfit 向けの補助導線は概ね実装済み
- 対象: invalid 一覧 / 詳細からの `restore` / `duplicate` と、新規作成画面への複製初期値適用
- backend: `POST /api/outfits/{id}/duplicate` は実装済み
- frontend: `duplicate` response を新規作成画面へ反映する導線は実装済み
- 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`

- event_logs は未実装
- 対象: テーブル、発火ポイント、payload 設計、記録対象の絞り込み
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

---

## future API

- 現時点の wear logs 関連 future API はなし
- purchase_candidates 関連の future API は現時点ではなし
- 正本: `docs/api/openapi.yaml`

---

## 副作用あり

- item を `disposed` にすると、その item を含む `active` outfit は `invalid` に遷移する
- outfit は item が `active` に戻っても自動 `restore` しない
- 手動 `restore` は対象 outfit が `invalid` で、構成 item がすべて `active` の場合のみ許可する
- 正本: `docs/specs/outfits/create-edit.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- `disposed` item と `invalid` outfit は wear logs の新規登録・更新候補から除外する
- wear logs では `current status` を補助表示に留め、履歴正本とは分けて扱う
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- wear log の削除は編集画面からのみ行い、物理削除で扱う
- 削除時に関連 `wear_log_items` は一緒に削除するが、別 record の `display_order` 自動再採番は行わない
- 正本: `docs/specs/wears/wear-logs.md`, `docs/data/database.md`, `docs/api/openapi.yaml`

- `duplicate` は `active` / `invalid` 共通機能だが、invalid outfit では再利用の主導線になる
- invalid outfit の `duplicate` では `disposed` item を通常選択状態にしない
- `duplicate` response は保存済み outfit ではなく、新規作成画面へ渡す初期値 payload を返す
- 正本: `docs/specs/outfits/create-edit.md`, `docs/api/openapi.yaml`

- event_logs を実装する場合、`item_disposed` `item_reactivated` `outfit_invalidated` `outfit_restored` `outfit_duplicated` などのイベント種別設計が連動する
- 正本: `docs/data/database.md`, `docs/specs/logging/logging-policy.md`

- purchase_candidates の `item-draft` は item 作成初期値生成に留め、candidate の `purchased` 更新や item 画像保存との最終接続は別責務として扱う
- `category_id -> category / shape` の変換と DB 構造差の吸収は Laravel 側で行い、frontend / BFF へ分散させない
- 正本: `docs/specs/purchase-candidates.md`, `docs/project/implementation-notes.md`

---

## 実装順候補

1. item status の実装着手
   - `active / disposed` の docs 整合確認は概ね完了しているため、保存・更新・候補除外・削除方針の実装へ進む
   - 理由: outfit invalid 化と wear logs 候補除外の前提になるため
2. outfit status と invalid 化副作用の実装着手
   - `active / invalid`、通常保存時の `status` 非包含、item `disposed` に伴う invalid 化は docs に反映済みのため、実装を揃える
   - 理由: invalid outfit 実装と wear logs の候補制約の前提になるため
3. purchase_candidates 残タスクの実装着手
   - 対象: 比較ロジック、item 保存成功時の `purchased` 反映、自動画像引き継ぎの本接続
   - 理由: MVP の CRUD / 画像 / item-draft が揃ったため、item 側との責務境界を次に詰めやすいため
4. wear logs 残タスクの実装着手
   - 対象: 候補 UI の補助改善、snapshot の採否整理
   - 理由: CRUD と責務分離は揃ったため、運用上不足する補助導線から詰めやすいため
5. event_logs の実装着手
   - 対象: テーブル、発火ポイント、記録対象の絞り込み
   - 理由: item / outfit / wear logs の主要状態変化が固まってからの方が event_type と payload を固定しやすいため

---

## 実装前の確認メモ

- 仕様確認は `docs/specs/` を優先し、保存方針は `docs/data/database.md`、API schema は `docs/api/openapi.yaml` を優先する
- 実装時に docs と差異が出た場合は、このチェックリストではなく正本側を更新する
- `docs/project/implementation-notes.md` は進捗共有と引き継ぎメモ、`implementation-checklist.md` は実装前確認の整理用として使い分ける
- ボトムナビは major feature 追加時に都度見直し、現時点では wear logs / purchase_candidates の表示対象ページ範囲と独立タブ化を TODO として残す

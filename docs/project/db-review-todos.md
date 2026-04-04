# DB Review TODOs

このファイルは、DB 見直しの後続タスクを短く整理するためのメモです。  
正本仕様を直接置き換えるものではなく、次に Codex へ依頼する作業や、設計再確認が必要な論点をまとめます。

## 優先度高: wear logs 周辺の DB 見直し

### 1. items の削除方針を固定する

- snapshot なし継続を前提に、`wear_log_items.source_item_id` から current item を参照できる状態を維持する
- そのため、`items` は原則物理削除しない方針を第一候補にする
- UI 上の `削除` が論理削除なのか、`disposed` / `inactive` / `deleted_at` のどれで扱うかを整理する
- `disposed item` は新規候補から除外しつつ、過去の wear log / outfit 参照では確認できる前提を維持する

### 2. wear_log_items の制約を見直す

- `wear_log_items` は wear log 内 item 構成の正本として扱う
- `source_outfit_id` は由来参照であり、item 構成の正本ではないことを明文化する
- 以下の制約候補を再確認する
  - `(wear_log_id, source_item_id)` unique を付けるか
  - `(wear_log_id, sort_order)` unique を付けるか
  - `sort_order` の null 禁止
  - `item_source_type` の許容値固定（`outfit` / `manual`）
  - FK と delete 方針

### 3. wear_logs.status の責務を増やしすぎない

- 現時点の第一候補は `planned` / `worn` のまま維持する
- 必要なら `cancelled` 追加を再判断する
- `invalid` / `過去未完了` / `候補外 item 含む` などは status に混ぜず、補助表示や別フラグで扱う方針を維持する

### 4. wear_logs 削除時の関連削除を確認する

- `wear_logs` 削除時に `wear_log_items` が孤児化しないことを確認する
- FK cascade delete でよいか、実装と migration の両面で確認する

## TODO: カテゴリ表示設定を JSON に寄せすぎない

現時点では current 実装を維持してよいが、今後設定粒度が増える場合は JSON 偏重のまま進めない方が安全。

### 背景

- カテゴリ表示設定は、大分類 ON/OFF だけでなく、中分類 ON/OFF、表示順、初期プリセット、将来の追加設定へ広がる可能性がある
- JSON 1 カラムへ寄せすぎると、部分更新・制約・差分確認・テストが徐々に重くなる
- settings / items / outfits / purchase candidates など、カテゴリ設定を参照する画面が増えているため、正規化の再検討余地がある

### 後続で再確認したいこと

- `user_settings` と `user_category_settings` の責務分離が必要か
- 大分類 / 中分類の ON/OFF と表示順を row ベースで持つ方がよいか
- onboarding でのプリセット選択と、保存後の個別調整を同じ保存形式で扱えるか
- 一覧 filter 候補 / create-edit 候補 / 既存データ表示で、設定参照ルールをどこまで共通化できるか

### 現時点の方針

- 今すぐ全面移行はしない
- ただし今後 settings 追加が続く場合、JSON のまま拡張し続けず、DB 正規化案を先に比較してから進める
- この論点は wear logs 周辺の DB 見直しよりは優先度を下げるが、docs 上の TODO として保持する

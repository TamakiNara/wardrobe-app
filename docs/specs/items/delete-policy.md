# Item Delete Policy

アイテム削除機能を実装する前に、**物理削除** と **状態変更** の役割分担、削除可否条件、関連データの扱いを整理するための仕様メモ。  
今回は docs 整理のみを対象とし、API / UI / DB の実装変更は行わない。

関連資料:

- item 状態管理: `./status-management.md`
- item 詳細の状態 UI: `./detail-status-ui.md`
- outfit 正本: `../outfits/create-edit.md`
- wear log 正本: `../wears/wear-logs.md`
- import/export: `../import-export.md`
- logging: `../logging.md`
- task backlog: `../task-backlog.md`

---

## 概要

item は、所持品そのものに加えて、次の履歴・派生データと結びつく。

- `outfit_items`
- `wear_log_items`
- `item_images`
- `item_materials`
- purchase candidate 側の `converted_item_id`

そのため、誤登録・重複登録のようなケースを除き、**「手放した」ことと「item record を物理削除する」ことは分けて扱う**。

現時点の基本方針:

- 実際に手放した item は、まず `disposed` で残す
- 物理削除は、**履歴や参照整合を壊さない条件**を満たす場合に限定する

---

## current の状況

### backend current

- 物理削除 API は存在する
  - `DELETE /api/items/{id}`
- route は `auth:web` 配下で、`user_id` scope をかけた `findOrFail` で対象 item を取得する
- そのため、他 user の item を削除することはできない
- item status 操作 API は存在する
  - `POST /api/items/{id}/dispose`
  - `POST /api/items/{id}/reactivate`
- care status 操作 API は存在する
  - `POST /api/items/{id}/care-status`
- 削除成功時:
  - `200`
  - `{"message":"deleted"}`
- current delete API は、以下の参照がある item を `422` で拒否する
  - `outfit_items`
  - `wear_log_items`
- current delete API の拒否文言:
  - `このアイテムは参照中のため完全に削除できません。手放す操作を利用してください。`
- 削除不可時の response は **message のみ**で、`reasons` 配列はまだない
- route の実装上、`active` / `disposed` の別で delete 可否は分けていない
  - 参照がなければ `disposed` でも delete できる想定
  - ただし `disposed` item の削除は current feature test で明示確認されていない

### frontend UI current

- `手放す` / `クローゼットに戻す` は item 詳細画面の `状態管理` セクションから操作できる
- `care_status` は item 詳細画面から操作できる
- 物理削除 button component 自体は存在する
  - `web/src/components/items/delete-item-button.tsx`
- `delete-item-button.tsx` の current 挙動
  - `window.confirm("このアイテムを削除しますか？\n削除したデータは元に戻せません。")`
  - `DELETE /api/items/{id}` を BFF 経由で呼ぶ
  - 成功時は `/items` へ遷移して `router.refresh()`
  - 失敗時は画面内に generic error を表示する
- ただし current item 詳細画面には delete button は結線されておらず、**通常の画面導線としては未実装扱い**とする
- current button は API の `message` を generic user-facing 文言へ畳んでおり、削除不可理由を個別表示する実装にはなっていない

### current status / care_status

- `status`
  - `active`
  - `disposed`
- `care_status`
  - `null`
  - `in_cleaning`

対応する current UI:

- `手放す`
  - `active -> disposed`
- `クローゼットに戻す`
  - `disposed -> active`

---

## 用語整理

### 物理削除

DB から item record 自体を削除すること。

想定用途:

- 誤登録
- 重複登録
- item 化直後の登録ミス
- 履歴として残す意味が薄く、他データからも参照されていないもの

### 状態変更

item record は残したまま、利用状態だけを変えること。

current の主対象:

- `active`
- `disposed`

想定用途:

- 実際に手放した
- いまは候補から外したい
- 着用履歴やコーディネートとの関係は残したい

### クリーニング状態

`care_status` は補助状態であり、物理削除や `disposed` とは別概念とする。

- `in_cleaning`
- `null`

---

## relation と削除時の意味

### outfits

- DB 上は `outfit_items.item_id -> items.id` が `cascadeOnDelete`
- ただし業務ルール上は、item を削除すると outfit 構成自体が変わり、履歴や invalid 判定の意味が崩れる
- current backend でも、`outfit_items` 参照がある item は削除不可

### wear logs

- DB 上は `wear_log_items.source_item_id -> items.id` が `nullOnDelete`
- つまり技術的には item 削除時に `source_item_id = null` へ落とすことは可能
- ただし業務ルール上は、何を着た記録かが曖昧になるため、current backend では削除不可

### images

- `item_images.item_id -> items.id` は `cascadeOnDelete`
- ただし current 実装では、item 削除時に storage 上の画像ファイルをまとめて削除する処理は確認できていない
- `ItemImageService::deleteImage()` には単体画像削除時の storage cleanup がある
- しかし item delete API からはその cleanup は呼ばれていない
- そのため、将来 delete を正式導線にする場合は **storage ファイル cleanup** を別途実装判断する必要がある
- current のままでは file orphan が残る可能性がある

### materials

- `item_materials.item_id -> items.id` は `cascadeOnDelete`
- 素材明細は item 従属データなので、物理削除時に一緒に消える設計で自然

### purchase candidate 由来データ

- current では item 側に `purchase_candidate_id` は持たない
- 逆に purchase candidate 側が `converted_item_id` を持つ
- `converted_item_id -> items.id` は `nullOnDelete`
- そのため item を削除すると、purchase candidate 側の item 化参照は `null` になり得る
- 技術的には整合するが、**「item 化済み履歴」をどう解釈するか**は別途要判断
- current feature test では、この relation がある item を delete した時の挙動は明示確認されていない

---

## 削除可否条件

### 物理削除してよい第一候補

- wear logs がない
- outfits 参照がない
- 誤登録・重複登録・ item 化直後の誤作成など、履歴として残す意味が薄い
- 画像・素材以外の重要 relation がない
- 削除しても purchase candidate 側の履歴解釈が致命的に壊れない

### 物理削除しない方がよい条件

- wear logs がある
- outfits に含まれている
- 着用履歴・統計・ invalid outfit の文脈で意味を持つ
- 実際に手放しただけで、履歴は残したい

### 要再判断

- 画像だけある item を delete 可能とするか
- purchase candidate から item 化されたが未使用の item を delete 可能とするか
- 将来 setup / item relation、派生 relation が入った場合の delete 条件
- item 削除時に purchase candidate 側の `converted_item_id` をどう扱うか

---

## 推奨方針

### 物理削除を許可する条件

第一候補:

- wear logs なし
- outfits 参照なし
- current の重要 relation がない
- 誤登録・重複登録・未使用の下書き的 item

### 状態変更を推奨する条件

- 実際に手放しただけ
- wear logs がある
- outfits 参照がある
- 過去のコーディネートや着用履歴の意味を残したい

### current と推奨の関係

- current backend は、最低限
  - `outfit_items`
  - `wear_log_items`
    参照がある item の delete を拒否している
- この方向性は妥当で、今後 UI を正式導線にする場合も維持を第一候補とする
- さらに purchase candidate 由来・storage file cleanup まで考慮して、delete 可否判定を明文化するのが次段階

---

## API 案

今回は実装しないが、将来の第一候補は次とする。

### `DELETE /api/items/{id}`

- 物理削除 API
- 削除可能条件を満たす場合のみ成功

成功例:

```json
{
  "message": "アイテムを削除しました。"
}
```

削除不可例:

```json
{
  "message": "このアイテムは削除できません。",
  "reasons": ["wear_logs", "outfits"]
}
```

補足:

- current API はまだ `reasons` を返さず、message のみ
- UI で削除不可理由を出し分けたい場合は、`DELETE` response 拡張か `delete-check` 導入が必要になり得る

### `GET /api/items/{id}/delete-check`

- 現時点では必須ではない
- MVP では `DELETE` 時の validation だけでもよい
- ただし UI で disabled 理由を出したい場合は後続候補

---

## frontend UI 案

### 表示場所

- item 詳細画面の下部補助操作
- 編集画面ではなく詳細画面を第一候補
- `状態管理` の近くに置くのは自然だが、`手放す` とは明確に分ける

### 削除可の場合

- `削除する`
- confirm を出す
- `この操作は取り消せません。`
- `画像も削除されます。`
  - 実際に storage cleanup を入れるなら明記

### 削除不可の場合

- 第一候補:
  - 削除 button を出さない、または disabled
  - 理由を表示する
  - `手放す` を案内する

文言候補:

- `このアイテムは着用履歴またはコーディネートに使われているため削除できません。`
- `履歴を残したい場合は「手放す」を利用してください。`

### current button を使い回す場合の論点

- current `delete-item-button.tsx` は BFF / confirm / redirect の基本動作はすでに持っている
- 一方で次は未対応
  - item 詳細への結線
  - 削除不可理由の出し分け
  - storage file cleanup 前提の文言
  - `converted_item_id` がある item の扱い説明
- そのため、**完全に作り直す必須性はないが、そのまま結線する前に仕様差分を吸収する修正が必要** と整理する

---

## logging 方針

今回は実装しないが、将来の第一候補は次とする。

### item delete

- `info`
- operation: `item.delete.completed`
- context:
  - `user_id`
  - `item_id`
  - `result`
  - `outfits_count`
  - `wear_logs_count`
  - `elapsed_ms`

### item delete rejected

- validation 的な通常操作なら、初期段階ではログ不要でもよい
- ただし調査価値が上がった場合は
  - `warning`
  - `item.delete.rejected`
    を再検討する

### disposed / reactivate

- `info`
- operations:
  - `item.status.disposed`
  - `item.status.reactivated`

---

## import / export との関係

- 物理削除された item は export されない
- `disposed` item は export される
- そのため、backup / restore の観点でも
  - delete は「履歴ごと消す」
  - disposed は「履歴を残して運用から外す」
    という意味の差を持つ

---

## tests の current

current feature / component test で確認できること:

- `ItemsEndpointsTest`
  - unreferenced item を delete できる
  - outfit 参照あり item は `422`
  - wear log 参照あり item は `422`
- `delete-item-button.test.tsx`
  - `500` 失敗時に raw DB error を画面へ出さない

current で未確認のもの:

- 他 user item の delete
- `disposed` item の delete
- images / materials を持つ item の delete
- `converted_item_id` がある item の delete
- item delete 後の storage file cleanup

---

## UI 実装前の判断事項

- image file cleanup 未実装のまま delete UI を出すか
- `converted_item_id` がある item を delete 可能にするか
- 削除不可理由を API response に追加するか
- `delete-check` API を作るか
- current `delete-item-button.tsx` を修正して使うか、作り直すか
- item detail のどこに置くか
- `状態管理` セクションとどう分けるか
- confirm 文言に image cleanup や履歴影響をどこまで書くか
- 成功後の遷移先を `/items` 固定でよいか

---

## 実装する場合の次ステップ

1. delete 可否条件を backend validation として明文化する
2. 他 user item / disposed item / converted item を含む delete test を追加する
3. purchase candidate 由来 item の扱いを決める
4. item delete 時の image file cleanup を実装するか決める
5. item 詳細に delete UI を正式導線として置くか決める
6. delete 不可理由の UI 表示方式を決める
7. structured log を `item.delete.*` / `item.status.*` として追加する

---

## 今回やらないこと

- 実装変更
- DB migration
- API 追加 / 変更
- frontend UI 追加
- logging 実装
- tests 追加 / 変更

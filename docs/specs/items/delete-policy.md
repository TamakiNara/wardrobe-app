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
  - 参照がなければ `disposed` でも delete できる
  - current feature test でも `disposed` item の delete 成功を確認済み

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
- current 実装では、item 削除時に対象 image file の `disk + path` を先に確保し、**DB 上の item delete 成功後に storage file cleanup を行う**
- `ItemImageService::deleteImage()` には単体画像削除時の storage cleanup があり、item delete でも同系統の cleanup を使う
- file delete に失敗しても item delete 自体は成功扱いとし、orphan になりうる file は warning log で追えるようにする

#### current の画像保存方針

- item image は `disk + path` で管理する
- current の主な保存先 disk は `public`
- upload 時の path は `items/{item_id}/...`
- item 化や複製時も、current 実装では item ごとの保存先へ **物理コピー** している
- そのため current の item image は、少なくとも通常運用では **item 専用 file** とみなしてよい

#### current の cleanup 実装

- 単体画像削除:
  - `ItemImageService::deleteImage()` が storage file を削除する
- item update / 画像同期:
  - `ItemImageSync` は差し替え・コピー時の整合を扱う
- item delete:
  - DB delete 後に storage file cleanup を行う
  - cleanup failure は `item.delete.image_cleanup_failed` warning log を残す

### materials

- `item_materials.item_id -> items.id` は `cascadeOnDelete`
- 素材明細は item 従属データなので、物理削除時に一緒に消える設計で自然

### purchase candidate 由来データ

- current では item 側に `purchase_candidate_id` は持たない
- 逆に purchase candidate 側が `converted_item_id` を持つ
- `converted_item_id -> items.id` は `nullOnDelete`
- そのため item を削除すると、purchase candidate 側の item 化参照は `null` になり得る
- 技術的には整合するが、**「item 化済み履歴」をどう解釈するか**は別途要判断
- current feature test では、この relation がある item を delete した時に candidate 自体は残り、`converted_item_id` が `null` になることを確認済み

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
- さらに purchase candidate 由来 relation まで考慮して、delete 可否判定を明文化するのが次段階

### image file cleanup の推奨

比較:

- 案A:
  - item delete では DB row だけ消し、storage file は残す
  - 実装は軽いが orphan file が残る
- 案B:
  - item delete 時に item image の storage file も削除する
  - DB と storage の意味を揃えやすい
- 案C:
  - DB row のみ先に消し、後続 cleanup job で orphan file を掃除する
  - 仕組みが重く、MVP にはやや過剰

推奨:

- **案Bを第一候補**とする
- 理由:
  - current の item image は item 専用 file として扱いやすい
  - 物理削除の意味と一致する
  - orphan file を運用課題として積み上げにくい

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

### image cleanup 実装時の順序案

第一候補:

- DB transaction 中に削除対象 file path を取得する
- item delete を commit する
- commit 後に storage file delete を実行する

理由:

- DB 整合を優先できる
- file delete failure で item delete 全体を巻き戻さずに済む
- transaction と storage 操作の責務を分けやすい

比較:

- file delete → DB delete
  - file は消えたのに DB が残るリスクがある
- DB delete → file delete
  - 方向性はよいが、削除対象 path を commit 前に確保しておく設計を明示した方が安全
- transaction 中に path 取得 → commit 後 delete
  - 第一候補

### file delete failure 時の扱い

第一候補:

- item delete 自体は成功させる
- file cleanup failure は warning log に残す

理由:

- storage 一時エラーで物理削除全体を止める方が UX 影響が大きい
- orphan file は後から回収できる
- current delete policy では履歴参照のない item を対象にする前提なので、DB delete を優先してよい

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
  - current backend は storage cleanup 済み前提で文言を合わせられる

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

### UI 結線前の扱い

- image cleanup 方針と backend 実装は current で揃った
- そのため UI 結線前の主な論点は
  - 削除不可理由の見せ方
  - `converted_item_id` がある item の扱い
  - confirm 文言
    へ移ったと整理する

---

## logging 方針

current では、item delete に関して次の structured log を導入済み。

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

current:

- item delete success 時に `item.delete.completed`
- item delete 中の想定外例外時に `item.delete.failed`
- image cleanup failure 時に `item.delete.image_cleanup_failed`
- `item.delete.completed` には `image_cleanup_failed_count` を含める

### item delete rejected

- validation 的な通常操作なら、初期段階ではログ不要でもよい
- ただし調査価値が上がった場合は
  - `warning`
  - `item.delete.rejected`
    を再検討する

### image cleanup failure

- `warning`
- operation:
  - `item.delete.image_cleanup_failed`
- context 候補:
  - `user_id`
  - `item_id`
  - `image_count`
  - `failed_count`
  - `disk`
  - `path_basename`

ログに出さない:

- 画像 URL 全文
- 長い path 全文
- memo 本文

### disposed / reactivate

- `info`
- operations:
  - `item.status.disposed`
  - `item.status.reactivated`

---

## import / export との関係

- 物理削除された item は export されない
- `disposed` item は export される
- item images は current import/export で backup payload に含まれる
  - `disk`
  - `original_filename`
  - `mime_type`
  - `file_size`
  - `sort_order`
  - `is_primary`
  - `content_base64`
- restore 時は item ごとの保存先に file を再生成する
- そのため、backup / restore の観点でも
  - delete は「履歴ごと消す」
  - disposed は「履歴を残して運用から外す」
    という意味の差を持つ
- item delete 時に item 専用 file を cleanup する方針は、current import/export と矛盾しない

---

## tests の current

current feature / component test で確認できること:

- `ItemsEndpointsTest`
  - unreferenced item を delete できる
  - 他 user item は delete できず `404`
  - `disposed` item でも unreferenced なら delete できる
  - item materials を持つ item は delete でき、DB row も cascade で消える
  - item image rows を持つ item は delete でき、DB row も cascade で消える
  - item image rows を持つ item は delete でき、storage file も cleanup される
  - `converted_item_id` を持つ purchase candidate があっても item は delete でき、candidate 側は `nullOnDelete`
  - outfit 参照あり item は `422`
  - wear log 参照あり item は `422`
  - image cleanup failure が起きても item delete 自体は成功し、warning log を残す
- `delete-item-button.test.tsx`
  - `500` 失敗時に raw DB error を画面へ出さない

current で未確認のもの:

- image cleanup failure を後続 cleanup job で再回収するか

---

## UI 実装前の判断事項

- `converted_item_id` がある item を delete 可能にするか
- 削除不可理由を API response に追加するか
- `delete-check` API を作るか
- current `delete-item-button.tsx` を修正して使うか、作り直すか
- item detail のどこに置くか
- `状態管理` セクションとどう分けるか
- confirm 文言に image cleanup や履歴影響をどこまで書くか
- 成功後の遷移先を `/items` 固定でよいか

推奨整理:

- cleanup は current backend で対応済み
- 次は UI と API message の整合を詰める

---

## 実装する場合の次ステップ

1. delete 可否条件を backend validation として明文化する
2. purchase candidate 由来 item の扱いを決める
3. item 詳細に delete UI を正式導線として置くか決める
4. delete 不可理由の UI 表示方式を決める
5. `item.delete.rejected` を追加するか判断する
6. `item.status.*` 以外の item operation log を追加する

---

## 今回やらないこと

- 実装変更
- DB migration
- API 追加 / 変更
- frontend UI 追加
- logging 実装
- tests 追加 / 変更

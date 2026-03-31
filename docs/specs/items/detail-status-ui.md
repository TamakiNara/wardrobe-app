# Item Detail Status UI

item 詳細画面で行う status 操作 UI の仕様を整理する。  
この資料は `item status` 正本を、item 詳細画面の UI / 導線観点で補足する。  
`disposed` / `reactivate` / `delete` の役割分担や副作用ルール自体は `docs/specs/items/status-management.md` を正本とする。

関連資料:

- item status 正本: `docs/specs/items/status-management.md`
- outfit 副作用: `docs/specs/outfits/create-edit.md`
- API: `docs/api/openapi.yaml`
- エラーメッセージ方針: `docs/specs/error-message-guidelines.md`

---

## 基本方針

- 状態管理ルールの正本は `docs/specs/items/status-management.md` とし、この資料では item 詳細画面に何を出すかだけを扱う
- item status の変更操作は item 詳細画面から行う
- 通常編集フォームに status を混ぜない
- status 変更は通常の create / update とは別導線で扱う
- UI は現在の status に応じて 1 つだけ主要アクションを表示する
- `care_status` は item 詳細から付与 / 解除する
- `care_status` は主 status と別導線で扱い、通常編集フォームには混ぜても主 status の代替にはしない

---

## 表示する操作

### `active` item の場合

- 「手放す」を表示する

### `disposed` item の場合

- 「所持品に戻す」を表示する

### 補足

- 同時に両方の操作は表示しない
- status はフォーム項目として編集させず、操作ボタンとして分離する

---

## 「手放す」操作

### 実行前確認

- 実行前に確認ダイアログを出す
- 確認文言では、少なくとも次を明記する
  - 「このアイテムを含むコーディネートは無効になります」

### 確認文言の初期案

- タイトル: `このアイテムを手放しますか？`
- 本文: `手放すと、このアイテムを含むコーディネートは無効になります。よろしいですか？`
- 実行ボタン: `手放す`
- キャンセルボタン: `キャンセル`

### 意図

- `disposed` 変更は関連 `active outfit` を `invalid` にする副作用を伴うため、誤操作を避ける
- 通常の項目更新とは異なる操作であることを明確にする

---

## 「所持品に戻す」操作

### 実行方針

- `disposed` item の詳細画面では「所持品に戻す」を表示する
- 実行後、item 自体は `active` に戻す
- ただし関連 outfit は自動 `restore` しない前提とする

### 補足

- outfit の復帰は別導線で扱う
- item 側の復帰だけで関連データが完全に元通りになるとは案内しない

---

## `care_status` 操作

### current 実装

- item 詳細画面から `in_cleaning` の付与 / 解除を行う
- `care_status` は通常の create / update payload に含めてもよいが、詳細画面には即時切替導線も置く

### 表示する操作

#### `care_status` 未設定の場合

- 「クリーニング中にする」を表示する

#### `care_status = in_cleaning` の場合

- 「クリーニング解除」を表示する

### 意味づけ

- `care_status` は補助状態であり、`disposed` のように候補除外や invalid 化の主制御には使わない
- 解除しても outfit や wear logs を自動更新しない
- wear logs 側では保存可のまま警告表示だけを行う

---

## 一覧との関係

- `disposed` item は通常一覧に出さない
- MVP では「手放したアイテム一覧」は作らない
- そのため、`disposed` item を再操作する主導線は item 詳細画面を前提とする

---

## 成功 / 失敗メッセージ方針

### 成功時

- 成功時は画面上部のバナーまたはトーストで結果を短く伝える
- 初期文言案:
  - `アイテムを手放しました。`
  - `アイテムを所持品に戻しました。`

### 失敗時

- 失敗時は画面上部のバナーで案内する
- 技術詳細は出さず、次の行動が分かる文言にする
- 初期文言案:
  - `アイテムの状態を変更できませんでした。時間をおいて再度お試しください。`
  - `対象のアイテムが見つかりませんでした。一覧から確認してください。`

### 文体

- 文体は `docs/specs/error-message-guidelines.md` に合わせて丁寧語を基本とする
- 副作用の説明は確認ダイアログで事前に伝え、失敗メッセージでは過度に詳細化しない

---

## API との対応

- 「手放す」は `POST /api/items/{id}/dispose` を想定する
- 「所持品に戻す」は `POST /api/items/{id}/reactivate` を想定する
- `care_status` の付与 / 解除は `POST /api/items/{id}/care-status` を想定する
- どちらも通常の `ItemUpsertRequest` とは分けて扱う

---

## 現時点のまとめ

- `active` item では「手放す」を表示する
- `disposed` item では「所持品に戻す」を表示する
- 通常編集フォームに status を混ぜない
- 「手放す」実行前には確認ダイアログを出す
- 確認文言では「このアイテムを含むコーディネートは無効になります」と明記する
- `disposed` item は通常一覧に出さない
- MVP では「手放したアイテム一覧」は作らない
- 成功 / 失敗メッセージは丁寧語で簡潔に案内する
- `care_status` は item 詳細から `in_cleaning` の付与 / 解除を行う
- `care_status` は候補除外や invalid 化の主制御には使わない

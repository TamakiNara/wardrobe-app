# Item Detail Status UI

item 詳細画面で行う status 操作 UI の仕様を整理する。  
この資料は `item status` 正本を、item 詳細画面の UI / 導線観点で補足する。  
`disposed` / `reactivate` の役割分担や副作用ルール自体は `docs/specs/items/status-management.md` を正本とする。

関連資料:

- item status 正本: `docs/specs/items/status-management.md`
- duplicate / color variant: `docs/specs/items/duplicate-color-variant.md`
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
- 通常の UI 主導線には物理削除を置かない
- `care_status` は item 詳細から付与 / 解除する
- `care_status` は主 status と別導線で扱い、通常編集フォームには混ぜても主 status の代替にはしない
- `複製` / `色違い追加` は status 操作とは別系統の派生作成導線として扱う
- `複製` / `色違い追加` は破壊系操作の近くへ寄せすぎない

---

## 表示する操作

### 全 status 共通で出してよい操作

- `複製`
- `色違い追加`

補足:

- `複製` / `色違い追加` の正本仕様は `docs/specs/items/duplicate-color-variant.md` を参照する
- `disposed` item でも draft 生成自体は許可してよい
- ただし新規保存後の item は `active` 開始を前提とする

### `active` item の場合

- 「手放す」を表示する

### `disposed` item の場合

- 「クローゼットに戻す」を表示する

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

## 「クローゼットに戻す」操作

### 実行方針

- `disposed` item の詳細画面では「クローゼットに戻す」を表示する
- 実行後、item 自体は `active` に戻す
- ただし関連 outfit は自動 `restore` しない前提とする

### 補足

- outfit の復帰は別導線で扱う
- item 側の復帰だけで関連データが完全に元通りになるとは案内しない

---

## `care_status` 操作

### 現状の実装

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
- 「手放したアイテム一覧」は別画面として用意する
- `disposed` item の再操作は、手放したアイテム一覧と item 詳細画面の両方から行える前提とする

---

## 成功 / 失敗メッセージ方針

### 成功時

- 成功時は画面上部のバナーまたはトーストで結果を短く伝える
- 初期文言案:
  - `アイテムを手放しました。`
  - `アイテムをクローゼットに戻しました。`

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
- 「クローゼットに戻す」は `POST /api/items/{id}/reactivate` を想定する
- `care_status` の付与 / 解除は `POST /api/items/{id}/care-status` を想定する
- `複製` は `POST /api/items/{id}/duplicate` を第一候補とする
- `色違い追加` は `POST /api/items/{id}/color-variant` を第一候補とする
- どちらも通常の `ItemUpsertRequest` とは分けて扱う

---

## 現時点のまとめ

- `active` item では「手放す」を表示する
- `disposed` item では「クローゼットに戻す」を表示する
- 通常編集フォームに status を混ぜない
- 「手放す」実行前には確認ダイアログを出す
- 確認文言では「このアイテムを含むコーディネートは無効になります」と明記する
- `disposed` item は通常一覧に出さない
- 「手放したアイテム一覧」は別画面として用意する
- 成功 / 失敗メッセージは丁寧語で簡潔に案内する
- `care_status` は item 詳細から `in_cleaning` の付与 / 解除を行う
- `care_status` は候補除外や invalid 化の主制御には使わない

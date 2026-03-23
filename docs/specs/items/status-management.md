# Item Status Management

item status の状態管理と、副作用を伴う運用方針を整理する。  
この資料は既存 docs の内容を item status 観点で集約したものであり、大きな仕様変更は行わない。

関連資料:

- DB: `docs/data/database.md`
- API: `docs/api/openapi.yaml`
- outfit 連携: `docs/specs/outfits/create-edit.md`
- logging: `docs/specs/logging/logging-policy.md`

---

## 概要

item status は、item を通常利用対象として扱うかどうかを管理する内部状態である。

MVP では、item status に次の 2 値を持つ。

- `active`
- `disposed`

---

## `disposed` の意味

- `disposed` は「手放した / 現在所持していない」状態を表す
- wear logs や過去の参照を残す都合上、物理削除より `disposed` を優先する
- 単なる軽微編集とは異なり、outfit / wear logs に影響する状態変更として扱う

---

## 通常 update payload との役割分担

### 方針

- 通常の create / update payload に `status` は含めない
- `status` は内部状態として管理する
- `disposed` への変更は別導線で扱う前提とする

### 理由

- `disposed` 変更時は、関連 outfit の `invalid` 化など副作用を伴う
- 通常の項目更新と同列に扱うと、副作用の確認や制御が曖昧になりやすい

補足:

- OpenAPI でも `ItemUpsertRequest` は通常の項目更新 request として定義し、`status` 非包含方針を採用している

---

## 一覧・候補からの除外

### 通常一覧

- `disposed` item は通常一覧から除外する

### outfit 候補

- `disposed` item は outfit の新規作成・更新時の候補から除外する
- `disposed` item を含めた保存は不可とする

### wear logs 候補

- `disposed` item は wear logs の新規登録・更新時の候補から除外する
- wear logs で `disposed` item を指定することは不可とする

---

## outfit への副作用

### item を `disposed` にした時

- その item を含む `active` outfit は `invalid` に遷移する
- これは item status 変更に伴う副作用として扱う

### item が `active` に戻った時

- outfit は自動 `restore` しない
- 復帰が必要な場合は、invalid outfit 側の手動 `restore` 導線で扱う前提とする

### 副作用の意図

- 通常利用できない item を含む outfit を通常一覧や再利用導線に残さないため
- 利用可能かどうかを曖昧にしないため
- 復帰時も自動反映ではなく、ユーザー判断を伴う運用に寄せるため

---

## delete との役割分担

### `disposed`

- 「今は所持していないが、履歴や参照整合のためレコードは残す」状態
- wear logs や関連 outfit への影響を考慮した状態管理の導線

### delete

- item レコード自体を削除する操作
- wear logs で参照されている場合は安易に物理削除させず、まず `disposed` を優先誘導する

### 方針

- 「所持していない」と「履歴上も不要」は分けて扱う
- MVP では、参照整合や副作用を考えると `disposed` を優先する

---

## logging 方針との関係

- `disposed` は outfit / wear logs に影響するため、軽微な項目編集より記録価値が高い
- logging では `item_disposed` `item_reactivated` を最小セットに含める
- 副作用で発生する `outfit_invalidated` も関連イベントとして扱う

---

## 現時点のまとめ

- item status は `active` / `disposed`
- `disposed` は「手放した / 現在所持していない」状態
- 通常 update payload に `status` は含めない
- `disposed` item は通常一覧 / outfit 候補 / wear logs 候補から除外する
- item を `disposed` にした時、関連 `active` outfit を `invalid` にする
- item が `active` に戻っても outfit は自動 `restore` しない
- delete と `disposed` は役割を分け、MVP では `disposed` を優先する

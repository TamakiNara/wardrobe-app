# Item Status Management

item status の状態管理と、副作用を伴う運用方針を整理する。  
この資料は item 状態管理ルールの正本とし、既存 docs の内容を item status 観点で集約する。  
詳細画面のボタン配置や確認ダイアログなどの UI 導線は `docs/specs/items/detail-status-ui.md` を参照する。

関連資料:

- DB: `docs/data/database.md`
- API: `docs/api/openapi.yaml`
- outfit 連携: `docs/specs/outfits/create-edit.md`
- logging: `docs/specs/logging/logging-policy.md`
- item 詳細 UI: `docs/specs/items/detail-status-ui.md`

---

## 概要

item status は、item を通常利用対象として扱うかどうかを管理する内部状態である。

初期実装範囲では、item status に次の 2 値を持つ。

- `active`
- `disposed`

補助状態として、別カラム `care_status` を持つ。

- `null`
- `in_cleaning`

---

## 役割分担

- `disposed`
  - 「手放した / 現在所持していない」を表す主 status
  - outfit / wear logs の候補や副作用に影響する
- `reactivate`
  - `disposed` item を `active` に戻す操作
  - item 自体だけを復帰させ、related outfit の自動復旧は行わない
- `delete`
  - item record 自体を削除する操作
  - 状態管理の代替ではなく、登録ミスや不要 record の整理に限定して扱う
- `care_status`
  - 主 status ではなく補助状態
  - 現時点では `in_cleaning` のみを持ち、候補除外や invalid 化の主制御には使わない

---

## `disposed` の意味

- `disposed` は「手放した / 現在所持していない」状態を表す
- wear logs や過去の参照を残す都合上、物理削除より `disposed` を優先する
- 単なる軽微編集とは異なり、outfit / wear logs に影響する状態変更として扱う

---

## `care_status` の意味

- `care_status` は主 status ではなく補助状態として扱う
- 現状の実装の許可値は `in_cleaning` のみ
- `in_cleaning` は「クリーニング中」を表す
- 主制御ではなく、バッジ表示・警告・解除導線などの補助 UI に使う
- `disposed` と同列の強い状態にはしない

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

### `in_cleaning` item の扱い

- `in_cleaning` item は通常一覧から除外しない
- `in_cleaning` item は outfit の新規作成・更新候補から除外しない
- `in_cleaning` item は wear logs の新規登録・更新候補から除外しない
- wear logs では planned / worn ともに保存可能とし、UI 上で警告だけを出す

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
- 初期実装範囲では、参照整合や副作用を考えると `disposed` を優先する

---

## 現状の実装 / 今後対応 / 未確定

### 現状の実装

- item status は `active` / `disposed` を持つ
- 通常の create / update payload に `status` は含めない
- `dispose` / `reactivate` は item 詳細画面からの専用操作導線として扱う
- `disposed` item は通常一覧、outfit 候補、wear logs 候補から除外する
- `disposed` item は `GET /api/items/disposed` と `/items/disposed` の dedicated 一覧で確認し、詳細画面から `reactivate` する
- item を `disposed` にした時、その item を含む `active` outfit は `invalid` に遷移する
- `reactivate` しても related outfit は自動 `restore` しない
- `care_status = in_cleaning` は補助状態として扱い、候補除外や invalid 化の主制御には使わない
- wear logs や過去参照を残す前提で、物理削除より `disposed` を優先する

### 今後対応

- 通常編集フォームへ `status` を混ぜない方針を維持する
- related outfit invalid 化や wear logs 候補除外を、状態変更操作と一体で分かる UI に寄せる

### 未確定

- `disposed_at` / `dispose_reason` を 現在の schema に追加するか
- event log で `item_disposed` / `item_reactivated` をどこまで現状の範囲に含めるか
- `delete` をどの条件まで許容し、どこから `disposed` へ誘導するか

---

## logging 方針との関係

- `disposed` は outfit / wear logs に影響するため、軽微な項目編集より記録価値が高い
- logging では `item_disposed` `item_reactivated` を最小セットに含める
- 副作用で発生する `outfit_invalidated` も関連イベントとして扱う

---

## 現時点のまとめ

- item status は `active` / `disposed`
- 補助状態として `care_status = in_cleaning | null` を持つ
- `disposed` は「手放した / 現在所持していない」状態
- `care_status` は主制御には使わず、補助表示・警告・解除導線に使う
- 通常 update payload に `status` は含めない
- `disposed` item は通常一覧 / outfit 候補 / wear logs 候補から除外する
- `in_cleaning` item は通常一覧 / outfit 候補 / wear logs 候補から除外しない
- item を `disposed` にした時、関連 `active` outfit を `invalid` にする
- item が `active` に戻っても outfit は自動 `restore` しない
- delete と `disposed` は役割を分け、初期実装範囲では `disposed` を優先する

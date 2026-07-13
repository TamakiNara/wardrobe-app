# アイテム状態管理

## 目的

アイテムを現在使える状態として扱うか、手放した状態として扱うか、補助的なケア状態を持つかを整理します。

アイテム状態は、通常一覧、コーディネート、着用履歴、削除可否に影響します。通常編集と状態変更の責務を分けることで、履歴や参照関係を壊さずにアイテムを管理できるようにします。

## 適用範囲

### この資料で扱うこと

- 所有状態 `status`
- 補助状態 `care_status`
- 通常編集と状態変更操作の境界
- 状態変更による一覧、候補、関連データへの影響
- 状態管理との境界としての物理削除の扱い
- 複製・色違い追加時の `care_status` の扱い
- 状態管理として確認すべきテスト観点

### この資料で扱わないこと

- 状態変更画面の配置、文言、確認ダイアログの詳細
- 物理削除の詳細な許可条件、画像削除、削除ログ、削除 UI
- 複製・色違い追加時の入力値生成ルールや画面導線
- 各機能固有の詳細な画面仕様

上記は関連 docs を参照します。

## 状態仕様

### 状態の全体像

| 種別     | 値            | 意味                                  | 主な用途                             |
| -------- | ------------- | ------------------------------------- | ------------------------------------ |
| 所有状態 | `active`      | 現在利用できるアイテム                | 通常一覧、候補選択、編集             |
| 所有状態 | `disposed`    | 手放した / 現在所持していないアイテム | 履歴保持、手放したアイテム一覧、復帰 |
| ケア状態 | `null`        | 補助状態なし                          | 通常表示                             |
| ケア状態 | `in_cleaning` | クリーニング中                        | バッジ、警告、解除導線               |

`status` は主状態、`care_status` は補助状態です。`care_status` は候補除外や `invalid` 化の主制御には使いません。

### 通常編集と状態変更の境界

通常編集は、アイテムの基本属性、カテゴリ別属性、画像、購入情報、メモ、補助状態 `care_status` などを作成・更新する操作です。

状態変更は、所有状態 `status` を切り替える操作です。通常編集とは副作用と責務が異なるため、通常の作成・更新 payload からは `status` を変更できません。

| 操作                | 主な対象                    | 更新経路                           | 副作用                                       |
| ------------------- | --------------------------- | ---------------------------------- | -------------------------------------------- |
| 通常作成・更新      | アイテム属性、`care_status` | `ItemUpsertRequest`                | 関連 outfit の `invalid` 化は行わない        |
| `disposed` への変更 | `status`                    | `POST /api/items/{id}/dispose`     | 関連する `active` outfit を `invalid` にする |
| `active` への復帰   | `status`                    | `POST /api/items/{id}/reactivate`  | 関連 outfit は自動復旧しない                 |
| ケア状態の即時更新  | `care_status`               | `POST /api/items/{id}/care-status` | 候補除外や `invalid` 化は行わない            |

`care_status` は補助状態であり、通常の作成・更新 payload と item 詳細画面の即時更新の両方から変更できます。

### 所有状態 `status`

`status` は `active` / `disposed` を持ちます。

- `active`
  - 現在利用できるアイテムを表します。
  - 通常一覧に表示します。
  - コーディネートや着用履歴の新規候補に出せます。
- `disposed`
  - 手放した / 現在所持していないアイテムを表します。
  - 通常一覧には表示しません。
  - 手放したアイテム一覧で確認します。
  - コーディネートや着用履歴の新規候補から除外します。
  - 既存の着用履歴に含まれている場合は、履歴保持のため表示・保持できます。
  - item 詳細画面から `active` へ戻せます。

すでに `disposed` の item を `dispose` しようとした場合、またはすでに `active` の item を `reactivate` しようとした場合は validation error とします。

### ケア状態 `care_status`

`care_status` は補助状態です。現在の許可値は `in_cleaning` のみで、補助状態なしは `null` です。

- `in_cleaning` は「クリーニング中」を表します。
- 通常一覧から除外しません。
- コーディネート候補や着用履歴候補から除外しません。
- 着用履歴では保存可能とし、UI で警告だけを出します。
- `disposed` と同じ強い状態にはしません。
- 複製・色違い追加時には引き継ぎません。

## システム上の扱い

### 画面

この資料では、画面仕様のうち状態管理として守る原則だけを扱います。

- `status` は通常の編集フォーム項目にしません。
- `disposed` への変更と `active` への復帰は、item 詳細画面の専用操作として扱います。
- `care_status` は補助状態として表示・編集します。
- 物理削除は状態管理の主導線に混ぜず、削除用の補助導線として扱います。
- 状態変更に伴う副作用は、画面だけで完結させず API / backend 側のルールとして扱います。

ボタン配置、確認 UI、成功 / 失敗メッセージの詳細は `docs/specs/items/detail-status-ui.md` を参照します。

### API

| API 名                       | route                              | 役割                                        |
| ---------------------------- | ---------------------------------- | ------------------------------------------- |
| アイテム作成                 | `POST /api/items`                  | 通常作成。`status` は payload に含めない    |
| アイテム更新                 | `PUT /api/items/{id}`              | 通常更新。`status` は payload に含めない    |
| 手放したアイテム一覧取得     | `GET /api/items/disposed`          | `status = disposed` の item を取得する      |
| アイテムを手放す             | `POST /api/items/{id}/dispose`     | `active` item を `disposed` にする          |
| アイテムをクローゼットに戻す | `POST /api/items/{id}/reactivate`  | `disposed` item を `active` に戻す          |
| ケア状態更新                 | `POST /api/items/{id}/care-status` | `care_status` を更新する                    |
| アイテム物理削除             | `DELETE /api/items/{id}`           | 参照関係が許す場合に item record を削除する |

`dispose` / `reactivate` は response に状態変更後の item を含みます。`care-status` は `care_status` 更新後の item を返します。

### DB

- `items.status`
  - 型: string
  - default: `active`
  - 値: `active` / `disposed`
- `items.care_status`
  - 型: string nullable
  - 値: `null` / `in_cleaning`

### ログ

状態管理仕様の責務は、状態変更の成功・失敗を追跡できる structured log を出力することです。
詳細は `docs/specs/logging.md` を参照します。

## 他機能への影響

### コーディネート

- `disposed` item は、新規作成・編集時の候補から除外します。
- `disposed` item を含む保存は不可とします。
- item を `disposed` にした時、その item を含む `active` outfit は `invalid` に遷移します。
- item を `active` に戻しても、関連 outfit は自動復旧しません。
- 復旧が必要な場合は、outfit 側の手動 `restore` 導線で扱います。

### 着用履歴

- `disposed` item は、新規登録・編集時の新規候補から除外します。
- 新しく `disposed` item を指定して保存することは不可とします。
- 既存の wear log にすでに含まれる `disposed` item は、過去履歴保持のため表示・保持できます。
- `in_cleaning` item は保存可能です。ただし UI 上で警告を出します。

### 物理削除

`disposed` と物理削除は別の操作です。

- `disposed`
  - item record を残したまま、現在利用しない状態にします。
  - 履歴や参照整合を守りたい場合に使います。
  - 通常のユーザー向け主導線です。

- 物理削除
  - item record 自体を削除します。
  - 誤登録、重複登録、不用 record の整理に限定します。
  - `outfit_items` や `wear_log_items` から参照されている item は削除せず、`disposed` を優先します。

`outfit_items` または `wear_log_items` から参照されている item の物理削除は `422` で拒否します。参照がなければ `active` / `disposed` のどちらでも物理削除できます。

purchase candidate が `converted_item_id` で対象 item を参照していても、その参照だけでは物理削除を拒否する理由にはしません。

物理削除時は、purchase candidate 側の `converted_item_id` を `null` にします。

削除条件、画像削除、削除ログ、削除 UI の詳細は `docs/specs/items/delete-policy.md` を参照します。

## テスト観点

### 状態変更

- 通常の作成・更新経路から `status` が変わらず、専用 route でだけ `active` / `disposed` を切り替えられること。
- 同じ状態への `dispose` / `reactivate` が拒否され、関連 outfit などへ不要な副作用を出さないこと。
- `dispose` 成功時に関連する `active` outfit が `invalid` になり、`reactivate` 成功時には自動復帰しないこと。
- `care_status = in_cleaning` が候補除外、outfit の `invalid` 化、所有状態変更の代替にならないこと。

### 関連機能

- `disposed` item がコーディネート・着用履歴の新規候補から除外されること。
- 既存の着用履歴に含まれる `disposed` item は、履歴保持のため表示・保持できること。
- `in_cleaning` item を含む着用履歴は保存可能で、警告表示に留まること。

### 物理削除との境界

- 物理削除可否が `status` ではなく参照関係で決まること。
- 参照あり item の物理削除が拒否され、item と関連 record の状態が変わらないこと。
- 参照なし item の物理削除では、purchase candidate 側の `converted_item_id` が解除されること。

## 関連 docs

- `docs/specs/items/detail-status-ui.md`
- `docs/specs/items/delete-policy.md`
- `docs/specs/items/duplicate-color-variant.md`
- `docs/specs/outfits/create-edit.md`
- `docs/specs/wears/wear-logs.md`
- `docs/specs/logging.md`
- `docs/data/database.md`
- `docs/api/openapi.yaml`

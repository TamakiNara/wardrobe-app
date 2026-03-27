# Outfit Create / Edit Specification

Outfit の作成・編集・状態管理に関する仕様を定義する。  
この資料では、Outfit の保存条件、item 構成ルール、invalid の扱い、複製仕様、一覧表示方針を整理する。

---

## 概要

Outfit は、**ユーザーが再利用したい item の組み合わせ** を表す。  
wear logs に対しては、実際に着た記録そのものではなく、**ベースにしたコーデ定義** として参照される。

保存時の正本は以下の 2 つで構成する。

- `outfits`
- `outfit_items`

---

## 基本方針

- Outfit は「いま使えるコーデ定義」として扱う
- 保存条件は **active な item を1件以上含むこと**
- 同一 outfit 内で同一 item の重複は許可しない
- item の順序は `outfit_items.sort_order` で管理する
- `invalid` は手動で作る状態ではなく、副作用で遷移する状態とする
- invalid outfit は直接編集より **複製して新規作成** を主導線とする
- `duplicate`（複製）機能自体は `active` / `invalid` を問わず利用可能とする
- `invalid` と削除は別概念として扱う

---

## Outfit の役割

Outfit は、以下の役割を持つ。

- item 群の組み合わせを保存する
- item の表示順を保存する
- wear logs の `source_outfit_id` の参照元になる
- 再利用・派生作成の基点になる

---

## 保存条件

### 必須条件

- item を **1件以上** 含む
- 含まれる item はすべて `active`
- 同一 item 重複なし
- `sort_order` が連番
- 通常の作成・更新では `status=active` 前提で扱う

### 任意項目

- `name`
- `memo`
- `seasons`
- `tpos`

---

## item 構成ルール

### 基本

- item は複数指定可
- 同一 outfit 内で同一 item の重複は禁止
- `sort_order` は 1,2,3... の連番
- 並び変更は UI 上下移動で行う

### `sort_order` の扱い

- 新規追加時は末尾に追加
- 中間削除時は残りを詰め直す
- 編集途中の操作ごとに即保存せず、保存時に全体更新する

---

## 他 outfit と同一構成の扱い

### 方針

**他 outfit と全く同じ item 構成の登録は許可する。**

### 理由

同一構成でも、以下により別 outfit として扱う価値があるため。

- 名前違い
- TPO 違い
- season 違い
- memo 違い
- 派生用テンプレートとしての利用

MVP では、全体構成の重複禁止は行わない。

---

## name の扱い

### 保存

- `name` は nullable でよい

### 表示

- `name` が未設定の場合、UI では空欄表示にしない
- フォールバック表示名を用いる

### MVP 推奨表示

- 一覧では `名称未設定`
- 必要に応じてサブ表示で item 構成の概要を出す

### 一覧での補助表示

- current の outfit 一覧では、item 構成の配色情報から生成する配色サムネイルを補助表示として出す
- 詳細は `docs/specs/color-thumbnails.md` を正本とする

---

## `status` の扱い

### 値

- `active`
- `invalid`

### `active`

- 通常利用可能
- 通常一覧に表示
- wear log の `source_outfit_id` 候補になる

### `invalid`

- 構成 item の状態により通常利用できない
- 通常一覧には出さない
- invalid outfit 一覧で確認する
- wear log の `source_outfit_id` 候補には出さない

---

## invalid と削除の違い

### invalid

- 「今は通常利用できない状態」
- DB 上は残る
- invalid 一覧で確認・復帰・複製可能
- 主に item 状態変化の副作用で発生する

### 削除

- ユーザーが outfit 自体を不要と判断した状態
- invalid とは別概念
- MVP では通常削除操作として扱う
- 論理削除の導入は将来検討

### 方針

**invalid は削除の代替ではない。**  
「使えない」と「要らない」は分けて扱う。

---

## item の状態変更との関係

### 作成・更新時

- `disposed` item を含めて保存不可

### item が `disposed` になった時

- その item を含む `active` outfit を `invalid` 化する

### item が `active` に戻った時

- outfit は自動復帰しない
- invalid 一覧から手動復帰する

---

## invalid outfit の扱い

### 基本

- 通常一覧に出さない
- invalid outfit 一覧で管理する
- 複製して新規作成を主導線とする
- MVP では、invalid outfit の再利用は直接編集より複製して新規作成を主導線とし、手動復帰は条件を満たす場合のみ補助導線として扱う

### 手動復帰条件

- 構成 item がすべて `active`
- 他に invalid 理由がない

### 手動復帰時

- `status = active` に戻す
- item 構成自体は変更しない

補足:

- API 名称上は `restore` として扱う

---

## Outfit の `duplicate` 仕様

### 基本

- `duplicate` は **active / invalid 共通機能**
- invalid では特に再利用導線として重要とする

### 遷移先

- Outfit 新規作成画面

### 引き継ぐもの

- `name`（`（コピー）` 付き）
- `memo`
- `seasons`
- `tpos`
- item 構成と `sort_order`

### 引き継がないもの

- `id`
- `status`
- `created_at`
- `updated_at`

### disposed item の扱い

- active outfit の複製では通常どおり引き継ぐ
- invalid outfit の複製では、disposed item は通常選択状態にしない
- 「元コーデには含まれていたが現在は使えない」と分かる形で表示する

### 保存条件

- active item のみで構成されていること
- 通常の outfit 保存条件を満たすこと

---

## API 方針

### 一覧

`GET /api/outfits`

### 詳細

`GET /api/outfits/{id}`

### 作成

`POST /api/outfits`

### 更新

`PUT /api/outfits/{id}`

### 削除

`DELETE /api/outfits/{id}`

関連資料:

- DB: `docs/data/database.md`
- wear logs 連携: `docs/specs/wears/wear-logs.md`
- API: `docs/api/openapi.yaml`

### payload 方針

作成 / 更新は同形 payload を前提とする。

```json
{
  "name": "通勤セット",
  "memo": "春秋向け",
  "seasons": ["春", "秋"],
  "tpos": ["仕事"],
  "items": [
    {
      "item_id": 101,
      "sort_order": 1
    },
    {
      "item_id": 205,
      "sort_order": 2
    }
  ]
}
```

### 補足

- `status` は通常作成 / 更新 payload に含めない
- `status` は内部状態として管理する
- 更新時は明細込み全体更新を前提とする

---

## バリデーション方針

### 必須

- `items` は配列で 1 件以上
- 各 `item_id` は自分の item
- 各 item は `active`
- 同一 `item_id` 重複不可
- `sort_order` 必須
- `sort_order` は連番

### 任意

- `name`
- `memo`
- `seasons`
- `tpos`

- 他 outfit と同一 item 構成であっても保存を許可する
- 全体構成の重複チェックは MVP では行わない

---

## 一覧表示方針

### 通常一覧

- `active` outfit のみ表示

### invalid 一覧

- `invalid` outfit のみ表示
- 検索
- invalid 理由の簡易表示
- 詳細確認
- 複製して新規作成
- 手動復帰は一覧から直接ではなく、詳細で条件確認後に行う

### 一覧の見せ方（MVP）

- タイトル（name またはフォールバック）
- season / tpo
- 一覧向けの短い invalid 理由
- 画像・サムネイル中心ではなく、まずはテキスト中心で始める

---

## 詳細表示方針

### active 詳細

- item 構成
- 並び順
- season / tpo / memo
- item の `current status`（`active` / `disposed`）を補助表示

### invalid 詳細

- invalid 一覧から参照
- invalid 理由の簡易表示
- disposed item の有無が分かる補助表示
- 手動復帰または複製導線
- invalid の current 主導線は「詳細で状況確認 → 複製または復旧検討」とする

---

## テスト観点

### 作成

- active item のみで作成できる
- item 1件以上で作成できる
- item 重複はエラー
- disposed item はエラー
- sort_order 連番で保存できる

### 更新

- item 構成を全置換できる
- 並び順変更できる
- disposed item を含む更新は不可

### status 副作用

- item disposed で関連 outfit が invalid 化
- item active 復帰でも outfit 自動復帰しない
- invalid outfit は手動復帰のみ

### 複製

- active outfit から複製できる
- invalid outfit から複製できる
- `（コピー）` 付き名称
- invalid 由来複製では disposed item は通常選択状態では入らない
- active item のみなら保存できる

---

## 現時点のまとめ

Outfit は、MVP では以下の思想で進める。

- **再利用可能なコーデ定義**
- **保存条件は active item 1件以上**
- **同一 outfit 内の item 重複禁止**
- **順序は `outfit_items.sort_order` で管理**
- **`invalid` は副作用でのみ発生**
- **削除と invalid は分ける**
- **複製は共通機能、invalid では再利用主導線**
- **一覧はテキスト中心で始める**

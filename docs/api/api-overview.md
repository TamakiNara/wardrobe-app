# API

## Action Keywords

action keyword は、成功時 response の `message` に入る短い状態語です。
record を返すかどうかで読み方が変わるため、以下を共通ルールとします。

| keyword | 主な schema | 主な endpoint | record 返却 | 成功結果の正本 |
| --- | --- | --- | --- | --- |
| `created` | `ItemResponseWithMessage`, `OutfitResponseWithMessage`, `WearLogMutationResponse`, `PurchaseCandidateResponseWithMessage`, `PurchaseCandidateImageResponseWithMessage`, `UserBrandResponseWithMessage` | `POST /api/items`, `POST /api/outfits`, `POST /api/wear-logs`, `POST /api/purchase-candidates`, `POST /api/purchase-candidates/{id}/images`, `POST /api/settings/brands` | あり | response に含まれる作成後 record |
| `updated` | `ItemResponseWithMessage`, `OutfitResponseWithMessage`, `WearLogMutationResponse`, `PurchaseCandidateResponseWithMessage`, `UserBrandResponseWithMessage`, `CategoryVisibilitySettingsUpdatedResponse` | `PUT /api/items/{id}`, `PUT /api/outfits/{id}`, `PUT /api/wear-logs/{id}`, `PUT /api/purchase-candidates/{id}`, `PATCH /api/settings/brands/{id}`, `PUT /api/settings/categories` | あり | response に含まれる更新後 record / 設定値 |
| `deleted` | `MessageOnlyResponse` | `DELETE /api/items/{id}`, `DELETE /api/items/{id}/images/{imageId}`, `DELETE /api/outfits/{id}`, `DELETE /api/wear-logs/{id}`, `DELETE /api/purchase-candidates/{id}`, `DELETE /api/purchase-candidates/{id}/images/{imageId}` | なし | 後続の一覧 / 詳細取得結果 |
| `logged_out` | `MessageOnlyResponse` | `POST /api/logout` | なし | Cookie と後続の `GET /api/me` |
| `disposed` | `ItemResponseWithMessage` | `POST /api/items/{id}/dispose` | あり | response に含まれる状態変更後 item |
| `reactivated` | `ItemResponseWithMessage` | `POST /api/items/{id}/reactivate` | あり | response に含まれる状態変更後 item |
| `restored` | `OutfitResponseWithMessage` | `POST /api/outfits/{id}/restore` | あり | response に含まれる復帰後 outfit |
| `duplicated_payload_ready` | `OutfitDuplicateResponse` | `POST /api/outfits/{id}/duplicate` | payload のみ | response に含まれる新規作成用初期値 payload |

補足:

- `created` / `updated` は、後続処理の action keyword であり、作成・更新結果そのものは record 側を正本として読む
- `deleted` / `logged_out` は record を返さないため、message は完了通知に留まり、正本は後続状態確認で読む
- `duplicated_payload_ready` は状態変更結果ではなく、初期値 payload 準備完了を表す

### Naming Rules

- 作成完了は `created`、更新完了は `updated`、削除完了は `deleted` を優先し、同じ意味の別 keyword を増やさない
- `disposed` / `reactivated` / `restored` のような状態変更系 keyword は、CRUD の `updated` では意味が弱くなる場合にだけ使う
- `duplicated_payload_ready` のような特殊用途 keyword は、record の状態変更ではなく payload 準備完了を伝えたい場合に限定する
- `message` は補助情報であり、record を返す API では record 側を正本として読む
- `MessageOnlyResponse` を返す API では、`message` は完了通知に留め、結果の正本は後続の状態確認で読む
- 新規 API で独自 keyword を増やすのは、既存の `created / updated / deleted` では操作結果の意味が曖昧になり、かつ状態変更や payload 準備完了のような明確な差分がある場合に限る
- 単に UI 向けの成功文言を返したいだけなら、新しい keyword を増やさず既存 keyword を使う
- record を返す更新系で「何が変わったか」を強調したい場合は、まず endpoint description と schema description を補う。keyword の追加はその後に検討する

### Error Response Guide

- OpenAPI には、current 実装でアプリ固有の意味や読み分けがある error response を優先して明示する
- 現時点で明示対象にするのは、主に `422` / `401` / `404` と、必要時の `409`
- `422` / `401` / `404` / `409` はアプリ仕様としての判断や復旧方針があるため、endpoint 単位で意味が読めるようにする
- `400` / `429` / `500` は、アプリ独自の契約がない限り framework default に委ね、通常の endpoint 定義には過剰に書かない
- 成功 response は action keyword と record の役割分担、失敗 response は status code と error schema の役割分担を先に決めてから追記する

### 422 / Validation Rules

- 成功時の `message` は action keyword、失敗時の `message` は人が読む補助説明として役割を分ける
- `ValidationErrorResponse` は field 単位の `errors` を持つ 422 response であり、正本は `errors` を読む
- `ValidationErrorResponse.message` は validation 全体の補助説明であり、個別項目の判断材料は `errors` を優先する
- 業務ルール違反や認証失敗など、field 単位の `errors` を返さない 422 は message only response として扱う
- 1 つの endpoint で validation error と業務ルール違反の両方があり得る場合は、OpenAPI 上で両方を読めるようにする
- 新規 API で 422 を追加するときは、まず `errors` が必要かを決める。field ごとの修正誘導が必要なら `ValidationErrorResponse`、そうでなければ message only を優先する

### 409 / Business Rule Rules

- current API では、競合系・業務ルール違反の失敗は原則として `409` ではなく `422` に寄せる
- `409` は現時点ではほぼ未使用とし、後続導入時も「同時更新競合」や「バージョン不整合」のように 422 では意味が弱い場合に限定する
- `422 + ValidationErrorResponse`
  - field 単位で修正可能な不備がある場合に使う
  - 例: 必須不足、形式不正、選択不可 item / outfit、重複ブランド候補
- `422 + UnprocessableEntityMessageResponse`
  - field 単位の修正箇所へ落としにくい業務ルール違反に使う
  - 例: login の `invalid credentials`、outfit restore 不可
- 新規 API で 409 を増やす前に、まず `422 + errors` と `422 + message only` のどちらで current 方針に沿って表現できるかを確認する

### 401 / 404 Rules

- `401` は未ログイン・認証切れなど、認証状態を満たしていないことを表す
- current API では、未認証時は原則として JSON の `401 Unauthenticated.` を返す
- `404` は純粋な未検出に加え、他人データ秘匿のためにも使う
- current API では所有者チェック付きの `findOrFail` を多用しているため、他人データアクセスは `403` ではなく `404` になる
- `404` response の正本は「対象が見つからない」ことだけであり、未検出と他人データ秘匿は response 本文だけでは区別しない
- `POST /api/login` の認証失敗は `401` ではなく `422 invalid credentials` を返す
- `POST /api/logout` は例外的に、未認証でも `logged_out` を返す

### 400 / 429 / 500 Rules

- current OpenAPI では `400` / `429` / `500` を原則として明示していない
- これらは current 実装でアプリ独自の response shape や文言を定義していないため、framework default に委ねる
- `400`
  - malformed JSON や想定外 request 形式のように、アプリ固有の業務ルールではない失敗に留まる限り、個別 endpoint に明示しない
- `429`
  - current API では endpoint 単位の明示的な rate limit 契約を docs 化していないため、原則省略する
  - 将来、retry 指針や endpoint 固有制限を運用する場合にだけ明示を検討する
- `500`
  - 想定外サーバエラーとして framework default に委ね、通常の endpoint 定義には過剰記述しない
- 新規 API で `400` / `429` / `500` を明示するのは、アプリ独自の意味・復旧手順・利用者向け期待値がある場合に限る

---

## Auth

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Notes

- `logout` は `MessageOnlyResponse` を返し、`message` は action keyword として `logged_out` を返す
- 認証状態の正本は response 本文ではなく、Cookie と後続の `GET /api/me` で確認する

---

## Categories

- `GET /api/categories`

### Categories response

```json
{
  "groups": [
    {
      "id": "tops",
      "name": "トップス",
      "categories": [
        {
          "id": "tops_tshirt",
          "groupId": "tops",
          "name": "Tシャツ"
        }
      ]
    }
  ]
}
```

### Notes

- category master の有効データのみ返す
- DBカラムは `group_id` だが、JSONでは `groupId` を返す

---

## Settings

- `GET /api/settings/categories`
- `PUT /api/settings/categories`
- `GET /api/settings/brands`
- `POST /api/settings/brands`
- `PATCH /api/settings/brands/{id}`

### Notes

- ブランド候補は `user_brands` をユーザー単位で管理する
- item の正本は `items.brand_name`、候補の正本は `user_brands` とし、FK では結ばない
- settings 更新系は `MessageOnlyResponse` ではなく、更新後の設定値や record を含む response を返す
- `POST /api/items` / `PUT /api/items/{id}` は `save_brand_as_candidate=true` のとき Laravel 側で候補追加を試行する
- 既存候補との重複時は候補追加をスキップし、item 保存自体は失敗させない
- brand 候補の正規化と重複判定は backend 側で扱う
- item 新規作成 / 編集では `GET /api/settings/brands?active_only=1&keyword=...` をサジェスト取得に利用する
- 設定画面では `GET /api/settings/brands` / `POST /api/settings/brands` / `PATCH /api/settings/brands/{id}` を使って候補管理する
- 設定画面の一覧では `updated_at` を使って更新日時を表示し、無効候補は折りたたみで整理する
- 仕様正本は [`../specs/settings/brand-candidates.md`](../specs/settings/brand-candidates.md) を参照する

---

## Items

- `GET /api/items`
- `GET /api/items/{id}`
- `POST /api/items`
- `PUT /api/items/{id}`
- `DELETE /api/items/{id}`
- `POST /api/items/{id}/dispose`
- `POST /api/items/{id}/reactivate`
- `POST /api/items/{id}/images`
- `DELETE /api/items/{id}/images/{imageId}`

### Item payload

```json
{
  "name": "White raglan tee",
  "category": "tops",
  "shape": "tshirt",
  "colors": [
    {
      "role": "main",
      "mode": "preset",
      "value": "white",
      "hex": "#FFFFFF",
      "label": "ホワイト"
    }
  ],
  "seasons": ["春", "夏"],
  "tpos": ["休日"],
  "spec": {
    "tops": {
      "shape": "tshirt",
      "sleeve": "short",
      "length": "normal",
      "neck": "crew",
      "design": "raglan",
      "fit": "normal"
    }
  }
}
```

### Notes

- `spec` は nullable
- 現在の実装では `spec.tops` を利用
- `spec.tops.*` は create / update の両方で受け付ける
- `images` は `sort_order` と `is_primary` を含む配列として create / update で受け付け、item 編集画面の並び替え / 代表画像切り替えに利用する
- `brand_name` は item の正本として保存し、`save_brand_as_candidate` は候補追加試行フラグとして扱う
- create / update / status 変更 API の `message` は action keyword を返し、実際の item 状態は `item` record 側を正本として読む
- delete / 画像 delete は `MessageOnlyResponse` を返し、削除結果の正本は後続の一覧 / 詳細取得結果で確認する
- `dispose` は item を `disposed` に変更し、その item を含む `active outfit` を `invalid` にする副作用を伴う
- `reactivate` は item を `active` に戻すが、関連 outfit は自動 `restore` しない
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照
- 詳細仕様は [`../specs/items/tops.md`](../specs/items/tops.md) を参照
- item status の状態管理は [`../specs/items/status-management.md`](../specs/items/status-management.md) を参照
- 未認証時は `401 Unauthenticated.` を返す

---

## Outfits

- `GET /api/outfits`
- `GET /api/outfits/{id}`
- `POST /api/outfits`
- `PUT /api/outfits/{id}`
- `DELETE /api/outfits/{id}`
- `GET /api/outfits/invalid`
- `POST /api/outfits/{id}/restore`
- `POST /api/outfits/{id}/duplicate`

### Notes

- `status` は通常の create / update payload に含めず、内部状態として `active` / `invalid` を管理する
- `invalid outfit` 一覧、`restore`、`duplicate` は current 実装として利用できる
- `restore` は対象 outfit が `invalid` で、構成 item がすべて `active` の場合のみ成功する
- create / update / restore API の `message` は action keyword を返し、実際の outfit 状態は `outfit` record 側を正本として読む
- delete は `MessageOnlyResponse` を返し、削除結果の正本は後続の一覧 / 詳細取得結果で確認する
- `duplicate` は保存済み outfit を直接複製作成する API ではなく、新規作成画面へ渡す初期値 payload を返す
- `duplicate` の `message` は状態変更結果ではなく、payload 準備完了を表す
- invalid outfit 由来の duplicate では、disposed item を `selectable=false` と `note` 付きで返す
- 保存条件と invalid 運用は [`../specs/outfits/create-edit.md`](../specs/outfits/create-edit.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照

---

## Wear Logs

- `GET /api/wear-logs`
- `GET /api/wear-logs/{id}`
- `POST /api/wear-logs`
- `PUT /api/wear-logs/{id}`
- `DELETE /api/wear-logs/{id}`

### Notes

- 一覧 / 詳細 / 登録 / 更新 / 削除を揃え、一覧 → 詳細 → 編集の責務分離で扱う
- `source_outfit_id` は「ベースにした outfit」を表し、最終的な item 構成は `items` を正本とする
- `items` は空配列を含めて常に送信し、保存時は UI 上の最終順序に従って `sort_order` を連番で再採番する
- `item_source_type` は `outfit` / `manual`
- delete は `MessageOnlyResponse` を返し、削除結果の正本は後続の一覧 / 詳細取得結果で確認する
- `invalid outfit` / `disposed item` は新規候補から除外しつつ、編集時は既存 record に含まれる候補外データを同一 record の再保存に限り保持できる
- `current status` は履歴の主表示ではなく補助情報として扱う
- 詳細仕様は [`../specs/wears/wear-logs.md`](../specs/wears/wear-logs.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照

---

## 購入検討 / `purchase_candidates`

- `GET /api/purchase-candidates`
- `GET /api/purchase-candidates/{id}`
- `POST /api/purchase-candidates`
- `PUT /api/purchase-candidates/{id}`
- `DELETE /api/purchase-candidates/{id}`
- `POST /api/purchase-candidates/{id}/duplicate`
- `POST /api/purchase-candidates/{id}/images`
- `DELETE /api/purchase-candidates/{id}/images/{imageId}`
- `POST /api/purchase-candidates/{id}/item-draft`

### Notes

- 購入検討は items と別エンティティで管理し、outfits や wear logs の候補へ直接混ぜない
- 一覧 / 詳細 / 作成 / 更新 / 削除に加え、candidate 画像追加 / 削除と item 作成初期値生成を分けて扱う
- delete / 画像 delete は `MessageOnlyResponse` を返し、削除結果の正本は後続の詳細取得結果で確認する
- `item-draft` は保存済み item を返す API ではなく、item 作成画面へ渡す初期値 payload を返す
- `item-draft` は candidate 側の `category_id` を source metadata として保持しつつ、current item API 互換の `category` / `shape` と配列項目を返す前提とする
- candidate から item へは登録済み全画像を引き継ぎ、`sort_order` と `is_primary` も維持する前提とする
- current 実装では、item create に `purchase_candidate_id` を渡した場合、Laravel 側で item 作成、画像コピー、candidate の `purchased` 反映、`converted_item_id` / `converted_at` 更新をまとめて処理する
- `sale_price` / `sale_ends_at` は candidate 専用であり、list / detail では補助表示するが、`item-draft` や item create には含めない
- `POST /api/purchase-candidates/{id}/duplicate` は詳細画面から使う current API で、`created` と新しい purchase candidate record を返す
- candidate 複製では colors / seasons / tpos / images を引き継ぎ、画像は新 candidate 用保存先へ物理コピーする
- 比較結果は詳細画面での補助表示前提とし、比較ロジックの詳細は後続検討とする
- 詳細仕様は [`../specs/purchase-candidates.md`](../specs/purchase-candidates.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照
- `docs/specs/README.md` からも購入検討を含む主要 spec 一覧へ辿れる

### 入口メモ

- 仕様の正本: [`../specs/purchase-candidates.md`](../specs/purchase-candidates.md)
- DB / 画像保存方針: [`../data/database.md`](../data/database.md)
- 実装メモと未対応事項: [`../project/implementation-notes.md`](../project/implementation-notes.md)
- OpenAPI の request / response schema は [`./openapi.yaml`](./openapi.yaml) を参照

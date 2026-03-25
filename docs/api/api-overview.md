# API

## Auth

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

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

### Notes

- `status` は通常の create / update payload に含めず、内部状態として `active` / `invalid` を管理する
- `invalid outfit` 一覧、`restore`、`duplicate` は [`openapi.yaml`](./openapi.yaml) の定義に沿って API を用意している
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
- `POST /api/purchase-candidates/{id}/images`
- `DELETE /api/purchase-candidates/{id}/images/{imageId}`
- `POST /api/purchase-candidates/{id}/item-draft`

### Notes

- 購入検討は items と別エンティティで管理し、outfits や wear logs の候補へ直接混ぜない
- 一覧 / 詳細 / 作成 / 更新 / 削除に加え、candidate 画像追加 / 削除と item 作成初期値生成を分けて扱う
- `item-draft` は保存済み item を返す API ではなく、item 作成画面へ渡す初期値 payload を返す
- `item-draft` は candidate 側の `category_id` を source metadata として保持しつつ、current item API 互換の `category` / `shape` と配列項目を返す前提とする
- candidate から item へは登録済み全画像を引き継ぎ、`sort_order` と `is_primary` も維持する前提とする
- current 実装では、item create に `purchase_candidate_id` を渡した場合、Laravel 側で item 作成、画像コピー、candidate の `purchased` 反映、`converted_item_id` / `converted_at` 更新をまとめて処理する
- 比較結果は詳細画面での補助表示前提とし、比較ロジックの詳細は後続検討とする
- 詳細仕様は [`../specs/purchase-candidates.md`](../specs/purchase-candidates.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照
- `docs/specs/README.md` からも購入検討を含む主要 spec 一覧へ辿れる

### 入口メモ

- 仕様の正本: [`../specs/purchase-candidates.md`](../specs/purchase-candidates.md)
- DB / 画像保存方針: [`../data/database.md`](../data/database.md)
- 実装メモと未対応事項: [`../project/implementation-notes.md`](../project/implementation-notes.md)
- OpenAPI の request / response schema は [`./openapi.yaml`](./openapi.yaml) を参照

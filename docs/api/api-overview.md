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
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照
- 詳細仕様は [`../specs/items/tops.md`](../specs/items/tops.md) を参照
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
- `invalid outfit` 一覧、`restore`、`duplicate` は未実装の `future API` として [`openapi.yaml`](./openapi.yaml) に定義済み
- 保存条件と invalid 運用は [`../specs/outfits/create-edit.md`](../specs/outfits/create-edit.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照

---

## Wear Logs (`future API`)

- `GET /api/wear-logs`
- `GET /api/wear-logs/{id}`
- `POST /api/wear-logs`
- `PUT /api/wear-logs/{id}`
- `DELETE /api/wear-logs/{id}`

### Notes

- 現時点では未実装で、`future API` として [`openapi.yaml`](./openapi.yaml) に定義済み
- `source_outfit_id` は「ベースにした outfit」を表し、最終的な item 構成は `items` を正本とする
- `item_source_type` は `outfit` / `manual`
- `current status` は履歴の主表示ではなく補助情報として扱う
- 詳細仕様は [`../specs/wears/wear-logs.md`](../specs/wears/wear-logs.md) を参照
- DB 保存方針は [`../data/database.md`](../data/database.md) を参照

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
- 未認証時は `401 Unauthenticated.` を返す

---

## Outfits

- `GET /api/outfits`
- `GET /api/outfits/{id}`
- `POST /api/outfits`
- `PUT /api/outfits/{id}`
- `DELETE /api/outfits/{id}`

詳細な schema は今後 OpenAPI と合わせて更新する。
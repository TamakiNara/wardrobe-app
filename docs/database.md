# Database Design

## Overview

Wardrobe App では、現在 `users` と `items` を主要テーブルとして使用しています。  
認証は Laravel の Session Authentication を前提としており、`users` は Laravel 標準のユーザーテーブルを利用します。

---

## Current Tables

- `users`
- `items`

---

## users

Laravel 標準のユーザーテーブルです。

主な用途

- ログイン認証
- アイテム所有者の識別

---

## items

ユーザーが登録した服アイテムを保持するテーブルです。

### Columns

| column | type | description |
|---|---|---|
| id | bigint | 主キー |
| user_id | bigint | 所有ユーザーID |
| name | string nullable | アイテム名 |
| category | string | カテゴリ |
| shape | string | 形 |
| colors | json | 色情報 |
| seasons | json nullable | 季節情報 |
| tpos | json nullable | TPO情報 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

---

## items.colors

`colors` は JSON で保持しています。

### Example

```json
[
  {
    "role": "main",
    "mode": "preset",
    "value": "navy",
    "hex": "#1F3A5F",
    "label": "ネイビー"
  },
  {
    "role": "sub",
    "mode": "custom",
    "value": "#D9D9D9",
    "hex": "#D9D9D9",
    "label": "カスタムカラー"
  }
]
```

### Notes

- `role` は `main` / `sub`
- `mode` は `preset` / `custom`
- `value` は元の入力値
- `hex` は描画や表示用のカラーコード
- `label` は画面表示用の名称

---

## items.seasons

`seasons` は JSON 配列として保持しています。

### Example

```json
["春", "秋"]
```

### Notes

- 現在は未選択可
- `オール` は UI 上で排他制御
- DB 上は文字列配列として保存

---

## items.tpos

`tpos` も JSON 配列として保持しています。

### Example

```json
["仕事", "休日"]
```

### Notes

- 現在は未選択可
- 将来的に選択肢マスタ化の可能性あり

---

## Relationships

### users : items

- 1 user has many items
- 1 item belongs to 1 user

```text
users 1 --- n items
```

---

## Why JSON is used now

`colors`, `seasons`, `tpos` は将来的には正規化可能ですが、現時点では JSON としています。

### Reasons

- MVP 段階で実装速度を優先できる
- アイテム登録〜一覧表示までを早く通せる
- フロント側の payload と整合しやすい
- 後で `item_colors`, `item_seasons`, `item_tpos` に分割しやすい

---

## Future Expansion

将来的に次のような正規化を検討できます。

- `item_colors`
- `item_seasons`
- `item_tpos`
- `outfits`
- `outfit_items`

### Expected Benefits

- 集計しやすい
- 検索しやすい
- マスタ管理しやすい
- コーデ機能との連携がしやすい

---

## Current Design Policy

現段階では次を重視しています。

- 実装速度
- UI / API / DB の整合性
- 早期に一覧表示まで完成させること
- 後から正規化しやすい形を保つこと

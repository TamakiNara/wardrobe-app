# サムネイル current 確認リファレンス

このファイルは、outfit thumbnail / wear log thumbnail の **current 実装確認用** メモです。  
新仕様の策定ではなく、現時点の code current と docs current を確認しやすくすることを目的にします。

正本:

- `docs/specs/items/thumbnail-skin-exposure.md`
- `docs/project/implementation-notes.md`

---

## 用語

- `others`
  - `tops` / `bottoms` 以外の残余カテゴリ
  - current では `legwear` は含めない
- `lower-body preview`
  - `bottoms` / `legwear` / `skinTonePreset` を使って下半身だけを再計算して描く領域
- `onepiece_allinone mode`
  - `onepiece_allinone` を主レイヤーとして扱う dedicated mode

---

## outfit thumbnail の current

### 1. standard mode

対象:

- 通常の `tops / bottoms / others`
- `allinone + bottoms`
- `onepiece_allinone` があっても dedicated mode 条件に入らないケース

表示ルール:

- `tops` は上段
- `bottoms` は下段
- `others` は下部バー
- `legwear` は `others` へ入れず、lower-body preview 専用
- representative bottoms がある場合のみ lower-body preview を出す
- `skinTonePreset` は lower-body preview に反映する

ASCII 例:

```text
+------------------+
| tops             |
|------------------|
| lower-body       |
+------------------+
| others           |
+------------------+
```

### 2. onepiece_allinone mode

current 対象:

- `bottoms` がない `onepiece_allinone`
- `onepiece + bottoms`

current 非対象:

- `allinone + bottoms`
  - current では standard mode 維持
  - 最終ルールは要再判断

表示ルール:

- `onepiece_allinone` を主レイヤーにする
- `tops` と `onepiece_allinone` の前後は `sort_order` 正本
- `onepiece + bottoms` では、`bottoms` は裾見せ補助レイヤー
- `legwear` は lower-body preview 専用のまま維持
- `skinTonePreset` は lower-body preview に反映する

ASCII 例:

```text
+------------------+
| tops underlay    |
|==================|  <- onepiece_allinone main layer
|                  |
|                  |
|------------------|  <- lower-body preview (optional)
+------------------+
| others           |
+------------------+
```

### 3. tops と onepiece_allinone の前後

current:

- `sort_order` の大きい item を上側レイヤーとして扱う
- カテゴリ固定優先では決めない

確認観点:

- `tops` が下なら underlay
- `tops` が上なら overlay

ASCII 例:

```text
sort_order: tops < onepiece_allinone
=> tops underlay

sort_order: tops > onepiece_allinone
=> tops overlay
```

---

## wear log thumbnail の current

### 1. standard mode

対象:

- 通常の `tops / bottoms / others`
- `allinone + bottoms`
- `onepiece_allinone` があっても dedicated mode 条件に入らないケース

表示ルール:

- 入力正本は `wear_log_items`
- `tops` / `bottoms` / `others` の基本レイアウトは standard
- `legwear` は `others` へ戻さず lower-body preview 専用
- representative bottoms がある場合のみ lower-body preview を出す
- skin tone は API payload に重複保存せず、settings の `skinTonePreset` を web 側で取得して反映する

ASCII 例:

```text
+------------------+
| tops             |
|------------------|
| lower-body       |
+------------------+
| others           |
+------------------+
```

### 2. onepiece_allinone mode

current 対象:

- `onepiece + bottoms`

current 非対象:

- `allinone + bottoms`
  - current では standard mode 維持
  - 要再判断

表示ルール:

- 判定正本は `wear_log_items` の `category / shape / sort_order`
- `onepiece` を主レイヤーにする
- `bottoms` は裾見せ補助レイヤー
- `tops` と `onepiece_allinone` の前後は `sort_order` 正本
- `legwear` は lower-body preview 専用
- `skinTonePreset` は lower-body preview に反映する

ASCII 例:

```text
+------------------+
| tops underlay    |
|==================|  <- onepiece main layer
|                  |
|                  |
|------------------|  <- lower-body preview
+------------------+
| others           |
+------------------+
```

---

## `tops / bottoms / others` の current 整理

### outfit

- `tops`
  - 上段または dedicated mode の overlay / underlay
- `bottoms`
  - standard mode では main 下段
  - `onepiece + bottoms` では裾見せ補助
- `others`
  - non-lower-body の残余カテゴリ
- `legwear`
  - `others` ではなく lower-body preview 専用

### wear log

- `tops`
  - standard 上段または dedicated mode の overlay / underlay
- `bottoms`
  - standard 下段
  - `onepiece + bottoms` では裾見せ補助
- `others`
  - non-lower-body の残余カテゴリ
- `legwear`
  - `others` ではなく lower-body preview 専用

---

## `onepiece + bottoms` / `allinone + bottoms`

### current で一致していれば OK

- outfit:
  - `onepiece + bottoms` は dedicated mode
  - `allinone + bottoms` は standard mode
- wear log:
  - `onepiece + bottoms` は dedicated mode
  - `allinone + bottoms` は standard mode

### まだ要再判断

- `allinone + bottoms` を将来 dedicated mode に上げるか
- `onepiece + bottoms` の裾見せ量の最終値
- 極小サイズ時の簡略化

---

## `legwear = lower-body 専用`

current で一致していれば OK なこと:

- `legwear` は `others` に出ない
- representative bottoms があるときだけ lower-body preview に参加する
- `bottoms` がない場合は lower-body preview 自体を出さない
- `onepiece + bottoms + legwear` でも `legwear` は lower-body preview 専用

ASCII 例:

```text
OK:
tops + bottoms + legwear
=> others に legwear が出ない
=> lower-body にだけ効く

NG:
tops + bottoms + legwear
=> others bar に legwear 色が出る
```

---

## `skinTonePreset` 反映

### outfit current

- settings の `skinTonePreset` を受け取り、lower-body preview に反映する

### wear log current

- settings の `skinTonePreset` を web 側で取得して反映する
- API payload に重複保持しない

確認観点:

- lower-body preview があるケースで肌色が preset に応じて変わる
- standard mode / onepiece_allinone mode の両方で反映される

---

## 確認観点チェックリスト

### current で一致していれば OK

- outfit standard で `tops / bottoms / others` が期待どおり出る
- outfit で `legwear` が `others` に戻らない
- outfit で `onepiece + bottoms` が dedicated mode に入る
- outfit で `allinone + bottoms` が standard のまま
- outfit で `tops` と `onepiece_allinone` の前後が `sort_order` どおり
- wear log standard で `tops / bottoms / others` が期待どおり出る
- wear log で `legwear` が `others` に戻らない
- wear log で `onepiece + bottoms` が dedicated mode に入る
- wear log で `allinone + bottoms` が standard のまま
- wear log で `skinTonePreset` が lower-body preview に反映される

### まだ要再判断

- `allinone + bottoms` の dedicated mode 化
- `onepiece + bottoms` の裾見せ量の最終調整
- 極小サイズ時の onepiece_allinone 表示の簡略化
- renderer の完全共通化

# サムネイル現状確認リファレンス

このファイルは、outfit thumbnail / wear log thumbnail の **現状の実装確認用** メモです。  
新仕様の策定ではなく、現時点のコードと docs の記述を確認しやすくすることを目的にします。

正本:

- `docs/specs/items/thumbnail-skin-exposure.md`
- `docs/project/implementation-notes.md`

---

## 用語

- `others`
  - `tops` / `bottoms` 以外の残余カテゴリ
  - 現時点では `legwear` は含めない
- `lower-body preview`
  - `bottoms` / `legwear` / `skinTonePreset` を使って下半身だけを再計算して描く領域
- `onepiece_allinone mode`
  - `onepiece_allinone` を主レイヤーとして扱う dedicated mode

---

## outfit thumbnail の現状

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

現状確認の対象:

- `bottoms` がない `onepiece_allinone`
- `onepiece + bottoms`

現状確認の対象外:

- `allinone + bottoms`
  - 現時点では standard mode 維持
  - 最終ルールは要再判断

表示ルール:

- `onepiece_allinone` を主レイヤーにする
- `tops` と `onepiece_allinone` の前後は `sort_order` 正本
- 現時点では、複数 `tops` を個別に前後判定して underlay / overlay を混在表示する前提は置かない
- `onepiece + bottoms` では、`bottoms` は裾見せ補助レイヤー
- compact は小さい thumbnail variant を指す補助区分として残るが、`onepiece main / bottoms hem / tops` 全体 / `others` の構造比率は一覧と詳細で変えない
- `legwear` は lower-body preview 専用のまま維持
- `skinTonePreset` は lower-body preview に反映する

ASCII 例:

```text
+------------------+
| tops underlay    |
| onepiece main    |
| onepiece main    |
| onepiece main    |
| bottoms hem      |
+------------------+
| others           |
+------------------+
```

```text
+------------------+
| tops overlay     |
| onepiece main    |
| onepiece main    |
| onepiece main    |
| bottoms hem      |
+------------------+
| others           |
+------------------+
```

### 3. tops と onepiece_allinone の前後

現状の実装:

- `sort_order` の大きい item を上側レイヤーとして扱う
- カテゴリ固定優先では決めない

確認観点:

- `tops` 全体が underlay 側として見えるケース
- `tops` 全体が overlay 側として見えるケース
- 現時点では、複数 `tops` の一部だけが underlay、別の一部だけが overlay のような混在表現は確認対象にしない

注記:

- `U / O` 記法を使う場合でも 現状の実装上の状態名ではなく、`tops` 全体の見え方を補助的に説明するための記号として扱う
- 現状では `tops` 個別の前後判定結果を図示する前提ではなく、`tops` 全体の代表的な見え方と representative `onepiece_allinone` の `sort_order` 比較で読む

ASCII 例:

```text
sort_order: tops < onepiece_allinone
=> tops 全体が underlay 側に見える

sort_order: tops > onepiece_allinone
=> tops 全体が overlay 側に見える
```

---

## wear log thumbnail の現状

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

現状確認の対象:

- `onepiece + bottoms`

現状確認の対象外:

- `allinone + bottoms`
  - 現時点では standard mode 維持
  - 要再判断

表示ルール:

- 判定正本は `wear_log_items` の `category / shape / sort_order`
- `onepiece` を主レイヤーにする
- `bottoms` は裾見せ補助レイヤー
- `tops` と `onepiece_allinone` の前後は `sort_order` 正本
- 現時点では、複数 `tops` を個別に前後判定して underlay / overlay を混在表示する前提は置かない
- compact は小さい thumbnail variant を指す補助区分として残るが、`onepiece main / bottoms hem / tops` 全体 / `others` の構造比率は一覧と詳細で変えない
- `legwear` は lower-body preview 専用
- `skinTonePreset` は lower-body preview に反映する

ASCII 例:

```text
+------------------+
| tops underlay    |
| onepiece main    |
| onepiece main    |
| onepiece main    |
| bottoms hem      |
+------------------+
| others           |
+------------------+
```

```text
+------------------+
| tops overlay     |
| onepiece main    |
| onepiece main    |
| onepiece main    |
| bottoms hem      |
+------------------+
| others           |
+------------------+
```

---

## `tops / bottoms / others` の現状整理

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

### 現状の実装 で一致していれば OK

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

現状の実装で一致していれば OK なこと:

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

### outfit の現状

- settings の `skinTonePreset` を受け取り、lower-body preview に反映する

### wear log の現状

- settings の `skinTonePreset` を web 側で取得して反映する
- API payload に重複保持しない

確認観点:

- lower-body preview があるケースで肌色が preset に応じて変わる
- standard mode / onepiece_allinone mode の両方で反映される

---

## 確認観点チェックリスト

### 現状の実装 で一致していれば OK

- outfit standard で `tops / bottoms / others` が期待どおり出る
- outfit で `legwear` が `others` に戻らない
- outfit で `onepiece + bottoms` が dedicated mode に入る
- outfit で `allinone + bottoms` が standard のまま
- outfit で `tops` と `onepiece_allinone` の前後が `sort_order` どおり
- wear log standard で `tops / bottoms / others` が期待どおり出る
- 共通 grouping の current は `main_upper / main_lower / main_full / support / hidden` で、wear log / outfit の `others` 相当は renderer 側で `support` と `main_full` を束ねている
- `outerwear` は `main_upper`、`bags / shoes / fashion_accessories` は `support`、`inner` は `hidden` として扱う
- wear log で `legwear` が `others` に戻らない
- wear log で `onepiece + bottoms` が dedicated mode に入る
- wear log で `allinone + bottoms` が standard のまま
- wear log で `skinTonePreset` が lower-body preview に反映される

### まだ要再判断

- `allinone + bottoms` の dedicated mode 化
- `onepiece + bottoms` の裾見せ量の最終調整
- 極小サイズ時の onepiece_allinone 表示の簡略化
- renderer の完全共通化

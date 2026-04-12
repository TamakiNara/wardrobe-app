# スカートの形・補助情報メモ

## 現状

### 形

- shape は `tight` / `flare` / `a_line` / `mermaid` を第一候補として扱う
- `skirts.other` は画面上で shape を非表示
- ドメイン上は shape 未指定寄りとして扱う
- 保存表現は今回 `tops + other` のような空文字保存に広げず、既存の backend fallback を維持
- `subcategory = other` のときは、read model で visible category を復元

### shape に残す一覧

- `tight`
- `flare`
- `a_line`
- `mermaid`
- 上記はいずれもシルエットとして意味を持つ値候補を第一候補とする

### shape から外す一覧

- 素材寄り: `tulle` / `lace` / `denim` / `leather` / `satin`
- デザイン寄り: `pleats` / `gather` / `tuck` / `tiered` / `wrap` / `balloon` / `trench`
- これらはシルエットではなく、将来は別轴の spec に分離する前提で整理する

## 将来の spec 軸（未実装）

### `skirt_length`

- スカート専用の丈軸として `skirt_length` を設ける
- `pants` の `length`とは別軸として扱う
- 候補語彙: `mini` / `knee` / `midi` / `mid_calf` / `long` / `maxi`
- 表示名の例: ミニ丈 / ひざ丈 / ミディ丈 / ミモレ丈 / ロング丈 / マキシ丈
- 今回は docs のみで整理し、実装は行わない

### 将来の分離先

- 素材系は将来 `material` 軸へ
- デザイン系は将来 `design` 軸へ
- 今回はまだ将来先を master data や UI に追加しない

### 現状実装との関係

- 現状は `pants` の丈を流用した暫定状態
- 将来的には `skirt_length` に置き換える予定
- shape も段階的に整理していく前提で进める

## 要再判断

### 保存表現

- `skirts + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

# スカートの形・補助情報メモ

## 現状

### 形

- shape は `tight` / `flare` / `a_line` / `mermaid` を第一候補として扱う
- `skirts.other` は画面上で shape を非表示
- ドメイン上は shape 未指定寄りとして扱う
- 保存表現は今回 `tops + other` のような空文字保存に広げず、既存の backend fallback を維持
- `subcategory = other` のときは、read model で visible category を復元

### shape に残す一覧

- `tight`: タイト `Tight`
- `flare`: フレア `Flare`
- `a_line`: Aライン / 台形 `A-line / Trapeze`
- `mermaid`: マーメイド `Mermaid`
- 台形寄りの見え方は `a_line` に含めて扱う `A-line / Trapeze`
- 上記はいずれもシルエットとして意味を持つ値候補を第一候補とする

### shape から外す一覧

- 素材寄り: `tulle` チュール `Tulle` / `lace` レース `Lace` / `denim` デニム `Denim` / `leather` レザー `Leather` / `satin` サテン `Satin`
- デザイン寄り: `pleats` プリーツ `Pleats` / `gather` ギャザー `Gather` / `tuck` タック `Tuck` / `tiered` ティアード `Tiered` / `wrap` ラップ `Wrap` / `balloon` バルーン `Balloon` / `trench` トレンチ `Trench-inspired`
- これらはシルエットではなく、将来は別軸の spec に分離する前提で整理する

## 丈 spec

### `skirt_length`

- `skirts` は `spec.skirt.length_type` を正本として使う
- `pants` の `spec.bottoms.length_type` とは別軸として扱う
- 候補語彙: `mini` / `knee` / `midi` / `mid_calf` / `long` / `maxi`
- 表示名の想定: ミニ丈 `Mini` / ひざ丈 `Knee length` / ミディ丈 `Midi` / ミモレ丈 `Mid-calf / Midi-long` / ロング丈 `Long` / マキシ丈 `Maxi`
- UI 上のラベルは、現時点でも「丈」を使う
- edit / detail / preview では `spec.skirt.length_type` を優先し、値がなければ既存 `spec.bottoms.length_type` を read fallback として読む

### 将来の分離先
- 素材系は将来 `material` 軸へ
- デザイン系は将来 `design` 軸へ
- 今回はまだこれらを master data や UI に追加しない

### 現状実装との関係
- 新規保存では `spec.skirt.length_type` を正本にする
- 既存 skirts データの `spec.bottoms.length_type` は migration せず、read fallback で吸収する
- shape も段階的に整理していく前提で进める

## 要再判断

### 保存表現

- `skirts + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

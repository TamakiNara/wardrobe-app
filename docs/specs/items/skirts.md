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

- 素材系の候補は `material_type`
- デザイン系の候補は `design_type`
- 候補語彙の正本は下の補助 spec を参照し、shape に混ぜない

## 補助 spec

### `material_type`

- `spec.skirt.material_type` は素材系の補助 spec として扱う
- 現時点では単一選択とし、複数要素を持つスカートでも最も特徴的な 1 つを選ぶ
- 候補語彙: `tulle` チュール `Tulle` / `lace` レース `Lace` / `denim` デニム `Denim` / `leather` レザー `Leather` / `satin` サテン `Satin`

### `design_type`

- `spec.skirt.design_type` はデザイン系の補助 spec として扱う
- 現時点では単一選択とし、複数要素を持つスカートでも最も特徴的な 1 つを選ぶ
- 候補語彙: `tuck` タック `Tuck` / `gather` ギャザー `Gather` / `pleats` プリーツ `Pleats` / `tiered` ティアード `Tiered` / `wrap` ラップ `Wrap` / `balloon` バルーン `Balloon` / `trench` トレンチ `Trench-inspired`
- `design_type` は将来的に複数選択化の余地があるが、今回は採用しない

## 丈 spec

### `skirt_length`

- `skirts` は `spec.skirt.length_type` を正本として使う
- `pants` の `spec.bottoms.length_type` とは別軸として扱う
- 候補語彙: `mini` / `knee` / `midi` / `mid_calf` / `long` / `maxi`
- 表示名の想定: ミニ丈 `Mini` / ひざ丈 `Knee length` / ミディ丈 `Midi` / ミモレ丈 `Mid-calf / Midi-long` / ロング丈 `Long` / マキシ丈 `Maxi`
- UI 上のラベルは、現時点でも「丈」を使う
- edit / detail / preview では `spec.skirt.length_type` を優先し、値がなければ既存 `spec.bottoms.length_type` を read fallback として読む

### 実装状況

- `material_type` / `design_type` は master data / UI / API 保存・復元 / 詳細表示に追加済み
- 検索 / フィルタ / validator / normalizer への反映も将来対応とする
- 将来的には複数選択化の余地も残すが、今回は採用しない

### 現状実装との関係

- 新規保存では `spec.skirt.length_type` を正本にする
- 既存 skirts データの `spec.bottoms.length_type` は migration せず、read fallback で吸収する
- shape も段階的に整理していく前提で进める

## 要再判断

### 保存表現

- `skirts + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

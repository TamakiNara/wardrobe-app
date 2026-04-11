# スカートの形・補助情報メモ

## 現状

### 形

- shape は `tight` / `flare` / `a_line` / `mermaid` を第一候補として扱う
- `skirts.other` は画面上で shape を非表示
- ドメイン上は shape 未指定寄りとして扱う
- 保存表現は今回 `tops + other` のような空文字保存に広げず、既存の backend fallback を維持
- `subcategory = other` のときは、read model で visible category を復元

### shape に混ぜない候補

- `pleats` はデザイン寄りの候補として、shape に混ぜない
- 素材寄りの候補も shape に混ぜない

## 今後の候補

### スカート丈 独立軸

- `bottom_length` とは別に `skirt_length` を持つ案は継続検討
- 第一候補語彙: `mini` / `knee` / `midi` / `mid_calf` / `long` / `maxi`
- 今回は `spec.bottoms.length_type` が pants / skirts / bottoms で横断利用中のため、実装は見送る

## 要再判断

### 保存表現

- `skirts + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

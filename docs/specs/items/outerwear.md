# アウターの形・補助情報メモ

## 現状

### その他系の shape 表示

- `outerwear.other` は画面上で shape を非表示
- ドメイン上は shape 未指定寄りとして扱う
- 保存表現は今回 `tops + other` のような空文字保存に広げず、既存の backend fallback を維持
- `subcategory = other` のときは、read model で visible category を復元

## 要再判断

### 保存表現

- `outerwear + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

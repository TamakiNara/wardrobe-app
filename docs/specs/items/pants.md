# パンツの形・補助情報メモ

## 現状

### 形

- shape 候補に `jogger` / `skinny` / `gaucho` を追加
- `pants.other` は画面上で shape を非表示
- ドメイン上は shape 未指定寄りとして扱う
- 保存表現は今回 `tops + other` のような空文字保存に広げず、既存の backend fallback を維持
- `subcategory = other` のときは、read model で visible category を復元

### 補助情報

- `high_waist` / `low_rise` は shape ではなく `spec.bottoms.rise_type` (股上軸)で扱う
- `rise_type` は現時点ではパンツのみで、画面ラベルは股上として扱う

### 丈

- `spec.bottoms.length_type` に `ankle` を追加

## 要再判断

### 保存表現

- `pants + other` の shape 未指定を `""` / `null` / 未送信のどれで正式化するかは再判断
- 現状は staged rollout と既存 backend 影響を優先し、画面と read model の自然さ改善を先行

## TODO（直近課題）

### 仕様検討
- `other pants` の未指定保存表現をどうするか
- `high_waist / low_rise` の語彙を将来見直すか

### UI / 文言改善
- `ボトムス丈` ラベルの見直し
- `jogger` の表示名を他と揃えるか（ジョガー / ジョガーパンツ）
- 種類未選択時に shape を先に選べてしまう挙動を許容するか

### 技術的負債 / 将来対応
- `pants + other` の fallback を `pants` に寄せている現状の意味付け整理


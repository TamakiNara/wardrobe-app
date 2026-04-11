# レッグウェアの形・補助情報メモ

## 現状

### 種類

- `socks` / `stockings` / `tights` / `leggings` / `leg_warmer` / `other` を扱う
- `leggings` の表示名は「レギンス・スパッツ」として扱う

### 画面表示

- レッグウェアは `subcategory` 主導で扱い、shape は画面上で表示しない
- ソックス選択時は `spec.legwear.coverage_type` を「ソックスの長さ」として表示する
- レギンス・スパッツ選択時は `spec.legwear.coverage_type` を「レギンス・スパッツの長さ」として表示する
- タイツ / ストッキング / レッグウォーマーは追加 spec を増やさない

### 候補語彙

- ソックスの長さは `foot_cover` / `ankle_sneaker` / `crew` / `three_quarter` / `high_socks` を使う
- レギンス・スパッツの長さは `one_tenth` / `three_tenths` / `five_tenths` / `seven_tenths` / `seven_eighths` / `ten_tenths` / `twelve_tenths` を使う

## 要再判断

- ストッキング / タイツ / レッグウォーマーに独自 spec を持たせるかは再判断
- レッグウェア全体の見出し文言を種類ごとにさらに分けるかは UI を見ながら再判断

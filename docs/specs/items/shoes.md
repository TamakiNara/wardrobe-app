# シューズの形・補助情報メモ

## 現状

### 種類

- `sneakers` / `pumps` / `boots` / `sandals` / `leather_shoes` / `rain_shoes_boots` / `other` を扱う

### 画面表示

- シューズは `subcategory` 主導で扱い、shape は画面上で表示しない
- UI で選ばせない shape を内部で別値に確定しない方針を維持する

## 要再判断

- シューズ内でさらに型差が必要になった場合にだけ shape を復活させる
- `other` の保存表現を未指定寄りに寄せるかは staged rollout を見ながら再判断

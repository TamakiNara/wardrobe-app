# バッグの形・補助情報メモ

## 現状

### 種類

- `tote` / `shoulder` / `boston` / `rucksack` / `hand` / `body` / `waist_pouch` / `messenger` / `clutch` / `sacoche` / `pochette` / `drawstring` / `basket_bag` / `briefcase` / `marche_bag` / `other` を扱う
- `rucksack` の表示名は「リュックサック・バックパック」とする

### 画面表示

- バッグは `subcategory` 主導で扱い、shape は画面上で表示しない
- `other` は shape を非表示にし、画面上は未指定寄りで扱う

### 互換

- item 側の正規値は `rucksack` を使う
- `bags_rucksack` は settings 側の ID 名としてだけ残し、item の語彙は `rucksack` に統一する

## 要再判断

- バッグ内で構造差を別 shape として持つ必要が出るまでは `subcategory` 主導を維持する
- `other` の保存表現を未指定寄りに正式化するかは別途再判断

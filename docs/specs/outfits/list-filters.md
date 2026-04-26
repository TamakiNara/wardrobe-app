# Outfit List Filters

コーディネート一覧の絞り込み条件、URL クエリ、初期季節適用の扱いを整理する。
一覧表示そのものの仕様を対象とし、新規作成 / 編集時の item 候補絞り込みは `./item-candidate-rules.md` を参照する。

---

## 基本方針

- コーディネート一覧の絞り込み条件は URL クエリを正本とする
- フィルタ UI は URL の状態をそのまま表示する
- `currentSeason` は設定由来の初期提案であり、ユーザーの明示絞り込みとは分けて扱う
- ユーザーが明示的に季節を選択した場合は `season` を使う

---

## 現在の一覧フィルタ

- `keyword`
- `season`
- `currentSeason`
- `tpo`
- `sort`
- `page`

---

## `season` と `currentSeason` の役割

### `currentSeason`

- ユーザー設定の「現在の季節」から作る初期提案値
- 一覧を開いた時点で URL に `season` と `currentSeason` のどちらもなければ、client 側で `currentSeason` を URL に反映する
- URL 上は `currentSeason=春` のように表示する

### `season`

- ユーザーが一覧上で明示的に選んだ季節
- URL 上は `season=春` のように表示する
- `season` がある場合は `currentSeason` より優先する

### クエリなし

- `season` も `currentSeason` もない場合は季節フィルタなし

---

## 一覧表示中の挙動

- 初回表示で `season` と `currentSeason` のどちらもなければ、`currentSeason` を初期提案として URL に反映する
- ユーザーが季節を明示選択した場合は `season` を使い、`currentSeason` は外す
- 季節を `解除` した場合は `season` と `currentSeason` の両方を外す
- `解除` 直後の同一表示中は `currentSeason` を再自動適用しない
- 一覧を離れて再訪問した場合は、条件なしなら再び `currentSeason` を初期提案として適用する
- 季節以外の条件変更時は、現在の `season` または `currentSeason` を維持する

---

## backend 側の解釈

- `season` があればそれを優先して使う
- `season` がなく `currentSeason` があれば、それを一覧取得条件として使う
- どちらもない場合は季節条件なし

---

## 関連資料

- outfit 新規作成 / 編集: `./create-edit.md`
- outfit item 候補絞り込み: `./item-candidate-rules.md`
- item 一覧フィルタ: `../items/list-filters.md`

# コーディネート一覧フィルタ仕様

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
- `item_id`

### `item_id`

- item detail の「このアイテムを含むコーディネートを見る」導線から `/outfits?item_id={id}` として渡す
- backend はログインユーザー所有の item に限定して、その item を含む outfit のみ返す
- 他 user の item_id / 存在しない item_id の場合は 0 件扱いにし、item summary は返さない
- 自分の item であれば `disposed` でも検索条件として受け付ける
- 一覧画面では `meta.filters.item` があれば「{item name} を含むコーディネート」と表示し、summary がなければ generic 表示にする
- keyword / season / currentSeason / tpo / sort / page の変更時も `item_id` は維持し、解除導線を押した場合だけ外す
- `item_id` filter 中は currentSeason の自動適用を行わない

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

## 使用アイテム絞り込み

コーディネート一覧の「使用アイテムで絞り込み」は、候補 item を選んで `/outfits?item_id={id}` へ反映する frontend 側の補助 picker として扱う。server-side の outfit 絞り込み条件は引き続き `item_id` であり、カテゴリや種類を API query として追加しない。

item 候補 picker では、以下の軽い絞り込みを持つ。

- キーワード
- カテゴリ
- 種類
- 季節
- TPO

`種類` はカテゴリに従属する。カテゴリ未選択時、または選択中カテゴリに該当する種類候補がない場合は、種類 filter は選択不可にする。カテゴリを変更した場合は、古い種類 filter が不整合に残らないようにリセットする。

種類候補は、現在取得済みの item 候補に存在する subcategory / shape と、master data のカテゴリ配下種類を突き合わせて生成する。subcategory が未設定の item は通常の候補には残すが、種類 select の選択肢としては出さない。

候補カードでは、登録済み写真 URL がある場合だけ写真サムネイルを表示する。写真がない item には placeholder や余計な thumbnail frame を出さない。写真サムネイルは primary image を優先し、なければ `sort_order` が最小の画像を使う。

---

## 一覧カードの使用アイテム簡易表示

コーディネート一覧カードでは、配色サムネイルと非表示件数の表示を維持したうえで、visible item の名前を簡易表示する。item 名リストが表示アイテム数の役割も兼ねるため、通常の `表示アイテム数` は出さない。

- 非表示カテゴリ item は簡易表示に含めない。
- 先頭 3 件まで item 名を表示する。
- 4 件以上ある場合は `ほか N 件` で省略する。
- item がない、または全件が非表示カテゴリの場合は、余計な空表示を出さない。
- 一覧カードには item 写真サムネイルは出さず、写真表示は作成 / 編集 picker や詳細画面側の責務にする。

---

## 関連資料

- outfit 新規作成 / 編集: `./create-edit.md`
- outfit item 候補絞り込み: `./item-candidate-rules.md`
- item 一覧フィルタ: `../items/list-filters.md`

# Item List Filters

item 一覧の絞り込み条件、URL クエリ、初期提案の扱いを整理する。
一覧表示とクローゼットビューの切り替えは [closet-view.md](./closet-view.md) を参照する。

---

## 基本方針

- item 一覧の絞り込み条件は URL クエリを正本とする
- フィルタ UI は URL の状態をそのまま表示する
- `currentSeason` は設定由来の初期提案であり、ユーザーの明示絞り込みとは分けて扱う
- ユーザーが明示選択した季節は `season` で表現する

---

## 現在の絞り込み条件

- `keyword`
- `brand`
- `category`
- `subcategory`
- `season`
- `currentSeason`
- `tpo`
- `sort`
- `page`

---

## `season` と `currentSeason` の役割

### `currentSeason`

- ユーザー設定の「現在の季節」に由来する初期提案
- item 一覧を開いた時点で URL に `season` と `currentSeason` のどちらもない場合だけ使う
- URL 上は `currentSeason=春` のように表現する

### `season`

- ユーザーが一覧上で明示的に選んだ季節絞り込み
- URL 上は `season=春` のように表現する
- `season` がある場合は `currentSeason` より優先する

### クエリなし

- `season` も `currentSeason` もない場合は、季節絞り込みなし

---

## item 一覧での初期適用

- item 一覧の初回表示では、URL に `season` と `currentSeason` のどちらもなく、かつユーザー設定に `currentSeason` がある場合だけ `currentSeason` を初期提案として適用する
- この適用は frontend 側で行い、URL に反映した状態で一覧を表示する
- そのため、裏でだけ季節が効いている状態は作らない

---

## 一覧表示中の挙動

- ユーザーが季節を明示選択した場合は `season` を使い、`currentSeason` は外す
- ユーザーが季節フィルタを解除した場合は `season` と `currentSeason` の両方を外す
- 解除後、その表示中は `currentSeason` を即座に再適用しない
- 一覧を離れて再訪問した場合は、再び `season` と `currentSeason` のどちらもなければ `currentSeason` を初期提案として適用する
- 季節以外の条件を変更する場合は、現在の `season` または `currentSeason` を維持する

---

## backend 側の解釈

- `season` があればそれを優先する
- `season` がなく `currentSeason` があれば、それを一覧取得条件として使う
- `春` などの季節指定では、その季節に加えて `オール` と季節未設定の item も含める

---

## 適用範囲

current:

- item 一覧

planned / 別 spec 参照:

- outfit 一覧
- outfit 作成 / 編集画面の item 候補絞り込み
- 色違い group の詳細表示は `docs/specs/items/duplicate-color-variant.md` を参照

未対応:

- purchase candidate 一覧

---

## 色違い group との関係

- item 側に group 概念を入れても、初回実装では一覧を group-aware 折りたたみ表示にしない
- 一覧は引き続き 1 item 1 record 表示を正本とする
- 理由:
  - item は実物管理であり、色違いでも所持品 1 件ずつ表示される方が自然
  - 季節 / 色 / underwear / disposed など既存絞り込みとの組み合わせが複雑になりやすい
  - 一覧 API 変更影響が大きい
- 同じ group の item 表示は詳細画面側で扱う
- 将来的に一覧カードへ `色違いあり` バッジを出すことは検討余地ありとする

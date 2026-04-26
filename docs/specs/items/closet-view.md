# Item Closet View

item 一覧の表示バリエーションとして使う「クローゼットビュー」の 現在の仕様を整理する。

関連資料:

- 一覧共通方針: `docs/specs/discovery/search-filter-sort.md`
- item 一覧フィルタ / `currentSeason`: `docs/specs/items/list-filters.md`
- item status / `care_status`: `docs/specs/items/status-management.md`
- 実装メモ: `docs/project/implementation-notes.md`

---

## 位置づけ

- クローゼットビューは item 一覧の一表示モードとして扱う
- 別ページは作らない
- 既存の検索・絞り込み・並び順・URL クエリ正本の方針は維持する
- 表示切替自体は page 内 state で扱い、現時点では URL へ保存しない

---

## 表示切替

- item 一覧上部に、通常一覧 / クローゼットビューの切替 UI を置く
- 現時点の実装では、アイコンだけでなく短いラベルも併記した segmented control で切り替える
- 通常一覧が初期表示
- 切替後も、現在の検索・絞り込み・並び順条件はそのまま維持する

---

## 表示対象

- `active` item のみを対象とする
- `disposed` item は表示しない
- `care_status` は表示対象判定には使わない
- 全体 0 件のときは、通常一覧と同じ空状態を使う

---

## グルーピング

- category master の中分類単位で大きく表示する
- 各中分類の中では shape 単位でもう一段分けて表示する
- 0 件の中分類は表示しない
- 0 件の shape グループも表示しない
- 見出しに件数は出さない
- 中分類の表示順は category master 順を基本とする
- shape の表示順は、その中分類に対応する shape master 順を基本とする

---

## レイアウト

- 初期版は縦長の図形を横並びに並べる
- 同一中分類カードの中では、shape グループも横並びを基本とし、item 数が多い場合のみ折り返す
- 1 item = 1図形
- 各 item は同じ基本サイズで並べる
- 文字は図形内に載せない
- 図形押下で item 詳細へ遷移する
- 中分類見出しと shape 見出し、図形群の距離は詰めて、item 数が少ないときに大きな空白を作らない

---

## 色表現

- main color を面積の 90% で表示する
- sub color があれば右端の細い帯 10% で表示する
- sub color がなければ単色とする
- main / sub は item の現在の色情報を使う
- main color が取れない item は `#E5E7EB` を使う

---

## 色順

- main color の hex を HSL に正規化して並び順を決める
- color code が取れない item は末尾
- HSL 変換で `saturation <= 0.1` は無彩色扱い
- 無彩色は `lightness asc`
- 彩色は `hue asc` -> `lightness asc`
- tie-breaker は `id asc`

補足:

- 現時点の実装では shared utility で正規化し、無彩色を彩色より先に並べる
- 無効な hex や main color 欠損は「色が取れない item」として同列に扱う

---

## アクセシビリティ

- 各図形は click 可能な link として扱う
- `aria-label` を付ける
  - 例: `{item名} / {形名} / {メインカラー}`
- focus 時に視認できる枠線を出す

---

## 今回やらないこと

- 実画像を使ったクローゼット表現
- 別ページ化
- 表示切替状態の再訪時保持
- B 案レイアウト

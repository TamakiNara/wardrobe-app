# アンダーウェア一覧とカテゴリ責務

## 概要

- top-level category として `underwear` を持つ
- 通常の item / purchase candidate と同じデータ構造で保存する
- UI 上は通常一覧から分離し、専用一覧で扱う

## カテゴリ責務

### `underwear`

- 他人に見せない
- 通常のアイテム一覧に出したくない
- 例:
  - ブラ
  - ショーツ
  - 補正下着
  - 見せない肌着

### `inner`

- 見せてもよいインナー / ルームウェア寄り
- 例:
  - 見せるキャミ
  - ブラトップ
  - ルームウェア

### 境界アイテムの判断基準

- 通常のアイテム一覧に出したいか
- コーディネートや着用履歴で、他カテゴリと同じ粒度で扱いたいか

## subcategory

- `bra` / ブラ
- `shorts` / ショーツ
- `shapewear` / 補正下着
- `undershirt` / 肌着
- `other` / その他アンダーウェア

初期段階では、専用 spec は増やしすぎず、既存の `size_label` / `size_note` / `size_details` で受ける。

## 一覧分離

### 通常一覧から除外

- `/items`
- `/items/disposed`

上記では `underwear` を表示しない。

### 専用一覧

- `/items/underwear`
  - active な `underwear` item のみ表示
- `/items/underwear/disposed`
  - disposed な `underwear` item のみ表示

## 導線アイコン

- `/items` と `/purchase-candidates` のアンダーウェア導線には、[SVG Repo の bra icon](https://www.svgrepo.com/svg/258196/bra) をそのままベースにしたアイコンを採用する
- 配色だけ `currentColor` に合わせ、形状自体は崩さずに使う
- ボトムナビには追加せず、一覧上部の secondary action 導線だけで使う

## detail / edit

- 詳細画面と編集画面は通常の item 画面を流用する
- ただし戻り先は `underwear` 用一覧へ切り替える

戻り先:

- active な `underwear`
  - `アンダーウェア一覧`
- disposed な `underwear`
  - `手放したアンダーウェア一覧`

## import / export

- `underwear` item も通常 item と同じく backup / restore 対象に含める
- 復元後も category に応じて専用一覧へ表示される

## wear logs

- 初期実装では `underwear` は着用履歴の item 候補に出さない
- 将来的に設定で表示可にする余地は残す

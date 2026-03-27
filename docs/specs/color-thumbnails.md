# Color Thumbnails

item 画像の代わりではなく、構成色を補助表示するための「配色サムネイル」の current 仕様を整理する。

関連資料:

- outfit 正本: `docs/specs/outfits/create-edit.md`
- wear logs 正本: `docs/specs/wears/wear-logs.md`
- 実装メモ: `docs/project/implementation-notes.md`

---

## 位置づけ

- 配色サムネイルは一覧カードの補助表示として扱う
- outfit 画像や wear log 詳細画像の代替というより、配色構成を把握するためのサムネイルとする
- 初期版では常に配色情報として表示し、画像の有無では出し分けない

---

## グループ

- `tops`
- `bottoms`
- `others`

`others` には、少なくともアウター・シューズ・バッグ・小物を含める。

---

## レイアウト

- tops / bottoms が両方ある場合は、メインコンテナを上下 2 分割する
- `others` がある場合は、下部に固定高さのバーを追加する
- `others` がない場合はバーを表示しない
- tops / bottoms のどちらか一方だけがある場合は、メインコンテナ全体をそのグループで使う
- `others` のみの場合は、サムネイル全体を `others` で使う

---

## グループ内分配

- 各グループ内は item 数で均等割りする
- 初期版では、tops / bottoms / others のいずれも横方向の均等割りで扱う

---

## 色表現

- 各 item 領域は main color 90 / sub color 10 で描画する
- sub color は右端の細帯で表現する
- sub color がない場合は単色で描画する
- item の現在の `main / sub` 色情報を使う
- current 実装では outfit / wear logs ともに共通の segment helper を使うが、正本の取り方は機能ごとに分ける

---

## フォールバック色

- 色が取得できない item は `#E5E7EB` で描画する
- main color 欠損と無効な色コードは、どちらも同じフォールバック色として扱う

---

## current の適用範囲

- outfit 一覧
  - current outfit の item 構成を正本にして描画する
- wear logs 一覧
  - `wear_log_items` を正本にして描画する
  - `source_outfit_id` は描画正本として使わない
- クローゼットビュー
  - item の current 色情報を正本にし、図形の main / sub 表現にも同じフォールバック色を使う
- wear log 日詳細モーダルにはまだ表示しない
- outfit 詳細 / wear log 個別詳細への展開もまだ行わない

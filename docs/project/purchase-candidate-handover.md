# 購入検討 引き継ぎメモ

この資料は、購入検討まわりの後続設計メモを残すための引き継ぎ資料です。  
`current` 実装の正本ではなく、`planned` や `要再判断` の論点を別スレッドへ引き継ぐことを目的とします。

正本:

- 仕様: `docs/specs/purchase-candidates.md`
- API: `docs/api/api-overview.md`
- OpenAPI: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`

---

## この資料の位置づけ

- current 実装と一致している事項を、後続設計の前提として再確認する
- まだ未実装の `sale` / `複製` / `purchased` 後の編集範囲を整理する
- current と future を混ぜず、設計差分に進む前の判断材料を残す

---

## current と一致している前提

### 購入検討と item の境界

- `items` は所持品の正本
- 購入検討は未所持の候補管理
- candidate -> item は変換ではなく item 新規作成
- item 作成成功時に candidate を `purchased` に更新する
- `converted_item_id` / `converted_at` を candidate 側へ保存する

### ブランド

- ブランド候補はユーザー単位の `user_brands`
- item 側の正本は `items.brand_name`
- item と brand は FK で結ばない
- item 新規 / 編集ではブランド候補サジェストを使う

### 画像

- candidate 画像と item 画像は別管理
- item 保存時に candidate 画像を item 用保存先へ物理コピーする
- 保存後は candidate 側と item 側で自動同期しない

### item-draft

- `item-draft` は item 作成画面用の初期値 payload
- `purchase_candidate_id` を付けて item を保存すると、Laravel 側で candidate 更新までまとめて処理する
- current 実装では `memo` も item 初期値へ引き継ぐ
- `wanted_reason` は item `memo` へ自動結合しない

---

## planned として有力な論点

### sale 情報

- `sale_price`
- `sale_ends_at`

方針メモ:

- 追加先は `purchase_candidates` のみ
- item 側へは持ち込まない
- sale 情報は candidate 一覧 / 詳細で補助表示する
- ホーム sale 表示は将来実装として切り分ける

### 複製機能

- candidate 複製機能を追加する
- 詳細画面からの複製を主導線にする
- API は直接複製作成ではなく、`duplicate payload` 型を第一候補にする

---

## 要再判断の論点

### memo の扱い

- current 実装では candidate `memo` を item 初期値へ引き継ぐ
- 将来も維持するか、item に持ち込まない方針へ寄せるかは未確定

### sale 表示の範囲

- 一覧 / 詳細は次段階の planned
- ホームは将来実装
- item 作成画面へ sale 情報をどこまで参考表示するかは未確定

### purchased 後の編集範囲

- `purchased` 後の candidate を閲覧中心にするか
- どこまで軽微修正を許可するか

### 複製時の画像方式

- candidate -> candidate 複製時に、画像ファイルを再利用するか
- 物理コピーで独立させるか

---

## メモ時点の判断

- `price` は candidate では想定価格、item では実購入価格
- sale 情報は candidate 側のみ
- ホームで sale を扱う場合は `considering` 主体を前提にする
- `purchased` 候補も複製元にできる方向で検討してよい

---

## 次に設計差分へ進むときに決めること

1. `sale_price` / `sale_ends_at` の schema と API 追加範囲
2. candidate 一覧 / 詳細での sale 表示項目
3. `POST /api/purchase-candidates/{id}/duplicate` の payload 形式
4. `purchased` 後 candidate の編集許可範囲
5. `memo` を item 初期値へ引き継ぎ続けるか

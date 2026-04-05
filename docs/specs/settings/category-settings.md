# Category Settings Specification

## 概要

ユーザーごとに **利用するカテゴリの表示可否を設定できる機能**。

カテゴリは **大分類 / 中分類の2階層**で構成される。

表示設定はユーザー単位で保存し、
実際に保存するのは **中分類のON/OFF状態のみ** とする。

大分類の状態は中分類から算出する。

DBテーブル構成の詳細は `docs/data/database.md` を参照する。

---

# 1. カテゴリ構造

## 階層

```
大分類
 └ 中分類
```

将来的に小分類追加の余地は残すが、
初期実装では **2階層のみ** とする。

---

# 2. 現行カテゴリ一覧

この節は、**現行実装のカテゴリ構造**を記録する正本です。  
次回の category master 再編候補は `2-1. カテゴリ体系再編の採用候補` を参照します。

## トップス

* Tシャツ
* シャツ / ブラウス
* ニット / セーター
* パーカー / スウェット
* カーディガン
* ベスト

## アウター

* ジャケット
* コート
* ブルゾン
* ダウン / 中綿
* その他アウター

## ボトムス

* パンツ
* スカート
* ショートパンツ
* その他ボトムス

## ワンピース / オールインワン

* ワンピース
* オールインワン / サロペット

## ルームウェア・インナー

* ルームウェア
* インナー
* パジャマ

## シューズ

* スニーカー
* ローファー / 革靴
* パンプス
* ブーツ
* サンダル
* その他シューズ

## バッグ

* ハンドバッグ
* ショルダーバッグ
* トートバッグ
* リュック
* ボディバッグ
* クラッチバッグ
* その他バッグ

## 小物

* 帽子
* ベルト
* マフラー / ストール
* 手袋
* アクセサリー
* その他小物

## 2-1. カテゴリ体系再編の採用候補

この節は、**次回再編時に採用したい候補案**です。  
現時点の seed / API / 画面実装の正本ではありません。

現行の 2 階層構造は維持しつつ、次に category master を再編する場合は次の大分類・中分類を第一候補とする。

基本方針:

- 参考粒度は ZOZOTOWN と Rakuten Fashion を参照するが、そのままコピーせず、クローゼットアプリで登録・検索・設定しやすい粒度を優先する
- 中分類は「一般的な登録時に迷いにくい名称」を優先し、詳細シルエット差は item 側 `shape` や spec で吸収する
- 一方で、現行の `ボトムス`、`ワンピース・オールインワン`、`小物` のように責務が広すぎる大分類は分割する
- `その他○○` は、利用頻度が高く今後も新規追加余地が大きい大分類だけに持つ
- この節で示す内部名の候補は、**次回再編を実施する場合の採用候補**であり、現行の内部名正本は `#16. 現行の大分類ID一覧` と `#17. 現行の中分類ID一覧` を参照する

### 大分類の最終候補

| 表示名 | 内部名 | 備考 |
| --- | --- | --- |
| トップス | `tops` | 現行維持 |
| ジャケット・アウター | `outerwear` | 現行 `outer` から名称と内部名を見直す候補 |
| パンツ | `pants` | 現行 `bottoms` から分離 |
| スカート | `skirts` | 現行 `bottoms` から分離 |
| ワンピース・ドレス | `onepiece_dress` | 現行 `onepiece_allinone` から分離 |
| オールインワン | `allinone` | 現行 `onepiece_allinone` から分離 |
| ルームウェア・インナー | `roomwear_inner` | 今回は統合維持 |
| レッグウェア | `legwear` | 現行維持 |
| シューズ | `shoes` | 現行維持 |
| バッグ | `bags` | 現行維持 |
| ファッション小物 | `fashion_accessories` | 現行 `accessories` を改名する候補 |
| 水着 | `swimwear` | 新設候補 |
| 着物 | `kimono` | 新設候補 |

実装第1弾では、`swimwear` と `kimono` を含む大分類までを対象にし、`users.visible_category_ids`・settings・onboarding・purchase candidate の `category_id` を新しい中分類 ID へ寄せる。item 側では `bottoms` / `outer` / `onepiece_allinone` などは現行値を維持する一方、`bags`・`fashion_accessories`・`swimwear`・`kimono` は current item category にも切り出し、橋渡しは必要な箇所だけに限定する。

### 中分類の最終候補

#### トップス (`tops`)

- `tops_tshirt_cutsew` : Tシャツ・カットソー
- `tops_shirt_blouse` : シャツ・ブラウス
- `tops_knit_sweater` : ニット・セーター
- `tops_cardigan` : カーディガン
- `tops_polo_shirt` : ポロシャツ
- `tops_sweat_trainer` : スウェット・トレーナー
- `tops_hoodie` : パーカー・フーディー
- `tops_vest_gilet` : ベスト・ジレ
- `tops_camisole` : キャミソール
- `tops_tanktop` : タンクトップ・ノースリーブ
- `tops_other` : その他トップス

#### ジャケット・アウター (`outerwear`)

- `outerwear_jacket` : ジャケット
- `outerwear_blouson` : ブルゾン
- `outerwear_down_padded` : ダウンジャケット・中綿ジャケット
- `outerwear_coat` : コート
- `outerwear_mountain_parka` : マウンテンパーカー
- `outerwear_other` : その他アウター

#### パンツ (`pants`)

- `pants_pants` : パンツ
- `pants_denim` : ジーンズ・デニムパンツ
- `pants_slacks` : スラックス・ドレスパンツ
- `pants_short` : ショートパンツ
- `pants_other` : その他パンツ

#### スカート (`skirts`)

- `skirts_skirt` : スカート
- `skirts_other` : その他スカート

#### ワンピース・ドレス (`onepiece_dress`)

- `onepiece_dress_onepiece` : ワンピース
- `onepiece_dress_dress` : ドレス
- `onepiece_dress_other` : その他ワンピース・ドレス

#### オールインワン (`allinone`)

- `allinone_allinone` : オールインワン
- `allinone_salopette` : サロペット
- `allinone_other` : その他オールインワン

#### ルームウェア・インナー (`roomwear_inner`)

- `roomwear_inner_roomwear` : ルームウェア
- `roomwear_inner_underwear` : インナー
- `roomwear_inner_pajamas` : パジャマ

#### レッグウェア (`legwear`)

- `legwear_socks` : ソックス
- `legwear_stockings` : ストッキング
- `legwear_tights` : タイツ
- `legwear_leggings` : レギンス
- `legwear_other` : その他レッグウェア

#### シューズ (`shoes`)

- `shoes_sneakers` : スニーカー
- `shoes_loafers_leather` : ローファー・革靴
- `shoes_pumps` : パンプス
- `shoes_boots` : ブーツ
- `shoes_sandals` : サンダル
- `shoes_other` : その他シューズ

#### バッグ (`bags`)

- `bags_bag` : バッグ
- `bags_other` : その他バッグ

#### ファッション小物 (`fashion_accessories`)

- `fashion_accessories_hat` : 帽子
- `fashion_accessories_belt` : ベルト
- `fashion_accessories_scarf_stole` : マフラー・ストール
- `fashion_accessories_gloves` : 手袋
- `fashion_accessories_jewelry` : アクセサリー
- `fashion_accessories_wallet_case` : 財布・カードケース
- `fashion_accessories_hair` : ヘアアクセサリー
- `fashion_accessories_eyewear` : 眼鏡・サングラス
- `fashion_accessories_watch` : 腕時計
- `fashion_accessories_other` : その他ファッション小物

#### 水着 (`swimwear`)

- `swimwear_swimwear` : 水着
- `swimwear_rashguard` : ラッシュガード
- `swimwear_other` : その他水着

#### 着物 (`kimono`)

- `kimono_kimono` : 着物
- `kimono_other` : その他着物

### 境界整理

- `バッグ` と `ファッション小物` は分ける
  - バッグは持ち運び用途の主アイテム
  - ファッション小物は帽子・ベルト・アクセサリー・財布・眼鏡などの補助アイテム
- `ワンピース・ドレス` と `オールインワン` は分ける
  - 1 枚で上下がつながっていても、スカート型とパンツ型で登録・検索意図が違うため
- 大分類と同名の中分類は許容する
  - 例として `スカート > スカート` は不自然ではなく、詳細シルエット差を item 側 `shape` や spec へ逃がしたい時に有効
  - 同名中分類は「その大分類の代表カテゴリ」を表す
  - 一方で `その他○○` は、既存の代表カテゴリに入れにくいものを受け止める受け皿カテゴリとして扱う
  - 代表カテゴリと受け皿カテゴリは役割が違うため、同時に置く場合も意味が重ならないようにする
- `パンツ > パンツ`、`バッグ > バッグ`、`シューズ > シューズ`、`着物 > 着物` も同じ考え方で許容する
  - 一覧・設定・登録で迷いにくい代表カテゴリを先に置き、細かい型差は必要なものだけ中分類へ残す
- `ルームウェア・インナー` は今回は統合維持
  - さらに分ける余地はあるが、現段階では優先度を下げる
  - `インナー` の中にブラ・ショーツなどの下着をどこまで含めるかは要検討とし、初回再編では広げすぎない
- `水着` と `着物` は独立大分類とする
  - 通常衣類と混ぜると settings や onboarding で扱いづらいため
- `デニムスカート` は今回は中分類に含めない
  - 素材差として扱う余地が大きく、初回再編では `スカート > スカート` や item 側 spec / shape で吸収する方を優先する
- `シャツワンピース` や `ニットワンピース` のような型差は今回は中分類に含めない
  - ワンピース・ドレスの代表カテゴリを優先し、素材差や型差は shape / spec 側で扱う余地を残す
- アウターの細かい型差やバッグの用途差も、初回再編では中分類へ入れすぎない
  - 登録時に迷いにくい代表カテゴリを優先し、バッグの用途差は current item shape で吸収しつつ、後から実データを見て追加要否を再判断する

## 2-2. `shape` / `spec` に寄せる前提の最小設計メモ

カテゴリ再編で中分類を代表カテゴリ中心に絞る場合でも、`shape` / `spec` 側がまったく未整理だと登録時に情報を逃がせない。  
現時点で具体化できている範囲と、再編に合わせて次に詰めるべき範囲を次のように整理する。

### 現時点で比較的具体化されているもの

- `tops`
  - `spec.tops` を保存対象として使用している
  - 想定キーは `shape / sleeve / length / neck / design / fit`
  - 詳細は `docs/specs/items/tops.md` を参照する
- `bottoms`
  - `spec.bottoms.length_type` があり、丈感の補助情報を持てる
  - 詳細は `docs/specs/items/thumbnail-skin-exposure.md` を参照する
- `legwear`
  - `spec.legwear.coverage_type` があり、覆い方の補助情報を持てる
  - 詳細は `docs/specs/items/thumbnail-skin-exposure.md` を参照する

### 再編に合わせて次に詰めるべきもの

- `pants`
  - `パンツ > パンツ` を代表カテゴリにしたうえで、シルエット差は `shape` 側へ寄せる
  - まずは `straight / tapered / wide` 程度の差を維持できればよい
- `skirts`
  - `スカート > スカート` を代表カテゴリにし、`タイト / フレア / プリーツ` のような型差は `shape` または `spec` 側で吸収する
  - 初回再編では中分類よりも `shape` 側の受け皿整備を優先する
- `outerwear`
  - `ジャケット・アウター` は同名中分類を置かず、`jacket / blouson / coat / mountain_parka / down_padded` のような最小 shape へ寄せる前提で整理する
  - ただし、初回は `jacket / blouson / coat / mountain_parka / down_padded` 程度の最小 shape でもよい
- `onepiece_dress`
  - `シャツワンピース` や `ニットワンピース` を中分類に持たない代わりに、必要なら素材差や袖丈差を `spec` 側で扱える余地を残す
- `bags`
  - 初回は `バッグ > バッグ` を代表カテゴリにし、中分類は増やしすぎない
  - 一方で current item shape としては `bag / tote / shoulder / backpack / clutch` 程度を持ち、用途差は shape で吸収する
- `kimono`
  - 初回は `着物 > 着物` を代表カテゴリにし、`浴衣` や和装小物は広げない

### 現時点の判断

- `shape` / `spec` は **方向性としては使えるが、再編全体をそのまま受け止められるほど全面的には詰まっていない**
- かなり具体化されているのは `tops` と `bottoms.length_type`、`legwear.coverage_type` まで
- そのため、次に実装へ進むときは category master 追加だけでなく、少なくとも `pants` と `skirts` の `shape` の持ち方を同時に決める前提で進める

---

# 3. 分類プリセット

ユーザー登録時に **分類プリセット** を選択する。

## プリセット

| 内部値 | UI 表示 |
| ------ | -------- |
| `male` | `Men` |
| `female` | `Women` |
| `custom` | `Custom` |

---

## `male` / `Men` 基本セット

初期OFF

* スカート
* ワンピース
* オールインワン / サロペット
* パンプス

その他カテゴリは ON

---

## `female` / `Women` 基本セット

基本 **すべてON**

---

## `custom` / `Custom`

全カテゴリON状態で表示し、
ユーザーが不要カテゴリをOFFにする。

表示文言

```
カテゴリは後から設定画面で変更できます
```

補足:

- 新規登録直後の導線では、まずカテゴリプリセット選択画面を表示する
- `custom` を選んだ場合は、全カテゴリ ON の状態でカテゴリ微調整画面へ進む
- 詳細は `docs/specs/settings/category-preset-selection.md` を参照する

---

# 4. カテゴリ表示設定画面

設定画面

```
設定
 └ カテゴリ設定
```

---

## UI構造

- 現状の実装の画面パスは `/settings/categories`
- settings トップはハブ画面とし、カテゴリ設定本体は別ページで管理する

大分類ごとに折りたたみ表示。

例

```
トップス
アウター
ボトムス
ワンピース / オールインワン
ルームウェア・インナー
シューズ
バッグ
小物
```

展開すると中分類を表示。

---

# 5. 大分類状態

大分類は **三状態表示** とする。

| 状態 | 条件 |
| ---- | --------- |
| ON | 中分類すべてON |
| 一部ON | 中分類が一部ON |
| OFF | 中分類すべてOFF |

---

# 6. 大分類操作

## OFF

配下の中分類をすべてOFFにする。

登録済みアイテムが存在する場合のみ、確認ダイアログを表示する。

設定画面の `すべてOFF` ボタン押下時は、登録済みアイテム件数を含めた確認ダイアログを表示する。

登録済みアイテムが存在する場合は、影響件数が分かるように
`現在〇アイテム` の形式で件数を表示する。

ダイアログでは、非表示にしてもデータ自体は削除されないことを明示する。

例

```
バッグをすべてOFFにしますか？

現在3アイテムがこの大分類に登録されています。

非表示にしてもデータは削除されません。
変更後は「表示設定を保存」を押してください。
```

---

## ON

配下の中分類をすべてONにする。

設定画面の `すべてON` ボタン押下時は、確認ダイアログを表示しない。

---

# 7. 中分類操作

中分類は個別ON/OFF可能。

中分類を OFF にする際は、登録済みアイテムが存在する場合のみ確認ダイアログを表示する。
中分類を ON に戻す際は、確認ダイアログを表示しない。

例

```
バッグ
  ハンドバッグ
  ショルダーバッグ
  トートバッグ
  リュック
  ボディバッグ
  クラッチバッグ
  その他バッグ
```

---

# 8. 登録済みアイテムの扱い

カテゴリOFF時に
登録済みアイテムが存在する場合、確認ダイアログを表示。

例

```
スカートには登録済みアイテムが3件あります。
非表示にすると一覧では表示されません。
```

※ データは削除しない

---

# 9. アイテム登録時のカテゴリ選択

カテゴリ選択は **2段階方式**。

## 1段階

大分類選択

例

* トップス
* アウター
* ボトムス
* シューズ
* バッグ
* 小物

---

## 2段階

中分類選択

例（バッグ）

* ハンドバッグ
* ショルダーバッグ
* トートバッグ
* リュック
* ボディバッグ
* クラッチバッグ
* その他バッグ

---

# 10. 非表示カテゴリの扱い

## 新規登録

非表示カテゴリは選択肢に出さない。

補足:

- 大分類選択には ON の大分類のみ表示する
- 設定で OFF にしたカテゴリは、通常の登録候補から外す
- コーディネート新規作成のアイテム選択でも、OFF にしたカテゴリのアイテムは候補から外す
- コーディネート一覧ではコーディネート自体は残し、表示アイテム数のみ現在の表示設定に合わせて再計算する

---

## 編集

既存アイテムがそのカテゴリの場合は表示する。

補足:

- 基本は ON の大分類のみ表示する
- ただし編集中のアイテムが現在 OFF のカテゴリだった場合は、そのカテゴリだけは消さずに残す
- コーディネート編集でも、現在選択中のアイテムが OFF カテゴリでもそのアイテムだけは候補に残す
- コーディネート詳細では OFF にしたカテゴリのアイテムを非表示にし、件数を案内する
- 既存データを編集不能にしないための例外とする

補足表示

```
このカテゴリは現在非表示設定です
```

---

# 11. データ保存方針

## 保存対象

ユーザー単位

```
visible_category_ids
```

保存内容

```
中分類ID
```

補足:

- `visible_category_ids` はキー自体を必ず送る
- 空配列 `[]` は「すべてOFF」の意味で保存可能とする
- キー欠落と空配列は別物として扱う
- 現行実装では `users.visible_category_ids` に保存する
- これは中分類の表示可否だけを支える現行保存形式であり、カテゴリ設定の拡張項目を JSON として増やし続ける前提にはしない

## 将来の正本方針

- `user_settings` は全体設定へ寄せ、カテゴリ表示設定は将来的に `user_category_settings` のような専用テーブルへ分離する方向を第一候補とする
- カテゴリ master 側の階層は `category_groups` / `category_master` を正本とし、ユーザー側では `user_id + category_id` 単位で表示可否を管理する想定とする
- 大分類の状態は将来も行データから算出し、専用の大分類状態列は持たない
- 表示順や onboarding プリセットの反映が必要になった場合も、まずは行単位で表現できるかを優先して検討する
- そのため、今後カテゴリ表示設定に新しい保存項目を足す場合は、`visible_category_ids` へ追加せず専用テーブル案と比較してから進める

---

## 保存しないもの

* 大分類状態（算出）

## 初期値

- DB 上の `visible_category_ids` の初期値は `null`
- ただし画面表示では `null` をそのまま使わず、active な中分類をすべて ON として扱う
- 初回アクセス時の実質的な初期表示は「全カテゴリ ON」になる

## 画面表示ルール

- 画面では `GET /api/categories` で大分類 / 中分類一覧を取得する
- `GET /api/settings/categories` で `visibleCategoryIds` を取得する
- 中分類ごとの ON / OFF は `visibleCategoryIds` に含まれるかどうかで判定する
- 大分類の `ON / 一部ON / OFF` は、中分類の ON 件数から毎回算出する
- そのため、大分類状態自体は DB には保存しない
- onboarding プリセットも現時点では最終的に `visible_category_ids` へ反映しているが、将来的にはカテゴリ設定行の初期投入で表現する方向を優先する

## 保存UIの扱い

- 未保存変更がないとき、保存ボタンは非活性表示とする
- 中分類または大分類の ON / OFF を変更すると、保存ボタンを活性化する
- 未保存変更がある状態でブラウザ再読み込み / タブを閉じる操作をした場合は、離脱警告を表示する
- ページ内遷移時の警告は今後の検討対象とする

---

# 12. API (想定)

## カテゴリ取得

```
GET /api/categories
```

レスポンス

```
groups
  categories
```

---

## ユーザー設定取得

```
GET /api/settings/categories
```

---

## ユーザー設定更新

```
PUT /api/settings/categories
```

---

# 13. 将来拡張

* 小分類追加
* カテゴリ検索
* よく使うカテゴリ優先表示
* プリセット再適用
* カテゴリおすすめ構成リセット

---

# 14. カテゴリID設計

カテゴリIDは **大分類 / 中分類の両方に付与** する。

目的:

- UI表示名と内部識別子を分離する
- ユーザー設定保存で安定したキーを使う
- API / DB / フロントで同じ値を参照できるようにする
- 表示名変更時も既存データ互換性を維持する

---

# 15. ID設計方針

## 基本方針

- ID は **英小文字スネークケース** を使う
- 表示名とは分離する
- 意味が分かる命名を優先する
- 一度採番した ID は原則変更しない
- 中分類IDは **`大分類ID_中分類キー`** を基本形とする

例

- 大分類: `tops`
- 中分類: `tops_tshirt`

補足:

- カテゴリAPI / DB / 仕様書では `name` を使う
- 表示専用の補助データでは `label` を使う

## 命名規則

本仕様では、層ごとに命名規則を分ける。

- DBカラム名は `snake_case`
- APIレスポンスおよびリクエストJSONは `camelCase`

例

- DB: `group_id`
- API: `groupId`

このため、カテゴリマスタでは DB 上 `group_id` を使用し、
API では `groupId` として返す。

---

# 16. 現行の大分類ID一覧

| 大分類 | ID |
| ------ | ------ |
| トップス | `tops` |
| アウター | `outer` |
| ボトムス | `bottoms` |
| ワンピース / オールインワン | `onepiece_allinone` |
| ルームウェア・インナー | `inner` |
| シューズ | `shoes` |
| バッグ | `bags` |
| 小物 | `accessories` |

この節は、**現行実装で使っている大分類IDの正本**です。  
大分類IDはカテゴリグループの親キーとして使う。

補足:

- `inner` は「ルームウェア・インナー」グループ全体を表す簡略IDとして使用する

---

# 17. 現行の中分類ID一覧

この節は、**現行実装で使っている中分類IDの正本**です。  
`2-1. カテゴリ体系再編の採用候補` に出てくる `outerwear` / `pants` / `skirts` / `onepiece_dress` / `allinone` / `fashion_accessories` などは、現時点ではまだ採用前の候補名です。

## トップス

| 表示名 | ID |
| ------ | ------ |
| Tシャツ | `tops_tshirt` |
| シャツ / ブラウス | `tops_shirt` |
| ニット / セーター | `tops_knit` |
| パーカー / スウェット | `tops_hoodie` |
| カーディガン | `tops_cardigan` |
| ベスト | `tops_vest` |

## アウター

| 表示名 | ID |
| ------ | ------ |
| ジャケット | `outer_jacket` |
| コート | `outer_coat` |
| ブルゾン | `outer_blouson` |
| ダウン / 中綿 | `outer_down` |
| その他アウター | `outer_other` |

## ボトムス

| 表示名 | ID |
| ------ | ------ |
| パンツ | `bottoms_pants` |
| スカート | `bottoms_skirt` |
| ショートパンツ | `bottoms_shorts` |
| その他ボトムス | `bottoms_other` |

## ワンピース / オールインワン

| 表示名 | ID |
| ------ | ------ |
| ワンピース | `onepiece` |
| オールインワン / サロペット | `allinone` |

## ルームウェア・インナー

| 表示名 | ID |
| ------ | ------ |
| ルームウェア | `inner_roomwear` |
| インナー | `inner_underwear` |
| パジャマ | `inner_pajamas` |

## シューズ

| 表示名 | ID |
| ------ | ------ |
| スニーカー | `shoes_sneakers` |
| ローファー / 革靴 | `shoes_loafers` |
| パンプス | `shoes_pumps` |
| ブーツ | `shoes_boots` |
| サンダル | `shoes_sandals` |
| その他シューズ | `shoes_other` |

## バッグ

| 表示名 | ID |
| ------ | ------ |
| ハンドバッグ | `bags_hand` |
| ショルダーバッグ | `bags_shoulder` |
| トートバッグ | `bags_tote` |
| リュック | `bags_backpack` |
| ボディバッグ | `bags_body` |
| クラッチバッグ | `bags_clutch` |
| その他バッグ | `bags_other` |

## 小物

| 表示名 | ID |
| ------ | ------ |
| 帽子 | `accessories_hat` |
| ベルト | `accessories_belt` |
| マフラー / ストール | `accessories_scarf` |
| 手袋 | `accessories_gloves` |
| アクセサリー | `accessories_jewelry` |
| その他小物 | `accessories_other` |

補足:

- 表示名に `/` があっても、IDでは `_` もしくは短縮キーに正規化する
- 将来的に表示名を変更しても ID は維持する
- `bags_tote` のように、短すぎず分かりやすいキーを優先する
- `tops_shirt` はカテゴリ設定上の統合カテゴリであり、アイテム詳細仕様の shape では `shirt` / `blouse` を個別に扱う

---

# 18. データ構造

カテゴリマスタでは、少なくとも次を持つ。

## category_groups

| column | type | note |
| ------ | ------ | ------ |
| id | varchar | 大分類ID |
| name | varchar | 表示名 |
| sort_order | int | 表示順 |

## category_master

| column | type | note |
| ------ | ------ | ------ |
| id | varchar | 中分類ID |
| group_id | varchar | 親の大分類ID。DBでは `snake_case` を使う |
| name | varchar | 表示名 |
| sort_order | int | 表示順 |

---

# 19. APIレスポンス例

```json
{
  "groups": [
    {
      "id": "tops",
      "name": "トップス",
      "categories": [
        {
          "id": "tops_tshirt",
          "groupId": "tops",
          "name": "Tシャツ"
        },
        {
          "id": "tops_shirt",
          "groupId": "tops",
          "name": "シャツ / ブラウス"
        }
      ]
    }
  ]
}
```

カテゴリ取得APIでは、表示名だけでなく ID も返す。

補足:

- DB / 設計書のカラム名は group_id とする
- APIレスポンス / フロントのJSONは groupId とする

---

# 20. ユーザー設定保存との関係

ユーザー設定では **中分類IDのみ** を保存する。

保存例:

```json
{
  "visible_category_ids": [
    "tops_tshirt",
    "tops_shirt",
    "outer_jacket",
    "bottoms_pants",
    "bags_tote"
  ]
}
```

大分類の ON / 一部ON / OFF は、この中分類IDの集合から算出する。

---

# 21. 今後の拡張方針

- 小分類を追加する場合は、ID文字列の無理な多段連結よりも、階層カラムまたは別テーブルで表現することを優先する
- 廃止カテゴリは即削除せず、互換期間を設ける
- 既存アイテムと設定値の整合を壊さないよう、ID変更ではなく表示名変更で吸収する
- マスタ定義は API / フロントで二重管理せず、最終的には共通化を目指す

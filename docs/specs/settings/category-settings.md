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

実装第1弾と第2弾では、`swimwear` と `kimono` を含む大分類までを対象にし、`users.visible_category_ids`・settings・onboarding・purchase candidate の `category_id` を新しい中分類 ID へ寄せる。item 側も `bags`・`fashion_accessories`・`swimwear`・`kimono` に加えて、`pants`・`skirts`・`outerwear`・`onepiece_dress`・`allinone` を現在の item カテゴリに取り込む。橋渡しは旧 `bottoms` / `outer` / `onepiece_allinone` を既存データ互換として残す箇所に限定する。

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
- `pants_cargo` : カーゴパンツ
- `pants_chino` : チノパンツ
- `pants_sweat_jersey` : ジャージ・スウェットパンツ
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
  - 現時点では現在の item shape として `pants / denim / slacks / cargo / chino / sweat-jersey / other` と、シルエット差としての `straight / tapered / wide / culottes` を併用している
- `skirts`
  - `スカート > スカート` を代表カテゴリにし、`タイト / フレア / プリーツ` のような型差は `shape` または `spec` 側で吸収する
  - 現時点では現在の item shape として `skirt / other` を持つ
- `outerwear`
  - `ジャケット・アウター` は同名中分類を置かず、`jacket / blouson / coat / mountain-parka / down-padded / other` の最小 shape で扱う
- `onepiece_dress`
  - `シャツワンピース` や `ニットワンピース` を中分類に持たない代わりに、必要なら素材差や袖丈差を `spec` 側で扱える余地を残す
  - 現時点では現在の item shape として `onepiece / dress / other` を持つ
- `allinone`
  - 現時点では現在の item shape として `allinone / salopette / other` を持つ
- `bags`
  - 初回は `バッグ > バッグ` を代表カテゴリにし、中分類は増やしすぎない
  - 一方で現在の item shape としては `bag / tote / shoulder / backpack / clutch` 程度を持ち、用途差は shape で吸収する
- `kimono`
  - 初回は `着物 > 着物` を代表カテゴリにし、`浴衣` や和装小物は広げない

### 現時点の判断

- `shape` / `spec` は **方向性としては使えるが、再編全体をそのまま受け止められるほど全面的には詰まっていない**
- かなり具体化されているのは `tops` と `bottoms.length_type`、`legwear.coverage_type` まで
- `pants` / `skirts` / `outerwear` / `onepiece_dress` / `allinone` は現在の item category と最小 shape までは導入したが、spec の責務分解はまだ最小限に留めている

## 2-3. `category` / `subcategory` / `shape` / `spec` の責務整理

カテゴリ再編を続ける前提として、`category` / `subcategory` / `shape` / `spec` の役割は次のように分ける。

### `category`

- 用途・売り場・一覧探索の単位
- 一般ユーザーが最初に「これは何か」を選ぶ分類
- settings、onboarding、一覧絞り込み、候補表示、purchase candidate 変換の基準になる
- そのため、登録時に迷いにくい代表カテゴリを優先し、細かい型差まで抱え込まない

### `subcategory`

- 種類名として定着している下位分類
- 一般ユーザーが「別物」として認識しやすいものを置く
- 現在のカテゴリ設定で扱う中分類 ID は、この `subcategory` に相当するものとして扱う
- settings と onboarding の ON / OFF 対象は、当面 `category` 直下の `subcategory` までに留める
- 全カテゴリで必須ではなく、必要なカテゴリだけ値を持てる前提を優先する

### `shape`

- 同じ `category` / `subcategory` の中での見た目・構造・型の差
- サムネイル、一覧補助表示、作成 / 編集時の第2段階の選択肢として使う
- ただし、素材名や丈名を何でも `shape` に入れるのではなく、「見た目や構造の差として説明しやすいもの」を優先する

### `spec`

- 寸法・長さ・覆い方・機能・補助属性のための保存領域
- 一覧探索の主分類には使わず、描画や補助ラベル、詳細表示で効く情報を持つ
- まずは `tops` の詳細仕様、`bottoms.length_type`、`legwear.coverage_type` を正本とし、後続で必要なカテゴリだけ広げる

### 混ざりやすい論点

- 「種類名として定着したもの」は、まず `subcategory` に置けるかを優先して判断する
- 「丈」は原則 `spec` に寄せる
- 「シルエット差」は原則 `shape` に寄せる
- 「売り場として独立して見たいもの」は `category` に残す

### カテゴリ設定との関係

- docs 上では、`大分類 = category`、`中分類（種類） = subcategory` と読めるように整理する
- `users.visible_category_ids` は、当面「表示対象の種類 ID 配列」として読む
- `shape` と `spec` はカテゴリ設定の ON / OFF 対象に広げない
- item 入力フォームは、できるだけ `カテゴリ / 種類 / 形 / 詳細` の並びへ寄せ、使わない欄は非表示または未選択可で扱う
- これにより、カテゴリごとに入力項目の意味は変えても、フォーム全体の見た目は大きく変えすぎない

### item モデルでの保持方針

- item には `subcategory` を独立カラムとして段階導入する前提を第一候補にする
- `subcategory` は中分類 ID をそのまま持つのではなく、`denim`、`slacks`、`hoodie` のような単体値で持つ
- `subcategory` の意味は常に `category` と組み合わせて読む
- settings 側の中分類 ID とは、たとえば `pants_denim` ⇔ `category = pants` かつ `subcategory = denim` のように対応づけて扱う
- これにより、settings の中分類 ID は ON / OFF 対象、item の `subcategory` は実データの種類名、という責務差を保ったまま同じ概念を扱える
- `subcategory` は全カテゴリで必須にはせず、まず `tops`、`pants`、`outerwear`、`onepiece_dress`、`allinone` を中心に導入し、`skirts`、`bags`、`shoes`、`kimono` は代表カテゴリまたは `null` 許容で始める

### 入力フォーム方針

- create / edit は原則 `カテゴリ / 種類 / 形 / 詳細` の並びへ寄せる
- `subcategory` が定義されているカテゴリでは、`shape` より先に `種類` を選ぶ
- `shape` 候補は `category` に加えて `subcategory` に応じて出し分ける前提を優先する
- `subcategory` をまだ厳密に持たないカテゴリでは、`種類` 欄は代表カテゴリの固定値または未選択可で扱う
- 主表示は `subcategory` 優先とし、未移行データや `subcategory = null` の場合は現行の bridge から補助ラベルを出す
- `skirts`、`bags`、`shoes`、`kimono` は、通常入力ではプルダウンではなく軽い UI で `種類` を見せ、代表カテゴリを既定値にしつつ `other` へ切り替えられる前提を優先する
- `skirts` は `subcategory = skirt`、`bags` は `subcategory = bag`、`shoes` は `subcategory = shoes`、`kimono` は `subcategory = kimono` を通常入力の既定値とし、`other` はサブカテゴリ側の受け皿として扱う
- `other` は staged rollout 中の旧データ互換や補助表現にも残すが、shape 側の新規入力候補には追加しない

### 現時点の入力必須条件

| category | `subcategory` | `shape` | 必須の spec | 候補1件時 | `other / null` |
| --- | --- | --- | --- | --- | --- |
| `tops` | 必須 | 条件付き必須 | tops 系の詳細は任意 | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `pants` | 必須 | 条件付き必須 | `spec.bottoms.length_type` | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `skirts` | 任意 | 条件付き必須 | `spec.bottoms.length_type` | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `outerwear` | 必須 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `onepiece_dress` | 必須 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `allinone` | 必須 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `shape` は任意寄り |
| `bags` | 任意 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `subcategory = bag` 以外は `shape` 任意寄り |
| `shoes` | 任意 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `subcategory = shoes` 以外は `shape` 任意寄り |
| `kimono` | 任意 | 条件付き必須 | なし | 自動選択し、必須表示は弱める | `subcategory = kimono` 以外は `shape` 任意寄り |

- `shape` の条件付き必須は、`category + subcategory` で見た候補数を基準にする
- 候補が複数ある場合のみ手動選択を求め、候補が1件なら自動選択で済ませる
- `subcategory = other` と staged rollout 中の `null` は、旧データ互換を優先して `shape` 任意寄りに扱う
- `bags` は `subcategory = bag` のときだけ `shape` 必須寄りとし、`other / null` は任意寄りを現時点の第一候補とする
- `outerwear` は `subcategory = other` を受け皿にし、shape 側の `other` は新規入力の主導線には置かない

## 2-4. lower-body 系の優先方針

### `pants`

- 中分類に残すもの
  - `pants_pants`
  - `pants_denim`
  - `pants_slacks`
  - `pants_cargo`
  - `pants_chino`
  - `pants_sweat_jersey`
  - `pants_other`
- `shape` に寄せるもの
  - テーパード
  - ストレート
  - ワイド
  - キュロット
- `spec` に寄せるもの
  - `length_type`
  - 裾丈の補助情報
  - 必要に応じた補助属性
- `length_type` の候補値
  - `mini`
  - `short`
  - `half`
  - `cropped`
  - `full`
- 丈の考え方
  - `mini` はかなり短い丈感
  - `short` は一般的なショート丈
  - `half` はひざ付近までの丈
  - `cropped` はくるぶしが見える短めのフルレングス寄り
  - `full` は通常のフルレングス
- `mini` と `short` は分ける
  - 短さの段階差を保持したいので同一視しない
- 方針
  - `パンツ` は代表カテゴリ、`ジーンズ・デニムパンツ`、`スラックス・ドレスパンツ`、`カーゴパンツ`、`チノパンツ`、`ジャージ・スウェットパンツ` は種類名として定着しているので中分類に残す
  - シルエット差は `shape` に寄せる
  - 丈の差は原則 `spec` に寄せる
  - `pants_short` は中分類に置かず、短さは `spec.length_type` で表す
  - `キュロット` は見た目と構造の差として説明しやすいため、現時点では `shape` に置く

### `skirts`

- 中分類に残すもの
  - `skirts_skirt`
  - `skirts_other`
- `shape` に寄せるもの
  - タイト
  - フレア
  - Aライン
  - プリーツ
- `spec` に寄せるもの
  - `length_type`
  - 丈の補助情報

### 丈の扱い

- lower-body 系の丈は、原則 `spec` に寄せる
- その理由は、丈を `category` や `shape` に混ぜると一覧探索と描画補助の責務が混ざりやすいため
- `pants` と `skirts` の `length_type` は、まず `mini / short / half / cropped / full` を共通候補として持つ
- short 系の見え方は中分類ではなく `length_type` で揃える
- 現行実装では lower-body 系の新規保存と編集を `pants` / `skirts` 前提へ寄せ、`spec.bottoms.length_type` も `mini / short / half / cropped / full` を正本候補として扱う
- 旧 `bottoms` データは互換のため読み取りを残し、`knee` は `half`、`midi` は `cropped`、`ankle` は `full` へ正規化して扱う
- 現在の item データモデルには lower-body 専用の中分類保持欄がないため、`pants_denim`、`pants_slacks`、`pants_cargo`、`pants_chino`、`pants_sweat_jersey` などは item の現在 `category / shape` へ取り込む段階では代表カテゴリ `pants` に寄せている

### `tops`

- 中分類に残すもの
  - `tops_tshirt_cutsew`
  - `tops_shirt_blouse`
  - `tops_knit_sweater`
  - `tops_cardigan`
  - `tops_polo_shirt`
  - `tops_sweat_trainer`
  - `tops_hoodie`
  - `tops_vest_gilet`
  - `tops_camisole`
  - `tops_tanktop`
  - `tops_other`
- `shape / spec` 側に寄せるもの
  - 首元
  - 袖
  - fit
  - 丈
  - 補助デザイン
- 方針
  - `パーカー・フーディー`、`スウェット・トレーナー`、`ポロシャツ`、`キャミソール`、`タンクトップ・ノースリーブ` のように、種類名として定着しているものは中分類に残す
  - 同じ種類の中の首元・袖・fit・丈の差は `shape / spec` 側で扱う
  - `tops` では種類名を中分類に、見た目差と補助属性を `shape / spec` に寄せる判断を優先する

## 2-5. 例外ルール

### `ジーンズ・デニムパンツ`

- 素材名を含むが、実運用では種類名として定着しているため `pants` の中分類に残してよい
- ただし、色落ち加工やワイド / ストレートなどの差分までは中分類に増やさず、必要なら `shape` 側へ寄せる

### `ジャージ・スウェットパンツ`

- 素材感を含むが、実運用では種類名として定着しているため `pants_sweat_jersey` を中分類に置いてよい

### `デニムスカート`

- 初回再編では中分類に入れず、`skirts_skirt` を代表カテゴリにする
- デニムという素材差は、後続で spec か素材情報で扱う余地を残す

### `パーカー・フーディー`

- 種類名として定着しているため、`tops` の中分類に残してよい
- 一方で、ジップアップ / プルオーバーのような差は後続で `shape` か `spec` へ寄せる余地を残す

### `キュロット`

- パンツ内の見た目と構造の差として扱い、現時点では `shape` に置く方を優先する

### バッグの用途差

- 初回再編では `bags_bag` を代表カテゴリにし、中分類を増やしすぎない
- トート / ショルダー / リュック / クラッチのような差は、current item では `shape` 側で吸収する
- 将来、一覧探索や登録実態から「用途差を中分類に上げる価値」が明確になった時だけ中分類追加を再判断する

### 2-6. 一覧・検索で使いたい粒度を基準にした再整理メモ

- `subcategory` に上げる第一条件は、「一覧・検索で独立して絞りたくなるか」と「ユーザーが別物として認識しやすいか」を両方満たすこととする
- `shape` は、同じ `subcategory` の中で見た目や構造の差を補助的に表すものに寄せる
- `spec` は、丈・覆い方・素材・機能・補助属性の保存領域として扱い、一覧・検索の主導線には広げすぎない
- `bags` は、トート / ショルダー / リュック / ハンド / クラッチ / ボディを独立して探したくなる可能性が高く、将来の一覧・検索を優先するなら `shape` から `subcategory` へ上げる候補が強い
- `fashion_accessories` は、帽子 / ベルト / マフラー・ストール / 手袋 / アクセサリー / 財布・カードケース / ヘアアクセサリー / 眼鏡・サングラス / 腕時計のように、種類名として独立認識されやすいため `subcategory` 厚めを第一候補とする
- `shoes` は、スニーカー / パンプス / ブーツ / サンダルのように一覧・検索で独立して使いたくなる粒度が強く、`shoes / other` のままより `subcategory` 厚めへ寄せる方が自然である
- `legwear` は、ソックス / ストッキング / タイツ / レギンスを `subcategory` に置き、`coverage_type` は引き続き `spec` に寄せる方が責務を分けやすい
- `roomwear_inner` は、ルームウェア / インナー / パジャマのような大きい種類差は `subcategory` に置く方が一覧・検索で扱いやすいが、キャミソールやペチコートのような細分は大分類構成の再判断と合わせて段階的に見る
- `bags` の再整理第一候補は、`bag / other` のままより `tote / shoulder / backpack / hand / clutch / body / other` を `subcategory` に上げ、`shape` は同じバッグ種の中の構造差が必要になった時だけ持つ方である
- `fashion_accessories` の再整理第一候補は、現在 `shape` にある値をそのまま `subcategory` として使い、初期段階では `shape` をほぼ持たない構成に寄せることである
- `shoes` の再整理第一候補は、`sneakers / pumps / boots / sandals / other` を `subcategory` に上げ、`shape` はヒール高やブーツ丈のような後続差分が必要になった時だけ追加する構成に寄せることである
- `legwear` は `subcategory` 厚め / `shape` 薄めが自然で、独立絞り込みしたい粒度は `socks / stockings / tights / leggings / other` に寄せる方が一覧・検索に向く
- `roomwear_inner` は、現時点では `roomwear / underwear / pajamas / other` のような大きい種類差を `subcategory` に置く方が自然で、キャミソールやペチコートのような細分は `tops` やインナー再編の後続論点として保留してよい
- `bags`、`shoes`、`legwear`、`roomwear_inner` は、入力フォームの分かりやすさだけでなく一覧・検索で独立して使いたい粒度を優先すると、現状より `subcategory` を厚くする再整理余地がある
- 一方で、`skirts` のように代表カテゴリ 1 つの中で shape 差を比較したいものは、`subcategory` を薄く保ったまま `shape` 厚めでよい
- category settings は引き続き「表示対象の種類 ID」を ON / OFF する前提なので、一覧・検索で独立して使いたい粒度を `subcategory` に上げる場合は、settings 側の中分類 ID も同じ粒度へ寄せる方が自然である
- settings だけ現状粒度のまま、一覧・検索だけ別軸で細かくすると、`visible_category_ids` と item の `subcategory` の対応説明が難しくなるため、将来拡張するなら原則として同じ粒度へそろえる第一候補を維持する


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

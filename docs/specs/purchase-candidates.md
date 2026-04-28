# 購入検討 仕様

購入検討（内部識別子: `purchase_candidates`）機能の仕様を定義する。  
この資料では、購入検討の役割、`items` との責務分離、状態管理、item への昇格、画像、画面、API、集計前提を整理する。

---

## 概要

購入検討は、クローゼット系 Web アプリにおける **「まだ所持していないが、購入を検討している服」** を管理するための機能とする。

この機能は単なる欲しい物リストではなく、以下を目的とする。

- 購入検討中の候補を保存する
- 手持ち item と比較する
- 優先度や保留状態を管理する
- 購入後に item へ昇格させる
- 購入前の判断材料を履歴として残す

---

## 機能の位置づけ

- 購入検討は **準主要機能** とする
- 購入検討は主要導線としてボトムナビに含める
- wear logs を含む全体再編は後続検討とし、初期実装範囲では購入検討を既存主要導線へ追加する
- 想定する主要ナビは以下
  - ホーム
  - items
  - outfits
  - purchase_candidates
  - settings

---

## 今回やらないこと

初期段階では、以下は対象外とする。

- EC 連携
- AI による自動推薦
- 診断結果による強い自動判定
- 天気 API 連動
- candidate を使った仮コーデ保存
- 比較ロジックの高度化

補足:

- 比較ロジックは後で追加検討する
- 今は後から拡張しやすい構造にしておくことを優先する

---

## 現状の実装 / 今後対応 / 要再判断

添付メモや後続検討事項を現状の実装説明へ混ぜないため、購入検討まわりの論点は次のように切り分ける。

### 現状と一致

- candidate -> item は変換ではなく item 新規作成で扱う
- item 作成成功時に candidate を `purchased` に更新し、`converted_item_id` / `converted_at` を保存する
- `item-draft` は item 作成画面用の初期値 payload を返す
- `price` は candidate では想定価格、item では実購入価格として扱う
- `memo` は item-draft に含め、item 作成画面の `memo` 初期値として引き継ぐ
- `wanted_reason` は item `memo` へ自動結合しない
- candidate `memo` と item `memo` は item 作成後は独立管理とし、同期しない
- `release_date` / `sale_price` / `sale_ends_at` / `discount_ends_at` は candidate 専用の補助情報として保持する
- candidate 一覧 / 詳細では sale 情報を補助表示する
- candidate 複製機能は詳細画面から使い、colors / seasons / tpos / images も引き継ぐ
- candidate 複製時の画像は record 共有ではなく、新 candidate 用保存先へ物理コピーする
- `purchased` 後 candidate は item 化済み履歴として扱い、candidate 側の更新を item へ逆流させない
- `purchased` 後 candidate では `memo` / `wanted_reason` / `priority` / `release_date` / `sale_price` / `sale_ends_at` / `discount_ends_at` / `purchase_url` を更新できる
- `purchased` 後 candidate でも画像追加 / 削除は画像 API で扱える
- `purchased` の candidate では item 追加導線を出さず、必要なら複製から再検討する
- duplicate は `purchased` / `dropped` を含むどの status からでも許可する

### 将来タスクとして有力

- ホームで sale 候補を要約表示する
- タグ機能は将来追加予定だが、現時点では未実装とし、方針メモは `docs/specs/tags.md` を参照する

### 要再判断

- sale 情報を item 作成画面でどこまで参考表示するか

---

## エンティティ責務

### 購入検討 (`purchase_candidates`)

まだ所持していない服の購入検討情報を管理する。

責務:

- 候補の保存
- 候補の比較
- 購入理由の保持
- 検討状態の保持
- item 昇格履歴の保持

### `items`

現在所持している服の正本を管理する。

責務:

- 所持状態の管理
- outfit / wear logs の参照元
- 実物情報の保持
- 実際の購入情報の保持

### `purchase_candidate_images`

購入判断材料としての画像を管理する。

責務:

- EC 商品画像
- 店頭写真
- 色違い比較画像
- 候補比較用画像

### `item_images`

所持品管理用の画像を管理する。

責務:

- 実物画像
- 管理用画像
- detail 表示用画像

---

## 基本方針

- 購入検討は `items` と **別エンティティ** で管理する
- item 化は「変換」ではなく **item 新規作成** とする
- 購入検討と所持品は責務を混ぜない
- ただし比較しやすいよう、共通項目はなるべく揃える
- 画像は item / candidate ともに **複数枚対応** とする
- candidate から item へは **登録済み全画像を初期値として引き継ぐ**
- `dropped` は削除ではなく **見送り履歴を残す状態** として扱う
- item 保存時には candidate 画像ファイルを item 用保存先へ物理コピーし、保存後は item 側画像として独立管理する

### アンダーウェアの扱い

- `underwear` は通常の purchase candidate と同じデータ構造で保存する
- ただし UI 上は通常一覧から分離する
- 通常一覧 `/purchase-candidates` では `underwear` を表示しない
- 専用一覧 `/purchase-candidates/underwear` では `underwear` のみ表示する
- detail / edit / item 化は既存画面を流用し、戻り先だけ `アンダーウェア購入検討一覧` に切り替える

---

## 色違いグループ

### 目的

同一商品の色違い候補を、保存上は独立した購入検討として持ちつつ、一覧上は関連する候補として束ねて比較しやすくする。

### 基本方針

- 色違いごとに `purchase_candidates` の独立 record を持つ
- 色違いの関連は `purchase_candidate_groups` と `purchase_candidates.group_id` で表現する
- `purchase_candidates.group_order` を group 内表示順の正本とする
- group 内の代表表示は `group_order` が最も小さい candidate を使う
- `group_id = null` の candidate は単独候補として扱う
- group に属する candidate が 1 件だけになった場合は、通常候補と同じ表示に自然に縮退してよい

### main color 任意色名ラベル

色違い group の識別性向上として、purchase candidate の main color にユーザー任意の色名ラベルを持たせる。

目的は、色分類そのものを増やすことではなく、同一商品の色違い候補をユーザーが識別しやすくすることである。

既存の color `label` は、preset / custom 由来のシステム表示名として扱う。  
一方、任意色名ラベルは、ユーザーが商品上の色名や自分にとって分かりやすい呼び名を補助的に入力する値として扱う。

例:

- `00 WHITE`
- `09 BLACK`
- `31 BEIGE`
- `64 BLUE`

上記のように、プリセット色名そのものではなく、商品ページ上の色番・色表記に近い形式も許容する。

#### 基本方針

- 項目名候補は `custom_label` とする
- 対象は main color のみとする
- sub color には追加しない
- 任意入力とし、未入力を許容する
- 未入力時は既存の color `label` を fallback として使う
- 色名は分類・検索・sort の正本ではなく、表示・識別補助として扱う
- 初期段階では filter / sort の対象にしない

#### purchase candidate 側

`purchase_candidate_colors.custom_label` nullable を持つ。

- `role = main` の行だけ入力対象とする
- `role = sub` では使用しない
- sub color に `custom_label` が送られた場合も保存しない
- DB 制約で main のみに限定するのではなく、validation / form / payload 整形で制御する

#### item 側との整合

最終的には item 側 colors にも `custom_label` を引き継げるようにする。

現状、purchase candidate は `purchase_candidate_colors` 別テーブルで色を持ち、items は `items.colors` JSON で色を持つため、DB 構造は一致していない。

ただし、API 上の color shape は item / purchase candidate でできるだけ揃える。

共通 shape の候補:

```ts
{
  role: "main" | "sub";
  mode: "preset" | "custom";
  value: string;
  hex: string;
  label: string;
  custom_label?: string | null;
}
```

短期方針:

- candidate 側に `custom_label` を追加する
- item 側は既存 JSON 構造を維持しつつ、将来的に `custom_label` を含められる形へ寄せる
- candidate から item 化する際に、`custom_label` を落とさず引き継げるようにする

中長期方針:

- item 側 colors を `item_colors` テーブルへ正規化するかは別途検討する
- seasons / tpos の正規化も同時に検討対象になり得るが、main color 任意色名ラベルの初期実装には含めない

#### form 表示

メインカラー欄の近くに任意入力欄を追加する。

表示例:

```text
色名
例: 00 WHITE / 31 BEIGE / 64 BLUE
```

placeholder は、既存プリセットの色名そのものではなく、商品ページ上の色番・色表記に近い形式を例示する。

#### duplicate / color-variant の扱い

通常複製:

- main color を引き継ぐ
- sub color を引き継ぐ
- main color の `custom_label` を引き継ぐ

色違い追加:

- main color は空にする
- sub color も空にする
- main color の `custom_label` も空にする
- custom color mode / custom hex も元 candidate から引き継がない

理由:

- 通常複製は同じ候補を複製する導線なので、色情報も初期値として引き継ぐのが自然である
- 色違い追加は別色への変更を前提とする導線なので、元 candidate の色や色名を引き継ぐと誤保存しやすい

#### 表示方針

一覧 grouped card:

- 視覚上は swatch 中心とする
- `custom_label` は `aria-label` / `title` などの補助に使う
- 一覧カード上に大きく常時表示しない

詳細上部の同 group 候補ナビ:

- `custom_label` があれば小さく表示してよい
- 未入力時は既存 color `label` を fallback 表示する
- custom color の `カスタムカラー` は強調しすぎない

画像なし通常カード:

- `custom_label` があれば色見本の補助として表示してよい

#### validation

- nullable
- string
- max: 50

#### 段階分け

Phase 1:

- candidate 側に `custom_label` を追加済み
- purchase candidate form / list / detail / duplicate / color-variant に対応済み
- 色違い追加では main color / sub color / custom_label を空にする
- item 側 colors の main color `custom_label` まで引き継ぎ済み

Phase 2:

- item 側 colors の構造整理と validation 共通化を検討する
- `custom_label` の検索・表示強化が必要なら detail / list 以外へ広げる

Phase 3:

- 必要になったら item colors 正規化を検討する
- seasons / tpos の正規化も別途検討する

### この方針を採る理由

色ごとに、価格、sale 情報、素材、URL、画像、比較メモなどが異なる可能性があるため、1 candidate の子要素として軽い差分だけを持つより、candidate 本体を色ごとに独立させた方が実務上自然である。

親 1 件 + 子 variant の構造にすると、どこまでを親の共通情報として持ち、どこからを色差分として持つかが曖昧になりやすい。特に、価格、sale 情報、purchase_url、materials、images、memo まで色ごとに変わり得る場合は、variant が実質的に独立 record に近くなるため、candidate 本体を独立させる方が責務を明確に保ちやすい。

---

## 一覧での表示

### 基本方針

- group に属さない candidate は通常の 1 カード表示とする
- 同じ `group_id` を持つ candidate が 2 件以上ある場合は、一覧上で 1 グループとして束ねて表示する
- PC 幅では最大 2 列の横長カードを基本とする
- 画像エリアを左、情報エリアを右に分け、価格 / sale 情報 / status / priority / 詳細導線を比較しやすい位置に置く
- mobile では 1 列表示へ落とす
- 一覧 API は `purchaseCandidateEntries` を正本 payload とし、`single` / `group` の group-aware response を返す
- pagination は candidate 件数ではなく、表示カード件数を基準にする
- 単独 candidate は 1 表示カードとして数える
- 同じ `group_id` を持つ candidate 群は 1 表示カードとして数える
- `meta.total` は filter 後の表示カード数とする
- `meta.totalAll` は空状態判定用の全 candidate 件数として扱う
- group がページ境界で分割されないよう、backend 側で group 化してから pagination する

### グループカードの表示

- 初期表示は `group_order` 最小の candidate を代表として表示する
- グループ内の色候補は `group_order asc` で並べる
- 角丸四角の swatch button を押すと、カード内の表示対象 candidate を切り替える
- 一覧カード上では `色違い n件` ラベルを表示しない
- 色違い件数や補足は、swatch button の `aria-label` / `title` で扱う
- 切り替え時に、画像、価格、sale 情報、状態、ブランドなどは選択中 candidate の内容へ切り替える
- group 内 candidate が 1 件だけになった場合は、通常カード表示へ自然に縮退してよい

### 通常カードと grouped card の色表示

- 画像あり通常カードでは、画像と重複するため色チップをカード内に表示しない
- 画像なし通常カードでは、画像の代替情報として色見本を表示する
- grouped card では、通常の色チップと candidate 切替 swatch を重複表示しない
- grouped card の swatch は、candidate 切替操作として扱う
- swatch は丸チップではなく、薄い border を持つ角丸四角の色見本として表示する

### 一覧カードの画像切替

- 複数画像がある candidate では、左右矢印と `1/n` 表示で画像を切り替える
- 画像切替は、現在選択中 candidate の画像だけを対象にする
- 色違い swatch で candidate を切り替えた場合は、その candidate の先頭画像へ戻す

### 一覧カードの sale 表示

- `sale_price` がある場合は sale 価格を主表示にし、通常価格を補助表示にする
- `discount_ends_at`（セール終了日）がある場合は、セール終了日の日付部分を控えめに強調する

### 一覧 pagination

- 一覧の pagination は表示カード単位で行う
- API response は `purchaseCandidateEntries` を返す
- `type = single` の entry は `candidate` を 1 件持つ
- `type = group` の entry は `group_id` / `representative_candidate_id` / `candidates[]` を持つ
- group 内 candidates は `group_order asc`, `id asc` で返す
- group card の代表 candidate は `group_order` 最小、同値または null がある場合は `id` で安定化する
- filter 適用時は、filter に一致した candidates だけを group entry に含める
- そのため、`status=considering` の一覧では、同 group の `purchased` candidate は一覧 card には含めず、詳細画面の同 group ナビで確認する

### purchased の扱い

- 通常一覧では、既存方針どおり `purchased` candidate は主表示から外す
- ただし group 自体は維持してよい
- 詳細画面では、同グループ内の `purchased` candidate も見えるようにする

---

## 詳細での表示

### 基本方針

- 詳細画面は現在の purchase candidate 1 件を正本として表示する
- そのうえで、同グループに属する他 candidate を補助情報として表示する

### 同グループ候補表示

- 詳細画面上部の基本情報エリア付近に「同じ商品の色違い」として表示する
- `group_order asc`, `id asc` で安定表示する
- `considering` / `on_hold` / `purchased` / `dropped` が分かるようにする
- `purchased` / `dropped` は詳細では見えてよい
- 現在表示中の candidate は「表示中」として区別する
- 他 candidate へ移動できる導線を持つ
- `group_id = null`、または同 group 候補が 1 件だけの場合は表示しない

### 手持ち item とのサイズ比較

- 詳細画面では、同じカテゴリの active な手持ち item から比較対象を選べる
- 比較候補は `size_details.structured` または `size_details.custom_fields` を持つ item のみに限定する
- 候補順は `同一 category` を前提に、`同一 subcategory` を優先し、さらに `同一 shape` を優先する
- 初期実装では比較対象 item_id は保存しない
- 比較表は `項目 / 購入検討 / 手持ち` の 3 列とする
- fixed size key を先に表示し、その後に `custom_fields` を表示する
- 同名の自由実寸が両方にある場合は 1 行にまとめ、片方だけにある項目はもう片方を `未設定` とする
- 購入検討側に fixed / free のどちらの実寸もない場合は、比較表の代わりに実寸入力を促す empty state を表示する
- 比較できる手持ち item がない場合は、その旨の empty state を表示する

---

## 色違い追加

### 基本方針

- 色違い追加は、通常複製に近い動きで作成する
- 元 candidate の内容を初期値として、新しい candidate を作る
- 新 candidate は元 candidate と同じ group に所属させる
- 色違い追加開始時の draft では元 candidate を更新せず、`variant_source_candidate_id` だけを持たせる
- 新 candidate の保存時に group を解決し、元 candidate がまだ group に属していない場合は保存 transaction 内で group を作成する

### 初期値

色違い追加では、別色への変更を前提とするため、色に関する項目は初期値として引き継がない。

引き継がない項目:

- main color
- sub color
- main color の `custom_label`
- custom color mode
- custom color hex

引き継ぐ項目:

- 名前
- カテゴリ
- ブランド
- 価格
- sale 情報
- URL
- memo
- wanted_reason
- materials
- images

補足:

- main color は必須項目のため、色違い追加画面では保存前にユーザーが選び直す
- 画像は引き続き draft として引き継ぐ
- 通常複製では main color / sub color / custom_label を引き継ぐため、色違い追加とは初期値方針を分ける

### 将来の改善候補

- 色違い追加時に画像も空で始めるかは、運用を見て後続で再判断する

---

## 通常複製との違い

### 通常複製

- 元 candidate をベースに独立した purchase candidate を作る
- `group_id` は引き継がない

### 色違い追加

- 元 candidate をベースに新しい purchase candidate を作る
- 保存時に元 candidate の group を解決し、同じ `group_id` を持たせて色違いグループとして一覧で束ねる

---

## item 化

### 基本方針

- item 化は purchase candidate 単位で行う
- グループ全体ではなく、現在表示している candidate を item 化対象とする

### この方針を採る理由

色ごとに purchase candidate 本体が分かれているため、item 化時に別途色選択 UI を出さなくても、どの色を購入したかを自然に確定できるため。

### item 化後

- item 化した candidate は `purchased` にする
- 同グループ内の他 candidate はそのまま残してよい
- 一覧では `purchased` を通常表示しないため、未購入候補だけが主に残る

---

## DB 方針

### `purchase_candidate_groups`

最小構成は次を想定する。

- `id`
- `user_id`
- `created_at`
- `updated_at`

現時点では group 自体に name や memo などの属性は持たせない。まずは「色違い候補を束ねるための薄いグループ」として扱う。

### `purchase_candidates`

既存項目に加えて、少なくとも次を持つ。

- `group_id`
- `group_order`

### `group_order`

- group 内表示順の正本とする
- 一覧での代表表示は `group_order` 最小の candidate を使う
- 詳細や色タブ・色チップの表示順も `group_order asc` を使う

### 既存データ

- 既存 candidate は `group_id = null` のままとする
- 色違い追加を使った候補から順に group 化する
- 既存 candidate を一括で group 化する migration は行わない

---

## 今は保留でよいこと

現時点では、次の事項は保留でよい。

- group に `name` を持たせるか
- group 単位の memo
- group の編集画面
- group 解消 UI
- group 同士の統合
- 一覧で purchased をどこまで補助表示するか

これらは、色違いグループの基本運用が固まってから後続で再判断する。

---

## 画面責務の分離

- 一覧は「確認・遷移」を主責務とし、代表画像と主要情報から詳細へ遷移する
- 詳細は候補内容・画像・item 追加導線・編集導線の確認を主責務とする
- 編集は candidate 内容の変更と画像操作を主責務とする
- 一覧では編集を主導線にせず、一覧 -> 詳細 -> 編集 を基本導線とする

## 画像管理の責務

- candidate 画像は購入検討側で upload / delete し、購入判断材料として扱う
- item 画像は item 側で別管理し、candidate 画像とは同じ record を共有しない
- item 保存時には candidate 画像を item 用保存先へ物理コピーして独立管理に切り替える
- candidate 側画像を削除しても、item 側へコピー済みの画像は残ることを前提とする
- candidate 側でも、編集画面と duplicate / color-variant draft の段階で代表画像切り替えと並び替えを扱える
- item 側では保存後画像の並び替えと代表画像切り替えを編集画面で扱い、candidate 側と同じ `sort_order` / `is_primary` の考え方で管理する

### 画像読み込み失敗時の表示

- 保存済み画像 URL の読み込みに失敗した場合、画面全体のエラーにはせず、画像なし相当の fallback 表示へ切り替える
- 一覧カードでは、既存の画像なし fallback と同等に扱う
- grouped card では、現在選択中 candidate / 選択中画像ごとに読み込み失敗状態を扱い、色違い swatch 切替や画像切替で失敗状態を不自然に引きずらない
- 詳細画像一覧では「画像を表示できません」と表示する
- 編集フォームの既存画像プレビューでも fallback 表示にする
- 編集フォームでは、画像を表示できない場合でも既存画像の削除導線は維持する

## item-draft 導線

- detail 画面の「アイテムに追加する」から `item-draft` を生成し、item 作成画面の初期値へ流し込む
- `item-draft` は保存済み item を返す API ではなく、item 作成画面用の初期値 payload を返す
- item 作成時に `purchase_candidate_id` を渡した場合、Laravel 側で item 作成と candidate 更新を同じ transaction で処理する
- `purchased` の candidate では `item-draft` を生成せず、詳細画面でも item 追加導線を表示しない
- item 作成画面には `returnTo` を渡し、現行の item 化導線である purchase candidate 詳細へキャンセル時に戻れるようにする
- サイズ候補が 1 つだけなら従来どおりそのまま `item-draft` を生成する
- サイズ候補が 2 つある場合は、detail 画面でどちらを item 化するか選んでから `item-draft` を生成する
- `item-draft` API には `selected_size = primary | secondary` を渡せる
- 戻るボタンの文言と遷移先の正本は `docs/specs/items/form-structure.md` の「戻る導線」を参照する

---

## DB 設計方針

## `purchase_candidates`

### カラム

- `id`
- `user_id`
- `status`
- `priority`
- `name`
- `category_id`
- `brand_name` nullable
- `price` nullable
- `release_date` nullable
- `sale_price` nullable
- `sale_ends_at` nullable
- `discount_ends_at` nullable
- `purchase_url` nullable
- `memo` nullable
- `wanted_reason` nullable
- `size_gender` nullable
- `size_label` nullable
- `size_note` nullable
- `size_details` nullable JSON
- `is_rain_ok` boolean default false
- `converted_item_id` nullable
- `converted_at` nullable
- `created_at`
- `updated_at`

### `status`

- `considering`
- `on_hold`
- `purchased`
- `dropped`

### `priority`

- `high`
- `medium`
- `low`

### 各項目の意味

- `price`: 想定価格
- `release_date`: 発売日
- `sale_price`: セール時の参考価格
- `sale_ends_at`: 販売終了日時
- `discount_ends_at`: セール終了日時
- `wanted_reason`: 購入判断の理由
- `memo`: 自由入力の補足情報。購入情報に限定しない
- `size_note`: サイズ感・着用感の補足メモ
- `size_details`: `structured` / `custom_fields` を持つ構造化実寸
- `converted_item_id`: item 化された先の ID
- `converted_at`: item 化日時

補足:

- `converted_item_id` / `converted_at` のカラムは 現在の schema に存在する
- 現時点の実装では、`purchase_candidate_id` 付きの item 作成成功時に自動更新する

---

## `items`

### 追加・整理したいカラム

- `id`
- `user_id`
- `status`
- `name`
- `category`
- `shape`
- `brand_name` nullable
- `price` nullable
- `purchase_url` nullable
- `purchased_at` nullable
- `memo` nullable
- `size_gender` nullable
- `size_label` nullable
- `size_note` nullable
- `size_details` nullable JSON
- `is_rain_ok` boolean default false
- `spec` nullable JSON
- `created_at`
- `updated_at`

### `status`

- `active`
- `disposed`

### 各項目の意味

- `price`: 実購入価格
- `purchased_at`: 実際の購入日
- `size_details`: item 側で `structured` / `custom_fields` に詳細化できるサイズ情報
- `spec`: 既存の item 詳細仕様枠を継続利用する

補足:

- `category_id` は candidate 側の正本とし、items 側では 現状の API の `category` / `shape` を優先する
- items 側へ `category_id` を直ちに導入するかは後続検討とする

---

## 多値項目

item 側と candidate 側では、**API で扱う配列形式** と **DB 保存構造** を分けて考える。

### 現状の item 側

- API / BFF の入出力は `colors` / `seasons` / `tpos` の配列を使う
- 現行 DB は `items.colors` / `items.seasons` / `items.tpos` を JSON で持つ

### 現状の candidate 側

- `purchase_candidate_colors`
- `purchase_candidate_seasons`
- `purchase_candidate_tpos`
- `purchase_candidate_materials`

### 今フェーズの方針

- candidate 側の colors / seasons / tpos / materials は別テーブルで保存する
- item 側の colors / seasons / tpos は現行どおり JSON 保存を維持する
- この DB 構造差は暫定で許容する
- API と `item-draft` では `colors` / `seasons` / `tpos` を配列で統一する
- 正規化テーブルと JSON の相互変換は Laravel 側で吸収し、frontend / BFF に持ち込まない
- purchase_candidates 実装着手のために、items 側 DB 構造の即時移行は前提にしない
- items 側を将来別テーブル化する場合も、API 契約はなるべく維持する

---

## `spec` の扱い

### 目的

purchase candidate 側でも、item と同様に `spec` を持てるようにする。

目的は、実寸を保存することではなく、**形・丈・覆い方・補助属性**を candidate 時点でも保持し、次を改善することである。

- 購入候補同士の比較精度
- item 化時の初期値再現性
- `category / shape / spec` の責務整合
- 将来の比較ロジックやサムネイル描画の拡張

### 分類責務の整理

- `カテゴリ`: アイテムの大分類。最初に選ぶ分類軸として扱う
- `種類`: カテゴリ内の主要分類。ユーザーがカテゴリの次に選ぶ軸として扱う
- `形`: 保存上は独立した分類軸として扱う
- `spec`: 分類の先にある詳細属性として扱い、丈・覆い方・袖・首回り・股上などを含む

補足:

- purchase candidate の画面上は `カテゴリ` と `種類` を主に選択する
- `形` は独立入力としては出さず、選択した種類に対応する分類情報として内部で解決する
- 保存上は item と整合するため `shape` を保持する
- `形` が必要なカテゴリでは、将来的に補助入力として出す余地を残す
- `spec` は分類の続きとして見える位置に置き、`カテゴリ / 種類 / 形` とは役割を分ける
- item / purchase candidate の差異は、分類責務の差ではなく、`shape` を UI で明示入力するか内部解決するかの扱い差として説明する
- `形` が不要な場合は、グレーアウトではなく非表示とする

#### カテゴリ別の第一候補

purchase candidate でも、`形` を出すかどうかの判断原則は item 側とそろえる。  
ただし Phase 1 では `形` を独立 UI に戻さず、種類選択から内部で `shape` を解決する前提を維持する。

| カテゴリ              | `形` の扱い  | purchase candidate での現時点の扱い                                                             |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `tops`                | 条件付き表示 | Phase 1 では独立 UI に戻さず、種類選択から内部解決する。`other` は `shape` 未解決のまま許容する |
| `pants`               | 条件付き表示 | Phase 1 では独立 UI に戻さず、種類選択から内部解決する                                          |
| `skirts`              | 条件付き表示 | Phase 1 では独立 UI に戻さず、種類選択から内部解決する                                          |
| `outerwear`           | 条件付き表示 | Phase 1 では独立 UI に戻さず、種類選択から内部解決する                                          |
| `onepiece_dress`      | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `allinone`            | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `inner`               | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `legwear`             | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `shoes`               | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `bags`                | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `fashion_accessories` | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `swimwear`            | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |
| `kimono`              | 非表示       | 種類から一意に決まるため、内部補完で扱う                                                        |

### `size_details` との責務分離

`size_details` と `spec` は別物として扱う。

- `size_details`: 実寸
  - 例: 肩幅、身幅、着丈、股下、総丈、スカート丈、高さ（H）、幅（W）、マチ（D）
  - `structured` / `custom_fields` ともに `value / min / max / note` を持てる
  - 範囲値や `ヌード寸` / `約` / `後ろ約` などの注記を保持できる
- `spec`: 実寸以外の構造・補助属性
  - 例: tops の sleeve / neck / fit
  - 例: bottoms の `length_type`
  - 例: legwear の `coverage_type`

つまり、`size_details` は実寸、`spec` は分類の先にある詳細属性として役割を分ける。

### 基本方針

- purchase candidate にも `spec` を持たせる方向を第一候補とする
- API shape は item 側とできるだけ揃える
- ただし、初期は item と完全同一の入力負荷にはしない
- 初期は `nullable` とし、未入力を許容する
- item 化時は `spec` を item 作成初期値へそのまま引き継ぐ
- まずは比較や item 化に効くカテゴリから段階的に導入する

### 初期対応カテゴリ

初期は以下を第一候補とする。

- `tops`
- `bottoms`
- `legwear`

理由:

- item 側でも比較的整理されている
- candidate 比較にも効きやすい
- item 化時の再現性に効く

### DB 方針

`purchase_candidates.spec` nullable JSON を第一候補とする。

理由:

- 初期は item 側と同じく JSON で十分である
- category ごとに保持 shape が変わるため、別テーブル化は現時点では過剰である
- 将来 category ごとの spec 構造が広がっても拡張しやすい

### API 方針

purchase candidate の create / update / detail / duplicate / color-variant / item-draft に `spec` を含める。

初期の shape は item 側と揃え、少なくとも以下を扱えるようにする。

```ts
type ItemSpec = {
  tops?: {
    sleeve?: string;
    length?: string;
    neck?: string;
    design?: string;
    fit?: string;
  };
  bottoms?: {
    length_type?: string;
  };
  legwear?: {
    coverage_type?: string;
  };
};
```

補足:

- `shape` は分類軸の正本として扱う
- 旧データ / 旧 item-draft 互換では `spec.tops.shape` 相当の値が残りうるが、これは恒久仕様ではなく旧互換値として扱う
- tops 再導入時も `shape` を分類軸、`spec` をその先の詳細属性として扱う
- 現行の request / restore / submit / response / item-draft は `shape` を分類軸の正本として扱い、`spec.tops.shape` を正規ルートとしては参照しない
- backend に `spec.tops.shape` が送られてきても、保存値や response / item-draft の正本としては扱わない
- 古いローカル下書きが残っている場合は、必要に応じて手動クリアを前提とする
- 互換 shape の扱いは、実装修正時に item 側との整合を見ながら段階的に縮退する

### 初期の入力方針

#### `tops`

Phase 2-1 では、tops spec の詳細属性だけを入力候補として出してよい。  
`shape` は `category_id` からの内部解決を基本値としつつ、複数 shape がある分類だけ独立 UI で上書き保存する。

- sleeve
- length
- neck
- design
- fit

補足:

- すべて任意
- `tops / other` は `shape=""` を許容し、spec も無理に補わない
- `spec.tops.shape` は復活させない
- length
- design

ただし、最初から全項目を必須にはしない。

#### `bottoms`

`length_type` を入力可能にする。

#### `legwear`

`coverage_type` を入力可能にする。

### 必須化方針

初期は `nullable` とし、必須化しない。

理由:

- 既存 candidate に `spec` がない
- 候補時点では分からないこともある
- 入力負荷を上げすぎると purchase candidate 登録が重くなる

将来的に、item 側との整合や運用実績を見て、一部カテゴリのみ必須化を再判断する。

### item 化時の扱い

item 化時は、candidate 側の `spec` を item 作成初期値へそのまま渡す。

- candidate に `spec` があれば item-draft に含める
- item 作成画面で確認・修正できるようにする
- 未入力なら `null` を許容する
- item 保存時に item 側 `spec` へ保存する

### duplicate / color-variant の扱い

#### 通常複製

`spec` を引き継ぐ。

理由:
同じ候補を複製する導線のため、形・丈・覆い方などの商品構造情報も初期値として引き継ぐのが自然である。

#### 色違い追加

`spec` も引き継ぐ。

理由:
色違いであっても、同一商品の候補であれば形・丈・覆い方は共通であることが多いため。
色違い追加で空にするのは `colors` / `custom_label` 側であり、`spec` まで空にする必要は薄い。

### 表示方針

- 一覧では初期段階では表示しなくてよい
- 詳細ではカテゴリによって必要なら補助表示してよい
- まずは保存・item 化引き継ぎを優先し、表示強化は後続対応とする

### item 側コードとの共通化観点

purchase candidate 側に `spec` を入れる場合も、item 側と別実装を増やしすぎないことを重視する。

方針:

- 可能な限り item 側の `spec` 型、入力定義、変換 helper を共通利用する
- category / shape ごとの `spec` 入力定義を purchase candidate 専用に二重管理しない
- item 側で既に持っている `spec` 関連の型・入力定義・validation helper があれば、purchase candidate 側でも流用を第一候補とする
- ただし、purchase candidate では入力負荷を抑えるため、UI は item 側より簡略化してよい
- 「保存 shape は揃えるが、UI の出し方は必要に応じて変える」を基本方針とする
- item / purchase candidate の違いは「分類責務が違う」ためではなく、「shape を UI で明示入力するか、内部解決するかの扱い差」として扱う
- purchase candidate は軽量入力を維持しつつ、複数 shape がある分類だけ `形` を独立 UI として表示する

### 段階分け

Phase 1:

- `purchase_candidates.spec` を追加する
- create / update / detail / duplicate / color-variant / item-draft で扱う
- 初期対象は `bottoms` / `legwear`
- 初期は `nullable` で運用する
- item 化時に `spec` を引き継ぐ
- item 側コードとの共通化は、型・入力定義・helper の流用を第一候補とする

Phase 2-1:

- tops spec の詳細属性を create / update / detail / duplicate / color-variant / item-draft で扱う
- tops の `shape` は `shirt_blouse` のように複数候補がある分類だけ UI で選べるようにする
- tops spec はすべて任意とし、purchase candidate の入力負荷は抑えたままにする
- `spec.tops.shape` は旧互換値としても復活させない

Phase 2-2:

- 詳細表示で `spec` を必要に応じて補助表示する
- `bottoms` / `legwear` の一部を必須化するか再判断する

Phase 3:

- item 側との仕様差分をさらに整理する
- category ごとの `spec` UI を洗練する
- 比較ロジックやサムネイル描画に活用する

### 必須/任意ルール

purchase candidate の spec 必須/任意ルールは、最終的に item 側の現行ルールを起点に共通化する。  
ただし purchase candidate は段階導入中のため、Phase 1 では `nullable` を維持し、未入力を許容する。

#### 基本方針

- 最終的な基準ルールは item 側の現行 spec ルールを起点にする
- purchase candidate 側は、実装段階に応じて適用範囲と必須化時期を分ける
- 現時点では「共通ルールに揃える方針」と「Phase 差分として未入力許容を残す方針」を併記する

#### item 側ルールを起点にした最終方針

- tops
  - `sleeve`: 任意
  - `length`: 任意
  - `neck`: 任意
  - `design`: 任意
  - `fit`: 任意

- bottoms / pants
  - `length_type`: 必須
  - `rise_type`: 任意

- skirts
  - `length_type`: 必須
  - `material_type`: 任意
  - `design_type`: 任意

- legwear
  - `coverage_type`: 条件付き必須
  - `socks` / `leggings` では必須
  - それ以外では非表示または任意

#### purchase candidate での現時点の扱い

- Phase 1 では、spec は `nullable` とし未入力を許容する
- そのため、item 側で必須の項目であっても purchase candidate では直ちに必須化しない
- 必須表示や validation は、Phase 2 以降で item 側ルールを起点に再判断する

#### 将来の適用候補

- `bottoms.length_type`
- `skirts.length_type`
- `legwear.coverage_type` のうち `socks` / `leggings`

これらは item 側ですでに分類・比較に必要な項目として扱っているため、purchase candidate 側でも将来的な必須化候補とする。

#### 補足

- purchase candidate 側の差異は「正本が違う」ためではなく、「段階導入中のため」として扱う
- tops spec は将来対応時も、直ちに全項目必須とはしない
- 必須化の実装前には、UI 表示・validation・restore・draft 挙動を item 側と照合して再確認する

## 画像テーブル

## `purchase_candidate_images`

### カラム

- `id`
- `purchase_candidate_id`
- `disk`
- `path`
- `original_filename` nullable
- `mime_type` nullable
- `file_size` nullable
- `sort_order`
- `is_primary`
- `created_at`
- `updated_at`

## `item_images`

### カラム

- `id`
- `item_id`
- `disk`
- `path`
- `original_filename` nullable
- `mime_type` nullable
- `file_size` nullable
- `sort_order`
- `is_primary`
- `created_at`
- `updated_at`

---

## 画像保存方針

- Laravel Storage 抽象を使う
- 初期 `disk` は `public`
- DB には `disk` と `path` を保存する
- URL は表示時に生成する
- item / candidate ともに複数画像対応とする
- 上限は **5 枚**
- 一覧表示は `is_primary = true` を優先する
- 初回画像は自動で primary とする
- candidate 画像を item に引き継ぐ場合は、item 保存時に item 用ディレクトリへ物理コピーする
- candidate 側画像を削除しても item 側画像が壊れないことを前提とする
- candidate 画像追加 UI は `ファイルを選択` ボタンと `画像を貼り付け、またはドラッグ＆ドロップ` エリアを分けて提供する
- 一覧では代表画像を表示し、詳細・編集・item draft 確認では画像全体を見やすく表示する

---

## SVG の扱い

- items は、画像があれば画像を優先表示する
- item 画像未登録時のみ、必要に応じて既存 SVG / テキスト補助表示を許可する
- 購入検討は画像主軸とし、SVG は主機能にしない

---

## candidate → item 昇格仕様

## 基本方針

昇格は「変換」ではなく、**item の新規作成** とする。
補足:
色違いグループに属する場合も、item 化は group 全体ではなく現在選択中の purchase candidate 単位で行う。

## 流れ

1. purchase_candidate 詳細で「item に追加」
2. candidate の内容を item 作成画面の初期値として引き継ぐ
3. ユーザーが必要に応じて補正する
4. 保存で `items` を新規作成する

素材・混率は現時点で `docs/specs/items/material-composition.md` に沿って candidate 側まで実装済みとし、`materials[{ part_label, material_name, ratio }]` を detail / create / edit / item-draft で共通利用する。

### 現状の実装

- 1 〜 4 までを実装済み
- `item-draft` から item 作成画面の初期値を生成し、item 新規作成へ流せる
- `purchase_candidate_id` を受けた item 作成時に、Laravel 側で candidate を `purchased` へ更新する
- `converted_item_id` / `converted_at` も同じ transaction 内で保存する

---

## 初期値として引き継ぐ項目

- `name`
- `source_category_id`
- `category`
- `shape`
- `brand_name`
- `purchase_url`
- `memo`
- `size_gender`
- `size_label`
- `size_note`
- `is_rain_ok`
- `colors`
- `seasons`
- `tpos`
- `materials`

---

## 確認・修正前提の項目

- `price`
- `images`
- `purchased_at`
- `size_details`
- `spec`

理由:

- 候補時点と購入後で値がズレやすいため

## item-draft -> item create マッピング

### 基本方針

- candidate 側の正本カテゴリは `category_id` とする
- `item-draft` は現在の `POST /api/items` に合わせ、item 作成画面がそのまま使える初期値 payload を返す
- frontend は `item-draft` を item 作成初期値として使い、`category_id` から `category` / `shape` への変換ロジックを持たない
- `category_id` から `category` / `shape` への解決は、category master を参照できる Laravel 側を正本にする

### マッピング表

| purchase_candidate | item-draft           | item create          | 方針                                                                                                  |
| ------------------ | -------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `category_id`      | `source_category_id` | 直接は送らない       | candidate 側の正本として保持する                                                                      |
| `category_id`      | `category` / `shape` | `category` / `shape` | 現在の item API 互換の値へ Laravel 側で解決する                                                       |
| `name`             | `name`               | `name`               | そのまま引き継ぐ                                                                                      |
| `brand_name`       | `brand_name`         | `brand_name`         | そのまま引き継ぐ                                                                                      |
| `price`            | `price`              | `price`              | 想定価格を初期値として入れるが、保存前に実購入価格として確認する                                      |
| `purchase_url`     | `purchase_url`       | `purchase_url`       | そのまま引き継ぐ                                                                                      |
| `memo`             | `memo`               | `memo`               | 現時点の実装では item 作成画面の初期値としてそのまま引き継ぐ。保存後は candidate と item で同期しない |
| `size_gender`      | `size_gender`        | `size_gender`        | そのまま引き継ぐ                                                                                      |
| `size_label`       | `size_label`         | `size_label`         | そのまま引き継ぐ                                                                                      |
| `size_note`        | `size_note`          | `size_note`          | サイズ感・着用感の補足メモとしてそのまま引き継ぐ                                                      |
| `size_details`     | `size_details`       | `size_details`       | `structured` / `custom_fields` を持つ実寸情報。初期は `null` を許容し、実測後の補完前提とする         |
| `purchased_at`     | `purchased_at`       | `purchased_at`       | 初期は `null` を許容し、購入日入力前提とする                                                          |
| `is_rain_ok`       | `is_rain_ok`         | `is_rain_ok`         | そのまま引き継ぐ                                                                                      |
| `colors`           | `colors`             | `colors`             | API 契約は配列で統一する                                                                              |
| `seasons`          | `seasons`            | `seasons`            | API 契約は配列で統一する                                                                              |
| `tpos`             | `tpos`               | `tpos`               | API 契約は配列で統一する                                                                              |
| `images`           | `images`             | item 画像初期値      | 全件引き継ぎ、item 保存時に item 用保存先へ物理コピーして `item_images` として別管理にする            |
| `materials`        | `materials`          | `materials`          | 素材・混率をそのまま引き継ぐ                                                                          |
| `spec`             | `spec`               | `spec`               | candidate 側で十分な情報がない場合は `null` とし、item 作成画面で補完する                             |

### `category_id` と 現在の item API

- `category_id` は category master 側の中分類 ID とする
- `item-draft` response では `source_category_id` を保持しつつ、現在の item API 用に `category` と `shape` を返す
- `category_id` から 現在の item API の値を一意に解決できない場合は、item API 拡張か category master 整理を先に行う
- BFF は変換責務を持たず、Laravel が返した `item-draft` をそのまま中継する

### 補足

- `wanted_reason` は candidate 側の検討履歴として残し、item `memo` へ自動結合しない
- `memo` は item 作成画面へ引き継ぐが、item 保存後に candidate と同期しない
- `images` は現在の item create request と別導線でもよいが、item 作成画面初期値としては同時に解釈できる形を維持する
- sale 情報 (`release_date` / `sale_price` / `sale_ends_at` / `discount_ends_at`) は candidate 専用であり、item 側の保存対象にはしない

---

## 画像引き継ぎ仕様

- candidate の登録済み画像は **全件** item 作成時の初期値として引き継ぐ
- `sort_order` と `is_primary` も引き継ぐ
- item 作成画面で画像の削除・追加を許可する
- item 編集画面でも画像の削除・追加を許可する
- candidate 側でも duplicate / color-variant draft を含めて、保存前に代表画像変更と並び替えを行える
- item 側では編集画面で `sort_order` と `is_primary` を更新できる
- item 保存時に candidate 画像ファイルを item 用保存先へ物理コピーし、`item_images` として別管理で確定する
- candidate 側画像と item 側画像は自動同期しない
- 同じ画像レコードを共有しない

理由:

- primary 1 枚のみ引き継ぐ仕様だと、ユーザーに不具合と誤認されやすいため

---

## 状態遷移

## `purchase_candidates`

### 基本遷移

- `considering -> on_hold`
- `considering -> purchased`
- `considering -> dropped`
- `on_hold -> considering`
- `on_hold -> purchased`
- `on_hold -> dropped`
- `dropped -> considering`

### 方針

- `dropped` は「見送り履歴を残す状態」
- DELETE とは別概念
- `purchased` / `dropped` はフィルタで見られるようにする
- `purchased` は item 化済み履歴であり、後から candidate を更新しても item 正本へは反映しない
- 初期一覧では `considering / on_hold` を主表示でよい

### DELETE との違い

- `dropped`: 一度検討した記録を残したい
- DELETE: 登録ミス、重複、記録自体が不要

---

## `items`

### 基本遷移

- `active -> disposed`
- `disposed -> active`

### 既存方針維持

- item を `disposed` にすると関連 active outfit は invalid 化する既存方針を維持する

---

## API 方針

## `purchase_candidates`

### 一覧

`GET /api/purchase-candidates`

#### response

一覧 response の正本は `purchaseCandidateEntries` とする。

`purchaseCandidateEntries` は以下のいずれかを持つ。

```ts
type PurchaseCandidateListEntry =
  | {
      type: "single";
      candidate: PurchaseCandidateListItem;
    }
  | {
      type: "group";
      group_id: number;
      representative_candidate_id: number;
      candidates: PurchaseCandidateListItem[];
    };
```

pagination meta は表示カード単位で扱う。

- `meta.total`: filter 後の表示カード数
- `meta.per_page`: 1ページあたりの表示カード数
- `meta.current_page` / `meta.page`: 表示カード単位の現在ページ
- `meta.lastPage`: 表示カード数から算出した最終ページ
- `meta.totalAll`: filter 前の全 candidate 件数、または空状態判定用の全 candidate 件数

旧 `purchaseCandidates` 配列は一覧 response の正本とはしない。

#### クエリ候補

- `page`
- `keyword`
- `status`
- `priority`
- `category`
- `subcategory`
- `brand`
- `sort`

### 詳細

`GET /api/purchase-candidates/{id}`

### 作成

`POST /api/purchase-candidates`

### 更新

`PUT /api/purchase-candidates/{id}`

### 削除

`DELETE /api/purchase-candidates/{id}`

---

## candidate 画像

### 追加

`POST /api/purchase-candidates/{id}/images`

### 削除

`DELETE /api/purchase-candidates/{id}/images/{imageId}`

### 並び・代表画像

現時点では画像追加時の `sort_order` / `is_primary` と削除時の primary 繰り上げを API 側で扱う。
candidate 側でも、編集画面と duplicate / color-variant draft で `sort_order` / `is_primary` を編集できる。

---

## item draft 生成

### 推奨 API

`POST /api/purchase-candidates/{id}/item-draft`

### 返却したい内容

- `item_draft`
- `candidate_summary`
- `images`

### 役割

保存済み item を直接作る API ではなく、item 作成画面用の **初期値生成 API** とする。

---

## item 側

### 既存 item 作成

`POST /api/items`

現時点の実装では、`purchase_candidate_id` を受けた item 作成時に、Laravel 側で次を同じ transaction 内にまとめる。

- item 作成
- candidate 由来画像の item 用保存先への物理コピー
- candidate の `status` を `purchased` に更新
- `converted_item_id` / `converted_at` の保存

方針:

- 責務は Laravel 側へ寄せる
- 二重管理しない

### item 画像

- `POST /api/items/{id}/images`
- `DELETE /api/items/{id}/images/{imageId}`
- `PUT /api/items/{id}` の `images` payload による並び替え / 代表画像切り替え

### 後続対応の関連仕様

- ホームでの sale 要約表示

---

## 画面要件

## purchase_candidates 一覧

一覧は「確認・遷移」を主責務とし、詳細への導線を主導線とする。  
編集は詳細画面から行うことを基本とし、一覧では編集操作を主導線にしない。
補足:
色違い候補が group 化されている場合の一覧上の束ね表示ルールは `## 色違いグループ` を参照する。

### 表示項目

- 代表画像
- 名前
- カテゴリ
- status
- priority
- 想定価格
- sale 情報（設定時のみ補助表示）
- wanted_reason 要約
- item 化済みか

### フィルタ

- status
- priority
- category
- subcategory
- brand
- sort
- keyword

補足:

- category は item 側の親カテゴリを指定する
- subcategory は category 選択後だけ有効にし、current 語彙の内部値で指定する
- UI 表示は current の表示名を使い、旧語彙は検索 UI に直接出さない
- subcategory は単独 filter としては扱わず、category 未指定時は送信しない
- category 変更時に現在の subcategory が不整合ならクリアする
- other は検索対象に含めるが、UI 上は候補の最後に置く
- backend では category / subcategory を category master の `category_id` へ解決して絞り込む
- category / subcategory / brand / sort / keyword / status / priority / page は URL query と同期する
- keyword / brand は debounce 付き即時反映、select 系は即時反映とする
- page 以外の条件変更時は page を 1 に戻す
- 個別解除と全体の条件クリア導線を用意する

### 導線

- 画像または主要情報領域の押下で詳細へ遷移できること
- 一覧内のリンクは詳細遷移を優先し、編集導線は詳細画面側を主に使うこと

---

## purchase_candidate 詳細

### 表示項目

- 基本情報
- 複数画像
- wanted_reason
- memo
- サイズ情報
- 雨対応
- sale 情報
- 手持ち比較結果
- item に追加ボタン
- 複製ボタン
- 保留 / 見送り操作
- `purchased` 時の補助説明
- 同グループ候補一覧（purchased を含む）

---

## purchase_candidate 作成 / 編集

補足:
色違い追加は通常の新規作成とは別に、詳細画面から既存 candidate を初期値とする導線で扱う。

### セクション構成

モバイル順を正本とし、現時点の第一候補は以下とする。

1. 基本情報
2. 分類
3. 購入情報
4. 色
5. 利用条件・特性
6. サイズ・実寸
7. 素材・混率
8. 補足情報
9. 画像
10. 送信 actions

補足:

- `購入情報` と `補足情報` は分けて扱う
- `wanted_reason` は購入判断理由として `購入情報` に含める
- `memo` は購入情報に限定しない自由入力の補足情報として `補足情報` に含める
- `memo` と `wanted_reason` は役割が異なる

### 入力項目

- 基本情報
  - 名前
  - priority
  - ブランド
- 分類
  - カテゴリ
- 購入情報
  - 発売日
  - 想定価格
  - セール価格
  - 販売終了日
  - セール終了日
  - セール終了予定
  - 購入 URL
  - wanted_reason
- 色
  - メインカラー
  - サブカラー
  - カスタムカラー入力
- 利用条件・特性
  - 季節
  - TPO
  - 雨対応
  - 透け感
- サイズ・実寸
  - サイズ情報
- 素材・混率
- 補足情報
  - memo
- 画像
  - 画像複数枚

### 入力制御

- `name` / `category_id` / メインカラーは必須項目として UI 上で明示する
- 色は preset に加えて custom color code を入力可能とする
- `オール` と個別季節は同時選択させず、どちらか一方だけを保持する
- `sale_ends_at` / `discount_ends_at` は `datetime-local` ではなく、日付入力と時刻入力に分ける
- `sale_ends_at` / `discount_ends_at` の日付を選んだ時点で、内部値は `YYYY-MM-DDT00:00` とする
- `sale_ends_at` / `discount_ends_at` の時刻入力は、日付未選択時は無効にする
- 編集 / duplicate / color-variant draft では、既存の `sale_ends_at` / `discount_ends_at` 時刻を維持する
- `sale_ends_at` / `discount_ends_at` はリセットボタンで空に戻せるようにし、保存時は `null` 相当で送る
- `purchased` の candidate では `memo` / `wanted_reason` / `priority` / `release_date` / `sale_price` / `sale_ends_at` / `discount_ends_at` / `purchase_url` を編集可とし、その他の項目は編集不可とする
- `purchased` 後も画像追加 / 削除は画像 API で扱える

### `memo` の扱い

- `memo` は自由入力の補足情報とする
- 購入情報に限定しない
- 属性補足・運用メモ・自由記述の受け皿として扱う
- `wanted_reason` は購入判断理由、`memo` は自由入力の補足情報として役割を分ける

---

## item 作成（candidate 由来）

### 初期表示

- candidate 由来の基本情報
- candidate 由来の全画像
- `sort_order` / `is_primary` 反映済み
- 画像の削除・追加が可能
- 画像の並び替えと代表画像変更が可能

### 追加で入力・修正する項目

- 実購入価格
- 購入日
- 実際のサイズ
- `size_details`
- `spec`
- 実物画像への差し替え

---

## 手持ち比較結果

## 前提

比較ロジックは今回は高度化しない。  
ただし、後で拡張しやすい構造にはしておく。

## 初期は欲しい観点

- 重複
- 不足補完
- 合わせやすさ
- 雨対応補完

## 注意

- 購入前 candidate を既存 outfits に直接混ぜない
- 仮コーデ保存は今回やらない
- 比較結果は詳細画面で補助的に出せるようにする

補足:

- 比較ロジックの具体化は後続で別途整理する

---

## 集計追加候補

## 月単位の服飾費

将来集計として追加したい候補。

### やりたいこと

- item の `price` と `purchased_at` を使って月別購入額を出す
- カテゴリ別購入額も見られるようにする
- 購入検討の想定価格との比較も将来的にはできるとよい

### 今回やるべき最低限

- item 側に `purchased_at` を持てるようにする
- `price` の意味を candidate / item で明確に分ける

---

## バリデーション方針

## `purchase_candidates`

- `name`: 必須
- `category_id`: 必須
- `status`: 許可値のみ
- `priority`: default `medium`
- `price`: nullable / numeric / min 0
- `release_date`: nullable / date
- `sale_price`: nullable / integer / min 0
- `sale_ends_at`: nullable / date
- `discount_ends_at`: nullable / date
- `purchase_url`: nullable / URL
- `wanted_reason`: nullable / length 制限
- `size_gender`: nullable / 許可値のみ
- `size_label`: nullable / string
- `size_note`: nullable / length 制限
- `size_details`: nullable / JSON
- `is_rain_ok`: boolean
- `materials`: nullable / array
- `materials.*.part_label`: required / string
- `materials.*.material_name`: required / string
- `materials.*.ratio`: required / integer / 1〜100
- `colors`: array / min 1
- main color は必須
- `colors.*.custom_label`: nullable / string / max 50
- `custom_label` は main color のみ保存対象とする
- sub color の `custom_label` は保存しない

## `items`

- 既存 validation に加えて以下を追加する
- `brand_name`: nullable
- `price`: nullable / numeric / min 0
- `purchase_url`: nullable / URL
- `purchased_at`: nullable / date
- `size_gender`: nullable / 許可値のみ
- `size_label`: nullable / string
- `size_note`: nullable / length 制限
- `size_details`: nullable / JSON

## images

- mime: `jpeg / png / webp`
- 最大サイズ: `5MB`
- 最大枚数: `5`
- 画像は任意

---

## テスト観点

## `purchase_candidates`

- 自分の候補のみ見える
- status / priority で絞れる
- 作成できる
- 更新できる
- 削除できる
- dropped にできる
- dropped から considering に戻せる
- purchased にできる

## candidate 画像

- 複数枚登録できる
- primary が 1 件になる
- `sort_order` が維持される
- 上限超過でエラーになる
- candidate 複製時に画像を新 candidate 用保存先へ物理コピーできる

## candidate -> item

- item draft を生成できる
- 候補情報が初期値に入る
- 全画像が初期値に入る
- `sort_order` / `is_primary` が引き継がれる
- `materials` が初期値に入る

### 現状の実装

- item draft を生成できる
- 候補情報が初期値に入る
- 全画像が初期値に入る
- `sort_order` / `is_primary` が引き継がれる
- `materials` が初期値に入る
- item 保存後に candidate が `purchased` になる
- `converted_item_id` / `converted_at` が保存される

## item

- `brand_name / price / purchase_url / purchased_at` を保存できる
- サイズ情報を保存できる
- 複数画像を保存できる
- 現在は item 作成時に candidate 由来画像を `item_images` として保存できる
- item 作成 / 編集画面で画像の追加・削除ができる
- 保存後の item 画像は candidate 側と自動同期しない

---

## 命名・値の推奨

## `size_gender`

推奨内部値:

- `women`
- `men`
- `unisex`

## `priority`

- `high`
- `medium`
- `low`

## `purchase_candidates.status`

- `considering`
- `on_hold`
- `purchased`
- `dropped`

## `items.status`

- `active`
- `disposed`

---

## docs 更新対象

- `docs/api/openapi.yaml`
- `docs/api/api-overview.md`
- `docs/data/database.md`
- `docs/project/implementation-notes.md`

---

## 今後の追加検討ポイント

- 比較ロジックの具体化
- 購入検討と手持ち item の比較 UI
- ホームでの sale 候補の要約表示
- 月次服飾費集計の詳細
- item 側 colors への main color `custom_label` 引き継ぎ

---

## 固定実寸

- purchase candidate の固定実寸は item と同じ resolver を使う
- 正本は `web/src/lib/items/size-details.ts`
- `category + shape` で固定実寸を解決し、対応がない場合は自由項目の実寸で補う
- 現在の対応範囲は [items/size-details.md](./items/size-details.md) を参照
- 実寸値は `value / min / max / note` を持てる
- `skirts_other` は item 側の `skirts / other` と同じく shape なしで扱う
- `skirts_other` でも `spec.skirt` は使用可
- `skirts_other` は固定実寸を出さず、必要なら自由項目の実寸で補う
- 複数 shape がある分類では `形` select を表示し、保存済み `shape` を purchase candidate の正本として保持する
- 現在の対象は `skirts / skirt`、`outerwear / jacket`、`outerwear / coat`、pants 系、`tops / shirt_blouse`
- shape 候補が 1 つ以下の分類では `形` は表示せず、response / item-draft では `category_id` から解決した shape を返す
- `item-draft` と item 化では、保存済み `shape` があればそれを優先し、なければ従来どおり `category_id` からの内部解決値を使う
- `note` は `ヌード寸` / `約` / `後ろ約` などの補足注記で、表示時は値の前に付ける
- `透け感` は item 側と同じ `none / slight / high` を内部値として保存する任意項目とする
- detail では `透け感` に値がある場合のみ表示し、未設定時は項目自体を表示しない
- item-draft / item 化でも `透け感` をそのまま引き継ぐ

---

## 複数サイズ候補

current:

- purchase candidate は最大 2 つのサイズ候補を持てる
- 第1候補は `size_label` / `size_note` / `size_details` を使う
- 第2候補は `alternate_size_label` / `alternate_size_note` / `alternate_size_details` を使う
- `size_gender` は 2 候補で共通とする
- 2 候補が入っている場合だけ、フォーム上で候補全体を入れ替える swap UI を出す
- フォームの `サイズ・実寸` では `サイズ候補1` / `サイズ候補2` をタブで切り替えて編集する
- タブにはサイズ表記と `入力あり` / `未入力` を表示し、候補の入力状態が分かるようにする
- detail の `サイズ・実寸` も同じ候補単位でタブ表示し、選択中候補だけを表示する
- detail のサイズ比較では、購入検討側サイズ候補は select を出さず、各候補を列で並べて item と比較する
- detail のサイズ比較表では、購入検討側の列ラベルはサイズ表記のみを使い、手持ち側は `手持ち（サイズ表記）` で表示する

planned:

item-draft / item 化:

- サイズ候補が 1 つだけなら、その候補をそのまま item-draft に使う
- サイズ候補が 2 つある場合は、detail 画面の item 化導線で `primary / secondary` を選ばせる
- 選んだ候補の `size_label` / `size_note` / `size_details` だけを item-draft に含める
- item 側は単一サイズ前提のままなので、第2候補は item へは引き継がない

import / export:

- backup / restore では `alternate_size_label` / `alternate_size_note` / `alternate_size_details` も対象に含める

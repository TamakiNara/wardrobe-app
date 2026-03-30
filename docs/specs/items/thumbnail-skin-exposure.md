# Thumbnail Skin Exposure Specification

## 目的

本仕様は、Wardrobe App における **サムネイル用の肌見え表現基盤** を定義する。  
対象は、以下の 3 つである。

- item サムネイル
- outfit サムネイル
- wear log サムネイル

本仕様の目的は、**ボトムス丈・レッグウェア・肌色設定を組み合わせて、脚の見え方を一貫したルールで表現できるようにすること** である。

---

## 概要

肌見え表現は、見た目の比率を DB に直接保存するのではなく、**分類値を保存し、描画時に見え方を計算する** 方針とする。

基本構造は次のとおり。

- ボトムスは「脚の見えるベース範囲」を決める
- レッグウェアは「見え方の補正」を担う
- 肌色は user settings の値を使う
- item 単体では「素の見え方」を表す
- outfit / wear log ではボトムス・レッグウェア・肌色を合成して最終表現する

### default preview

default preview は、category 未選択または shape 未確定時に用いる汎用プレビューとする。
ベース形状はメインカラーの角丸四角とし、サブカラーが設定されている場合のみ右下に控えめな斜め帯を表示してサブカラーの存在を示す。  
サブカラー未設定時はメインカラー単色表示とし、この斜め帯は汎用的な二色指定の簡易表現として扱う。  
shape 固有の切替位置や構造を表すものではなく、lower-body preview のサブカラー表現とは同一ルールとして扱わない。  
実装上は、面積・角度・境界線の有無を微調整してよいが、主張しすぎないことを優先する。

---

## 背景

ボトムス単体では、脚の見え方は確定しない。  
同じ `mini` でも、素足・ソックス・ストッキング・タイツ・レギンスで見え方は変わる。  
そのため、`skin_visibility_ratio` のような直接割合を item に保存すると、outfit / wear log 表現で破綻しやすい。

また、サムネイルで必要なのは厳密な人体比率ではなく、**視覚的に一貫した簡易表現** である。  
このため、本仕様では「詳細数値」ではなく「分類値 + 変換ロジック」を採用する。

---

## 位置づけ

- item 詳細属性 (`spec`) の拡張仕様
- settings / preferences の拡張候補
- サムネイル描画仕様
- outfit / wear log の合成表示仕様
- 検索条件や分析指標ではなく、まずは表示専用の基盤

---

## current / planned / 要再判断

### current

- tops については `spec.tops` を持つ設計がある
- `spec.bottoms.length_type` を保存・取得・item 画面で表示できる
- `spec.legwear.coverage_type` を保存・取得・item 画面で表示できる
- `skinTonePreset` を `user_preferences` に保存できる
- item サムネイルでは、`skinTonePreset` を使って lower-body preview を表示できる
- item 一覧と item 詳細は同じ item サムネイル描画ロジックを使う
- outfit サムネイルでは、representative bottoms / representative legwear / `skinTonePreset` を使った lower-body preview を表示できる
- 開発用 preview 詳細は feature flag で切り替え可能
- item / outfit / wear log にサムネイル表示の責務がある
- bottoms は lower-body preview のベース範囲を決めるため、item の作成 / 編集時に `spec.bottoms.length_type` を必須とする
- legwear は lower-body preview の補正情報として扱い、item の作成 / 編集時は `socks` / `leggings` のみ `spec.legwear.coverage_type` を必須とする
- `tights` / `stockings` は今回の必須化対象外で、固定値の自動補完を維持する
- 旧データ互換として、描画側では bottoms の欠落 / 無効値を `full`、legwear の欠落 / 判定不能を full-length legwear 表現として扱う
- representative selection は valid spec を優先し、`tights` / `stockings` は `coverage_type` 未設定でも representative legwear 候補に残す
- lower-body の重ね順は legwear を先、その上に bottoms を重ねる
- wear log サムネイルは `wear_log_items` を正本として扱う
- item 単体では `onepiece_allinone`（shape は `onepiece` / `allinone`）も non-lower-body 系の共通四角文法で扱い、outfit 側は `onepiece_allinone` 専用 mode で最小限の合成を持つ
- current の outfit サムネイルでは、`onepiece + bottoms` のみ `onepiece_allinone` 専用 mode へ寄せて主レイヤー + 裾見せ補助レイヤーで簡略表示し、`allinone + bottoms` は通常レイアウトを維持する
- outfit サムネイルでは、従来 `legwear` を色帯レイアウトの `others` へも流していたが、current では lower-body 専用責務へ寄せている

### planned

- wear log サムネイルでの合成表現は後続フェーズで整理する
- `onepiece_allinone` を representative bottoms 判定対象へ含める場合の別ルールを整理する
- tights / stockings のサブカラー表現を固定する
- wear log へ `onepiece_allinone` の重なり順ルールを広げる
- `onepiece_allinone` 後続整理でも `legwear = lower-body 専用` の前提を維持し、wear log へ同じ責務分離をどう広げるかを整理する

### 要再判断

- 一覧の極小サイズで微差が見えにくい場合の簡略化
- ここでいう「極小サイズ」は画面全体の breakpoint ではなく、一覧やモーダルで使う小さい thumbnail variant を指す
- tights / stockings のサブカラー表現
- `onepiece_allinone` 将来対応時の別ルール
- `bottom_length_type` から描画割合への変換テーブルの最終値
- `wear_log_items` 内でボトムス / レッグウェア候補が複数ある場合の優先順位
- 透け感や厚みを将来どこまで表現するか
- `onepiece_allinone` と bottoms の併用を current でどう扱うか、およびサムネイル上でどこまで想定外組み合わせを簡略化するか

---

## 基本方針

### 1. 肌見え割合を DB に直接保存しない

`skin_visibility_ratio` のような直接値は持たない。  
item 側には分類値のみを保存し、描画時に見え方へ変換する。

### 2. ボトムスはベース範囲を決める

ボトムスは「どこまで脚が見える可能性があるか」を決める役割を持つ。  
この段階では、レッグウェア補正前のベース表現を扱う。

### 3. レッグウェアは補正側とする

レッグウェアは、ボトムスで決まる脚の見え方に対して補正を加える。  
ボトムスとレッグウェアを同列には扱わない。

### 4. 肌色は設定値を使う

肌色は item 側の属性ではなく、**ユーザー設定** として扱う。  
同じ outfit でも、ユーザー設定に応じて肌色が変わることを許容する。

### 5. item 単体と outfit / wear log で責務を分ける

- item 単体: 素の見え方
- outfit / wear log: 合成後の最終的な見え方

---

## データ設計方針

### `spec.bottoms.length_type`

### 目的

ボトムス丈から、脚の見えるベース範囲を決める。

### 保存場所

- `spec.bottoms.length_type`

### 初期分類案

- `mini`
- `knee`
- `midi`
- `ankle`
- `full`

### 方針

- スカート / パンツ共通で使う
- 初期版は細かくしすぎず、サムネイル表現に十分な 5 段階とする
- 比率値ではなく分類値として保存する

### JSON 例

```json
{
  "bottoms": {
    "length_type": "midi"
  }
}
```

---

### `spec.legwear.coverage_type`

### 目的

レッグウェアによる脚の見え方補正を表現する。

### 保存場所

- `spec.legwear.coverage_type`
- Phase 1 の current UI では `legwear` category の item に対して扱う

### 初期分類案

- `ankle_socks`
- `crew_socks`
- `knee_socks`
- `over_knee`
- `stockings`
- `tights`
- `leggings_cropped`
- `leggings_full`

### 方針

- category は `legwear` を独立で持つ
- shape は `socks / stockings / tights / leggings` の粗い分類に留める
- `stockings` と `tights` は分ける
- `leggings` は legwear 側で扱う
- レッグウェアなしは item 未登録で表現し、`none` は値として持たない

### JSON 例

```json
{
  "legwear": {
    "coverage_type": "tights"
  }
}
```

---

### `skinTonePreset`

### 目的

肌色をユーザー設定として管理し、サムネイル描画に使う。

### 保存場所

- settings / preferences 側

### 内部値候補

- `pink_light`
- `pink_medium`
- `pink_deep`
- `neutral_light`
- `neutral_medium`
- `neutral_deep`
- `yellow_light`
- `yellow_medium`
- `yellow_deep`

### 初期値

- `neutral_medium`

### 表示名候補

- ピンク寄り・明るめ
- ピンク寄り・標準
- ピンク寄り・濃いめ
- ニュートラル・明るめ
- ニュートラル・標準
- ニュートラル・濃いめ
- イエロー寄り・明るめ
- イエロー寄り・標準
- イエロー寄り・濃いめ

### 方針

- 初期版はプリセット選択式
- カスタム色入力は持たない
- preset ID → hex 変換は描画側で行う

### current preset

- `pink_light` → `#F2D9C9`
- `pink_medium` → `#EDC6B5`
- `pink_deep` → `#D6A489`
- `neutral_light` → `#F5D9BF`
- `neutral_medium` → `#F1C7A6`
- `neutral_deep` → `#C78F67`
- `yellow_light` → `#F3DFC0`
- `yellow_medium` → `#E9C29B`
- `yellow_deep` → `#C98D5E`

---

## ボトムス丈の基準値

ボトムス丈は、脚の見えるベース範囲を決める。

### 参考ベース値

- `mini` → `1.00`
- `knee` → `0.70`
- `midi` → `0.45`
- `ankle` → `0.20`
- `full` → `0.00`

### 注意

この値は **描画用の内部基準** であり、DB 保存値ではない。  
また、最終的な見え方はレッグウェア補正後に決まるため、ボトムス単体で確定値として扱わない。

---

## レッグウェア補正ルール

### 基本方針

補正は一律の `coverage_ratio` ではなく、**補正モードごとに描画処理を分ける**。

### 補正分類

- socks 系: 位置補正
- leggings 系: 位置補正
- stockings: 透明度補正
- tights: 完全被覆

---

## socks 系

### 対象

- `ankle_socks`
- `crew_socks`
- `knee_socks`
- `over_knee`

### 方針

**下側から覆う** 補正とする。

### 解釈

- 足首側 / 足元側から露出範囲を削る
- 肌が見える位置は上側に寄る

---

## leggings 系

### 対象

- `leggings_cropped`
- `leggings_full`

### 方針

**上側から覆う** 補正とする。

### 解釈

- 太もも側 / 上側から露出範囲を削る
- 肌が見える位置は下側に残る

### 補足

以前の「下側から削る」整理は誤りとし、本仕様では採用しない。

---

## stockings

### 方針

**肌色を消さない**。  
肌色レイヤーの上に、ストッキング色の半透明レイヤーを重ねる表現とする。

### 表現

- まず肌色を描く
- その上にストッキング色の半透明レイヤーを重ねる

### 初期案

- overlay color: 固定のグレージュ系
- alpha: `0.35` 前後

---

## tights

### 方針

**肌色なし** とする。

### 表現

- 肌色レイヤーを描かない
- 露出部に見える範囲も、タイツ色で表現する

### 補足

stockings のような半透明レイヤーにはしない。

---

## item サムネイルでの扱い

### ボトムス item

- `spec.bottoms.length_type` に応じて、脚の見えるベース範囲を表現する
- レッグウェア補正は考慮しない
- item 単体では「素足前提の基礎形」として扱う

### レッグウェア item

- `spec.legwear.coverage_type` に応じて、覆い方の素の表現を持つ
- ボトムスとの最終合成までは行わない

### non-lower-body item

- item SVG は画像がない場合の代替表現として、non-lower-body 系カテゴリを角丸四角ベースの簡潔な記号化へ揃える
- `tops` / `outer` / `onepiece_allinone` / `inner` / `shoes` / `accessories` は shape ごとの個別 SVG を使わず、カテゴリ単位の共通表現で描く
- メインカラーを本体色とし、サブカラーがある場合のみ補助的な水平ラインで存在を示す
- shoes だけは例外として、サブカラーラインを下寄りに置き、`メイン / サブ / メイン` の印象になる位置で描く
- tops spec は current では保存・表示に利用するが、item SVG 描画では shape 差分の判断に使わない
- lower-body 系と outfit 側は item と責務が異なるため、既存の lower-body / 合成ルールを維持する

### lower-body preview のサブカラー

- lower-body preview の主色はメインカラーとする
- サブカラーは、肌に近い側の補助アクセントラインとしてのみ使用する
- 基本構成は `メイン / サブ / メイン` とする
- サブカラー未設定時はメインカラーへフォールバックする
- 位置や太さは原則共通ルールとし、必要最小限のみ shape 別微調整を許容する
- サブカラーは実際の服の全面配色再現ではなく、肌見え境界の視認性補助を目的とする

#### 適用対象

- bottoms
- socks
- leggings

#### 補足

- socks は現在の境界線位置にアクセントラインを置く
- leggings は bottoms と同様の考え方で扱う
- tights / stockings は別ルール検討対象とし、本ルールの固定対象には含めない

### 方針

item サムネイルは、**組み合わせ前提の最終見え方を出さない**。
outfit / wear log 側の合成で初めて、最終的な脚の見え方を表現する。
current では `skinTonePreset` を使い、item 単体の差分だけを表現する。

---

## outfit / wear log サムネイルでの扱い

### 合成に使う情報

- ボトムスの `length_type`
- レッグウェアの `coverage_type`
- ユーザー設定の `skinTonePreset`

### 基本ロジック

1. `bottom_length_type` から露出可能な脚領域を作る
2. legwear がなければ、そのまま肌色で描画する
3. legwear がある場合
   - socks → 下側から覆う
   - leggings → 上側から覆う
   - stockings → 肌色の上に半透明レイヤー
   - tights → 肌色なしでタイツ色
4. 最終的な脚の見え方を SVG に反映する

### outfit サムネイル

- outfit サムネイルは、既存 thumbnail レイアウトを正本とする
- lower-body preview は、既存 thumbnail のボトムス表示領域の中で再計算して描画する
- outfit thumbnail 全体のレイアウトは Phase 2-3 では変更しない
- lower-body preview の描画ルールは item 側の current ルールを再利用する
- outfit 側は、representative bottoms / representative legwear の選定と表示可否判定を主責務とする
- `legwear` は outfit 色帯レイアウトの `others` には含めず、lower-body preview の representative legwear 選定と合成にのみ参加させる

#### representative bottoms

1. outfit 表示対象 item から category = bottoms の item を抽出する
2. `outfit_items.sort_order` 昇順で並べる
3. `spec.bottoms.length_type` が有効な最初の item を採用する
4. 該当なしの場合は representative bottoms なしとする

#### representative legwear

1. outfit 表示対象 item から category = legwear の item を抽出する
2. `outfit_items.sort_order` 昇順で並べる
3. `spec.legwear.coverage_type` が有効な最初の item を採用する
4. 有効値がなくても、`tights` / `stockings` は未設定のまま candidate に残す
5. 該当なしの場合は representative legwear なしとする

#### 表示ルール

- representative bottoms がある場合のみ lower-body preview を表示する
- representative bottoms がない場合は lower-body preview を表示しない
- representative legwear がない場合は bottoms のみで描画する
- representative item の先頭候補に spec 不足がある場合は、同カテゴリ内の次候補へフォールバックする
- representative legwear が欠落 / 判定不能な場合でも、描画側では full-length legwear 表現として扱う

#### レイアウトルール

- lower-body preview は既存ボトムス表示領域を viewport とみなして描画する
- 配置基準は下端合わせとする
- 一覧 / 詳細で描画ロジックは共通とし、サイズ差のみ許容する

### wear log サムネイル

- `wear_log_items` を正本とする
- `source_outfit_id` は補助情報であり、最終描画正本にはしない
- current では wear log 専用の `onepiece_allinone` mode を `onepiece + bottoms` に限って持ち、`allinone + bottoms` は `standard` mode を維持する
- current では representative bottoms / legwear を `wear_log_items` から選び、representative bottoms がある場合のみ lower-body preview を表示する
- current では `legwear` を `others` へ流さず、lower-body preview 専用責務として扱う
- current では skin tone は wear log API payload に重複保存せず、settings の `skinTonePreset` を web 側で取得して lower-body preview と `onepiece_allinone` lower-body preview の描画へ渡す
- current の wear log 専用 mode では、`tops` と `onepiece_allinone` の上下は `sort_order` 正本で解決する
- outfit thumbnail の current で確定している `tops` と `onepiece_allinone` の上下は `sort_order` 正本、という責務分離だけを wear log 後続整理の前提にする
- wear log 側では outfit item の並びや representative 結果を流用せず、`wear_log_items` から描画用の代表候補と mode を再判定する前提で整理する
- Phase 2-3 では outfit サムネイルを優先し、wear log 側の representative 選定ルール詳細は後続フェーズで整理する
- wear log 専用 mode を導入する場合も、`onepiece_allinone` 判定は `wear_log_items` 内の category / shape / `sort_order` を正本にし、source outfit 側の mode は流用しない

### onepiece_allinone 系の扱い整理

#### current

- item 単体では、`onepiece_allinone` (`onepiece` / `allinone`) も non-lower-body 系カテゴリとして角丸四角ベースの共通 SVG を使う
- outfit サムネイルの current では、`bottoms` がない `onepiece_allinone` と `onepiece + bottoms` を `onepiece_allinone` 専用 mode の対象にし、`allinone + bottoms` は通常レイアウトへ残す
- tops と `onepiece_allinone` が同時にある場合は、`sort_order` の大きい item を上側レイヤーとして描く
- `onepiece` は固定の裾位置を持つ簡略ルールで lower-body preview を下側に出し、`allinone` は full 扱いで lower-body を見せない
- `onepiece + bottoms` は組み合わせ自体を許容し、current の outfit サムネイルでは `onepiece` を全高の主レイヤー、`bottoms` を裾から少し見える lower-body 補助レイヤーとして簡略表示する
- `allinone + bottoms` は current では専用簡略化へ寄せず、通常レイアウトを維持する
- `onepiece + bottoms + legwear` では `legwear` は引き続き lower-body preview 専用で扱い、`others` へは戻さない
- wear log は current では `wear_log_items` 正本の既存レイアウトを維持する

#### planned

- `onepiece + bottoms` は許容する前提を明示し、outfit サムネイルでは `onepiece` を全高の主レイヤー、`bottoms` を裾から少し見える補助レイヤーとして簡略化する
- `onepiece + bottoms + legwear` でも `legwear` は lower-body 専用責務を維持し、`bottoms` と同じ lower-body preview 系の補助表現として扱う
- tops と `onepiece_allinone` の上下関係は引き続き `sort_order` を正本としつつ、`onepiece + bottoms` では `bottoms` を表示簡略化対象として扱う
- `onepiece_allinone` を含む outfit の重なり順ルールを wear log にも広げるが、判定元は source outfit ではなく `wear_log_items` とする
- wear log で専用 mode を導入する場合、`onepiece + bottoms` は `onepiece` を全高主レイヤー、`bottoms` を裾見せ補助レイヤーとして簡略表示する方向で整理する
- tops と `onepiece_allinone` の前後は wear log でも `sort_order` 正本とし、カテゴリ固定優先にはしない
- legwear は `onepiece_allinone` がある場合でも下側レイヤーとして重ね、current lower-body preview の representative legwear 選定と描画ルールを流用する方向で整理する
- outer は current outfit の後段重ね責務を維持し、`onepiece_allinone` があることだけで自動的に消したり最前面固定したりしない
- wear log は今回は実装対象外だが、将来は outfit と同じ「並び順正本」の重なり順ルールを `wear_log_items` にも適用できるようにする
- wear log では outfit current の lower-body preview 責務分離や `onepiece_allinone` の前後判定方針は流用しつつ、mode 判定・representative 選定・ViewModel 組み立ては `wear_log_items` 前提で別途整理する
- 実装順は、1) wear log mode 判定条件の固定、2) dedicated ViewModel で `onepiece + bottoms` を簡略化、3) component renderer の専用分岐、4) unit / integration test の順を想定する

#### 要再判断

- `allinone` と bottoms のような不自然な組み合わせをサムネイルでどう簡略化するか
- `onepiece + bottoms` の裾見せ量や、極小サイズ時にどこまで省略するか
- `onepiece_allinone` と tops の重なりを極小サイズでも読める最小限の図形ルールへどこまで落とすか
- wear log で `onepiece_allinone` 専用 mode を outfit と同一にするか、`wear_log_items` 向けに別の簡略化を持つか
- `allinone + bottoms` を wear log では current 維持に留めるか、将来別 mode へ切り出すか

---

## current / planned の責務整理

### current で崩さない前提

- wear log サムネイルの正本は `wear_log_items`
- outfit サムネイルは current outfit item 構成を正本とする
- item の詳細属性は `spec.*` へ寄せる思想を維持する

### planned で追加するもの

- wear log サムネイルでの lower-body 合成

---

## バリデーション観点

### `spec.bottoms.length_type`

- 許可値のみ
- bottoms 系 item に対してのみ扱う
- item の作成 / 編集では必須とする
- 旧データ互換として、描画側では欠落 / 無効値を `full` 扱いにフォールバックする

### `spec.legwear.coverage_type`

- 許可値のみ
- Phase 1 の current UI では `legwear` category の item に対して扱う
- `shape` は粗い分類、`coverage_type` は詳細分類の正本として扱う
- `shape` ごとに許可される `coverage_type` があり、不整合な組み合わせは validation error にする
- `socks` / `leggings` は item の作成 / 編集で必須とする
- `tights` / `stockings` は今回の必須化対象外とし、固定値の自動補完を許容する
- 旧データ互換として、描画側では欠落 / 無効値を full-length legwear 表現として扱う
- これらの fallback は互換目的であり、新規入力要件を緩めるものではない

### `skinTonePreset`

- 許可値のみ
- 未設定時は `neutral_medium` 相当を既定として扱うかは要再判断

---

## テスト観点

### spec 保存

- `spec.bottoms.length_type` を保存できる
- `spec.legwear.coverage_type` を保存できる
- 許可値以外はエラーになる

### item サムネイル

- ボトムス item が丈分類に応じた基礎表現になる
- レッグウェア item が coverage_type に応じた基礎表現になる

### outfit / wear log サムネイル

- ボトムスだけなら肌色ベースで描画される
- socks は下側から覆う
- leggings は上側から覆う
- stockings は半透明レイヤーになる
- tights は肌色なしになる
- wear log は `wear_log_items` を正本に描画される

---

## 実装時の注意

- `coverage_type` を一律補正値として扱わない
- socks / leggings / stockings / tights は描画処理を分ける
- `skin_visibility_ratio` のような直接割合は持たない
- settings 側の `skinTonePreset` を item 側へ重複保存しない
- outfit / wear log 側で final 合成し、item 単体には最終見え方を持ち込まない
- 将来の検索条件や分析項目には直結させない
- default preview のサブカラー表示と lower-body preview のサブカラー表示を同一ルールとして扱わない
- outfit サムネイル用に item 側と別の色ルールを新設しない
- outfit サムネイルでは既存ボトムス表示領域を利用し、その中で lower-body を再計算する
- representative item 選定は見た目の都合ではなくデータルールに基づいて行う
- representative bottoms は有効な `spec.bottoms.length_type` を持つ item を優先し、全候補が無効な場合のみ描画側フォールバックで `full` 扱いにする
- representative legwear は有効な `spec.legwear.coverage_type` を持つ item を優先し、`tights` / `stockings` は未設定でも候補に残す
- representative legwear が欠落 / 判定不能な場合でも、描画側では full-length legwear 表現として扱う
- lower-body の重ね順は legwear を先、その上に bottoms を重ねる

---

## この仕様で固定する前提

1. 肌見え割合の直接保存はしない
2. ボトムスは脚の見えるベース範囲を決める
3. レッグウェアは補正側として扱う
4. `socks` は下側から覆う
5. `leggings` は上側から覆う
6. `stockings` は半透明レイヤー
7. `tights` は肌色なし
8. item 単体では素の見え方を表す
9. outfit / wear log で最終見え方を合成する

---

## 要再判断に残す論点

- 一覧の極小サイズで微差が見えにくい場合の簡略化
- `bottom_length_type` から描画割合への変換テーブルの最終値
- tights / stockings のサブカラー表現
- `onepiece_allinone` 将来対応時の別ルール
- wear log サムネイルで `wear_log_items` 内の候補をどう優先するか
- 透け感や厚みの追加表現
- 将来、検索条件や分析に使うかどうか

---

## TODO

### onepiece_allinone 系

- Phase 2-3 では representative bottoms 判定対象に含めない
- wear log では `onepiece_allinone` を `others` のままにせず、tops との上下関係を `sort_order` 正本で決める別ルールを後続で整理する
- legwear は下側レイヤーとして流用し、wear log へも同じ考え方を広げる前提で設計を詰める
- `onepiece + bottoms` は許容し、`onepiece` 主体 + `bottoms` 裾見せ補助レイヤーの簡略表現を後続で整理する
- `allinone + bottoms` は想定ケースと想定外ケースの境界を先に整理し、曖昧なまま representative bottoms へ含めない

### tights / stockings のサブカラー

- tights / stockings のサブカラー表現は current では固定しない
- default preview と lower-body preview の役割整理を踏まえて別途検討する

---

## 実装時に更新が想定される関連資料

- `docs/specs/items/thumbnail-skin-exposure.md`（本ファイル）
- `docs/specs/items/thumbnail-current-reference.md`
- `docs/data/database.md`
- `docs/api/openapi.yaml`
- `docs/project/implementation-notes.md`
- item spec 関連の docs
- settings / preferences 関連 docs
- outfit / wear log サムネイル関連 docs

---

## 現時点のまとめ

サムネイル用の肌見え表現は、**分類値 + 描画時合成** を基本とする。  
初期版では、ボトムス丈・レッグウェア・肌色設定を使って、item / outfit / wear log で一貫した脚の見え方を表現する。  
一方で、変換テーブルや preset 色値などの細部はまだ設計余地があるため、今回は `要再判断` に残し、まずは責務分離と表現ルールの正本を整えることを優先する。

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
- item / outfit / wear log にサムネイル表示の責務がある
- wear log サムネイルは `wear_log_items` を正本として扱う

### planned

- `skinTonePreset`
- item サムネイルでの素の見え方表現
- outfit / wear log サムネイルでの合成表現
- ボトムス丈とレッグウェア補正を使った脚の見え方描画

### 要再判断

- `bottom_length_type` から描画割合への変換テーブルの最終値
- `skinTonePreset` の実際の preset hex 値
- `wear_log_items` 内でボトムス / レッグウェア候補が複数ある場合の優先順位
- 初期版で `skinTonePreset` を settings API に含めるか
- 透け感や厚みを将来どこまで表現するか

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

### 方針

item サムネイルは、**組み合わせ前提の最終見え方を出さない**。  
outfit / wear log 側の合成で初めて、最終的な脚の見え方を表現する。

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

- その outfit に含まれるボトムス / レッグウェア構成から合成する
- current outfit item 構成を前提に描画する

### wear log サムネイル

- `wear_log_items` を正本とする
- `source_outfit_id` は補助情報であり、最終描画正本にはしない
- outfit ベースでも、最終的には wear log 側の item 構成から合成する

---

## current / planned の責務整理

### current で崩さない前提

- wear log サムネイルの正本は `wear_log_items`
- outfit サムネイルは current outfit item 構成を正本とする
- item の詳細属性は `spec.*` へ寄せる思想を維持する

### planned で追加するもの

- `spec.bottoms`
- `spec.legwear`
- `skinTonePreset`
- 脚の見え方の描画ロジック
- half-transparent overlay 表現

---

## バリデーション観点

### `spec.bottoms.length_type`

- 許可値のみ
- bottoms 系 item に対してのみ扱う
- 未設定可

### `spec.legwear.coverage_type`

- 許可値のみ
- Phase 1 の current UI では `legwear` category の item に対して扱う
- `shape` は粗い分類、`coverage_type` は詳細分類の正本として扱う
- 未設定可

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

- `bottom_length_type` から描画割合への変換テーブルの最終値
- `skinTonePreset` の preset hex 値
- wear log サムネイルで `wear_log_items` 内の候補をどう優先するか
- `skinTonePreset` を current settings API に含める時期
- 透け感や厚みの追加表現
- 将来、検索条件や分析に使うかどうか

---

## 実装時に更新が想定される関連資料

- `docs/specs/items/thumbnail-skin-exposure.md`（本ファイル）
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

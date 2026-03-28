# Thumbnail Skin Exposure 実装前影響整理メモ

この資料は、`docs/specs/items/thumbnail-skin-exposure.md` を実装へ落とす前に、影響範囲と段階的な実装順を整理するための補助メモです。  
current 実装の正本ではなく、今後の実装依頼や仕様確認の起点として使うことを目的とします。

正本:

- 仕様: `docs/specs/items/thumbnail-skin-exposure.md`
- item spec 関連: `docs/specs/items/`
- API: `docs/api/api-overview.md`
- OpenAPI: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`

---

## 目的

- `spec.bottoms` / `spec.legwear` / `skinTonePreset` / サムネイル描画責務を、どの順序で current 化するか整理する
- item / outfit / wear log で責務を分けたまま、段階導入できる形を明確にする
- 今後の実装依頼時に、どこまでを 1 つの依頼で切るべきか判断しやすくする

---

## 前提

- 肌見え割合のような直接値は DB に保存しない
- ボトムスは脚の見えるベース範囲を決める役割、レッグウェアは補正側として扱う
- `socks` は下側から覆い、`leggings` は上側から覆う
- `stockings` は肌色の上に半透明レイヤー、`tights` は肌色なしとする
- item 単体では素の見え方を表し、最終的な見え方は outfit / wear log 側で合成する
- wear log サムネイルの描画正本は `source_outfit_id` ではなく `wear_log_items` である
- 今回は実装ではなく、影響整理と段階的実装案の整理だけを行う

---

## current / planned / 要再判断

### current

- item / outfit / wear log にサムネイル表示の責務がある
- outfit サムネイルは current outfit item 構成を正本としている
- wear log サムネイルは `wear_log_items` を正本としている
- item 側では `spec.tops` を持つ設計がある

### planned

- `spec.bottoms.length_type`
- `spec.legwear.coverage_type`
- `skinTonePreset`
- item サムネイルでの素の脚見え表現
- outfit / wear log サムネイルでの脚見え合成表現

### 要再判断

- `skinTonePreset` を current settings API に含める時期
- `bottom_length_type` から描画割合への変換テーブルの最終値
- `wear_log_items` 内でボトムス / レッグウェア候補が複数ある場合の優先順位
- 透け感や厚みをどこまで初期版で扱うか
- wear log 側を outfit と同時にやるか、別段階に分けるか

---

## item spec 影響

### 追加が想定されるもの

- `spec.bottoms.length_type`
- `spec.legwear.coverage_type`

### 初期版で固定しやすい点

- どちらも直接割合ではなく分類値として保存できる
- `spec.tops` と同じく、item 側の `spec.*` に寄せる方針と整合する
- item 単体では最終合成まで持たず、「素の見え方」だけを表す責務に留めやすい

### 注意点

- bottoms 系 item にだけ `length_type` を持たせるか、他カテゴリでも nullable に持てるようにするかは実装時に決める必要がある
- legwear 系 item の coverage 分類は、既存 category / shape とどう対応づけるか整理が必要になる
- 保存値追加だけを先に入れても、UI で設定できない期間が発生する

---

## settings 影響

### 想定される追加

- `skinTonePreset` を user settings / preferences 側で持つ
- プリセット一覧と初期値を settings 画面で選べるようにする

### 先に入れるか後にするか

- item spec より前に settings を入れる必要は必ずしもない
- ただし outfit / wear log 合成へ進む前には、settings 側の肌色正本が必要になる

### 現時点の整理

- 第1段階では `spec.bottoms` / `spec.legwear` を先行し、`skinTonePreset` は第2段階以降でも成立しうる
- ただし item サムネイルで肌色を見せる案を初期版から入れるなら、settings 側も同時対応が必要になる

---

## item サムネイル影響

### 初期版で着手しやすい理由

- item 単体では「素の見え方」を出すだけでよく、合成責務がない
- `spec.bottoms.length_type` と `spec.legwear.coverage_type` があれば、単体表現の確認がしやすい
- outfit / wear log より責務が閉じている

### 注意点

- item サムネイルで肌色をどこまで出すかは、`skinTonePreset` の導入順と連動する
- bottoms item と legwear item で見た目ルールを分ける必要がある
- current の item サムネイル責務を広げすぎないよう、最終合成表現は持ち込まない方がよい

---

## outfit サムネイル影響

### 影響の中心

- ボトムス item と legwear item を current outfit item 構成から抽出する必要がある
- `length_type` と `coverage_type` を使って、脚の見え方を合成する描画ロジックが必要になる
- `skinTonePreset` が未導入なら、肌色表現の初期版をどう扱うか決める必要がある

### 段階導入上の位置づけ

- item サムネイルより後段に置く方が実装しやすい
- outfit 一覧サムネイルは current で既に配色サムネイル責務を持っているため、脚見え表現をどう統合するかは別段で検討が必要になる

---

## wear log サムネイル影響

### current と矛盾させない前提

- 描画正本は引き続き `wear_log_items`
- `source_outfit_id` はベース情報であり、最終描画正本には戻さない

### 影響の中心

- outfit よりさらに、当日の最終 item 構成を優先して評価する必要がある
- `wear_log_items` 内でボトムス / レッグウェア候補が複数ある場合の優先順位をどこかで決める必要がある
- 一覧サムネイル / 日詳細モーダル簡略版 / 将来の個別詳細展開で、どこまで同じ描画責務を共有するか整理が必要になる

### 段階導入上の位置づけ

- outfit 合成後に着手する方が自然である
- wear log は current のサムネイル責務が既に多いため、初期版から同時対応すると調整点が増えやすい

---

## 段階的実装案

### 第1段階

- `spec.bottoms.length_type` を追加
- `spec.legwear.coverage_type` を追加
- item create / edit / detail で設定・確認できるようにする

### 第2段階

- item サムネイルで bottoms / legwear の素の見え方を描画する
- 最終合成はまだ行わない
- `skinTonePreset` なしでも成立する範囲を優先する

### 第3段階

- `skinTonePreset` を settings / preferences 側へ追加
- item サムネイルで必要な範囲、または outfit 合成で必要な範囲に合わせて肌色選択を導入する

### 第4段階

- outfit サムネイルで bottoms + legwear + skinTonePreset の合成を追加
- 変換テーブルや補正ルールを outfit で先に確認する

### 第5段階

- wear log サムネイルへ展開する
- `wear_log_items` 正本を維持したまま、複数候補時の優先順位もこの段階で固める

### この順序を推奨する理由

- item spec を先に入れることで、後続描画の入力値が固定しやすい
- item サムネイルは責務が閉じており、最初の実装対象として扱いやすい
- outfit 合成でルールを確かめてから、wear log の `wear_log_items` ベース描画へ進む方が current 方針と矛盾しにくい

---

## テスト影響

### item spec

- `spec.bottoms.length_type` を保存できる
- `spec.legwear.coverage_type` を保存できる
- 許可値以外はエラーになる

### settings

- `skinTonePreset` を導入する段階で、取得・保存・初期値の確認が必要になる
- settings 側導入を後段にする場合、初期段階では test 対象に含めなくてよい

### item サムネイル

- bottoms item が丈分類に応じた基礎表現になる
- legwear item が coverage_type に応じた基礎表現になる
- item 単体で最終合成をしていないことを確認する

### outfit / wear log サムネイル

- outfit は current outfit item 構成を正本に合成する
- wear log は `wear_log_items` を正本に合成する
- `socks` / `leggings` / `stockings` / `tights` の補正ルールが崩れない
- 複数候補時の優先順位を導入した段階で、その rule を test に固定する

---

## 今決めるべきこと

1. 初期版は `spec.bottoms` / `spec.legwear` から入る
2. item サムネイルを outfit / wear log 合成より先に着手する
3. `skinTonePreset` は少なくとも outfit 合成前までに導入するか、代替案を決める
4. wear log は `wear_log_items` 正本を崩さない
5. 複数候補時の優先順位は、wear log 展開前までに確定する

---

## 保留でよいこと

- `bottom_length_type` の最終変換テーブル
- `skinTonePreset` の preset hex 値
- 透け感や厚みの精緻化
- 肌見え表現を検索条件や分析指標へ広げるか
- 一覧 / 詳細 / モーダルでどこまで同じ描画 helper を共有するか

---

## 現時点の整理

Thumbnail skin exposure は、**item spec の分類値追加を先に行い、item サムネイル → outfit 合成 → wear log 合成の順で段階導入する** のが最も扱いやすい。  
特に wear log は current で `wear_log_items` を正本としているため、outfit と同時に一気に広げるより、outfit 側で描画ルールを固めた後に展開する方が安全である。  
一方で、`skinTonePreset` の導入時期と複数候補時の優先順位は未確定の論点なので、今回は `要再判断` に残し、実装依頼時にスコープを切って扱うのが適切である。

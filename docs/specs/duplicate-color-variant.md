# Duplicate / Color Variant

item / purchase candidate の「複製」「色違い追加」で共通にそろえる概念を整理する。  
個別の UI や項目差分は、item 側は `docs/specs/items/duplicate-color-variant.md`、purchase candidate 側は `docs/specs/purchase-candidates.md` を正本とする。

---

## 目的

- 「複製」は既存データを元に、新しい独立データを作るための draft を生成する操作としてそろえる
- 「色違い追加」は既存データを元に、同一商品の別カラー用 draft を生成する操作としてそろえる
- duplicate / color-variant 実行時点では DB 保存を行わず、保存責務は既存の create API に寄せる
- 色違い関係は source ID ではなく group で表現する

---

## 基本方針

### 複製

- 詳細画面を起点にする
- duplicate API は draft payload を返すだけで、DB へ新規 record を作成しない
- 元データの主要属性を引き継ぎ、新規作成画面の初期値として扱う
- 保存時は新規データとして扱う
- 通常複製では `group_id` / `group_order` を引き継がない
- 複製後データは色違い group に自動所属させない

### 色違い追加

- 詳細画面を起点にする
- color-variant API は draft payload を返すだけで、DB へ新規 record を作成しない
- 色項目は空にした draft を返す
- draft には `variant_source_*_id` を一時入力値として含める
- 保存時に `variant_source_*_id` から source record を解決し、既存 group を再利用するか新規 group を作成する
- 保存後テーブルに `variant_source_*_id` を永続化する前提にはしない

---

## API 原則

- duplicate / color-variant API は draft payload を返すのみ
- duplicate / color-variant API 自体は新規 item / purchase candidate を保存しない
- 実際の保存は既存 create API で行う
- draft 生成 API の時点では source record を直接更新しない
- source record が他ユーザーのものである場合は参照できない

補足:

- color-variant 保存時は別扱いとする
- source record がまだ group 未所属であれば、保存 transaction 内で source record に `group_id` / `group_order` を設定してよい
- これは draft 生成 API の副作用ではなく、color-variant 保存時の group 解決処理として扱う

### item 側の第一候補

- `POST /api/items/{id}/duplicate`
- `POST /api/items/{id}/color-variant`

### purchase candidate 側の第一候補

- `POST /api/purchase-candidates/{id}/duplicate`
- `POST /api/purchase-candidates/{id}/color-variant`

---

## group 方針

- 色違い関係は group で表現する
- group は user をまたがない
- source record に group がある場合は保存時に同じ group に所属させる
- source record に group がない場合は保存 transaction 内で group を作成し、source と新規 record を同じ group に所属させる
- 通常複製では group を引き継がない

---

## 画像方針

- item 側 / purchase candidate 側ともに、複製・色違い追加の draft に画像を含める
- draft 段階では元画像情報を仮表示用初期値として扱う
- 保存時は新データ用保存先へ物理コピーする
- 元画像 record や保存先を参照し続けない
- 元データ側の画像削除が新データ側へ影響しない構成を前提とする

---

## 注意表示方針

- duplicate / color-variant 由来の新規作成画面では、元データから引き継いだ情報があることを画面上部で明示する
- 画面上部の注意カードを第一候補とする
- 画像 / price / purchased_at 相当日付項目 / memo は項目単位でも確認推奨バッジを表示する
- 保存前モーダルは現時点では不要とする

### アイコン候補

- 第一候補: `TriangleAlert`
- 代替候補: `CircleAlert`
- 情報寄りにしたい場合: `Info`

補足:

- 実装時には `lucide-react` の export 名を確認する

---

## current / planned / 要再判断

### current

- purchase candidate 側には duplicate / color-variant の概念と group 方針がすでに存在する
- item 側には duplicate / color-variant 専用仕様書はまだなく、detail / form / create API も purchase candidate 起点の item-draft が中心である
- item 側では保存時の画像物理コピー方針がすでに存在する

### planned

- item 側にも duplicate / color-variant draft API を追加する
- item 側にも group 概念を追加する
- purchase candidate 側の duplicate / color-variant 仕様を、本資料の draft-only / warning UI / image copy 原則に合わせて明文化する

### 要再判断

- group の代表 record をどこまで UI 正本として使うか
- group_order の並び替え UI をいつ入れるか
- group の解除 / 統合 / 分割 UI をいつ扱うか
- group 名を持たせるか
- 「色違いあり」バッジを一覧へ出すか

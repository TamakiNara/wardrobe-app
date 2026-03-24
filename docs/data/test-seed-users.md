# Test Seed Users Plan

テスト用ユーザーとサンプルデータを seed で再現可能に作るための検討資料です。
この資料では、何人分のテスト用ユーザーを作るか、どのサンプルデータを紐づけるか、どのように再実行可能にするかを整理します。

---

## 目的

- 3 アカウント固定のテスト用ユーザーを seed で作る
  - `empty-user@example.com`
  - `standard-user@example.com`
  - `large-user@example.com`
- パスワードは README にデフォルト値 `password123` を記載し、env `TEST_SEED_USER_PASSWORD` で上書き可能にする
- サンプルデータはそのユーザーに紐づける
  - Item
  - Outfits
  - カテゴリ設定

---

## 再現性の方針

- `php artisan migrate:fresh --seed` で初期状態を再現できる形を目指す
- `php artisan db:seed --class=TestDatasetSeeder` で、テスト用ユーザーとサンプルデータだけを再実行できる構成にする
- 「マイグレーション直後に入る基本 seed」と「確認用テストデータ」の責務は分ける方向で考える


- `TestDatasetSeeder` 単体でも、category group / category master / category preset からテスト用ユーザー / sample data まで一通り再投入できる構成にする


---

## README に書くこと

- テスト用アカウントの一覧
- ログイン情報
  - デフォルトパスワード
  - env `TEST_SEED_USER_PASSWORD` での上書き方法
- サンプルデータありのアカウントかどうか
- データを初期状態に戻す方法

---

## 確認用途と想定ユーザー

### パターンA: 新規登録後の初期状態確認用

- アカウント: `empty-user@example.com`
- Item 0 件
- Outfits 0 件
- 新規登録直後の初期導線を確認するためのアカウント

### パターンB: 標準的な確認用

- アカウント: `standard-user@example.com`
- Item 5〜8 件くらい
- Outfits 2〜3 件くらい
- カテゴリ設定は「大半 ON / 一部 OFF」にし、ON / 一部ON / OFF を確認できる状態にする
- 通常の CRUD や画面確認に使う主力アカウント
- データは手書き中心で作り、差分確認がしやすい内容にする

### パターンC: 多件数確認用

- アカウント: `large-user@example.com`
- Item 30〜50 件くらい
- Outfits 10〜20 件くらい
- フィルタ / 検索時の挙動確認
- レイアウト崩れ確認
- 多件数データは Factory 併用で生成する

### wear logs の確認用途

- `empty-user@example.com`
  - wear logs なし
  - 空状態と初回導線の確認用
- `standard-user@example.com`
  - 標準確認用の wear logs を 5 件投入
  - `planned` / `worn`、同日複数件、`display_order` 1 / 2、outfit のみ / item のみ / outfit + item を確認しやすい
  - あわせて、`source_outfit_id` が現在 `invalid` の記録と、現在 `disposed` の item を含む既存記録を 1 件ずつ確認できる
- `large-user@example.com`
  - 多件数確認用の wear logs を 14 件以上投入
  - ページング、status / date / keyword 絞り込み、日付の新しい順 / 古い順を確認しやすい


---

## サンプル Item の設計

### 将来的に入れたい差分

- カテゴリ違い
- 色違い
- ブランドあり / なし
- 画像あり / なし
- メモあり / なし
- サイズあり / なし
- 画像あり sample は最初は URL ベースとし、ローカルファイル対応は後回しにする

### 将来項目を含む具体例メモ

- 白Tシャツ: ブランドあり、画像なし
- 黒カーディガン: ブランドなし、メモあり
- デニムパンツ: サイズあり
- スニーカー: URL あり
- トートバッグ: 画像あり

---

## サンプル Outfit の設計

### 現在入れている差分

- 使用アイテム数が違う
- TPO 違い
  - 現在の seed は `仕事 / 休日 / フォーマル` に統一する
- 季節違い

### 例

- 通勤コーデ
  - カーディガン
  - 白Tシャツ
  - デニムパンツ
  - スニーカー
- 休日コーデ
  - 白Tシャツ
  - 黒スカート
  - トートバッグ
- 雨の日コーデ
  - カーディガン
  - デニムパンツ
  - スニーカー
  - トートバッグ

---

## seed の構成例

- `TestUserSeeder`
- `SampleItemSeeder`
- `SampleOutfitSeeder`
- `SampleWearLogSeeder`
- `SampleUserSettingSeeder`

---

## 作成順

1. ユーザー作成
2. カテゴリマスタ seed
3. ユーザー設定 seed
4. Item seed
5. Outfit seed
6. Outfit と Item の紐づけ seed

---

## 決定済み方針

- テスト用ユーザーは 3 アカウント固定とし、`empty-user@example.com` / `standard-user@example.com` / `large-user@example.com` を使う
- パスワードは README にデフォルト値を記載し、Seeder 実装では env 上書き可能にする
- 画像あり sample は URL ベースで開始し、ローカルファイルは後回しとする
- 標準確認用データは手書き中心、多件数確認用データは Factory 併用とする

---

## 現在の実装メモ

- 現行 schema で seed 対応している sample item の差分は category / color / seasons / tpos / spec まで
- 季節 UI の表示順は `春 / 夏 / 秋 / 冬 / オール`、TPO の正規値は `仕事 / 休日 / フォーマル` を前提にそろえる
- brand 名 / item メモ / 画像 URL などの将来項目は、テーブル追加後に sample data へ反映する
- `standard-user@example.com` は手書き 8 件の Item（うち `disposed` 1 件）と 4 件の Outfit（うち `invalid` 1 件）、5 件の wear logs を持ち、`large-user@example.com` は Factory 併用の 36 件の Item と 12 件の Outfit、14 件以上の wear logs を持つ
- `php artisan migrate:fresh --seed` と `php artisan db:seed --class=TestDatasetSeeder` は実行確認済み


- `TestDatasetSeeder` 単体実行時でも category 系 master とユーザーの `visible_category_ids` が整合するように修正済み

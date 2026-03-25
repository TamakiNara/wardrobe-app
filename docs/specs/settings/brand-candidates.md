# ブランド候補機能 仕様・実装 TODO

## 1. 目的

- アイテム登録・編集時のブランド入力をしやすくする
- よく使うブランドをユーザー単位の候補として保持し、表記ゆれを減らす
- 将来の検索・集計・正規化へつなげやすい形で導入する
- ただし現時点では過剰設計を避け、MVP では入力補助を主目的にする

---

## 2. この資料の位置づけ

この資料は、ブランド候補機能について以下をまとめるためのものとする。

- 仕様の整理
- 実装方針の整理
- 優先度付き TODO
- 今は保留でよいこと

---

## 3. 結論

### 3-1. データ保存方針

- アイテム側は当面 `items.brand_name` の文字列保存とする
- 候補ブランドは `user_brands` テーブルでユーザー単位管理とする
- 候補は入力補助であり、現時点では item と FK で結ばない

### 3-2. 読み仮名

- `user_brands.kana` は任意
- `normalized_kana` を持ち、重複判定とサジェストに利用する
- サジェストは `name` / `kana` の両方を対象にする
- 候補選択時に item 入力欄へ入るのは `name` とする

### 3-3. 候補運用

- 初期は `is_active` による無効化中心とする
- 将来的に削除 API を追加する余地は残す
- 候補の無効化・削除をしても既存 `items.brand_name` は変更しない

### 3-4. 実装責務

- item 保存値の正本は `items.brand_name`
- 候補の正本は `user_brands`
- 候補変更で既存 item の文字列を自動更新しない
- 正規化・重複判定・候補追加判定は backend 側へ寄せる
- frontend / BFF は入力と表示を主責務とし、変換責務を持ち込みすぎない

---

## 4. スコープ

## 4-1. 今回やること

- `items.brand_name` の保存可否と docs / API / 実装の整合確認
- `user_brands` テーブル追加
- ブランド候補一覧 / 追加 / 更新 API
- item create / update での `brand_name` 保存
- `save_brand_as_candidate` による候補追加試行
- backend feature test / OpenAPI / docs の整合

## 4-2. 今回やらないこと

- item と brand の FK 正規化
- グローバルブランドマスタ
- 候補削除 API の本実装
- 候補変更時の既存 item 一括更新
- 外部ブランドデータ連携
- item 入力時のブランド候補サジェスト UI
- ブランド設定画面
- Seeder の充実

---

## 5. 現状確認で見るべきこと

最初に以下を棚卸しする。

1. `items.brand_name` が DB に既にあるか
2. Item Model の `fillable` / `casts` / resource に brand が入っているか
3. item create / update request に `brand_name` が通るか
4. frontend / BFF の payload に `brand_name` が含まれているか
5. docs が古いだけなのか、実装が未完なのか

---

## 6. DB 設計方針

## 6-1. items テーブル

追加または確認対象:

```sql
brand_name varchar(255) null
```

意味:

- アイテムに紐づくブランド表示名
- 正本は文字列
- 候補テーブルとの FK は持たない

## 6-2. user_brands テーブル

```sql
user_brands
- id
- user_id
- name
- kana nullable
- normalized_name
- normalized_kana nullable
- is_active
- created_at
- updated_at
```

### カラム意図

#### `name`

- 画面表示用ブランド名
- 例: `UNIQLO`, `GU`, `GLOBAL WORK`

#### `kana`

- 任意の読み仮名
- 例: `ゆにくろ`, `じーゆー`, `ぐろーばるわーく`

#### `normalized_name`

- ブランド名重複判定用
- 検索補助にも利用

#### `normalized_kana`

- 読み仮名重複判定用
- 読み検索補助にも利用

#### `is_active`

- 候補をサジェスト対象に含めるか
- 初期実装は削除ではなく無効化中心

## 6-3. index / unique 方針

推奨:

- `unique(user_id, normalized_name)`
- `index(user_id)`
- `index(user_id, is_active)`

`normalized_kana` については、DB の unique 制約ではなく、初期はアプリケーション側重複確認を優先してよい。

理由:

- RDB 差異や nullable unique の扱い差を避けやすい
- 初期段階では実装・運用のシンプルさを優先できる

---

## 7. 正規化方針

## 7-1. name

- trim
- 連続空白の単一化
- 英字小文字化
- 可能なら全角英数字の半角寄せ

## 7-2. kana

- trim
- 連続空白の単一化
- ひらがなに寄せる

## 7-3. 実装場所

`BrandNormalizer` に寄せる。

責務:

- `normalizeName(string $value): string`
- `normalizeKana(?string $value): ?string`

理由:

- request / seeder / service / test で再利用できる
- brand 周りの仕様変更に強い

---

## 8. 重複判定方針

- 基本は `user_id + normalized_name`
- `kana` 入力時は `user_id + normalized_kana` でも重複確認する
- 既存候補と重複する場合は新規作成しない

### item 保存時の扱い

- `save_brand_as_candidate=true` のとき候補追加を試行する
- 既存候補と重複する場合は追加をスキップする
- 重複スキップは item 保存失敗にしない

---

## 9. API 方針

## 9-1. ブランド候補一覧取得

`GET /api/settings/brands`

用途:

- 設定画面一覧表示
- アイテム入力時サジェスト候補取得

想定 query:

- `active_only=true|false`
- `keyword=uni`
- `keyword=ゆに`

レスポンス例:

```json
{
  "data": [
    {
      "id": 1,
      "name": "UNIQLO",
      "kana": "ゆにくろ",
      "is_active": true
    }
  ]
}
```

## 9-2. ブランド候補追加

`POST /api/settings/brands`

request 例:

```json
{
  "name": "UNIQLO",
  "kana": "ゆにくろ"
}
```

挙動:

- `normalized_name` 生成
- `kana` があれば `normalized_kana` 生成
- 同一ユーザー内で重複確認
- 問題なければ作成

## 9-3. ブランド候補更新

`PATCH /api/settings/brands/{id}`

request 例:

```json
{
  "name": "UNIQLO",
  "kana": "ゆにくろ",
  "is_active": true
}
```

挙動:

- `name` / `kana` 更新時は正規化値も再生成
- 重複確認あり

## 9-4. ブランド候補無効化 / 再有効化

`PATCH /api/settings/brands/{id}`

```json
{
  "is_active": false
}
```

## 9-5. 将来のブランド候補削除

`DELETE /api/settings/brands/{id}`

方針:

- 将来的には削除 API を追加する
- ただし削除は候補管理上の削除であり、既存アイテムの `brand_name` は変更しない
- 削除時に関連 item を更新しない

## 9-6. item 保存 API 追加項目

既存の item create / update に以下を追加する。

```json
{
  "brand_name": "UNIQLO",
  "save_brand_as_candidate": true
}
```

server behavior:

- `items.brand_name` を保存
- `save_brand_as_candidate=true` なら候補追加を試行
- 重複なら追加スキップ
- 重複スキップは item 保存失敗にしない

---

## 10. UI 方針

## 10-1. item 画面

目的:

- ブランド名の入力をしやすくする
- よく使う候補を再利用しやすくする

画面要素:

- ブランド単一入力欄
- 候補サジェスト
- 「候補へ追加する」チェック

サジェスト仕様:

- 検索対象は `name` / `kana`
- 初期実装は前方一致優先
- 件数が少なければ部分一致も許容
- `is_active = true` のみ対象
- 表示はブランド名を主表示
- 必要なら読み仮名を補助表示
- 選択時に入力欄へ入るのはブランド名
- current 実装では item 新規作成 / 編集画面で候補サジェスト UI を提供する

保存ルール:

- `items.brand_name` には入力欄の最終文字列を保存する
- 候補から選択した場合も保存値は文字列
- その値が候補になくても編集可能
- 候補から選び直した場合はその文字列で上書きする

## 10-2. ブランド設定画面

目的:

- よく使うブランド候補を管理する
- 読み仮名を登録し、サジェスト精度を上げる

画面でできること:

- ブランド追加
- ブランド名編集
- 読み仮名編集
- 有効 / 無効切替
- 将来: 削除

一覧表示項目:

- ブランド名
- 読み仮名
- 状態（有効 / 無効）
- 更新日
- 操作（編集 / 無効化 / 再有効化 / 将来は削除）

---

## 11. バリデーション方針

## 11-1. items.brand_name

- nullable
- string
- max:255
- trim 後に保存

## 11-2. save_brand_as_candidate

- boolean

## 11-3. user_brands.name

- required
- string
- max:255
- trim 後空文字不可
- user 単位で `normalized_name` 重複不可

## 11-4. user_brands.kana

- nullable
- string
- max:255
- trim 後空文字なら null 扱い
- user 単位で `normalized_kana` 重複不可を原則とする

---

## 12. 権限・整合性ルール

- 候補ブランドはユーザー単位
- 他ユーザーの候補は取得・編集・削除できない
- 候補名変更・無効化・削除で既存 item の `brand_name` は変えない
- item 表示は常に `items.brand_name` を基準にする

---

## 13. Seeder 方針

ブランドは全体共通ではなく **ユーザー単位の候補** とする。  
したがって Seeder も **テストユーザーごとに候補ブランドを投入** する。

想定:

- 初期確認ユーザー: 少数
- 標準確認ユーザー: 日常的ブランド一式
- 多件数確認ユーザー: 多数ブランド + 無効候補も一部含める

注意:

- item seed の `brand_name` と候補の `name` は極力揃える
- 正規化値は Seeder 直書きでもよいが、できれば normalizer を通す

---

## 14. テスト観点

## 14-1. ブランド候補 API

- 自ユーザーの候補だけ取得できる
- `is_active=false` を除外できる
- `normalized_name` 重複を防げる
- `normalized_kana` 重複を防げる
- 読み仮名未設定でも登録できる
- 更新時の重複判定が正しく動く

## 14-2. item 保存

- `brand_name` 未設定で保存できる
- 自由入力ブランド名で保存できる
- `save_brand_as_candidate=true` で候補追加できる
- 既存候補と重複する場合は追加されない
- 重複時も item 保存は成功する

## 14-3. Seeder

- 対象ユーザーへ候補投入される
- 無効候補も含めたデータ投入確認ができる
- item データとのブランド整合が崩れていない

---

## 15. 優先度付き TODO

## 優先度A（先にやる）

### A-1. 現況確認

- `items.brand_name` が DB / API / Model / Request に既にあるか確認
- フロント欄だけ先行実装なのかを確認
- docs と差分がある場合は実装を正として棚卸し

### A-2. DB

- `items.brand_name` 未追加なら migration 追加
- `user_brands` 新規作成
- index / unique / nullable 方針を確定

### A-3. Backend 基盤

- `UserBrand` Model
- `BrandNormalizer`
- `UserBrandService`
- item 保存 service 内の候補追加処理

### A-4. Brands API

- `GET /api/settings/brands`
- `POST /api/settings/brands`
- `PATCH /api/settings/brands/{id}`

### A-5. items API 拡張

- item create / update に `brand_name`
- item create / update に `save_brand_as_candidate`
- item 保存時の候補追加試行
- 重複時スキップ

## 優先度B（Aの後）

### B-1. Seeder

- テストユーザーごとの候補ブランド投入
- item seed と候補 seed の表記を揃える

### B-2. item 入力サジェスト UI

- ブランド入力欄
- 候補サジェスト
- 候補追加チェック

### B-3. ブランド設定画面

- 候補一覧
- 編集
- 有効 / 無効切替
- 読み仮名編集

### B-4. docs / OpenAPI / test

- `docs/data/database.md`
- `docs/api/openapi.yaml`
- `docs/api/api-overview.md`
- 必要なら `docs/specs/settings/...`
- feature test / frontend test 追加

---

## 16. current 実装メモ

- `items.brand_name` は DB / API / frontend payload に実装済み
- `user_brands` と `BrandNormalizer` は実装済み
- `GET /api/settings/brands` / `POST /api/settings/brands` / `PATCH /api/settings/brands/{id}` は実装済み
- item create / update は `save_brand_as_candidate` を受け取り、Laravel 側で候補追加を試行する
- `save_brand_as_candidate=true` かつ重複時は候補追加をスキップし、item 保存自体は成功させる
- item 新規作成 / 編集画面では `GET /api/settings/brands` を使ったブランド候補サジェスト UI を実装済み

未対応:

- ブランド設定画面
- `DELETE /api/settings/brands/{id}`
- Seeder の充実

## 優先度C（後続検討）

### C-1. 候補削除 API

- `DELETE /api/settings/brands/{id}`

### C-2. item と brand の厳密正規化

- `brand_id` 導入
- item との FK 化
- 既存 item の移行戦略

### C-3. 既存 item 一括反映

- 候補変更時の既存 item 更新
- ただし初期段階では不要

### C-4. 外部ブランドマスタ連携

- 必要になった場合のみ検討

---

## 17. 今は保留でよいこと

- グローバル共通ブランドマスタ
- soft delete
- 候補削除時の item 自動更新
- `brand_id` 正規化
- 外部連携
- 高度な表記ゆれ吸収ルール
- 読み仮名重複の例外許容ルール

---

## 18. 実務影響

### 良い点

- 入力しやすい
- ユーザー単位候補なので実利用に近い
- 読み仮名サジェストで UX が上がる
- 将来 `brand_id` 正規化に移行しやすい

### 注意点

- item は文字列保存なので表記統一には限界がある
- 候補名変更で既存 item は変わらない
- 読み仮名重複の扱いは将来例外が欲しくなる可能性がある

---

## 19. 次に見るべき更新対象

- `docs/data/database.md`
- `docs/api/openapi.yaml`
- `docs/api/api-overview.md`
- `docs/project/implementation-notes.md`
- 必要に応じて `docs/specs/settings/category-settings.md` 周辺との並び確認

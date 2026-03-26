# settings / calendar / wear logs / care_status 仕様整理

## 今回の結論

第1弾（preferences 基盤 + settings API/UI + 初期表示連動）は current 実装済み。
本メモでは、第1弾までの前提整理を残しつつ、主に第2弾以降の後続実装判断に使う。
カレンダーAPIや `care_status` を current 化する段階では、必要に応じて `docs/specs/` 配下の正式 spec へ分解する。

優先度順は以下とする。

1. preferences 基盤の導入
2. `currentSeason` / `defaultWearLogStatus` の settings API と UI
3. カレンダーAPIの分割（`月集約API` / `日詳細API`）
4. `items.care_status` 導入
5. wear log 保存時の `in_cleaning` 警告 UI

理由:

- `currentSeason` と `defaultWearLogStatus` は user preference 基盤がないと置き場が決まらない
- カレンダーは wear logs 表示導線の中核であり、API責務を先に固定した方が後続UIがぶれにくい
- `care_status` は item / outfit / wear log へ横断影響するため、状態の持ち方だけ先に固定してから UI を足す方が安全

---

## 1. preferences の保存先

### 結論

`currentSeason` と `defaultWearLogStatus` は user 基本属性ではなく user preference として扱うため、保存先は `users` 直持ちではなく `user_preferences` テーブルを第一候補とする。

### 想定テーブル

`user_preferences`

### 想定カラム

- `user_id`
- `current_season` nullable
- `default_wear_log_status` nullable
- `calendar_week_start` nullable
- `created_at`
- `updated_at`

### 制約

- `user_id` は PK 兼 FK にしてよい
- 1 user = 1 record を前提とする

### 未設定の扱い

以下を許容する。

- `current_season = null`
- `default_wear_log_status = null`

### 許可値

#### `current_season`

- `spring`
- `summer`
- `autumn`
- `winter`
- `null`

#### `default_wear_log_status`

- `planned`
- `worn`
- `null`

#### `calendar_week_start`

- `monday`
- `sunday`
- `null`

### 方針

- `null` は「未設定」を表す
- user 登録時に preferences record を同時作成してもよいし、初回 settings 保存時作成でもよい
- MVP では 1 record 集約のシンプル構成を優先する
- `calendar_week_start = null` の場合は、wear log カレンダーを月曜始まりで扱う

---

## 2. `currentSeason` の適用優先順位

### 結論

`currentSeason` は item 一覧 / outfit 一覧に対する強制条件ではなく、初期表示用の user preference として扱う。

### 適用優先順位

1. URL または画面上でユーザーが現在選択している季節フィルタ
2. URL に季節指定がない状態で一覧を開いたときの `currentSeason`
3. `currentSeason = null` の場合は季節絞り込みなし

### 補足

- `currentSeason` は一覧画面の初回表示時にのみ適用する
- 一覧表示中にユーザーが季節フィルタを変更または解除した場合、その画面では UI / URL 上の現在値を優先する
- 画面を再訪問した場合も、URL に季節条件がなければ再度 `currentSeason` を初期値として適用する
- 既存の一覧画面が URL クエリ正本なら、その方針を崩さない

### 対象画面

- item 一覧
- outfit 一覧

### 非対象

- wear logs 一覧
- purchase_candidates 一覧
- detail / edit 系画面

---

## 3. `defaultWearLogStatus` の扱い

### 結論

`defaultWearLogStatus` は wear log 新規作成時の初期値としてのみ使う。

### 許可値

- `planned`
- `worn`
- `null`

### 適用ルール

- 新規作成画面初期表示時のみ適用する
- 画面上で変更したらその場では UI 値を優先する
- edit 画面では既存 record の `status` を優先し、preference は使わない
- `null` の場合は現行デフォルト挙動に従う

### 補足

- UI表示ラベルは内部値ではなく、ユーザー向けに以下を使う
  - `planned` -> `予定`
  - `worn` -> `着用済み`

---

## 4. settings API / UI 方針

### 結論

settings には「重い設定」と「軽い設定」を分けて置くが、API は settings 配下で一貫させる。

### 今回対象にする settings

- `currentSeason`
- `defaultWearLogStatus`
- `calendarWeekStart`

### API 第一候補

- `GET /api/settings/preferences`
- `PUT /api/settings/preferences`

### response 例

```json
{
  "preferences": {
    "currentSeason": "spring",
    "defaultWearLogStatus": "planned",
    "calendarWeekStart": "monday"
  }
}
```

### request 例

```json
{
  "currentSeason": "spring",
  "defaultWearLogStatus": "planned",
  "calendarWeekStart": "monday"
}
```

### バリデーション

- `currentSeason`: nullable + 許可値のみ
- `defaultWearLogStatus`: nullable + 許可値のみ
- `calendarWeekStart`: nullable + `monday|sunday`

### UI 方針

- settings 画面の軽い設定セクションに置く
- `currentSeason` は単一選択
- `defaultWearLogStatus` も単一選択
- `calendarWeekStart` は `月曜始まり / 日曜始まり` の2択で表示し、`月曜始まり` を既定とする
- 未設定に戻せる導線を持つ

---

## 5. カレンダーAPIの分割方針

### 結論

カレンダー表示では、月表示と日詳細で必要な情報粒度が異なるため、API は分ける方針とする。

### 5-1. 月集約API

#### 用途

- 月カレンダー表示
- 日付ごとの planned / worn の存在把握
- dot 表示用情報の取得

#### API 第一候補

`GET /api/wear-logs/calendar?month=2026-03`

#### request

- `month` は `YYYY-MM` 形式

#### 返却例

- `date`
- `plannedCount`
- `wornCount`
- `dots`（最大3件分）
- `overflowCount`

#### response イメージ

```json
{
  "month": "2026-03",
  "days": [
    {
      "date": "2026-03-05",
      "plannedCount": 1,
      "wornCount": 2,
      "dots": [
        { "status": "planned" },
        { "status": "worn" },
        { "status": "worn" }
      ],
      "overflowCount": 0
    }
  ]
}
```

#### 方針

- 軽量性を優先する
- 一覧APIとは責務を分ける
- カレンダーのセル描画に必要な最小情報のみ返す
- dot の詳細テキストは初期は不要

### 5-2. 日詳細API

#### 用途

- 日付クリック後の日詳細シート表示
- その日の wear log 一覧表示

#### API 第一候補

`GET /api/wear-logs/by-date?event_date=2026-03-05`

#### 返却例

- `id`
- `status`
- `event_date`
- `display_order`
- `source_outfit_name`
- `items_count`
- `memo`

#### response イメージ

```json
{
  "eventDate": "2026-03-05",
  "wearLogs": [
    {
      "id": 10,
      "status": "worn",
      "event_date": "2026-03-05",
      "display_order": 1,
      "source_outfit_name": "通勤コーデ",
      "items_count": 4,
      "memo": "薄手コートで十分"
    }
  ]
}
```

#### 方針

- `display_order asc` を正本の並びとする
- 一覧APIとは責務を分ける
- 日詳細シート描画に必要な最小項目に留める
- 個別詳細へ遷移する導線は別で持つ

---

## 6. クリーニング状態の持ち方

### 結論

クリーニング中は主 `status` ではなく、補助状態として別で持つ。
主 `status` は `active / disposed` を維持する。

### 採用方針

- `status`: `active | disposed`
- `care_status`: nullable
  - `null` = 補助状態なし
  - `in_cleaning` = クリーニング中

### nullable を採用する理由

- 他のカラムの設計方針と揃えやすい
- 「未設定 / なし」を `null` で表現する既存方針と整合しやすい
- 現時点では `none` という値をわざわざ持たなくても十分である

### 補足

- `in_cleaning` は主 `status` に含めない
- `disposed` と同列の強い状態にしない
- コーデ作成可否や invalid 化のような主制御は `status` が担う
- 警告・絞り込み・補助バッジは `care_status` が担う

### ロジック分担

#### `status` が効くところ

- 選択可能か
- invalid 化が必要か
- 通常一覧に出すか

#### `care_status` が効くところ

- バッジ表示
- 絞り込み
- 警告
- クリーニング解除導線

---

## 7. クリーニング中 item の運用方針

### 基本方針

- item の補助状態として保持する
- 一覧では絞り込み対象に含める
- コーデ作成時は除外しない
- 着用履歴で使用する時は注意を出す

### planned / worn での警告

- planned 保存時: 軽い警告
- worn 保存時: より明確な警告
- いずれも保存は禁止しない

### worn 化時の導線

- 警告だけで終わらせない
- 初期版では item 詳細へ移動できる導線を置く
- 将来は警告UI内でクリーニング解除できるクイック操作を TODO とする

---

## 8. 優先順の codex 実装依頼単位

### 第1弾

preferences 基盤 + settings API/UI

current:

- `user_preferences` 導入
- `GET /api/settings/preferences`
- `PUT /api/settings/preferences`
- settings 画面に `currentSeason` / `defaultWearLogStatus` を追加
- item / outfit 一覧の初期表示へ `currentSeason` を適用
- wear log 新規作成へ `defaultWearLogStatus` を適用

### 第2弾

カレンダーAPI + 月表示 / 日詳細シート

current:

- `GET /api/wear-logs/calendar`
- `GET /api/wear-logs/by-date`
- 月カレンダー表示
- 日詳細モーダル
- 個別詳細への遷移導線
- 空日でも日詳細モーダルを開き、`この日で新規作成` 導線を出す

### 第3弾

`care_status` 導入

- `items.care_status` 追加
- item create / edit / detail / list / filter
- wear log 保存時警告
- item 詳細から `in_cleaning` の付与 / 解除

---

## 9. 今回まだ保留でよいこと

- `care_status` の将来値追加
- カレンダーセル上の dot デザイン詳細
- 月集約APIの dots にラベルまで入れるか
- 日詳細シート内の memo 表示文字数
- クリーニング解除クイック操作
- care_status の一括操作

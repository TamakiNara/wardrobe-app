# Weather Records Specification

日付ごとの天気情報を手入力で記録するための仕様です。  
MVP では API 連携は行わず、ユーザーが `日付 × 地域` 単位で天気を登録できることを正本とします。

---

## 対象

対象:

- `weather_records`
- `user_weather_locations`
- 着用履歴カレンダーの日付詳細モーダルからの導線
- 着用履歴詳細での参照表示

MVP で扱う入力項目:

- 日付
- 地域
- 天気
- 最高気温
- 最低気温
- メモ

今回はまだ行わないもの:

- 天気予報 API 連携
- 過去天気 API 連携
- 自動取得 / 自動保存
- おすすめ機能
- カレンダーセルへの天気表示

---

## 基本方針

- 天気情報は `wear_logs` に直接持たせず、独立した `weather_records` として保存する
- 保存単位は `日付 × 地域`
- 同じ日付に複数地域の天気を登録できる
- 着用履歴とは `event_date = weather_date` で参照し、MVP では `weather_record_id` は持たせない
- 着用履歴は地域ごとに分割しない

---

## user_weather_locations

ユーザーごとの「よく使う地域」や、将来の API 取得に使う地域を管理する設定です。

### カラム

- `id`
- `user_id`
- `name`
- `forecast_area_code` nullable
- `latitude` nullable
- `longitude` nullable
- `is_default`
- `display_order`
- `created_at`
- `updated_at`

### 仕様

- 1 ユーザーにつき複数地域を登録できる
- `is_default = true` は 1 ユーザーにつき 0 または 1 件
- `display_order` で表示順を制御する
- 地域を削除しても過去の天気表示が壊れないよう、`weather_records` 側に snapshot を持つ
- ただし MVP 実装では、既に `weather_records` から参照されている地域は削除不可とする

### UI

設定画面配下に簡易管理 UI を置く。

- `/settings/weather-locations`

表示内容:

- 地域名
- 地域コード
- デフォルト設定
- 追加 / 編集 / 削除

---

## weather_records

日付ごとの天気記録です。

### カラム

- `id`
- `user_id`
- `weather_date`
- `location_id` nullable
- `location_name_snapshot`
- `forecast_area_code_snapshot` nullable
- `weather_code`
- `temperature_high` nullable
- `temperature_low` nullable
- `memo` nullable
- `source_type`
- `source_name`
- `source_fetched_at` nullable
- `created_at`
- `updated_at`

### 地域の種類

天気記録の地域には次の 2 種類がある。

- 保存済み地域
  - `user_weather_locations` に登録済み
  - `location_id` に紐づけて保存する
- 一時地域
  - `user_weather_locations` には追加しない
  - `location_id = null` として、`location_name_snapshot` のみ保存する

### 仕様

- 保存単位は `日付 × 地域`
- 保存済み地域では `user_id + weather_date + location_id` の重複登録を避ける
- 一時地域では `user_id + weather_date + normalized location_name_snapshot` の重複を application validation で軽く防ぐ
- `location_name_snapshot` / `forecast_area_code_snapshot` は保存時点の値を必ず保存する
- 地域名を後で変更しても、過去の天気表示は snapshot を正本とする

### 地域入力

天気登録画面では、次のどちらかで登録できる。

- 登録済み地域から選ぶ
- 今回だけの地域名を入力する

補足:

- 登録済み地域は、よく使う地域や将来の予報 API 取得対象として扱う
- 今回だけの地域は、旅行先などを自由入力で残すための snapshot 用入力として扱う
- 一時地域では地域名のみ必須
- `この地域を今後も使う地域として保存する` を ON にした場合のみ、`user_weather_locations` に追加する
- 今回だけの地域は `forecast_area_code` を持たなくてもよい
- `forecast_area_code` は MVP では任意
- 地域コード一覧 UI は将来対応

### source の扱い

MVP では API 取得は行わないが、将来拡張に備えて次を保存する。

- `source_type = manual`
- `source_name = manual`
- `source_fetched_at = null`

将来候補:

- `forecast_api`
- `historical_api`

---

## weather_code

内部値は enum / allow-list で管理する。

- `sunny` - 晴れ
- `cloudy` - くもり
- `rain` - 雨
- `snow` - 雪
- `other` - その他

MVP では天気選択肢を `晴れ / くもり / 雨 / 雪 / その他` に絞る。`storm` のような細かい荒天区分は持たず、必要なら将来の API 連携時に再検討する。

---

## 気温入力

- 単位は摂氏 `℃` 固定
- `temperature_high` / `temperature_low` はどちらも nullable
- 小数を許可する
- 両方入力されている場合のみ `temperature_high >= temperature_low` を検証する
- MVP の入力 UI は number input 相当を維持し、stepper やスライダーは将来検討とする

---

## API

### weather locations

- `GET /api/settings/weather-locations`
- `POST /api/settings/weather-locations`
- `PATCH /api/settings/weather-locations/{id}`
- `DELETE /api/settings/weather-locations/{id}`

### weather records

- `GET /api/weather-records?date=YYYY-MM-DD`
- `POST /api/weather-records`
- `PATCH /api/weather-records/{id}`
- `DELETE /api/weather-records/{id}`

---

## 画面導線

### 天気登録画面

- `/wear-logs/weather?date=YYYY-MM-DD`

表示内容:

- 指定日の日付
- 地域入力
- 天気
- 最高気温
- 最低気温
- メモ
- 保存 / 削除

同じ日付に複数地域の天気を持てるため、画面下部にその日の登録済み天気一覧も表示する。

### 着用履歴カレンダーの日付詳細モーダル

- その日の天気一覧を表示する
- 未登録なら `天気を登録`
- 登録済みなら `天気を編集`

### 着用履歴詳細

`服装の振り返り` とは別に `この日の天気` セクションを表示する。

表示例:

- 地域
- 天気
- 最高気温
- 最低気温
- メモ

---

## import / export

MVP では次を backup / restore 対象に含める。

- `user_weather_locations`
- `weather_records`

復元順:

1. `user_weather_locations`
2. `weather_records`

復元時の注意:

- 保存済み地域の `location_id` は新しい地域 ID へ張り替える
- 一時地域は `location_id = null` のまま復元する
- `location_name_snapshot` / `forecast_area_code_snapshot` により表示値は維持される
- 不正な `weather_code` は validation error
- `temperature_high < temperature_low` は validation error
- import 失敗時に既存データを削除しない

---

## 将来検討

- 天気予報 API 連携
- 過去天気 API 連携
- 地域コード一覧 UI
- 緯度経度検索 UI
- `wear_log_weather_records` のような関連テーブル
- カレンダーセルでの天気表示

---

## 予報API用地域コードの整理

- `user_weather_locations.forecast_area_code` を物理名として使う
- 論理名は `予報API用地域コード` とする
- 現時点では [weather.tsukumijima.net](https://weather.tsukumijima.net/) の city code を主対象とする
- `weather_records.forecast_area_code_snapshot` は、その保存時点の予報API用地域コード snapshot を表す
- この値は気象庁の `office` / `class10` / `class20` code と完全に同一とはみなさない
- 将来、気象庁 forecast JSON や別系統の予報 API を採用する場合は、専用コード列の追加、またはコードマッピングを検討する
- 過去天気 API では緯度経度が必要になる可能性があるため、`latitude` / `longitude` は nullable のまま将来用に維持する

---

## weather_code の扱い

- `weather_code` は単独天気と複合天気を含む正式な天気コードです。
- DB に保存するのは `weather_code` のみで、icon 名、fallback icon、`primary_weather`、`has_rain_possibility`、`accessory_icon` は保存しません。
- 表示時は code 定義から label / icon / fallback icon / `primary_weather` / `has_rain_possibility` / `accessory_icon` を導出します。
- `has_rain_possibility` は「実際に雨に当たった」ことではなく、雨対策が必要かもしれない天気かどうかを示します。
- `cloudy_then_rain` / `cloudy_with_occasional_rain` / `sunny_with_occasional_rain` のように雨を含むコードでも、主天気は自動で `rain` に寄せません。

### MVP で扱う weather_code

- 単独天気
  - `sunny`
  - `cloudy`
  - `rain`
  - `snow`
  - `other`
- 複合天気
  - `sunny_then_cloudy`
  - `cloudy_then_sunny`
  - `cloudy_then_rain`
  - `rain_then_cloudy`
  - `sunny_with_occasional_clouds`
  - `cloudy_with_occasional_rain`
  - `sunny_with_occasional_rain`

### MVP で除外する将来候補

- `thunder`
- `fog`
- `windy`
- `storm`

### 将来候補

- `was_exposed_to_rain: true | false | null`
  - true: 実際に雨に当たった
  - false: 雨の可能性はあったが実際には当たらなかった
  - null: 未記録・不明
  - 用途: 雨対策の検証や雨の日コーデ分析

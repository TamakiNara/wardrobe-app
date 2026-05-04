# Weather Records Specification

`weather_records` の責務、保存単位、source metadata、snapshot planned を整理する正本です。  
取得 API の詳細は [weather-fetching.md](./weather-fetching.md)、地域設定は [weather locations](../settings/weather-locations.md) を参照してください。

関連 docs:

- [weather-current-status.md](./weather-current-status.md)
- [weather-fetching.md](./weather-fetching.md)
- [weather locations](../settings/weather-locations.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)
- [import-export](../import-export.md)
- [weather and feedback](../recommendation/weather-and-feedback.md)

---

## 目的

`weather_records` は、日付 x 地域の天気情報をアプリ内で扱うための保存先である。  
current では「ユーザーが確認して保存した最終表示値」を持ち、予報取得値・実績取得値・手入力値の厳密な履歴までは保持しない。

着用時の体感や評価そのものは `weather_records` ではなく [weather and feedback](../recommendation/weather-and-feedback.md) 側で扱う。

この docs では以下を扱う。

- `weather_records` の責務
- 保存単位
- location snapshot
- `weather_code`
- `temperature_high` / `temperature_low`
- `source_type` / `source_name` / `source_fetched_at`
- 予報取得値・実績取得値・手入力値の保存方針
- precipitation 系の current / planned
- `raw_weather_code` / `raw_weather_text` の current / planned
- `forecast_snapshot` / `observed_snapshot` planned
- カレンダー weather status との関係
- import / export 影響

---

## current

### `weather_records` の正本としての意味

current では、`weather_records` は以下の意味を持つ。

- ユーザーが確認して保存した最終表示値
- `user_id x weather_date x location` の天気情報
- 予報取得・実績取得・手入力の結果がフォーム経由で保存される
- 予報取得・実績取得はフォーム反映のみで、自動保存しない
- 保存された値は、着用履歴・日付詳細・将来のカレンダー表示で参照される

補足:

- `weather_records` は current では「取得時データの完全な記録」ではない
- 予報値と実績値の snapshot 分離はまだ未実装

### 保存単位

論理的な保存単位は以下。

- `user_id`
- `weather_date`
- 地域

地域の扱い:

- 保存済み地域を使う場合:
  - `location_id`
  - `location_name_snapshot`
- 今回だけの地域を使う場合:
  - `location_id = null`
  - `location_name_snapshot`

current の運用方針:

- 同一日付・同一地域に対して重複 record を増やさず、既存 record を更新する
- 保存済み地域でも、その時点の表示名は `location_name_snapshot` として保持する

### location snapshot

current で保持している location snapshot は次。

- `location_id`
- `location_name_snapshot`
- `forecast_area_code_snapshot` nullable

意味:

- `location_id` は保存済み地域との関連
- `location_name_snapshot` は、その保存時点で画面上に採用した地域名
- `forecast_area_code_snapshot` は legacy fallback 互換のため当面残す

`latitude / longitude / timezone` は current では `weather_records` へ snapshot 保存していない。  
座標正本の詳細は [weather locations](../settings/weather-locations.md) を参照する。

### `weather_code`

current の caveat:

- forecast / historical は current PoC として hourly から朝 / 昼 / 夜を算出し、`daytime -> morning -> night -> daily` の順で代表天気を決める
- そのため、深夜から早朝だけ雨で日中はくもりから晴れだった日でも、`weather_code = rain` になって服装アプリ上は不自然な場合がある
- current の `weather_code` は、forecast / historical の両方で活動時間帯ベース代表天気への移行を始めている
- `time_block_weather` と `has_rain_in_time_blocks` は current では response / UI 補足表示のみで、`weather_records` には保存しない

`weather_code` は app 内部の正規化天気コードである。

役割:

- アイコン表示
- 簡易表示
- 検索・分析
- `has_rain_possibility` の導出

補足:

- Open-Meteo WMO code や JMA 天気文から変換して保存する
- 詳細な取得元表記や raw 値そのものは保存しない
- enum は OpenAPI / frontend / backend validation と整合している必要がある

変換ルールの正本:

- Open-Meteo / fallback provider の取得仕様:
  - [weather-fetching.md](./weather-fetching.md)
- weather icon / preview:
  - [weather-current-status.md](./weather-current-status.md)

planned:

- `weather_records.weather_code` は、将来は hourly を使った活動時間帯ベースの代表天気へ寄せる第一候補
- 第一候補の活動時間帯は `7:00-22:00`
- 代替案として、朝 / 昼 / 夜の分割集計や user setting 化を比較する
- 深夜だけ雨だった日は、`weather_code` を日中中心の `cloudy` や `sunny` 寄りにしつつ、降水量系は別軸で扱う
- forecast / observed で同じ代表天気算出ロジックを使う前提で設計する
- 朝 / 昼 / 夜の時間帯を先に算出し、そのうえで代表天気を決める案を比較する
- 第一候補の時間帯は `朝 6:00-10:00` / `昼 10:00-17:00` / `夜 17:00-22:00`
- 代表天気は「昼を基本にし、雨 / 雪 / 雷は `has_rain_possibility` へ反映する」案を第一候補にする
- 朝 / 昼 / 夜の各天気は、将来保存する場合でも直カラム化せず、まずは `forecast_snapshot` / `observed_snapshot` または `source_payload` に含める案を優先する

### 気温

current の主な保存対象:

- `temperature_high`
- `temperature_low`

意味:

- 予報値・実績値・手入力値のいずれも保存されうる
- current では値ごとの source は持たない
- 最終的にフォーム上に残っていた値が保存される

### source metadata

current の source metadata は以下。

- `source_type`
- `source_name`
- `source_fetched_at`

重要:

- `source_*` は record 全体の厳密な由来ではない
- current では「最後にフォームへ反映した取得元」を表す
- API 取得後に手で修正して保存されている可能性がある
- `weather_code` と気温が別の取得元由来で混在する可能性もある
- 厳密な値ごとの由来は snapshot planned で扱う

current で想定する `source_name`:

- `manual`
- `open_meteo_jma_forecast`
- `open_meteo_historical`
- `jma_forecast_json`
- `tsukumijima`

`source_type` の代表例:

- `manual`
- `forecast_api`
- `historical_api`

### current の保存フロー

#### 手入力

- ユーザーがフォームへ直接入力する
- 保存時はその値を `weather_records` に保存する
- source は `manual` として扱う

#### 予報取得

- forecast API 取得結果をフォームへ反映する
- ユーザーが内容を確認し、必要なら修正して保存する
- 保存時はフォーム上の最終値を `weather_records` に保存する
- source は current では `forecast_api / open_meteo_jma_forecast` など「最後に反映した予報取得元」を持つ

#### 実績取得

- historical API 取得結果をフォームへ反映する
- ユーザーが内容を確認し、必要なら修正して保存する
- 保存時はフォーム上の最終値を `weather_records` に保存する
- source は current では `historical_api / open_meteo_historical` など「最後に反映した実績取得元」を持つ

### current のメリット

- 実装が軽い
- UI が単純
- import / export 構造も小さく保てる

### current の caveat

- 予報由来と実績由来が同じ record に混ざる可能性がある
- source が record 全体の由来ではなく「最後にフォームへ反映した取得元」になる
- 予報値と実績値の差分を後から見られない

---

## precipitation 系

### current

以下は current では取得 response / UI 参考表示のみで、DB 保存しない。

- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `precipitation_hours`

扱い:

- forecast / observed 取得時の補助表示
- 保存 payload には含めない
- `weather_records` の直カラムにも保存しない

### planned

保存する場合の第一候補:

- `forecast_snapshot`
- `observed_snapshot`

に含める

方針:

- いきなり `weather_records` の直カラムへ増やさない
- UI / 分析用途が固まってから、直カラム化が本当に必要か再判断する

---

## `raw_weather_code` / `raw_weather_text`

### current

current では DB 保存しない。

用途:

- response 返却
- 画面確認用
- 変換挙動の目視確認

取得元ごとの補足:

- Open-Meteo:
  - `raw_weather_code`
- JMA / tsukumijima fallback:
  - `raw_weather_text`
  - `raw_telop`

### planned

変換検証や調査が必要になった場合は、以下を候補にする。

- snapshot へ保持
- `source_payload` のような構造へ保持

方針:

- 直カラム化は慎重に判断する
- current の段階では response / 画面表示までに留める

---

## snapshot planned

中期案として、`weather_records` に取得時データの snapshot を持つ案を第一候補とする。

### `forecast_snapshot`

保存候補:

- `weather_code`
- `time_block_weather`
- `has_rain_in_time_blocks`
- `temperature_high`
- `temperature_low`
- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `raw_weather_code`
- `source_name`
- `source_fetched_at`

### `observed_snapshot`

保存候補:

- `weather_code`
- `time_block_weather`
- `has_rain_in_time_blocks`
- `temperature_high`
- `temperature_low`
- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `precipitation_hours`
- `raw_weather_code`
- `source_name`
- `source_fetched_at`

### 目的

- 予報値と実績値を分ける
- 最終表示値と取得時データを分ける
- 後から差分確認できるようにする
- precipitation 系や raw 値を、最終保存値とは別に持てるようにする

### current との差

- current では未実装
- 今すぐ必須ではない
- source の意味を厳密にしたくなった段階で優先度が上がる

---

## カレンダー weather status との関係

current では、`weather_records` から日単位の weather status を導出してカレンダーセルに表示する。

候補:

- `none`
- `forecast`
- `observed`
- `manual`

導出例:

- `source_type = forecast_api` -> `forecast`
- `source_type = historical_api` -> `observed`
- `source_type = manual` -> `manual`

同日に複数の `weather_records` がある場合の代表 status 優先順位:

- `observed`
- `manual`
- `forecast`
- `none`

同じ status が複数ある場合の current の代表順:

1. default location の record
2. 保存済み地域のうち `display_order` が小さい record
3. それでも同順位なら `id` が小さい record

`location_id = null` の今回だけの地域は default location にならず、同じ status 内では保存済み地域より後で扱う。  
ただし、今回だけの地域しかない日はその record を代表として使う。

`display_order` は地域設定画面で並び替え可能であり、地域一覧の表示順だけでなくカレンダー代表天気の tie-breaker にも使う。  
地域設定の詳細は [weather-locations](../settings/weather-locations.md) を参照する。

表示方針の前提:

- カレンダー上の主アイコンは `weather_code` から出す
- source 状態は色やバッジで表す
- 凡例では `Sun` を代表アイコンにして、予報 / 実績 / 振り返りありの色の意味を説明する
- `manual` は内部分類として残しつつ、表示上は observed 寄せで扱ってよい
- day-level の振り返り有無は `CircleCheck` ではなく、slate / neutral 系の書き込みアイコンで区別する
- 日付詳細モーダルでは `手入力` を source status バッジで確認できるようにする
- `is_user_edited` は current では導入しない
- 月単位の未完了サマリは current では導入しない

詳細表示の方針は [weather-current-status.md](./weather-current-status.md) を参照する。

---

## import / export 影響

### current

current の backup / restore は、最終保存値を roundtrip 対象にする。

代表項目:

- `weather_date`
- `location_id`
- `location_name_snapshot`
- `forecast_area_code_snapshot`
- `weather_code`
- `temperature_high`
- `temperature_low`
- `memo`
- `source_type`
- `source_name`
- `source_fetched_at`

current では含めないもの:

- `precipitation`
- `rain_sum`
- `snowfall_sum`
- `precipitation_hours`
- `raw_weather_code`
- `raw_weather_text`

詳細は [import-export](../import-export.md) を参照する。

### planned

snapshot を採用する場合:

- `forecast_snapshot`
- `observed_snapshot`

を backup / restore 対象に含める

追加で必要になる整理:

- JSON schema version
- source_name allow-list の更新
- precipitation 系 validation
- snapshot を export にそのまま含めるか、正規化して展開するか

---

## 参照先

- 取得 API 詳細:
  - [weather-fetching.md](./weather-fetching.md)
- 地域設定:
  - [weather locations](../settings/weather-locations.md)
- 天気機能全体の現在地:
  - [weather-current-status.md](./weather-current-status.md)
- Open-Meteo 移行検討メモ:
  - [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)
- backup / restore:
  - [import-export](../import-export.md)
- 着用履歴フィードバックとの関係:
  - [weather and feedback](../recommendation/weather-and-feedback.md)

---

## pending / 要再判断

- `forecast_snapshot / observed_snapshot` をいつ実装するか
- precipitation 系を snapshot に含めた上で、直カラム化が必要か
- `raw_weather_code` / `raw_weather_text` を snapshot に含める粒度
- source 履歴を別テーブル化する必要があるか

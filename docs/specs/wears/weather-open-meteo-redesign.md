# Open-Meteo JMA API 再設計メモ

最終更新: 2026-05-03

## 目的

天気 API 方針を、JMA forecast JSON + 気象庁最新 CSV 中心から、Open-Meteo JMA API 中心へ再設計する。

今回のメモでは以下を整理する。

- current: すでに実装済みの到達点
- planned: Open-Meteo を本命にした今後の設計方針
- pending / 要再判断: まだ判断が必要な点

関連 docs:

- [weather current status](./weather-current-status.md)
- [weather forecast integration](./weather-forecast-integration.md)
- [weather historical integration](./weather-historical-integration.md)
- [weather records](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [import-export](../import-export.md)

---

## current

### 予報取得

- `POST /api/weather-records/forecast` がある
- current 実装では JMA forecast JSON を優先し、JMA コードがない場合は `forecast_area_code` を使って `tsukumijima` fallback を行う
- 取得結果はフォーム反映のみで、自動保存はしない
- `source_type = forecast_api`
- `source_name` は current で以下を取りうる
  - `jma_forecast_json`
  - `tsukumijima`

### 実績取得 PoC

- `POST /api/weather-records/observed` がある
- 気象庁の最新 CSV を使った PoC が未コミット差分として存在する
- current PoC では以下を取得対象にしている
  - `temperature_high`
  - `temperature_low`
  - `precipitation`
- `weather_code` は observed fetch では無理に反映しない
- `source_type = historical_api`
- `source_name = jma_latest_csv`

### 地域設定

- `user_weather_locations` は current 実装で複数のコード体系を抱えている
  - `forecast_area_code`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
  - `observation_station_code`
  - `observation_station_name`
- `latitude` / `longitude` は補助情報として nullable のまま保持している
- 地域名はユーザー向け表示名であり、予報区域名・観測地点名とは一致しないことがある

### weather_code

- `weather_code` は app 内の正規化値として維持している
- icon 名は DB 保存しない
- `primary_weather` / `has_rain_possibility` / icon は code 定義から導出する
- JMA 天気文用の正規化ルールや dev preview は current のまま使える

---

## Open-Meteo 採用判断

### 結論

Open-Meteo JMA API は、次段の本命候補として採用可能。

理由:

- 緯度経度ベースで forecast / historical を同じ location model で扱える
- 予報区域コードと観測所コードを別々にユーザーへ設定させる必要を減らせる
- daily / hourly の両方から、気温・降水量・weather code を同系統で取得できる
- Geocoding API を併用すれば、地域設定 UI もコード入力中心から脱却できる

ただし、以下は前提として明示する。

- free tier は non-commercial 向けで、商用利用には dedicated API / API key が前提
- JMA 専用 endpoint はあるが、Open-Meteo 自身も多くの用途では generic forecast API を推奨している
- weather code は Open-Meteo / WMO code なので、現在の app `weather_code` とは別物

---

## Open-Meteo 利用方針

### forecast

第一候補:

- `https://api.open-meteo.com/v1/jma`

候補パラメータ:

- `latitude`
- `longitude`
- `timezone`
- `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours`
- `hourly=weather_code,precipitation,precipitation_probability,wind_speed_10m`

整理:

- daily だけでも MVP の「代表天気・最高気温・最低気温・降水量」は取れる
- hourly を追加すると `のち / 時々 / 一時` の推定余地ができる
- まずは daily 中心で PoC し、複合天気推定が必要になったら hourly を追加するのが安全

### historical / observed

第一候補:

- Open-Meteo Historical Weather API

候補パラメータ:

- `latitude`
- `longitude`
- `timezone`
- `start_date`
- `end_date`
- `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max`

整理:

- forecast と同じ `latitude` / `longitude` で扱える
- 日最高 / 日最低 / 日降水量 / rain / snowfall / weather_code を同系統で取得できる
- 当日確定実績というより、昨日以前の補助取得に向く
- 当日値を「確定実績」として扱うには、更新タイミングと遅延の確認が必要

### geocoding

第一候補:

- `https://geocoding-api.open-meteo.com/v1/search`

取得候補:

- `name`
- `latitude`
- `longitude`
- `timezone`
- `country`
- `admin1`〜`admin4`

整理:

- 地域登録 UI は「地域名入力 -> 候補検索 -> 候補選択」で十分に成立する
- 主要都市の static list や緯度経度手入力より、最終的には geocoding 連携の方が運用負荷を下げやすい
- current 実装では、地域設定画面から geocoding 検索を行い、候補選択で `latitude` / `longitude` / `timezone` をフォームへ反映できる
- 候補詳細の DB 保存はまだ行わず、手入力欄は fallback として残す
- 将来保存を検討する候補:
  - `geocoding_provider`
  - `geocoding_place_id`
  - `country`
  - `admin1`
  - `admin2`

---

## 地域設定の推奨設計

### 推奨する正本

将来的な `user_weather_locations` の正本は、コードではなく座標ベースへ寄せる。

推奨フィールド:

- `name`
- `latitude`
- `longitude`
- `timezone`
- `is_default`
- `display_order`

### legacy として残す候補

段階移行中は以下を legacy として残す。

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `observation_station_code`
- `observation_station_name`

整理:

- すぐ削除はしない
- import / export 互換には残す
- Open-Meteo 移行後は UI の主入力から外す
- usage がなくなった段階で DB 削除を検討する

### 評価

`forecast_area_code` / `jma_*` / `observation_station_*` を同時に持つ current 設計より、`latitude` / `longitude` / `timezone` を正本にした方が予報と実績の整合が取りやすい。

---

## 地域登録 UI 案

### 推奨案

1. 地域名を入力
2. Open-Meteo Geocoding API で候補検索
3. 候補を選択
4. `latitude` / `longitude` / `timezone` を保存

表示イメージ:

- 地域名: `川口`
- 候補: `Kawaguchi, Saitama, Japan`
- 保存値:
  - `latitude`
  - `longitude`
  - `timezone=Asia/Tokyo`

### 代替案比較

- 主要都市 static list
  - 長所: 実装が軽い
  - 短所: 地点網羅性が低い
- 緯度経度手入力
  - 長所: API 依存がない
  - 短所: UX が悪い
- 既存の地域名だけ残して座標は後設定
  - 長所: 移行しやすい
  - 短所: 取得不可地域が残りやすい

結論として、最終形は Geocoding API 連携が最有力。

---

## weather_code 変換方針

### 基本方針

Open-Meteo の `weather_code` は WMO code なので、app 側 `weather_code` へ写像する。

### 推奨ステップ

1. まずは daily `weather_code` を代表天気として単純変換する
2. `has_rain_possibility` は Open-Meteo の `precipitation_probability` / `precipitation_sum` も補助的に使う
3. `then` / `with_occasional` は、必要になったら hourly から推定する

### 初期マッピングの考え方

- 晴天系 -> `sunny`
- 曇天系 -> `cloudy`
- 雨系 -> `rain`
- 雪系 -> `snow`
- 雷系 -> `thunder`
- 霧系 -> `fog`
- 強風系 -> `windy`
- 判断が難しいもの -> `other`

### pending

- `then` / `with_occasional` を hourly からどこまで推定するか
- `daily weather_code` だけで複合天気を作るか
- precipitation 系指標から `has_rain_possibility` をどこまで強めに出すか

---

## 既存実装の扱い

### JMA forecast JSON

- current 実装としては残す
- ただし本命からは外し、legacy / deprecated 候補として扱う
- Open-Meteo forecast PoC が成立したら、新規導線の優先 provider から外す

### tsukumijima fallback

- 当面は互換のため残す
- Open-Meteo 導入後は legacy fallback として位置付ける
- usage が減った段階で削除判断を行う

### JMA latest CSV PoC

推奨:

- 今回の本命としては採用しない
- 破棄ではなく「保留 / legacy PoC」として扱う

理由:

- Open-Meteo historical に寄せた方が、観測所コード運用を避けやすい
- ただし比較材料として一度作った PoC の知見は残した方がよい

### weather_code definitions / icons / weather_records

- `weather_code` 定義は継続利用できる
- icon / `has_rain_possibility` の導出方針も継続利用できる
- `weather_records` の current 保存構造も大きくは変えずに済む

---

## DB / import-export / OpenAPI 影響

### user_weather_locations

planned:

- `latitude`
- `longitude`
- `timezone`

legacy:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `observation_station_code`
- `observation_station_name`

### weather_records

current の保存方針は維持しつつ、source を Open-Meteo へ寄せる。

候補:

- `source_type = forecast_api`
- `source_name = open_meteo_jma_forecast`
- `source_type = historical_api`
- `source_name = open_meteo_historical`
- `source_name = manual`

### import / export

- 新しい正本は `latitude` / `longitude` / `timezone`
- legacy code 群は当面 restore 互換のため残す
- 旧 backup との互換を維持する

### OpenAPI

将来的に更新が必要な箇所:

- `WeatherLocationRecord`
- `WeatherLocationUpsertRequest`
- `WeatherForecast`
- `WeatherObserved`
- `source_name` の説明

今回は docs 整理のみで、schema 実装は未変更とする。

---

## pending / 要再判断

- Open-Meteo JMA endpoint と generic forecast endpoint のどちらを正本にするか
- hourly を最初から使うか
- historical を「昨日以前中心」に割り切るか
- `precipitation_amount` を `weather_records` に保存するか
- `forecast_snapshot` / `observed_snapshot` を separate に持つか
- legacy code 群の削除タイミング
- JMA latest CSV PoC を branch / patch として残すか、完全に閉じるか

---

## 推奨移行ステップ

1. JMA latest CSV PoC は本命採用せず、保留 / legacy PoC 扱いにする
2. Open-Meteo 採用方針 docs を追加する
3. `user_weather_locations` の正本を `latitude` / `longitude` / `timezone` へ寄せる設計を確定する
4. Open-Meteo forecast PoC を実装する
5. Open-Meteo historical PoC を実装する
6. forecast / observed の source を Open-Meteo 系へ寄せる
7. JMA forecast JSON / tsukumijima / JMA latest CSV を legacy 扱いへ整理する
8. 利用状況を見て不要カラム削除を検討する

---

## 外部参照

- [Open-Meteo JMA API](https://open-meteo.com/en/docs/jma-api)
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [Open-Meteo Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)

---

## 2026-05-03 coordinate-primary direction note

### 推奨

- `user_weather_locations` は既存テーブルを維持したまま使う。
- `weather_locations_v2` のような新テーブルは、現時点では作らない。
- Open-Meteo 用の正本は `latitude` / `longitude` / `timezone` に寄せる。

## 2026-05-03 coordinate groundwork implementation note

### current

- Open-Meteo 移行の土台として、weather location に `latitude` / `longitude` / `timezone` を持たせている。
- DB 上は段階移行を優先して nullable のままにしている。
- 地域設定 UI では手入力 fallback を残し、`Asia/Tokyo` を初期値として扱う。

### planned

- Geocoding API 経由で location を検索し、座標を自動反映する主導線を整える。
- legacy code 群は当面残しつつ、current の主入力からは外していく。

## 2026-05-03 Open-Meteo forecast PoC note

### current

- `POST /api/weather-records/forecast` の provider 優先順位を変更し、Open-Meteo forecast を最優先にしている。
- location の `latitude` / `longitude` がある場合は [https://api.open-meteo.com/v1/jma](https://api.open-meteo.com/v1/jma) を使う。
- query では `latitude` / `longitude` / `timezone` と `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum` を指定する。
- `weather_code` は daily weather code を代表天気として app `weather_code` に変換し、`raw_weather_text` は使わず `raw_weather_code` を返す。
- JMA forecast JSON / tsukumijima は当面 fallback として残す。

### planned

- WMO weather code と app `weather_code` の対応表を docs と tests でさらに明確化する。
- `precipitation_probability` や hourly data の利用は後続で検討する。

## 2026-05-03 Open-Meteo historical PoC note

### current

- `POST /api/weather-records/observed` は、`latitude` / `longitude` を使って Open-Meteo Historical API から実績相当値を取得する。
- endpoint は `https://archive-api.open-meteo.com/v1/archive` で、`latitude` / `longitude` / `timezone` / `start_date` / `end_date` / `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours` を指定する。
- `timezone` 未設定時は `Asia/Tokyo` を fallback にする。
- `weather_code` は forecast と同じ変換表を再利用する。
- `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考表示のみで、まだ DB 保存しない。
- JMA latest CSV PoC は本線に戻さず、Open-Meteo historical を優先する。

### planned

- 予報 / historical の source 情報を UI でどう見せるかは別途調整する。
- forecast snapshot / observed snapshot の分離は将来候補に残す。

## 2026-05-03 date-based fetch behavior note

### 推奨 UI 案

- Open-Meteo 移行後の取得 UI は、`予報を取得` と `実績を取得` を 1 セクションにまとめつつ、日付に応じて主導線を切り替える案 B を採用候補とする。
- 未来日は forecast を主ボタンにし、historical は disabled に寄せる。
- 過去日は historical を主ボタンにし、forecast は控えめ表示にする。

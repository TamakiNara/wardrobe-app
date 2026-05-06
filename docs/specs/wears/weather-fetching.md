# Weather Fetching Specification

天気取得 API の current 正本です。  
Open-Meteo forecast / historical、provider 選択、legacy history、日付に応じた取得 UI の方針をここにまとめます。

関連 docs:

- [weather-current-status.md](./weather-current-status.md)
- [weather-records.md](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## current

### forecast

- current PoC では Open-Meteo forecast の daily に加えて `hourly=weather_code,precipitation` を取得する
- hourly から `朝 6:00-10:00` / `昼 10:00-17:00` / `夜 17:00-22:00` の天気を算出する
- `weather_records.weather_code` に相当する代表天気は `daytime -> morning -> night -> daily` の順で決める
- `time_block_weather` と `has_rain_in_time_blocks` は response / UI 補足表示のみで、current では保存しない
- 取得結果表示では `代表天気` と `時間帯: 朝 / 昼 / 夜` を主に見せ、raw weather code は通常 UI で前面に出さない

- endpoint:
  - `POST /api/weather-records/forecast`
- source:
  - `source_type = forecast_api`
  - `source_name = open_meteo_jma_forecast`
- location:
  - `latitude / longitude / timezone` を使用
- Open-Meteo:
  - daily `weather_code` を代表天気として使う
  - `temperature_2m_max` / `temperature_2m_min` を最高気温 / 最低気温として使う
  - `precipitation` / `rain_sum` / `snowfall_sum` は参考値として扱う
- `raw_weather_text` は使わず、`raw_weather_code` は current では開発確認用の補助情報に留める

### observed / historical

- current PoC では Open-Meteo Historical の daily に加えて `hourly=weather_code,precipitation` を取得する
- hourly から `朝 6:00-10:00` / `昼 10:00-17:00` / `夜 17:00-22:00` の天気を算出する
- `weather_records.weather_code` に相当する代表天気は `daytime -> morning -> night -> daily` の順で決める
- `time_block_weather` と `has_rain_in_time_blocks` は response / UI 補足表示のみで、current では保存しない
- 取得結果表示では `代表天気` と `時間帯: 朝 / 昼 / 夜` を主に見せ、raw weather code は通常 UI で前面に出さない
- endpoint:
  - `POST /api/weather-records/observed`
- source:
  - `source_type = historical_api`
  - `source_name = open_meteo_historical`
- location:
  - `latitude / longitude / timezone` を使用
- Open-Meteo Historical:
  - daily `weather_code` を代表天気として使う
  - `temperature_2m_max` / `temperature_2m_min` を最高気温 / 最低気温として使う
  - `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考値として扱う
- timezone 未設定時は `Asia/Tokyo` を fallback とする

### 共通方針

- 予報取得・実績取得ともに自動保存しない
- 取得結果はフォーム反映のみ
- 保存時に、フォーム上の最終値を `weather_records` へ保存する
- precipitation 系は current では DB 保存しない
- 降水量系は取得結果 UI で参考表示のみ行い、保存 payload には含めない
- カレンダー表示では `weather_records.source_type` から `none / forecast / observed / manual` の weather status を導出する
- カレンダーセルでは天気アイコンを主表示にし、source 状態は色で表す
- カレンダー凡例では `Sun` を代表アイコンにして、予報 / 実績 / 手入力 / 振り返りありを説明する
- 日付詳細モーダルでは、天気ごとに `予報 / 実績 / 手入力` の status バッジを表示する
- `user_weather_locations` の座標正本、Geocoding、legacy code fields の正本は [weather locations](../settings/weather-locations.md)
- `weather_records` の保存方針、source metadata、snapshot planned の正本は [weather-records.md](./weather-records.md)

---

## provider selection

### forecast

1. `latitude / longitude` がある場合:
   - Open-Meteo Forecast を使う
   - `source_name = open_meteo_jma_forecast`
2. `latitude / longitude` がない場合:
   - 取得不可

### observed

1. `latitude / longitude` がある場合:
   - Open-Meteo Historical を使う
   - `source_name = open_meteo_historical`
2. それ以外:
   - 取得不可

補足:

- JMA latest CSV PoC は current 本線に戻さない
- JMA latest CSV / 観測所コードの経緯は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) に残す

---

## date-based fetch UI

### 未来日

- `予報を取得` を主導線にする
- `実績を取得` は disabled
- 補足:
  - `未来日のため、実績データはまだ取得できません。`

### 今日

- `予報を取得` を主導線にする
- `実績を取得` も可能だが、未確定注意を出す
- 補足:
  - `今日の実績は未確定の値を含む場合があります。必要に応じて翌日以降に再取得してください。`

### 過去日

- `実績を取得` を主導線にする
- `予報を取得` は disabled
- 補足:
  - `過去日は実績データの取得を推奨します。`

---

## weather_code 変換

- Open-Meteo の WMO weather code を app `weather_code` に変換する
- current では daily `weather_code` を代表天気として使う
- `then` / `with_occasional` のような複合天気は current では生成しない
- 必要になったら hourly data から推定する

WMO から app `weather_code` への代表的な変換:

- `0`, `1` -> `sunny`
- `2`, `3` -> `cloudy`
- `45`, `48` -> `fog`
- drizzle / rain / showers 系 -> `rain`
- snow / snow grains / snow showers 系 -> `snow`
- thunderstorm / hail 系 -> `thunder`

---

### daily `weather_code` の限界

- current では Open-Meteo daily の `weather_code` をそのまま代表天気として使う暫定運用
- これは「日全体の代表天気」であり、服装アプリで見たい活動時間帯の天気とずれる場合がある
- 深夜から早朝だけ雨で、日中はくもりから晴れだった日でも、daily 集計では `rain` に寄ることがある
- この限界は forecast / historical の両方で同様に起こりうる

---

## legacy

### JMA forecast JSON

- forecast runtime fallback としては使わない
- 過去 record の `source_name` や import / export 互換のため、legacy history として扱う
- 日本語天気文正規化の知見は残す
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

### tsukumijima

- forecast runtime fallback としては使わない
- 既存 `forecast_area_code` と過去 record の `source_name` を扱う legacy history として残す
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

### JMA latest CSV PoC

- observed の本線採用はしない
- legacy PoC / history として残す
- 詳細は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## planned

- Open-Meteo hourly を使って、活動時間帯ベースの代表天気を算出する
- forecast / historical の両方で同じ helper を使い、朝 / 昼 / 夜と代表天気の算出を共通化する
- 第一候補の活動時間帯は `7:00-22:00`
- 代替案として、朝 / 昼 / 夜の分割集計も比較する
- user setting 化は要再判断とし、まずは固定時間帯での PoC を優先する
- 深夜だけ雨だった日は、weather_code を日中中心の `cloudy` や `sunny` 寄りにしつつ、`precipitation` / `rain_sum` は別軸で扱う
- forecast / historical で同じ代表天気ロジックを使い、source の違いだけを分ける
- `has_rain_possibility` は weather_code 由来を維持しつつ、将来は hourly 降水や降水量も補助情報として使う余地を残す
- `was_exposed_to_rain` は wear log feedback 側の体験データとして扱い、weather side から自動確定しない
- 朝 / 昼 / 夜の候補時間帯は、第一候補として `朝 6:00-10:00` / `昼 10:00-17:00` / `夜 17:00-22:00`
- `0:00-6:00` の深夜帯は、服装判断からは基本除外する
- 各時間帯の代表天気は、単純な最頻値ではなく「時間帯内の最多傾向を基本にしつつ、snow / thunder と一定以上の rain を優先する」方針を第一候補にする
- `weather_records.weather_code` に入れる代表天気は、昼の天気を基本にしつつ、雨 / 雪 / 雷は `has_rain_possibility` 側へ反映する案を第一候補にする
- これは「代表天気」と「雨対策の必要性」を分ける案であり、服装アプリの体感に最も寄せやすい

- Open-Meteo hourly を使った複合天気推定
- precipitation 系を DB 保存するかの再判断
- `forecast_snapshot / observed_snapshot` を使って、取得時データと最終保存値を分ける
- source の見せ方や日付別 fetch UI を、実装後の目視確認に基づいて調整する

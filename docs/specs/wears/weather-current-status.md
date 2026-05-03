# Weather Current Status

天気機能まわりの current / planned / 要再判断を、実装の到達点ベースでまとめる。
個別仕様の正本は関連 docs を参照し、このファイルは全体の現状整理と次の実装順の共有を目的とする。

関連 docs:

- [weather-records.md](./weather-records.md)
- [weather-forecast-integration.md](./weather-forecast-integration.md)
- [weather-historical-integration.md](./weather-historical-integration.md)
- [weather locations](../settings/weather-locations.md)
- [weather and feedback](../recommendation/weather-and-feedback.md)
- [import-export](../import-export.md)

---

## current

### 手動天気登録

- `weather_records` を正本として、日付 x 地域単位で天気を登録する。
- 保存済み地域と今回だけの地域を扱える。
- 今回だけの地域は `user_weather_locations` に追加せず、`weather_records` 側へ snapshot として保存する。
- `location_id` は nullable で、今回だけの地域では `null` を許容する。
- `location_name_snapshot` を保存し、地域設定変更後も当時の表示名を残せる。
- 最高気温 / 最低気温 / メモ / source metadata は `weather_records` に保存する。
- 天気取得後も自動保存はせず、フォーム反映後にユーザーが保存する。

### 地域設定

- `user_weather_locations` を持つ。
- 地域名はユーザー向け表示名であり、市区町村の正規コードではない。
- デフォルト地域を設定できる。
- `latitude` / `longitude` / `timezone` を保持できる。
- Open-Meteo Geocoding API を使った `地域を検索` 導線があり、候補選択で `latitude` / `longitude` / `timezone` をフォームへ反映できる。
- Geocoding で候補選択しても、地域名が入力済みなら上書きせず、位置情報だけ更新する。
- 緯度 / 経度 / タイムゾーンの手入力欄は fallback として残している。
- JMA 予報区域コードとして以下を保持できる。
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
- `forecast_area_code` は `weather.tsukumijima.net` 用の legacy code として残している。
- UI の主入力は JMA 予報区域であり、`forecast_area_code` は通常入力から外している。

### weather_code

- `weather_condition` から `weather_code` へのリネームは完了している。
- 単独天気と複合天気を扱う。
- DB に icon 名は保存しない。
- `icon` / `has_rain_possibility` / `primary_weather` は `weather_code` 定義から導出する。
- MVP の `weather_code` には `thunder` / `fog` / `windy` を含める。
- `storm` / 荒天はまだ正式採用していない。
- 変換できない表記は `other` に落とす。

### 天気アイコン

- Lucide icon を使う。
- 雨可能性がある天気では、傘アイコンを補助表示できる。
- カレンダーセルには天気アイコンを表示していない。
- 現在の主な表示箇所は以下。
  - 天気登録画面
  - 日付詳細モーダル
  - 着用履歴詳細

### 予報取得

- `POST /api/weather-records/forecast` がある。
- request は `weather_date` と `location_id` のみで、provider は backend 側で自動選択する。
- JMA コードが両方ある地域では JMA forecast JSON を優先する。
- JMA コードがなく、legacy `forecast_area_code` がある地域では `tsukumijima` fallback を使う。
- JMA コードも legacy code もない地域では取得不可。
- 取得結果はフォーム反映のみで、自動保存しない。
- `source_type = forecast_api`
- `source_name` は以下のどちらかになる。
  - `jma_forecast_json`
  - `tsukumijima`

### JMA forecast JSON

- `office_code` を使って `forecast/{office_code}.json` を取得する。
- `region_code` で対象地域の天気文を探す。
- JMA の日本語天気文を既存 `weather_code` へ正規化する。
- `raw_weather_text` は API response / frontend state / 取得結果表示に使う。
- `raw_weather_text` は DB 保存していない。
- 表示時は以下の整形を行う。
  - 全角スペースを半角スペースへ変換
  - 連続スペースを 1 つにまとめる
  - 前後空白を trim する
- `weather_code` は簡易表示・アイコン・分析用の正規化値、`raw_weather_text` は取得元の詳細表記として役割を分けている。
- JMA 天気文の時間帯入り表記は、既存 `weather_code` に安全に寄せられるものだけ正規化する。
- `から` や時間帯語を挟む遷移表記でも、意味を崩さず既存 code に寄せられる場合のみ吸収する。
- 単独の `雷` / `霧` / `強風` は `thunder` / `fog` / `windy` へ正規化する。
- 雨雪混在・雪混じり複合天気や荒天は今回も `other` のままとする。
- 変換ルールは、実データで頻出する表記を見ながら小さく追加していく。

### tsukumijima fallback

- 現在は fallback として残している。
- JMA コード未設定の既存地域では引き続き利用される。
- `forecast_area_code` は tsukumijima fallback / legacy backup 互換のため当面残す。

### 気温取得

- JMA forecast JSON では、気温 area が `region_code` ではなく代表地点 code で返ることがある。
- そのため `region_code` 直一致だけでは気温を取れない。
- current 実装では次の順で解決する。
  - daily `temps` を優先
  - 代表地点 code への対応づけを行う
  - 必要に応じて weekly `tempsMin` / `tempsMax` を fallback する
- 安全に取得できない場合は `temperature_high` / `temperature_low` を `null` のまま返す。
- 天気取得成功後、最高気温 / 最低気温の両方が `null` の場合は、画面に以下の補足を出す。
  - `気温は取得できませんでした。必要に応じて手入力してください。`
- 片方だけ取得できた場合は、取得できた値だけ反映し、追加メッセージは出さない。

### 実績取得との分離

- 予報取得と実績取得は別系統として扱う。
- 現状は予報取得のみ実装済みで、実績取得は未実装。
- 予報用コードと実績用観測所コードは別物という整理で進めている。

### 雨可能性と実際の雨体験の分離

- `has_rain_possibility` は `weather_code` から導出する。
- これは「雨対策が必要かもしれない」ことを示す補助情報であり、実際に雨に当たったかどうかは別概念。
- 実際に雨に当たったかを保存するフィールドは current では持っていない。

---

## planned

### tsukumijima の段階削除

- 現在は fallback として残す。
- 将来的には削除候補。
- 既存 `weather_records` の `source_name = tsukumijima` は履歴として残す。
- import / export 互換は維持する。

### 実績取得

- 実績取得は予報取得とは別系統で扱う。
- MVP 候補は気象庁の最新気象データ CSV。
- 実績取得には観測所コードが必要になる想定。
- 候補:
  - `observation_station_code`
  - `observation_station_name`
- 予報用コードと実績用コードは別物として共存させる。

### 雨体験フィードバック

- `has_rain_possibility` は `weather_code` 由来の補助情報として維持する。
- 実際に雨に当たったかどうかは将来別途扱う。
- 候補:
  - `was_exposed_to_rain`
- 保存先候補:
  - 着用履歴
  - フィードバック系データ

### raw_weather_text / source_payload

- 今は DB 保存しない。
- 将来的に取得元表記やレスポンス要約を保存したくなったら検討する。
- 候補:
  - `raw_weather_text`
  - `source_payload`

---

## pending / 要再判断

- JMA 天気文の `weather_code` 変換ルールをどこまで増やすか
- `一時` 系を `時々` 系として扱う範囲
- `storm` / 荒天を `weather_code` に入れるか、環境情報として分けるか
- カレンダーセルに天気アイコンを出すか
- 実績取得でどの観測所を使うか
- 観測所をユーザーに選ばせるか、自動推定するか
- 予報値と実績値を同一 `weather_record` に上書きするか、別 snapshot として持つか
- `raw_weather_text` を保存するか
- tsukumijima fallback をいつ削除するか

---

## 今後の推奨実装順

1. JMA weather text 変換ルールの小規模追加
2. JMA 取得後の目視確認と運用確認
3. tsukumijima fallback の利用状況確認
4. 実績取得 PoC
5. `user_weather_locations` への観測所コード追加
6. 実績取得 UI
7. `was_exposed_to_rain` などのフィードバック追加
8. tsukumijima fallback 削除判断

---

## メモ

- このファイルは current / planned / 要再判断の整理用ドキュメントであり、個別の request / response / DB 定義の正本は関連 docs と OpenAPI を参照する。
- 予報用コードと実績用観測所コードは別体系のまま進める前提とする。
---

## 2026-05-02 weather icon preview note

### current

- `snow` のメインアイコンは `Snowflake` を優先し、`CloudSnow` は fallback 側へ回す。
- `thunder` / `fog` / `windy` は current の `weather_code` として扱い、Lucide `CloudLightning` / `CloudFog` / `Wind` を割り当てる。
- 雨系では `Umbrella` を補助アイコンとして使い、雨対策が必要かもしれないことを示す。
- `/dev/weather-preview` は weather_code / icon / Open-Meteo WMO code 変換 / JMA 正規化の目視確認用ページとして使い、通常導線には載せない。

### pending / 要再判断

- `rain_or_snow` / `snow_with_occasional_rain` / `cloudy_with_occasional_snow` / `sunny_with_occasional_snow` は候補止まり。
- `storm` / 荒天は current の `weather_code` には入れず、注意情報として分けるかを後続で再判断する。
- 最高 / 最低気温に `Thermometer` を付ける案は、情報量を増やしすぎるため今回は見送っている。

## 2026-05-03 Open-Meteo redesign note

### planned

- JMA forecast JSON と最新 CSV を組み合わせる案は、本命候補から外す。
- 今後の本命は Open-Meteo JMA forecast / historical API とする。
- provider 再設計の全体方針は [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) に集約する。

## 2026-05-03 coordinate-primary direction note

### planned

- Open-Meteo 移行後の地域設定正本は `latitude` / `longitude` / `timezone` に寄せる。
- `forecast_area_code` / `jma_*` / `observation_station_*` は current 実装や legacy PoC の互換用として残す。
- 地域設定 UI は最終的に Geocoding API を主導線とし、static list や手入力は fallback として扱う。

## 2026-05-03 coordinate groundwork implementation note

### current

- 地域設定では JMA 系 legacy 項目を維持したまま、`latitude` / `longitude` / `timezone` を保存できる。
- latitude / longitude は片方だけ保存できないようにしている。
- timezone は Open-Meteo の daily 集計と日付境界に関わるため、初期値は `Asia/Tokyo` を基本とする。

### planned

- latitude / longitude / timezone を持つ地域を Open-Meteo 取得の主導線に寄せる。
- Geocoding API による地点検索と自動反映を通常導線にする。

## 2026-05-03 Open-Meteo forecast PoC note

### current

- 天気登録画面の `予報を取得` は、保存済み地域に `latitude` / `longitude` がある場合は Open-Meteo forecast を優先する。
- Open-Meteo forecast の source は `source_type = forecast_api` / `source_name = open_meteo_jma_forecast`。
- `weather_code` / 最高気温 / 最低気温をフォームへ反映する。
- `precipitation` / `rain_sum` / `snowfall_sum` は参考値表示のみで、今回は DB 保存しない。
- `raw_weather_text` は Open-Meteo では使わず、代わりに `raw_weather_code` を補足表示に使う。

### planned

- Open-Meteo forecast の hourly data を使い、必要なら将来的に `then` / `with_occasional` を推定する。
- forecast 取得結果と historical 取得結果の UI をもう少し明確に整理する。

## 2026-05-03 Open-Meteo historical PoC status note

### current

- 天気登録画面の `実績を取得` は、保存済み地域に `latitude` / `longitude` がある場合は Open-Meteo Historical を使う。
- 取得時は `weather_code` / 最高気温 / 最低気温 / `source_type` / `source_name` / `source_fetched_at` をフォームへ反映する。
- `precipitation` / `rain_sum` / `snowfall_sum` / `precipitation_hours` は参考値として表示する。
- JMA latest CSV PoC は current 本線に戻さず、Open-Meteo historical を優先する。

### planned

- 予報値と実績値を weather_record 上でどう分離するかは、snapshot 設計を含めて後続で整理する。
- `precipitation_amount` などの保存は将来候補として別途検討する。

## 2026-05-03 weather fetch date-based UI note

### current

- 天気登録画面の `天気データを取得` セクションには、`予報を取得` と `実績を取得` の 2 ボタンを並べている。
- 取得結果はどちらもフォーム反映のみで、自動保存はしない。
- 保存時の `source_type` / `source_name` は、最後にフォームへ反映した取得元を表す current 設計のまま。
- 対象日付が未来日・今日・過去日のどれかに応じて、予報取得 / 実績取得の主導線と disabled 状態を出し分けている。

### planned

- 今日の historical は未確定値を含む可能性があるため、注意文を追加する。
- 過去日の forecast は控えめ表示または無効化し、実績取得を主導線に寄せる。

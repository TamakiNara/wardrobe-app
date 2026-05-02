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
- MVP の `weather_code` には雷 / 霧 / 強風 / 荒天は入れていない。
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
- 雷 / 霧 / 強風 / 荒天を `weather_code` に入れるか、環境情報として分けるか
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

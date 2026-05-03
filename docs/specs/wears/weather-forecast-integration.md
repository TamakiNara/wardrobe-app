# Weather Forecast Integration

着用記録で使う天気予報データの取得元と、今後の移行方針を整理する。
今回は実装ではなく、current の JMA forecast JSON / tsukumijima fallback を整理しつつ、Open-Meteo forecast へ寄せる再設計メモを正本として残す。

---

## 目的

- 日本向けの予報取得を、第三者 API 依存から気象庁由来データ中心へ寄せる
- 予報用コードの意味を明確にし、`forecast_area_code` の曖昧さを解消する
- `weather_code` / `has_rain_possibility` / source metadata と整合する取得方針を定める

---

## current

MVP の current 実装では、forecast endpoint が provider を自動選択する。

- JMA コードが両方ある地域:
  - `https://www.jma.go.jp/bosai/forecast/data/forecast/{jma_forecast_office_code}.json`
  - `jma_forecast_region_code` を対象区域として使う
  - `source_name = jma_forecast_json`
- JMA コードがなく legacy `forecast_area_code` がある地域:
  - `https://weather.tsukumijima.net/api/forecast/city/{forecast_area_code}`
  - `forecast_area_code` を fallback 用 city code として扱う
  - `source_name = tsukumijima`
- どちらのコードもない地域:
  - forecast 取得不可

### current の長所

- livedoor 天気互換で構造が比較的単純
- 日本語 `telop` を直接使える
- MVP 実装済みで、地域設定 UI も成立している

### current の課題

- 第三者 API 依存であり、長期の正本候補としては弱い
- ユーザーが選ぶ地域名と予報区域の関係が分かりにくい
- `forecast_area_code` が「表示用の地域コード」なのか「取得 URL 用コード」なのか曖昧

---

## planned

### 本命候補

予報取得の本命候補は、気象庁サイトの forecast JSON とする。

- URL 例:
  - `https://www.jma.go.jp/bosai/forecast/data/forecast/{office_code}.json`
- 参照マスタ:
  - `https://www.jma.go.jp/bosai/common/const/area.json`

### 気象庁 forecast JSON で分かったこと

- `forecast/{code}.json` の `{code}` は、実質的に府県予報区に対応する `office code`
- ユーザーが選ぶ地域コードと、取得 URL に使う `office code` は同一とは限らない
- `area.json` には少なくとも以下の区分がある
  - `centers`
  - `offices`
  - `class10s`
  - `class15s`
  - `class20s`
- 一次細分区域として扱いやすいのは `class10`
- forecast JSON では、今日 / 明日 / 明後日の区域予報、降水確率、代表地点の気温、週間寄りの予報が取得できる

### 取得対象として想定する項目

MVP 後の JMA forecast JSON では、まず以下を取得対象とする。

- 日付
- 天気コード
- 天気名テキスト
- 降水確率
- 最高 / 最低気温

### 気温 block の構造メモ

- JMA forecast JSON の気温 block は、予報区域 code ではなく代表地点 code を返すことがある
- 例:
  - `jma_forecast_region_code = 110010`（埼玉県南部）
  - 気温 block 側の area code は `43241`（さいたま）になる
- そのため、気温取得では `region_code` の完全一致だけで探すと見つからない場合がある
- current 実装では、まず同一 code を優先し、見つからない場合は区域予報 block と代表地点 block の並び順対応で代表地点を解決する
- 並び順対応が使えない場合は、無理に補完せず `temperature_high` / `temperature_low = null` のまま返す

### JMA forecast JSON の長所

- 気象庁サイト由来のデータを直接使える
- 第三者 API 依存を減らせる
- 日本向け予報データの正本に近い

### JMA forecast JSON の注意点

- 安定 API というより、気象庁サイト表示用 JSON とみなす前提で扱う
- `office code` と `class10` など、コード体系の理解が必要
- 週間ブロックや代表地点コードの構造は単純ではない
- 将来の仕様変更リスクを考え、取得・変換ロジックは疎結合に保つ

---

## 地域コード設計

### 推奨

`forecast_area_code` をそのまま延命するのではなく、JMA 用に役割を分ける。

推奨カラム:

- `jma_forecast_region_code`
- `jma_forecast_office_code`

### 意味

- `jma_forecast_region_code`
  - ユーザーが設定画面で選ぶ予報区域コード
  - 第一候補は `class10`
  - 一次細分区域がない地域では `office code` 自体を入れることを許容する
- `jma_forecast_office_code`
  - `forecast/{code}.json` を取得するための URL 用コード
  - `area.json` から `region -> office` を解決して保持する

### なぜ 2 本に分けるか

- ユーザーが選ぶ地域と、取得 URL 用コードの責務が違うため
- `forecast_area_code` に tsukumijima city code と JMA code を混在させると意味が崩れるため
- 将来、予報 UI と取得処理を別々に変更しやすくするため

---

## forecast_area_code の扱い

### legacy

`forecast_area_code` は、段階移行中は legacy 扱いにする。

- 既存 DB / 既存 backup / 既存 UI との互換のため当面は残す
- ただし新設計では「最終的な正本カラム」にはしない
- docs 上では `legacy forecast region code` とみなす

### 移行中の読み替え

JMA へ切り替える初期段階では、既存 `forecast_area_code` から以下のように解決する。

- `forecast_area_code` が `class10` に対応するなら、その parent の `office code` を解決する
- `forecast_area_code` 自体が `office code` 相当なら、そのまま `jma_forecast_office_code` 相当として扱う

この読み替えは移行補助であり、最終的には `jma_forecast_region_code` / `jma_forecast_office_code` を明示的に持つ構成へ寄せる。

---

## weather_code 変換方針

JMA forecast JSON では、数値コードよりも日本語の `weathers` テキストを主に使って `weather_code` へ正規化する前提とする。

### 直接吸収しやすいパターン

- `晴`
- `曇`
- `雨`
- `雪`
- `晴のち曇`
- `曇のち晴`
- `曇のち雨`
- `雨のち曇`
- `晴時々曇`
- `曇時々雨`
- `晴時々雨`

### 当面 `other` に落としてよいもの

- `storm` / 荒天
- `雨か雪`
- `雪時々雨`
- `曇一時雪`

### 方針

- まずは既存 `weather_code` の範囲で吸収する
- 未対応パターンは `other` に落とす
- 取りこぼしが多い場合のみ、新しい `weather_code` の追加を再検討する

`has_rain_possibility` は、現行どおり `weather_code` 派生でよい。

---

### weather_code と raw_weather_text の役割分離

- `weather_code`
  - アイコン表示、簡易表示、検索、分析、`has_rain_possibility` 判定に使う正規化値
  - JMA の詳細表記はここへそのまま保存せず、既存 enum に寄せて扱う
- `raw_weather_text`
  - 取得元の詳細表記を保持する表示用値
  - 取得結果確認、変換ルール改善、将来の `source_payload` / `raw_weather_text` 保存検討に使う

### JMA 時間帯入り表記の扱い

- JMA の `weathers` には `晴れ　夜のはじめ頃　くもり` のような時間帯入り表記が含まれる
- `weather_code` 変換時は、全角スペースを半角スペースへ寄せたうえで `晴れ -> 晴`、`くもり / 曇り -> 曇` などの揺れを吸収する
- `晴れ 夜のはじめ頃 くもり` のような表記は `sunny_then_cloudy` に正規化する
- 単独の `雷` / `霧` / `強風` は `thunder` / `fog` / `windy` に正規化する
- 一方で、時間帯入りの詳細情報そのものは `raw_weather_text` として残す

### raw_weather_text の表示整形

- 表示時は全角スペースを半角スペースへ変換する
- 連続スペースは 1 つにまとめる
- 前後空白は trim する
- 例:
  - `晴れ　夜のはじめ頃　くもり`
  - 表示: `晴れ 夜のはじめ頃 くもり`

### 保存方針

- 今回は `raw_weather_text` を DB 保存しない
- forecast API response / frontend state では保持し、`取得した予報表記` の表示に使う
- 将来的に必要になった場合のみ、以下を別途検討する
  - `raw_weather_text`
  - `source_payload`

## source metadata

### current

- `source_type = forecast_api`
- `source_name = tsukumijima`

### planned

JMA forecast JSON を使う場合の `source_name` は以下を推奨する。

- `source_type = forecast_api`
- `source_name = jma_forecast_json`

### 併存期間に許容する source_name

- `manual`
- `tsukumijima`
- `jma_forecast_json`

`source_type` は当面 `manual / forecast_api / historical_api` のままでよい。

---

## 段階移行案

### Phase 1

- docs 整理
- JMA forecast JSON の取得仕様確認
- `forecast_area_code` の legacy 化方針を明文化

### Phase 2 PoC

- backend に `FetchJmaWeatherForecastService` を追加する
- `office_code` / `region_code` を service 引数で直接受ける
- JMA forecast JSON の `weathers` を既存 `weather_code` へ正規化できるか確認する
- `source_name = jma_forecast_json` の payload を返す
- まだ UI / DB / 既存 forecast API の本番切替は行わない

### Phase 2

- backend に JMA forecast fetch service を追加
- 既存 `forecast_area_code` から `office code` を解決して取得検証する
- UI はまだ切り替えない

### Phase 3

- `user_weather_locations` に JMA 用コードを追加
- 地域設定 UI を JMA 前提へ切り替える
- 予報取得は JMA を優先し、tsukumijima は fallback 扱いにする

### Phase 4

- tsukumijima 取得を削除する
- `forecast_area_code` は import 互換用の legacy 項目としてのみ扱う

---

## 要再判断

- `jma_forecast_region_code` の primary target を常に `class10` に固定するか
- 週間予報ブロックや代表地点気温を MVP 後のどの段階で使うか
- `weather_code` を増やすか、`other` へ寄せるか
- `forecast_area_code_snapshot` の rename をいつ行うか

---

## 参照

- 気象庁 forecast JSON:
  - `https://www.jma.go.jp/bosai/forecast/data/forecast/{office_code}.json`
- 気象庁 area 定義:
  - `https://www.jma.go.jp/bosai/common/const/area.json`


---

## 2026-05-02 implementation note

### current

- backend には `FetchJmaWeatherForecastService` の PoC がある
- `user_weather_locations` は `jma_forecast_region_code` / `jma_forecast_office_code` を保存できる
- `POST /api/weather-records/forecast` は JMA コードがある地域で `jma_forecast_json` を優先し、JMA 未設定かつ legacy `forecast_area_code` がある地域では `tsukumijima` fallback を使う
- JMA コードが片方だけの地域と、JMA / legacy の両方がない地域は forecast 取得不可とする

### planned

- forecast endpoint は今後、JMA コードがある場合に `jma_forecast_json` を優先する
- `forecast_area_code` は fallback / import 互換の legacy code として段階的に後退させる


---

## 2026-05-02 weather text normalization note

### current

- `weather_code` は簡易表示 / アイコン / 分析用の正規化値
- `raw_weather_text` は取得元の詳細表記を確認するための表示用文字列
- JMA の時間帯入り天気文は、既存 `weather_code` に安全に寄せられるものだけ正規化する
- 表示用 `raw_weather_text` は全角スペースを半角化し、連続スペースを 1 つにまとめて trim する
- 時間帯や補足表現を挿んでも既存 code に安全に寄せられるものは吸収する
  - `晴れ 夜のはじめ頃 くもり`
  - `晴れ 夕方 から くもり`
  - `くもり 昼過ぎ から 晴れ`
  - `くもり 夕方 から 雨`
  - `雨 昼過ぎ から くもり`
- `晴れ 一時 雨` / `くもり 一時 雨` は既存の `with_occasional_rain` 系へ寄せる

### other のまま残す表記

- 雨を含む複合の雷表記
- 雨を含む複合の霧表記
- 雨を含む複合の強風表記
- 荒天
- 雨か雪
- 雪時々雨
- 雪混じり複合天気

### planned

- 実データで頻出する JMA 表記を見ながら、既存 `weather_code` に安全に寄せられるものだけ追加する
- `raw_weather_text` は将来的に source_payload や raw code 保存と合わせて見直す余地を残す
---

## 2026-05-02 weather icon adjustment note

### current

- `weather_code` は簡易表示と分析用の正規化値のままとし、icon 名は DB へ保存しない
- `cloudy` は weather_code 名と Lucide `Cloud` の組み合わせを維持し、dev preview 側で icon 名も並記して混同を避ける
- `snow` は単独天気として `Snowflake` を優先し、`CloudSnow` は雪混じりや fallback 側の候補として扱う
- `thunder` / `fog` / `windy` は current の weather_code とし、Lucide `CloudLightning` / `CloudFog` / `Wind` を割り当てる
- 雨系では `CloudRain` / `CloudSunRain` などのメインアイコンを「天気そのもの」、`Umbrella` を「雨対策の補助」として分けて描画する
- `Umbrella` は blue / sky 系トーンで表示し、雨アイコンと意味を揃えつつ補助表示であることを維持する

### pending / 要再判断

- `雨か雪` / `雪時々雨` / `くもり一時雪` / `晴れ一時雪` は、無理に既存 weather_code へ寄せず候補 code として別枠整理する
- 候補 icon 例: `rain_or_snow` は `CloudSnow` または `Snowflake + Umbrella`、`snow_with_occasional_rain` / `cloudy_with_occasional_snow` は `CloudSnow`
- `storm` / 荒天は current では `other` または注意情報側として扱う候補にとどめる

---

## 2026-05-03 Open-Meteo redesign note

### planned

- JMA forecast JSON は current 実装として残しつつ、本命候補は Open-Meteo JMA forecast API へ切り替える方向で再設計する
- forecast provider の再設計メモは [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md) を参照する
- `jma_forecast_region_code` / `jma_forecast_office_code` は当面 legacy 候補として保持し、将来的には `latitude` / `longitude` / `timezone` 正本へ寄せる
---

## 2026-05-03 coordinate-primary direction note

### current

- 地域設定画面には Open-Meteo Geocoding API を使った候補検索があり、forecast 用 location の `latitude` / `longitude` / `timezone` を自動反映できる
- Geocoding 検索に失敗した場合も、座標とタイムゾーンは手入力 fallback で設定を継続できる

### planned

- Open-Meteo forecast では、`location` の `latitude` / `longitude` / `timezone` を正本入力にする
- `POST /api/weather-records/forecast` は、将来的に `weather_date` と `location_id` を受け取り、location の座標情報から `open_meteo_jma_forecast` を呼ぶ形へ寄せる
- JMA forecast JSON と `forecast_area_code` は current / legacy として当面並走する

---

## 2026-05-03 Open-Meteo forecast implementation note

### current

- `POST /api/weather-records/forecast` は location の `latitude` / `longitude` がある場合に Open-Meteo forecast を優先する
- Open-Meteo forecast では [https://api.open-meteo.com/v1/jma](https://api.open-meteo.com/v1/jma) を使い、daily の `weather_code` / `temperature_2m_max` / `temperature_2m_min` / `precipitation_sum` / `rain_sum` / `snowfall_sum` を取得する
- Open-Meteo weather code は app `weather_code` へ代表天気として正規化する
- `raw_weather_text` は Open-Meteo では使わず、`raw_weather_code` を response で返す
- `precipitation` / `rain_sum` / `snowfall_sum` は参考値として response に含めるが、今回は保存しない
- 座標がない地域では `jma_forecast_json`、それもない場合は `tsukumijima` fallback を維持する

### planned

- `then` / `with_occasional` の複合天気は、必要になったら hourly data を使った推定を検討する
- `has_rain_possibility` は app `weather_code` を基本にしつつ、precipitation probability などの補助指標も将来検討する

---

## 2026-05-03 Open-Meteo forecast PoC note

### current

- forecast 取得では `POST /api/weather-records/forecast` が、`latitude` / `longitude` を持つ地域に対して Open-Meteo を優先する
- Open-Meteo forecast の `source_name` は `open_meteo_jma_forecast`
- Open-Meteo では日本語の天気文を返さないため、`raw_weather_text` は `null` のまま扱う
- 代わりに `raw_weather_code` を response に含め、画面では `取得元: Open-Meteo` / `取得した天気コード` を補足表示する
- `precipitation` / `rain_sum` / `snowfall_sum` は参考値として返すが、今回は DB 保存しない

### planned

- Open-Meteo の hourly data を使う複合天気推定は、必要になった段階で別途検討する
- JMA forecast JSON と tsukumijima は fallback として当面残しつつ、順次 legacy 側へ寄せる

---

## 2026-05-03 forecast date guidance note

### planned

- forecast 導線は `未来日` と `今日` を主対象とする
- `過去日` では historical 導線を優先するため、forecast は disabled または補助扱いに寄せる
- forecast セクションの補足文候補:
  - `予報: これからの天気を取得します。`
  - `未来日のため、実績データはまだ取得できません。`
  - `今日は予報取得を優先できます。`

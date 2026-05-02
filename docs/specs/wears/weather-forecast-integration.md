# Weather Forecast Integration

着用記録で使う天気予報データの取得元と、今後の移行方針を整理する。
今回は実装ではなく、`weather.tsukumijima.net` から気象庁 forecast JSON へ段階移行する前提の設計整理を正本として残す。

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

- `雷`
- `霧`
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

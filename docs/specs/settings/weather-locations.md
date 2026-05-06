# Weather Location Settings

`user_weather_locations` の責務、座標正本、Geocoding、legacy code の扱いを整理する正本です。  
天気取得 API の詳細は [weather fetching](../wears/weather-fetching.md)、`weather_records` の保存方針は [weather records](../wears/weather-records.md) を参照してください。

関連 docs:

- [weather current status](../wears/weather-current-status.md)
- [weather fetching](../wears/weather-fetching.md)
- [weather records](../wears/weather-records.md)
- [weather-open-meteo-redesign.md](../wears/weather-open-meteo-redesign.md)
- [import-export](../import-export.md)

---

## 目的

`user_weather_locations` は、ユーザーがよく使う地域を保存し、天気取得に必要な位置情報を管理する設定である。  
current では Open-Meteo 移行を前提に、`latitude / longitude / timezone` を主軸へ寄せつつ、legacy code fields を当面共存させる。

この docs では以下を扱う。

- `user_weather_locations` の責務
- 地域名
- `latitude / longitude / timezone`
- Open-Meteo Geocoding API
- デフォルト地域
- `display_order`
- 今回だけの地域との違い
- legacy code fields
- import / export 影響
- 将来的な legacy 削除方針

---

## current

### `user_weather_locations` の責務

current では、`user_weather_locations` は以下の意味を持つ。

- ユーザーがよく使う地域を保存する設定
- 天気取得に使う位置情報を持つ
- 天気登録画面で保存済み地域として選択できる
- デフォルト地域を設定できる
- 地域名はユーザー向け表示名
- 地域名と API 上の地点・予報区域・観測地点は一致しない場合がある

設定画面:

- `/settings/weather-locations`

代表的な current 項目:

- `name`
- `latitude` nullable
- `longitude` nullable
- `timezone` nullable
- `is_default`
- `display_order`
- legacy code fields

### 地域名

`name` はユーザー向け表示名である。

例:

- `川口`
- `さいたま`
- `大阪市内`
- `旅行先`

補足:

- API の地点名や気象庁の予報区域名と完全一致する必要はない
- Geocoding 候補名や観測地点名とズレてもよい
- 保存時の表示名は、天気登録画面や `weather_records.location_name_snapshot` で利用される

---

## 座標正本

### current の正本候補

Open-Meteo 移行後の主軸として、以下を扱う。

- `latitude`
- `longitude`
- `timezone`

意味:

- Open-Meteo Forecast / Historical の取得に使う
- `timezone` は daily 集計と日付境界に影響する
- 日本国内利用では通常 `Asia/Tokyo`

### current 方針

- DB 上は nullable
- 新規作成時は UI 上で設定を促す
- 既存地域は未設定を許容する
- 座標未設定の場合、Open-Meteo forecast / historical は使えない
- Geocoding API の候補選択で自動反映できる
- 手入力は fallback として残す

### 入力ルール

current の validation 前提:

- `latitude`: `-90..90`
- `longitude`: `-180..180`
- `latitude` と `longitude` は原則セット
- `timezone`: IANA timezone 形式を想定

補足:

- UI では `timezone` の初期値を `Asia/Tokyo` に寄せる
- backend は `timezone = null` を受ける

---

## Open-Meteo Geocoding API

### current

current の通常導線:

1. 地域名を入力
2. Geocoding API で候補検索
3. 候補を表示
4. 候補選択で `latitude / longitude / timezone` をフォームへ反映

候補選択時の current ルール:

- 地域名が空なら候補 `name` を入れる
- 地域名が入力済みなら上書きしない
- `latitude / longitude / timezone` は候補値で更新する
- 手入力 fallback は残す
- Geocoding result の詳細は DB 保存しない

現在の実装メモ:

- BFF route:
  - `/api/settings/weather-locations/geocode`
- provider:
  - Open-Meteo Geocoding API

### planned

将来、必要なら以下の保存を再検討する。

- `geocoding_provider`
- `geocoding_place_id`
- `country`
- `admin1`
- `admin2`

ただし current では、`user_weather_locations` 自体の正本はあくまで

- `name`
- `latitude`
- `longitude`
- `timezone`

とする。

---

## デフォルト地域

### current

- `is_default`

意味:

- 0 件または 1 件
- 天気登録画面の初期選択候補
- 複数保存済み地域の中で、よく使う地域を表す

補足:

- デフォルト地域は、天気取得の唯一の対象ではない
- 日付や外出先に応じて、別の保存済み地域を選択できる

---

## 表示順

### current

- `display_order`

意味:

- 地域設定画面の保存済み地域一覧の表示順
- 値が小さいほど上に表示する
- カレンダー代表天気の tie-breaker に使う

current の代表順:

1. default location
2. `display_order` が小さい保存済み地域
3. `id` が小さい weather record

補足:

- デフォルト地域が最優先で、表示順はその次に使う
- 地域設定画面では `上へ` / `下へ` による並び替えを行える
- `location_id = null` の今回だけの地域は default location にならず、同じ status 内では保存済み地域より後で扱う

---

## 保存済み地域と今回だけの地域

### 保存済み地域

- `user_weather_locations` に保存する
- Open-Meteo 取得に使える
- デフォルト化できる
- 繰り返し使う地域向け

### 今回だけの地域

- `user_weather_locations` に保存しない
- `weather_records.location_id = null`
- `weather_records.location_name_snapshot` に保存する
- Open-Meteo 取得対象外
- 手入力向き

補足:

- 旅行先・一時的な外出先などに使う
- API 取得したい場合は、保存済み地域として登録する

---

## legacy code fields

current では以下を legacy / import-export 互換用として残す。

### `forecast_area_code`

- `weather.tsukumijima.net` 用 legacy code
- current では主入力ではない
- 旧 backup 互換や過去履歴参照用
- 将来的に削除候補

### `jma_forecast_region_code`

- JMA forecast JSON PoC 用 legacy code
- current では主入力ではない
- Open-Meteo 以降は runtime forecast では使わず、history / 旧 backup 互換用

### `jma_forecast_office_code`

- JMA forecast JSON の取得用 office code
- PoC / legacy 互換用
- current では主入力ではない

### `observation_station_code`

- JMA latest CSV PoC 用 legacy code
- current の本命ではない
- Open-Meteo Historical により観測所コード依存は避ける方針

### `observation_station_name`

- `observation_station_code` の補助表示
- legacy

### 共通方針

- すぐ削除しない
- import / export 互換のため当面残す
- 通常 UI の主入力からは段階的に外す
- 利用状況を見て削除を再判断する

---

## import / export 影響

### current

current の weather location backup / restore は、少なくとも以下を roundtrip 対象にする。

- `name`
- `latitude`
- `longitude`
- `timezone`
- `is_default`
- `display_order`
- legacy code fields

### 旧 backup 互換

- 座標系がない場合は未設定で復元する
- Open-Meteo 取得は未設定扱いになる
- legacy code fields は当面受ける

### Phase A

- current の主入力は `latitude / longitude / timezone`
- 地域設定画面では Geocoding と位置情報を主表示にする
- legacy code fields は `補助コード（旧API・fallback用）` として折りたたみ表示へ寄せる
- 一覧カードでは `補助コードあり` 程度に留め、必要時だけ詳細を開ける
- 既存値・保存 payload・import / export 互換は維持する

### Phase C

- forecast runtime provider は Open-Meteo Forecast のみ
- forecast 取得には `latitude / longitude / timezone` を使う
- legacy code fields は current の forecast runtime では使わない
- 補助コード section は旧 backup 互換や履歴保持のため残す

### validation

- `latitude`: `-90..90`
- `longitude`: `-180..180`
- `latitude / longitude` は原則セット
- `timezone`: IANA timezone 形式を想定

詳細は [import-export](../import-export.md) を参照する。

---

## planned

### legacy 削除方針

将来的には、`user_weather_locations` の正本を次へ寄せる。

- `name`
- `latitude`
- `longitude`
- `timezone`
- `is_default`
- `display_order`

legacy code fields は:

- fallback の実利用がなくなった段階
- import / export 互換の方針が固まった段階

で削除を再判断する。

### 今後の整理候補

- Geocoding result の詳細保存を行うか
- `timezone` を将来 `NOT NULL` に寄せるか
- 座標 snapshot を `weather_records` 側へ持つか
- fallback provider をどこまで残すか

---

## 参照先

- 天気取得 API 詳細:
  - [weather fetching](../wears/weather-fetching.md)
- `weather_records` の保存方針:
  - [weather records](../wears/weather-records.md)
- 天気機能全体の現在地:
  - [weather current status](../wears/weather-current-status.md)
- Open-Meteo 移行検討:
  - [weather-open-meteo-redesign.md](../wears/weather-open-meteo-redesign.md)
- backup / restore:
  - [import-export](../import-export.md)

---

## pending / 要再判断

- Geocoding result のどこまでを保存対象に広げるか
- legacy code fields をいつ UI 主導線から外し切るか
- 旧 backup 互換をどの期間維持するか

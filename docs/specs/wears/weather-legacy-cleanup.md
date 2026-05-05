# Weather Legacy Cleanup Memo

このファイルは、旧天気 API / legacy code fields / 旧検討メモの棚卸し結果をまとめるための整理メモです。  
今回は削除や停止は行わず、`current / fallback / legacy-compatible / history-only / unused candidate` の切り分けと、段階的な縮小案だけを扱います。

関連 docs:

- [weather current status](./weather-current-status.md)
- [weather-fetching.md](./weather-fetching.md)
- [weather-records.md](./weather-records.md)
- [weather locations](../settings/weather-locations.md)
- [import-export](../import-export.md)
- [weather-open-meteo-redesign.md](./weather-open-meteo-redesign.md)

---

## current

current の本線:

- forecast は Open-Meteo Forecast
- observed / historical は Open-Meteo Historical
- 地域設定の正本候補は `latitude / longitude / timezone`
- Geocoding は Open-Meteo Geocoding API

主な runtime ファイル:

- `api/app/Services/Weather/FetchOpenMeteoWeatherForecastService.php`
- `api/app/Services/Weather/FetchOpenMeteoHistoricalWeatherService.php`
- `api/app/Services/Weather/SearchOpenMeteoGeocodingService.php`
- `api/app/Http/Controllers/Api/WeatherRecordController.php`
- `web/src/app/wear-logs/weather/page.tsx`
- `web/src/app/settings/weather-locations/page.tsx`

---

## 棚卸し結果

### weather.tsukumijima.net

分類:

- fallback

残存箇所:

- `api/app/Services/Weather/FetchWeatherForecastService.php`
- `api/app/Http/Controllers/Api/WeatherRecordController.php`
- `api/tests/Feature/WeatherEndpointsTest.php`
- `web/src/app/wear-logs/weather/page.tsx`
- `web/src/types/weather.ts`
- `docs/specs/wears/weather-fetching.md`
- `docs/specs/wears/weather-open-meteo-redesign.md`
- `docs/api/openapi.yaml`

現状:

- forecast runtime fallback としてまだ使われる
- `forecast_area_code` がある地域で、Open-Meteo 座標と JMA code がない場合の最終 fallback
- import / export では `source_name = tsukumijima` の履歴互換が残る

削除前に確認すべきこと:

- `forecast_area_code` を持つ保存済み地域が実際にまだ使われているか
- Open-Meteo 座標未設定地域の現実運用があるか
- JMA forecast JSON fallback を残すのか、一気に Open-Meteo 依存に寄せるのか

### JMA forecast JSON

分類:

- fallback

残存箇所:

- `api/app/Services/Weather/FetchJmaWeatherForecastService.php`
- `api/app/Http/Controllers/Api/WeatherRecordController.php`
- `api/app/Http/Controllers/Api/WeatherLocationController.php`
- `api/app/Support/JmaForecastAreaCodeSupport.php`
- `api/tests/Feature/FetchJmaWeatherForecastServiceTest.php`
- `api/tests/Feature/WeatherEndpointsTest.php`
- `web/src/app/settings/weather-locations/page.tsx`
- `web/src/app/wear-logs/weather/page.tsx`
- `web/src/types/settings.ts`
- `docs/specs/wears/weather-fetching.md`
- `docs/specs/wears/weather-open-meteo-redesign.md`
- `docs/specs/settings/weather-locations.md`
- `docs/api/openapi.yaml`

現状:

- forecast runtime fallback としてまだ使われる
- Open-Meteo 座標がなく、`jma_forecast_region_code` / `jma_forecast_office_code` がある地域で使う
- 地域設定 UI でも JMA code は current で編集可能
- import / export でも code を roundtrip している

削除前に確認すべきこと:

- Open-Meteo 座標を持たない地域の運用がどれだけ残っているか
- JMA code を新規入力させる current UI を先に縮小するか
- `source_name = jma_forecast_json` を履歴互換としていつまで残すか

### JMA latest CSV PoC

分類:

- history-only

残存箇所:

- `docs/specs/wears/weather-current-status.md`
- `docs/specs/wears/weather-fetching.md`
- `docs/specs/wears/weather-open-meteo-redesign.md`
- `docs/specs/wears/weather-docs-reorganization.md`
- `docs/specs/settings/weather-locations.md`

現状:

- current branch の runtime code には残っていない
- observed の本線採用はしない前提の経緯メモとして残っている
- `weather-open-meteo-redesign.md` では「別ブランチへ退避済み」として整理されている

削除前に確認すべきこと:

- 経緯メモとして残す価値がまだあるか
- `weather-open-meteo-redesign.md` にだけ集約してよいか

### observation station fields

対象:

- `observation_station_code`
- `observation_station_name`

分類:

- history-only
- 一部 docs drift の疑いあり

残存箇所:

- `docs/specs/settings/weather-locations.md`
- `docs/specs/wears/weather-open-meteo-redesign.md`
- `docs/specs/import-export.md`

現状:

- current branch の DB column と runtime code には存在しない
- frontend type / OpenAPI / import validation にも current では出てこない
- ただし docs では import / export 互換用として残っている記述がある

要再判断:

- docs の `import-export` に残っている観測所コード記述は、実装互換として有効か再確認が必要
- current code では import validator が観測所コードを受けないため、少なくとも runtime 互換ではない

### legacy tests

分類:

- fallback
- legacy-compatible

主な残存箇所:

- `api/tests/Feature/FetchJmaWeatherForecastServiceTest.php`
- `api/tests/Feature/WeatherEndpointsTest.php`
- `web/src/app/wear-logs/weather/page.test.tsx`
- `web/src/app/wear-logs/weather/page-open-meteo.test.tsx`
- `web/src/app/settings/weather-locations/page.test.tsx`

現状:

- JMA fallback / tsukumijima fallback / legacy code field を守る回帰 test としてまだ意味がある
- runtime fallback を削除するまでは削除対象にしない

---

## legacy columns / fields

### `forecast_area_code`

現状:

- DB column として存在する
  - `user_weather_locations.forecast_area_code`
- UI に補助コードとして表示される
  - 地域設定画面
  - 天気登録画面の地域選択表示
- API request / response に含まれる
- import / export 対象
- OpenAPI に残っている
- current runtime では tsukumijima fallback 用に必要

分類:

- fallback
- legacy-compatible

削除する場合:

- migration が必要
- runtime fallback 削除
- import / export 互換方針の見直し
- frontend type / OpenAPI / tests 更新

### `jma_forecast_region_code`

現状:

- DB column として存在する
  - `user_weather_locations.jma_forecast_region_code`
- 地域設定 UI で編集できる
- API request / response に含まれる
- import / export 対象
- OpenAPI に残っている
- current runtime では JMA forecast JSON fallback 用に必要

分類:

- fallback
- legacy-compatible

削除する場合:

- migration が必要
- JMA forecast JSON fallback 停止
- 地域設定 UI / OpenAPI / import-export / tests 更新

### `jma_forecast_office_code`

現状:

- DB column として存在する
  - `user_weather_locations.jma_forecast_office_code`
- 地域設定 UI で内部的に保持される
- API request / response に含まれる
- import / export 対象
- OpenAPI に残っている
- current runtime では JMA forecast JSON の取得 URL 解決に必要

分類:

- fallback
- legacy-compatible

削除する場合:

- migration が必要
- JMA forecast JSON fallback 停止

### `observation_station_code`

現状:

- current branch の DB column には存在しない
- UI 表示なし
- API request / response なし
- OpenAPI なし
- docs には legacy / history として残る
- `docs/specs/import-export.md` には roundtrip 対象として残っているが、current code と整合再確認が必要

分類:

- history-only
- docs drift candidate

### `observation_station_name`

現状:

- current branch の DB column には存在しない
- UI 表示なし
- API request / response なし
- OpenAPI なし
- docs にのみ残る

分類:

- history-only
- docs drift candidate

---

## current / fallback / legacy-compatible / history-only / unused candidate

### current

- Open-Meteo Forecast
- Open-Meteo Historical
- Open-Meteo Geocoding
- `latitude / longitude / timezone`

### fallback

- JMA forecast JSON
- weather.tsukumijima.net
- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`

### legacy-compatible

- `forecast_area_code_snapshot`
- `source_name = jma_forecast_json`
- `source_name = tsukumijima`
- import / export で roundtrip している legacy code fields

### history-only

- JMA latest CSV PoC
- `observation_station_code`
- `observation_station_name`
- Open-Meteo 移行検討メモ内の旧 API 比較

### unused candidate

- current runtime / OpenAPI / frontend type に存在しないのに docs にだけ残っている観測所コード系記述
- current branch に runtime 実装がない JMA latest CSV PoC の細かい運用記述

---

## 削除・縮小フェーズ案

### Phase A: UI からさらに目立たなくする

- `forecast_area_code` を通常 UI の主導線からさらに外す
- JMA code fields も「fallback 用設定」として折りたたむ
- 天気登録画面の地域選択で legacy code を前面に出しすぎない
- 地域設定画面では `latitude / longitude / timezone` を主表示にし、legacy code fields は `補助コード（旧API・fallback用）` として補助表示へ寄せる
- 一覧カードでは `補助コードあり` と詳細開閉だけを残し、JMA code や旧予報コードは必要時のみ確認できるようにする

### Phase B: runtime fallback の利用状況確認

- JMA forecast JSON fallback が実際に使われている地域数を確認する
- tsukumijima fallback が実際に使われている地域数を確認する
- Open-Meteo 座標未設定地域の残存状況を確認する

### Phase C: fallback 削除

- JMA forecast JSON fallback を停止
- tsukumijima fallback を停止
- fallback service / tests / OpenAPI / frontend type / docs を整理

### Phase D: legacy columns 削除検討

- import / export 互換をいつまで維持するか決める
- `forecast_area_code` / JMA code fields の migration 削除を検討する
- `forecast_area_code_snapshot` をいつまで残すか再判断する

---

## 削除前チェックリスト

- Open-Meteo 座標未設定地域が本当に運用上なくなったか
- JMA forecast JSON fallback の呼び出し実績がなくなったか
- tsukumijima fallback の呼び出し実績がなくなったか
- import / export で旧 backup をどこまで受けるか決めたか
- `source_name = jma_forecast_json / tsukumijima` の履歴互換をどう扱うか決めたか
- weather location settings の UI を先に縮小するか決めたか
- OpenAPI と docs の current / legacy 表現が一致しているか確認したか

---

## 今は削除しないもの

- Open-Meteo 本線と併存する JMA forecast JSON fallback
- Open-Meteo 本線と併存する tsukumijima fallback
- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- fallback / legacy 回帰 test
- Open-Meteo 移行経緯を残す docs

理由:

- まだ current runtime fallback に使われているものがある
- import / export 互換と履歴 source の扱いが残っている
- 観測所コード系は docs 上の整理不足があり、先に current 実装との整合確認が必要

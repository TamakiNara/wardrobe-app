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
- Phase C 後の current では forecast runtime fallback を使わない
- JMA forecast JSON / weather.tsukumijima.net は legacy history / backup 互換扱い

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
- current runtime forecast では使わない

分類:

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
- current runtime forecast では使わない

分類:

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

## current / legacy-compatible / history-only / unused candidate

### current

- Open-Meteo Forecast
- Open-Meteo Historical
- Open-Meteo Geocoding
- `latitude / longitude / timezone`

### legacy-compatible

- JMA forecast JSON
- weather.tsukumijima.net
- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
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

---

## Phase B: runtime fallback 利用状況確認

### 確認日

- 2026-05-06

### 現在の forecast provider 優先順位

current code の優先順位は次のとおり。

1. `latitude / longitude` が両方ある
   - Open-Meteo Forecast
   - `source_name = open_meteo_jma_forecast`
2. `latitude / longitude` がない
   - forecast 取得不可

根拠:

- `api/app/Http/Controllers/Api/WeatherRecordController.php`
- `web/src/app/wear-logs/weather/page.tsx`

補足:

- `latitude` / `longitude` が片方だけの不完全状態は validation error とする
- observed / historical は Open-Meteo Historical のみで、JMA / tsukumijima fallback はない

### 座標未設定地域の扱い

current UI と runtime の整理:

- 地域設定の通常導線は Geocoding と `latitude / longitude / timezone`
- 新規作成 UI では位置情報が主入力
- 既存地域には座標未設定が残りうる
- 座標未設定の地域では legacy code の有無にかかわらず forecast は取得不可
- 座標未設定かつ legacy code ありの地域は、Phase A 以降は通常 UI では補助コード表示から確認する

observed について:

- 座標未設定では取得不可
- legacy code があっても observed fallback はない

### local DB / seed / test fixture 上の残存状況

#### local DB 読み取り結果

`user_weather_locations` の local 件数確認結果:

- 旧地域データ削除前
  - 総件数: 3
  - `latitude / longitude` 未設定: 2
  - 座標なし + JMA code pair あり: 1
  - 座標なし + `forecast_area_code` のみ: 1
  - 座標も legacy code もない地域: 0
  - default location で座標未設定: 0
- 旧地域データ削除後
  - 総件数: 1
  - `latitude / longitude` 未設定: 0
  - 座標なし + JMA code pair あり: 0
  - 座標なし + `forecast_area_code` のみ: 0
  - 座標も legacy code もない地域: 0
  - default location で座標未設定: 0

読み取り方法:

- local DB を read-only で集計
- 実装変更はなし

補足:

- 座標なし + JMA code pair あり 1 件と、座標なし + `forecast_area_code` のみ 1 件は、実運用データではなく実機確認用の local DB データとして扱ってよい
- これらの旧地域データは削除済みで、今後は座標付きの `川口` 地域を使う運用に寄せる
- したがって、local DB 残存データは Phase C を止める本質的な blocker ではない
- 一方で、runtime fallback 実装・current fallback 回帰 test・OpenAPI・import / export 互換は引き続き Phase C 前の整理対象
- Phase C へ進む前には、local DB / seed / test fixture に legacy-only location が残っていないか、または回帰 test 用として残す理由が明確かを再確認する

#### seed / fixture / test 上の残存

current test / fixture でも fallback 前提の地域が明示的に残っている。

- JMA only location
  - `api/tests/Feature/OpenMeteoForecastEndpointTest.php`
  - `web/src/app/wear-logs/weather/page.test.tsx`
- legacy `forecast_area_code` only location
  - `api/tests/Feature/OpenMeteoForecastEndpointTest.php`
  - `api/tests/Feature/WeatherEndpointsTest.php`
  - `web/src/app/wear-logs/weather/page.test.tsx`

結論:

- local DB の legacy-only 地域は削除済みで、current の本質 blocker ではない
- Phase C 実装後の主な整理対象は runtime fallback 実装、test、OpenAPI、import / export 互換である

### fallback がまだ必要そうだったケース

- 旧 backup / 手作業登録 / 古い既存地域で、座標未設定の location が残っている
- `jma_forecast_region_code / jma_forecast_office_code` はあるが Geocoding し直していない
- `forecast_area_code` だけを持つ既存 region を restore した
- 座標未設定地域でも forecast だけは使いたい
- import / export で legacy code fields を roundtrip している

### fallback が不要に近かった理由

- 新規作成 UI は `latitude / longitude / timezone` を主導線としている
- forecast / historical の current 本線は Open-Meteo に寄っている
- observed は既に Open-Meteo 座標必須で、JMA / tsukumijima は使えない
- legacy code fields は Phase A で補助表示へ寄せた
- Open-Meteo Geocoding が current の location 設定導線として成立している

### test 上の残存状況

runtime fallback の回帰 test として残っているもの:

- `api/tests/Feature/FetchJmaWeatherForecastServiceTest.php`
  - JMA forecast JSON service の単体確認
- `api/tests/Feature/OpenMeteoForecastEndpointTest.php`
  - Open-Meteo 優先
  - JMA fallback
  - tsukumijima fallback
- `api/tests/Feature/WeatherEndpointsTest.php`
  - weather location CRUD による legacy code field roundtrip
  - forecast endpoint の fallback 経路
- `web/src/app/wear-logs/weather/page.test.tsx`
  - disabled 条件
  - JMA / tsukumijima の source 保存
- `web/src/app/settings/weather-locations/page.test.tsx`
  - legacy code field を持つ location fixture

整理:

- これらは Phase C 実装前は current fallback を守る回帰 test だった
- Phase C 実装後は Open-Meteo current test と legacy 互換 test を残し、fallback success test を整理対象にする

### OpenAPI / import-export 互換の影響

OpenAPI:

- `forecast_area_code`
  - deprecated 扱いだが schema に残る
- `jma_forecast_region_code`
  - request / response schema に残る
- `jma_forecast_office_code`
  - request / response schema に残る
- forecast endpoint description に provider fallback 順序が記載されている
- `forecast_area_code_snapshot`
  - weather record schema に残る
- `source_name`
  - `jma_forecast_json` / `tsukumijima` を許容している

import / export:

- weather location backup に legacy code fields を含む
- restore で `forecast_area_code` / JMA code fields を受ける
- weather record 側も `forecast_area_code_snapshot` を roundtrip している

結論:

- runtime fallback を削除するだけでなく、OpenAPI / import-export / source 履歴互換の整理が必要

### Phase C へ進める条件

- 既存 location の座標設定が完了している
- local DB / 実運用 DB で fallback 対象地域がなくなった、または確認用データだけだと切り分けられている
- 新規作成では座標設定が常に主導線として使われる
- import / export の旧形式受け入れ方針が決まっている
- `source_name = jma_forecast_json / tsukumijima` の履歴互換をどう扱うか決まっている
- JMA / tsukumijima fallback 回帰 test を不要化できる
- OpenAPI と docs で legacy code fields を deprecated / planned removal として寄せられる

### Phase B 時点の判断

- Phase C にはまだ進めない

理由:

- local DB の fallback 対象 2 件は実機確認用データで、現在は削除済み
- したがって local DB 残存は本質的 blocker ではない
- 一方で current test は runtime fallback を正面から守っている
- OpenAPI に legacy provider / legacy code field が残っている
- import / export と source 履歴互換の整理が未了

### local DB クリーンアップ後に再確認する項目

- 座標未設定 location 件数
- JMA fallback 対象件数
- tsukumijima fallback 対象件数
- default location が座標未設定になっていないこと
- seed / fixture / test に fallback 前提データが残っていないか、または history / 回帰 test として残す理由が明確か

### weather record の location snapshot 補足

- `user_weather_locations.name` は現在の地域設定名
- `weather_records.location_name_snapshot` は保存時点の地域名
- 地域マスタを後から改名・削除しても、過去の weather record では保存時点名が表示されることがある
- したがって、現在の地域設定名と weather record の snapshot 名が異なることはありうる
- これは過去履歴を保全するための仕様であり、不具合ではない

---

## Phase C: runtime fallback 削除計画

### Phase C 後の目標状態

#### forecast

- forecast provider は Open-Meteo Forecast のみ
- `latitude / longitude / timezone` を forecast 取得の前提にする
- JMA forecast JSON fallback は使わない
- `weather.tsukumijima.net` fallback は使わない
- 座標未設定地域では forecast 取得不可

#### observed / historical

- すでに Open-Meteo Historical のみ
- 引き続き座標必須

#### 地域設定

- current の正本は `latitude / longitude / timezone`
- legacy code fields は runtime forecast の主導線から切り離す
- DB column 削除はまだ行わず、Phase D で再判断する

#### import / export

- Phase C では旧 backup 互換を維持する
- legacy code fields と `forecast_area_code_snapshot` の roundtrip は残す
- runtime fallback からは切り離す

### 影響範囲一覧

#### backend runtime

変更対象:

- `api/app/Http/Controllers/Api/WeatherRecordController.php`
  - forecast provider 自動選択から JMA / tsukumijima 分岐を外す
  - forecast は Open-Meteo 座標必須に寄せる
- forecast endpoint validation / error message
  - legacy code があっても forecast 取得不可になるため文言見直しが必要

削除候補:

- `api/app/Services/Weather/FetchJmaWeatherForecastService.php`
- `api/app/Services/Weather/FetchWeatherForecastService.php`
- `api/app/Support/JmaForecastAreaCodeSupport.php`

維持候補:

- `FetchOpenMeteoWeatherForecastService`
- `FetchOpenMeteoHistoricalWeatherService`
- legacy code field を保持する model / request / response

#### backend tests

削除または書き換え対象:

- `api/tests/Feature/FetchJmaWeatherForecastServiceTest.php`
- `api/tests/Feature/OpenMeteoForecastEndpointTest.php` の JMA / tsukumijima fallback success case
- `api/tests/Feature/WeatherEndpointsTest.php` の fallback 成功経路 test

維持対象:

- Open-Meteo forecast / historical の current test
- weather location CRUD と legacy code field roundtrip test
- import / export の legacy field roundtrip test

#### frontend

変更対象:

- `web/src/app/wear-logs/weather/page.tsx`
  - forecast button enabled / disabled 条件を座標必須へ寄せる
  - JMA / `forecast_area_code` fallback 前提の説明を外す
- `web/src/types/weather.ts`
  - forecast response 内で legacy fallback provider 前提の説明を整理

削除または未使用化候補:

- `hasJmaForecastCodes`
- `hasIncompleteJmaForecastCodes`
- `hasLegacyForecastCode`
- `getForecastDisabledReason` 内の fallback 前提分岐

維持候補:

- 地域設定画面の legacy 補助コード section
  - Phase C では完全削除せず、必要なら「新規取得には使いません」と補足する

#### docs

更新対象:

- `docs/specs/wears/weather-fetching.md`
- `docs/specs/wears/weather-current-status.md`
- `docs/specs/settings/weather-locations.md`
- `docs/specs/wears/weather-legacy-cleanup.md`
- `docs/specs/wears/weather-open-meteo-redesign.md`
- `docs/specs/import-export.md`

#### OpenAPI

変更対象:

- forecast endpoint description
  - JMA / tsukumijima fallback 記述を外す
- weather location schema description
  - legacy code fields の説明を runtime fallback 用から import / export 互換用へ寄せる
- forecast response / weather record source description
  - `source_name = jma_forecast_json / tsukumijima` を履歴互換として扱う

#### import / export

維持対象:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `forecast_area_code_snapshot`
- 旧 backup restore
- 過去 `source_name` の履歴互換

Phase C では変更しない:

- backup schema
- restore validator
- weather record snapshot 構造

### 案A / B / C の比較

#### 案A: runtime fallback だけ削除し、DB / API legacy fields は残す

内容:

- forecast endpoint は Open-Meteo のみ
- JMA / tsukumijima service は削除または未使用化
- legacy code fields は import / export 互換として残す
- OpenAPI では deprecated / legacy として残す

長所:

- runtime がすっきりする
- DB migration を避けられる
- 旧 backup 互換を残しやすい
- 差分を runtime と docs / OpenAPI に寄せられる

短所:

- legacy fields 自体はしばらく残る
- API schema は完全には軽くならない

#### 案B: runtime fallback と API legacy fields を同時削除する

内容:

- runtime fallback 削除
- request / response から legacy fields 削除
- OpenAPI から削除
- import / export も新形式へ寄せる

長所:

- API / frontend type がすっきりする

短所:

- 互換影響が大きい
- restore 互換の整理が重い
- 一度に差分が大きくなる

#### 案C: runtime fallback / API / DB columns まで一括削除する

内容:

- migration で legacy columns 削除
- import / export 互換も再設計
- tests / docs も大幅整理

長所:

- 最終形に近い

短所:

- リスクが最も高い
- backup 互換を壊しやすい
- current の段階では過剰

### 推奨案

推奨は案A。

理由:

- current の本質課題は runtime fallback を止めること
- DB migration を伴わずに forecast provider を Open-Meteo のみに寄せられる
- import / export 互換と source 履歴互換を別フェーズへ分離できる
- Phase D で columns / schema 削除を再判断しやすい

### source_name 履歴互換

runtime fallback を削除しても、過去 record の `source_name` は残りうる。

Phase C の扱い:

- `source_name = jma_forecast_json`
  - 過去履歴表示のため残す
  - 新規取得では使わない
- `source_name = tsukumijima`
  - 過去履歴表示のため残す
  - 新規取得では使わない
- import / export
  - legacy source_name として restore で受ける
- UI
  - 必要なら「旧API」など控えめな補足に留める

### import / export 互換の扱い

推奨:

- Phase C では import / export roundtrip は残す
- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `forecast_area_code_snapshot`
  は backup / restore の互換データとして維持する
- Phase D で legacy columns 削除可否を再判断する

理由:

- runtime fallback 削除と backup 互換削除を同時にやると差分が大きすぎる
- 旧 backup をいきなり壊さない方が安全

### frontend UI 方針

推奨:

- forecast button enabled 判定は `latitude / longitude` のみへ変更
- JMA code pair や `forecast_area_code` だけでは forecast ボタンを有効にしない
- 地域設定画面の legacy 補助コード section は Phase C では残す
- ただし補足文は
  - 「現在は新規 forecast 取得には使いません」
  - 「旧 backup 互換や履歴保持のため残しています」
    の方向へ寄せる

### test 方針

Phase C 実装時の整理方針:

- 維持:
  - Open-Meteo forecast success test
  - Open-Meteo historical success test
  - import / export legacy field roundtrip test
  - legacy source_name import / history test
- 削除または書き換え:
  - JMA fallback success test
  - tsukumijima fallback success test
  - fallback service 単体 test
  - frontend の fallback enabled 条件 test

### Phase C 実装手順案

1. forecast endpoint の provider selection を Open-Meteo only にする
2. forecast validation / error message を座標必須前提へ更新する
3. frontend の forecast enabled 条件を座標必須へ変更する
4. JMA / tsukumijima fallback service 呼び出しを削除する
5. fallback success test を削除または Open-Meteo 前提に書き換える
6. docs / OpenAPI description を current に合わせて更新する
7. legacy service classes を削除するか、未使用期間を置いてから削除するか判断する
8. import / export legacy roundtrip test は維持する
9. lint / build / backend test / frontend test を通す

### まだ判断が必要な点

- `FetchJmaWeatherForecastService` / `FetchWeatherForecastService` を Phase C で即削除するか、一度未使用化だけに留めるか
- `JmaForecastAreaCodeSupport` を地域設定 UI の補助入力のために残すか、Phase C で UI ごと縮小するか
- `source_name = jma_forecast_json / tsukumijima` を UI でどう見せるか
- legacy code fields を API request / response にいつまで残すか
- Phase D で DB columns を削除する前に、旧 backup 互換をいつ終了するか

---

## Phase D: legacy fields 整理計画

Phase D は、Phase C で止めた runtime fallback の次に、

- UI
- API request / response
- frontend type
- OpenAPI
- import / export
- DB columns

に残っている legacy field を、どの順で縮小・削除するかを決めるための整理フェーズとする。  
この段階では、**runtime forecast provider の current は Open-Meteo only のまま維持**しつつ、互換と履歴保持をどこまで残すかを判断する。

### Phase D の目的

- current の主入力と正本を `latitude / longitude / timezone` に固定する
- runtime で未使用になった legacy location field を、UI / API / OpenAPI / import-export / DB でどう扱うか決める
- `source_name = jma_forecast_json / tsukumijima` の履歴互換をどこまで残すか決める
- Phase E 以降で DB migration や互換終了を進めるための前提条件を整理する

### Phase D ではまだやらないこと

- DB migration
- OpenAPI schema からの削除
- import / export validator からの削除
- 旧 backup の restore 非対応化
- `weather_records` 既存履歴の書き換え

### 現在残っている legacy fields

#### location fields

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`

残存場所:

- DB columns
  - `user_weather_locations`
- backend request / response
- frontend type
- 地域設定 UI の補助コード section
- OpenAPI schema
- import / export roundtrip

current の扱い:

- runtime forecast provider selection では未使用
- UI では主入力ではなく補助コード
- backup / restore 互換のため残している

#### weather record snapshot

- `forecast_area_code_snapshot`

残存場所:

- DB column
  - `weather_records`
- weather record payload / schema
- import / export roundtrip

current の扱い:

- runtime では使わない
- 過去履歴の保存時点情報と backup / restore 互換のため残している

#### source history

- `source_name = jma_forecast_json`
- `source_name = tsukumijima`

残存場所:

- 既存 `weather_records`
- import / export roundtrip
- OpenAPI description

current の扱い:

- 新規 forecast 取得では発生しない
- 履歴表示と restore 互換のため残している

#### helper / validator

- `JmaForecastAreaCodeSupport`

残存場所:

- weather location request validation
- import / export validation
- unit test

current の扱い:

- runtime forecast provider では未使用
- legacy code field をまだ request / import で受けるため残している

### 論点A: legacy location fields

対象:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`

確認結果:

- DB column として残っている
- API request / response に残っている
- frontend type に残っている
- 地域設定 UI に残っている
- import / export で roundtrip している
- current runtime forecast では完全に未使用

Phase D の判断候補:

- UI から完全に隠すか
- API response から外すか
- API request では当面受けるか
- import では受けるが export では出さない段階を作るか
- DB column は Phase D では残し、Phase E 以降で migration 対象にするか

### 論点B: `forecast_area_code_snapshot`

確認結果:

- `weather_records` に残っている
- 過去 record の履歴と backup / restore 互換で意味がある
- runtime forecast / observed では使っていない

Phase D の判断候補:

- Phase D では残す
- 新規保存で null 専用に寄せるかは別途判断
- 完全削除するなら migration と旧履歴互換終了判断が必要

推奨:

- Phase D では保持
- Phase E 以降で import / export 互換終了時に再判断

### 論点C: `source_name` 履歴互換

対象:

- `jma_forecast_json`
- `tsukumijima`

確認結果:

- current の新規取得では発生しない
- 既存 `weather_records` には残りうる
- import / export では legacy history source として受ける必要がある

推奨:

- Phase D でも履歴互換は維持
- UI では必要なら `旧API` として控えめに見せる
- OpenAPI allow-list / description からはまだ外さない
- 新規取得 current とは切り分けて説明する

### 論点D: import / export 互換

対象:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`
- `forecast_area_code_snapshot`
- legacy `source_name`

段階案:

1. import / export とも維持
   - 最も安全
   - current Phase C の延長
2. import は受けるが export は出さない
   - 新形式へ寄せやすい
   - 旧 backup を restore しつつ、新規 export を clean にできる
3. import / export とも削除
   - 互換影響が大きい
4. migration と同時に削除
   - 最終形には近いが、現在は重い

比較:

- 当面の安全性は 1
- 段階的な縮小として現実的なのは 2
- 一気に整理するなら 3 / 4 だが current ではリスクが高い

### 案A / B / C の比較

#### 案A: UI / API から隠し、DB / import 互換は残す

内容:

- UI から legacy 補助コードをさらに隠す
- 通常 API response からも外す候補
- DB column は残す
- import では旧 backup を受ける
- export は出すか再判断する

長所:

- 通常利用の見通しがよくなる
- DB migration を避けられる
- 旧 backup 互換を保ちやすい

短所:

- DB には legacy が残る
- request / import / DB の三層で完全削除ではない

#### 案B: API / import-export は残し、UI だけ隠す

内容:

- UI からは隠す
- API / OpenAPI には legacy fields を残す
- import / export 互換も残す

長所:

- 最も安全
- 差分が小さい

短所:

- API がすっきりしない
- Phase C 後の整理としては中途半端

#### 案C: DB column まで削除する

内容:

- migration で legacy columns 削除
- API / OpenAPI / import-export / frontend type から削除

長所:

- 最終形に近い
- 保守性は高い

短所:

- 旧 backup 互換が難しい
- 差分が大きい
- current では危険

### 推奨案

推奨は **案A**。

理由:

- Phase C 後の短期課題は「runtime で使わないものを通常導線から外す」こと
- DB migration を伴わずに UI / API の current を軽くできる
- import / export 互換を当面残しやすい
- Phase E 以降で DB column 削除を切り離せる

### 推奨方針の仮説

短期:

- UI から legacy 補助コードをさらに隠す
- 新規 / 編集画面では基本表示しない
- import では旧 backup を受ける
- export で出し続けるかは要判断

Phase D-1 current:

- 新規作成フォームでは legacy 補助コードを通常導線に表示しない
- 編集フォームでは、既存値がある location に限って補助コードの存在を控えめに表示する
- 編集フォームでは詳細を開いた場合だけ legacy 値を read-only で確認できる
- 一覧カードでは位置情報を主表示にし、legacy 値は詳細表示時のみ確認する
- この段階では DB / API / import-export の legacy fields は削除しない

Phase D-2 planning:

- runtime では未使用になった legacy fields を、backup / restore でどこまで残すか判断する
- 特に `export から外し、import だけ受ける` 非対称案を比較対象にする
- `source_name` の legacy 履歴互換は location field と切り分けて扱う

中期:

- API response から legacy fields を外すか検討
- OpenAPI では deprecated / legacy 説明を強める

長期:

- DB column 削除は Phase E 以降
- 旧 backup 互換終了方針を決めてから migration

現時点の判断:

- この仮説は妥当
- 特に「UI 縮小 → API / OpenAPI 再判断 → DB migration」はリスク分離として自然

### Phase D でやること

- legacy field の残存場所を current / legacy-compatible に整理する
- UI / API / import-export / DB の削除順を決める
- `source_name` 履歴互換の扱いを固定する
- Phase E に回す migration / 互換終了条件を明文化する

### Phase D でやらないこと

- DB migration
- API schema 削除
- import / export validator 変更
- OpenAPI schema 削除
- legacy source_name allow-list 削除

### Phase D 実装に進む場合の手順

1. weather location UI の legacy 補助コードをさらに隠す方針を確定する
2. weather location API response から legacy field を外すか判断する
3. frontend type を current / legacy でどう分けるか決める
4. import は受けるが export は出さない段階案を採るか判断する
5. OpenAPI に deprecated / legacy の説明を強める
6. `JmaForecastAreaCodeSupport` を request / import validator だけに残すか再判断する
7. Phase E の migration 条件を決める

### Phase D-2: export / import legacy field 整理方針

Phase D-2 は、runtime では未使用になった legacy fields を backup / restore でどこまで残すかを決める整理フェーズとする。  
この段階でも、**実装変更・schema 変更・migration はまだ行わない**。

### Phase D-2 current

weather location の legacy field については、Phase D-2 で次を current とする。

- export から外す
  - `forecast_area_code`
  - `jma_forecast_region_code`
  - `jma_forecast_office_code`
- import は旧 backup 互換として引き続き受ける
- そのため、weather location の import / export は意図的に非対称になる

一方で、weather record 側の履歴情報は Phase D-2 では維持する。

- `forecast_area_code_snapshot`
  - 過去 record の履歴 snapshot として export / import に残す
- `source_name = jma_forecast_json / tsukumijima`
  - legacy history source として export / import に残す

補足:

- DB column / 通常 API request / response / OpenAPI schema は Phase D-2 ではまだ削除しない
- Phase E 以降で DB column 削除や export の最終縮小を再判断する

### Phase D-3: 通常 API response の legacy field 整理方針

Phase D-3 は、`weather_locations` の通常 API response / frontend type / OpenAPI に残っている

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`

を、いつ current から外すかを整理する設計フェーズとする。  
この段階では、**実装変更・API 変更・OpenAPI schema 変更・frontend type 変更はまだ行わない**。

#### 比較する案

##### 案A: 通常 API response から外すが、request / import では受ける

長所:

- current API response を Open-Meteo 前提に寄せられる
- frontend の通常型が軽くなる
- UI で legacy を前面に出しにくくなる

短所:

- 既存 legacy 値確認 UI を別 API や別 payload に分ける必要が出る
- request と response が非対称になる
- current の編集画面で「既存値がある場合のみ read-only 確認」が難しくなる

##### 案B: 通常 API response には残すが、UI では通常利用しない

長所:

- 現状に最も近く安全
- 既存 legacy 値確認 UI を維持しやすい
- DB migration 前のつなぎとして自然

短所:

- API schema と frontend type はすっきりしない
- Phase C / D-1 / D-2 と比べると整理が中途半端に見える

##### 案C: request / response から外し、import だけ受ける

長所:

- 通常 API / frontend をかなり current に寄せられる
- legacy field を import 互換の内部都合へ閉じ込めやすい

短所:

- 既存 legacy 値を通常 UI で確認できなくなる
- request validation / OpenAPI / frontend type の差分が大きい
- DB column が残る間は、通常 API だけ legacy を見せない不一致が強くなる

##### 案D: DB column まで削除する

長所:

- 最終形に最も近い
- API / frontend / schema をまとめて整理できる

短所:

- migration と旧 backup 互換整理が必要
- 現時点では Phase E 以降向き

#### 推奨案

Phase D-3 時点の推奨は **案B** とする。

理由:

- current UI では legacy code を通常導線に出していない
- 一方で、既存値がある location では read-only 確認をまだ維持している
- export はすでに current 形式へ寄せてあり、API response まで同時に削る必然性はまだ弱い
- DB columns / import / OpenAPI が残る間は、response だけ先に外すと非対称性が増えやすい

#### Phase D-3 current 方針

- 通常 API response には、当面 legacy fields を残す
- create / update request も、Phase D-3 ではまだ legacy fields を受ける前提を維持する
- frontend type も current / legacy-compatible をまだ分けず、既存の互換型を維持する
- UI では通常利用しないが、既存値確認のために response 上は残す
- OpenAPI では schema 削除を急がず、deprecated / legacy 説明を強める候補として扱う
- `JmaForecastAreaCodeSupport` は request / import validator 用として当面残す

#### API response から外す前に判断すべきこと

- 既存 legacy 値確認 UI を今後も残すか
- read-only 確認を別 API / 別 payload に分離する必要があるか
- frontend type を current と legacy-compatible で分ける価値があるか
- OpenAPI で request / response の legacy field をどう書き分けるか
- `JmaForecastAreaCodeSupport` を UI request から外して import 専用にできるか

#### 比較する案

##### 案A: import / export とも legacy fields を維持

- export にも legacy fields を出し続ける
- import でも受け続ける
- 現状維持

長所:

- 最も安全
- 旧 backup / 新 backup の差が少ない
- DB columns が残っている間は自然

短所:

- 新しい backup にも使わない legacy fields が残る
- current 仕様としては重い
- Phase C / D-1 で UI と runtime を整理したのに、export は古い形を引きずる

##### 案B: import は受けるが、export では出さない

- 旧 backup restore のため import は legacy fields を受ける
- 新しく作る backup には legacy fields を含めない
- DB columns はまだ残す
- runtime では使わない

長所:

- 新しい backup が current 仕様に寄る
- 旧 backup 互換は残せる
- migration なしで段階的に縮小できる

短所:

- import / export が非対称になる
- docs と OpenAPI に明確な説明が必要
- export から外した後も DB には値が残るため、完全削除ではない

##### 案C: import / export とも削除

- legacy fields を backup / restore 対象から外す
- 旧 backup 互換も終了する

長所:

- 最もすっきりする

短所:

- 旧 backup を壊す
- DB columns が残る間は不自然
- Phase D の時点では早すぎる

#### 推奨案

推奨は **案B**。

理由:

- current の正本はすでに `latitude / longitude / timezone`
- runtime fallback も UI 主導線も削除済みで、legacy location field を新しい backup にまで残す理由は弱い
- 旧 backup restore はまだ壊さない方が安全
- `import だけ legacy を受ける` 形なら、Phase E 以降の column 削除と互換終了を段階的に進めやすい

#### 個別判断

##### weather location legacy fields

対象:

- `forecast_area_code`
- `jma_forecast_region_code`
- `jma_forecast_office_code`

推奨:

- export: Phase D-2 の第一候補では外す
- import: 旧 backup 互換として当面受ける

理由:

- current forecast / observed では使わない
- UI でも通常導線から外している
- DB columns はまだ残すが、新しい backup の正本として持ち続ける必要は薄い

##### weather record legacy snapshot

対象:

- `forecast_area_code_snapshot`

推奨:

- Phase D-2 では **export / import とも維持寄り**

理由:

- location legacy field と違い、`weather_records` 側の snapshot は過去履歴保全に近い
- 既存 record の roundtrip を保つなら、先に外すメリットが小さい
- 新規保存でほぼ未使用でも、過去 record を export / restore したときの再現性を優先した方が安全

補足:

- `forecast_area_code_snapshot` を export から外す判断は、Phase E 以降で履歴互換終了と一緒に再判断する

##### legacy source_name

対象:

- `jma_forecast_json`
- `tsukumijima`

推奨:

- Phase D-2 でも export / import に残す

理由:

- これは location の legacy field ではなく、record の履歴由来情報
- 新規取得では発生しないが、既存 `weather_records` には残りうる
- import / export で legacy history source として残す方が自然

#### import / export を非対称にする場合の注意点

- docs に `import は旧 backup を受けるが、export は current 形式へ寄せる` と明記する必要がある
- OpenAPI / backup schema 説明でも legacy field の扱いを current / legacy で書き分ける必要がある
- restore test は旧形式入力を維持しつつ、新 export test は legacy field なしへ分ける必要がある
- DB に値が残る期間は、export と DB の内容が一致しないことを前提にした説明が必要

#### 実装する場合の安全な手順

1. docs に Phase D-2 current 方針を明記する
2. weather location export から legacy fields を外す
3. import は legacy fields を受け続ける
4. import / export test を current / legacy で分離する
5. `forecast_area_code_snapshot` は別判断として維持する
6. `source_name` の legacy history 互換 test は残す
7. Phase E で DB columns / snapshot / export 完全縮小を再判断する

### Phase E 以降に回す課題

- `user_weather_locations` の legacy columns 削除
- `weather_records.forecast_area_code_snapshot` の削除可否判断
- export から legacy fields を外すかどうかの最終判断
- old backup restore の互換終了時期
- `source_name = jma_forecast_json / tsukumijima` の allow-list 縮小可否

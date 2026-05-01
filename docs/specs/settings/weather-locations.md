# Weather Location Settings

天気登録で使う「保存済み地域」を管理するための設定仕様です。

---

## 位置づけ

- デフォルト地域を登録できる
- よく使う地域を複数登録できる
- 天気登録画面で登録済み地域から選べる
- 一時的な地域はここに必ずしも追加しない

`user_weather_locations` は、旅行先など一回限りの地域を増やし続ける場所ではなく、継続的に使う地域を管理する設定とする。

---

## current

MVP では設定画面配下に簡易的な地域管理 UI を置く。

- `/settings/weather-locations`

扱う内容:

- 地域名
- 予報API用地域コード
- デフォルト設定
- 追加 / 編集 / 削除

UI 上の役割整理:

- 登録済み地域
  - よく使う地域
  - 将来の予報 API 取得にも使う地域
  - `forecast_area_code` を持てる
- 今回だけの地域
  - 旅行先や一時的な外出先
  - `user_weather_locations` には保存せず、`weather_records` の snapshot のみに残す

### 予報区域 UI

- 通常 UI では `forecast_area_code` を直接入力させず、`予報区域` として選択する
- 表示ラベルは `予報区域`
- 補足文は `天気予報APIで使う地域を選びます。` を基本とする
- 例: `さいたま（110010）`
- `未設定` も選べる
- MVP では `primary_area.xml` 相当の全国一覧をアプリ内の静的定義として select で表示する
- 将来、`primary_area.xml` 相当の定義から自動同期する余地を残す
- backend API は既存データや import 互換のため `forecast_area_code` を厳格 enum では制限せず、通常操作は UI の選択肢で制御する

---

## ルール

- 1 ユーザーにつき複数地域を登録できる
- デフォルト地域は 0 または 1 件
- 最初に作成した地域は自動でデフォルトにする
- デフォルト地域を切り替えた場合、他の地域の `is_default` は false にする
- `display_order` は数字で保持し、一覧順に使う

---

## 削除

MVP では、既に `weather_records` から参照されている保存済み地域は削除不可とする。

理由:

- 過去の天気記録との紐づきを不用意に壊さないため
- 一時地域は `weather_records` の snapshot だけで持てるため、保存済み地域の削除要件を複雑にしなくてよいため

将来は、削除時に snapshot のみ残して関連を切る移行も検討余地あり。

---

## 将来検討

- 予報API用地域コードの候補検索
- 緯度経度検索
- 現在地取得
- 表示順のドラッグ操作
- API 取得用の地域コード一覧との連携

---

## 地域コードの扱い

- `forecast_area_code` を物理名として使う
- 論理名は `予報API用地域コード` として扱う
- `name` はユーザー向けの表示名として扱う
- MVP では [weather.tsukumijima.net](https://weather.tsukumijima.net/) で使う city code を主対象とする
- 気象庁の `office` / `class10` / `class20` code と完全互換である前提にはしない
- 将来、気象庁系 API を使う場合は専用コード列の追加、またはコード変換レイヤーを別途持つ余地を残す
- `latitude` / `longitude` は、過去天気 API や座標ベース API 向けの将来拡張用として nullable で持つ
- 表示名は `川口` のような生活上の地域名でもよい
- API 連携時は `forecast_area_code` に対応する予報区域を別途選ぶ UI を検討する
- 将来は `表示名: 川口 / 予報区域: 埼玉県南部 / forecast_area_code: 110010` のように、表示名と予報API用地域コードを分けて扱う余地を残す
- 天気登録画面の `天気を取得` は、保存済み地域かつ `forecast_area_code` が設定された地域だけを対象にする
- 今回だけの地域は `user_weather_locations` に保存しないため、予報 API の取得対象にしない
- `forecast_area_code` は weather.tsukumijima.net の city code を保存するが、ユーザーには `予報区域` として見せる

---

## weather_code との関係

- `user_weather_locations` は地域設定であり、天気コード自体は保持しません。
- 単独天気 / 複合天気の選択は `weather_records.weather_code` に保存します。
- `forecast_area_code` は将来 API 用の地域コードであり、icon や rain possibility とは別概念です。
- 雨可能性 (`has_rain_possibility`) は保存せず、`weather_code` 定義から導出します。

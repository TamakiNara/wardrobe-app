# Weather Forecast Integration

天気登録画面で `weather.tsukumijima.net` を使って予報を取得し、フォームへ反映するための実装前詳細設計。

---

## 目的

- 天気登録画面で `天気を取得` ボタンから予報を取得できるようにする
- 取得結果はフォームへ反映するだけで、自動保存はしない
- 保存済み地域のうち `forecast_area_code` を持つ地域だけを対象にする
- `telop` を current の `weather_code` へ変換して扱う
- API 失敗時、日付不一致時、気温が取得できない場合の扱いを事前に決める

---

## current

- 天気登録画面では手入力で `weather_code` / `temperature_high` / `temperature_low` / `memo` を保存できる
- `weather_records` は `source_type`, `source_name`, `source_fetched_at` を持つ
- 保存済み地域には `forecast_area_code` を持てる
- 今回だけの地域は `location_id = null` で snapshot のみ保存する
- API 連携は未実装

---

## planned

### 対象画面

- `GET /wear-logs/weather?date=YYYY-MM-DD`

### 対象地域

- `登録済みの地域` タブで選択中の地域のみ
- かつ `forecast_area_code` が non-null / non-empty の地域のみ
- `今回だけの地域` タブでは `天気を取得` は使えない

### 非対象

- `forecast_area_code` 未設定の保存済み地域
- `今回だけの地域`
- 自動保存
- 過去実績 API / historical API

---

## UI 方針

### 画面上の配置

- 天気登録フォーム内の地域選択セクションか天気入力セクション上部に `天気を取得` ボタンを置く
- 取得対象がない場合は disabled にする

### ボタン活性条件

- `date` が妥当
- `locationMode === "saved"`
- `selectedLocationId !== null`
- 選択中の `user_weather_location.forecast_area_code` が存在する
- 取得中でない

### disabled 時の案内

- 保存済み地域だが `forecast_area_code` がない場合
  - `予報API用地域コードが設定された地域で取得できます。`
- 今回だけの地域タブの場合
  - `今回だけの地域では天気取得は使えません。`

### 取得成功時

- フォームの `weather_code`, `temperature_high`, `temperature_low` を上書きする
- `memo` は自動入力しない
- 画面上に `天気情報を取得しました。内容を確認して保存してください。` を表示する

### 取得失敗時

- フォームの現在値は保持する
- 取得失敗メッセージを表示する
- 自動保存はしない

---

## API 利用方針

### 外部 API

- `https://weather.tsukumijima.net/api/forecast/city/{forecast_area_code}`

### 使うレスポンス項目

- `publicTime`
- `forecasts[]`
  - `date`
  - `dateLabel`
  - `telop`
  - `temperature.max.celsius`
  - `temperature.min.celsius`

### MVP のサーバー側責務

- 外部 API 呼び出しは backend 側で行う
- frontend から外部 API を直接叩かない
- backend は画面向けに必要最小限の JSON を返す

### 想定アプリ内 API

- `POST /api/weather-records/forecast`

リクエスト:

- `weather_date`
- `location_id`

レスポンス案:

```json
{
  "message": "fetched",
  "forecast": {
    "weather_date": "2026-05-01",
    "location_id": 1,
    "location_name": "川口",
    "forecast_area_code": "110000",
    "weather_code": "sunny_then_cloudy",
    "temperature_high": 24,
    "temperature_low": 13,
    "source_type": "forecast_api",
    "source_name": "tsukumijima",
    "source_fetched_at": "2026-05-01T08:10:00+09:00",
    "raw_telop": "晴れ時々くもり"
  }
}
```

### backend validation

- `location_id` は current user 所有の保存済み地域であること
- 対象地域の `forecast_area_code` が存在すること
- `weather_date` は `YYYY-MM-DD`
- 今回だけの地域は対象外

---

## フォーム反映ルール

### 上書きする項目

- `weather_code`
- `temperature_high`
- `temperature_low`

### 上書きしない項目

- `memo`
- `location_id`
- `location_name`
- `save_location`
- 既存 record の保存状態

### 保存時の source metadata

予報取得後にそのまま登録または更新した場合:

- `source_type = forecast_api`
- `source_name = tsukumijima`
- `source_fetched_at = 取得成功時刻`

今回の MVP では `user_edited` のような追加フラグは持たない。  
取得後にユーザーが値を微調整して保存しても、初期入力元として `forecast_api` を保持する。

---

## telop から weather_code への変換

### 基本方針

- `telop` の原文をそのまま保存しない
- current の allow-list に入る `weather_code` へ正規化する
- `のち` と `時々` を区別する
- 雨を含んでも主天気を即 `rain` に潰さない

### 変換優先順位

1. 完全一致で複合天気を判定する
2. 完全一致で単独天気を判定する
3. 判定できないものは `other`

### MVP 変換表

- `晴れ` → `sunny`
- `曇り` / `くもり` → `cloudy`
- `雨` → `rain`
- `雪` → `snow`
- `晴れのち曇り` → `sunny_then_cloudy`
- `曇りのち晴れ` / `くもりのち晴れ` → `cloudy_then_sunny`
- `曇りのち雨` / `くもりのち雨` → `cloudy_then_rain`
- `雨のち曇り` / `雨のちくもり` → `rain_then_cloudy`
- `晴れ時々曇り` / `晴れ時々くもり` → `sunny_with_occasional_clouds`
- `曇り時々雨` / `くもり時々雨` → `cloudy_with_occasional_rain`
- `晴れ時々雨` → `sunny_with_occasional_rain`

### `other` に落とす例

- `雷`
- `霧`
- `暴風`
- `晴れ一時雨`
- `雨時々雪`
- `曇りのち一時雨`

### 要再判断

- `一時` を `with_occasional` に寄せるかどうか
- `みぞれ` を `snow` に寄せるか `other` にするか
- `雨時々止む` のような細粒度表現を扱うか

MVP では無理に拡張せず、不明な `telop` は安全側で `other` にする。

---

## 日付一致の扱い

### 基本方針

- `forecasts[]` から `weather_date` と一致する `date` の要素を探す
- 一致した要素だけをフォーム反映対象にする

### 一致しない場合

- フォームは更新しない
- エラーではなく取得不能として扱う
- メッセージ案:
  - `指定日の天気情報が取得できませんでした。手入力で登録できます。`

### 補足

`weather.tsukumijima.net` は通常 3 日分想定なので、対象日が範囲外なら一致しない。  
MVP では日付補正をしない。

---

## API 失敗時の扱い

### 失敗分類

- 外部 API HTTP エラー
- タイムアウト
- レスポンス構造不正
- `forecasts` 欠落
- `telop` 変換不能

### アプリ側の扱い

- 現在のフォーム入力は保持
- DB 保存は行わない
- backend は 4xx / 5xx を返し、frontend はトーストまたはページメッセージで案内

### メッセージ案

- `天気情報を取得できませんでした。手入力で登録できます。`
- `予報API用地域コードが設定された地域で取得できます。`
- `指定日の天気情報が取得できませんでした。手入力で登録できます。`

### ログ

- backend 側で `forecast_area_code`, `weather_date`, status code, 例外内容を記録する
- raw response 全文の永続保存は MVP では不要

---

## 気温が取得できない場合

### 前提

`weather.tsukumijima.net` では日付や発表時刻により `temperature.max.celsius` または `temperature.min.celsius` が `null` になりうる。

### 方針

- `max.celsius` が null の場合
  - `temperature_high = null`
- `min.celsius` が null の場合
  - `temperature_low = null`
- 片方だけ取れた場合は取れた方だけ反映する
- 両方 null でも `weather_code` が取れていれば反映は成功扱いにする

### UI 表示

- 成功メッセージは出してよい
- 補足として以下のいずれかを表示してよい
  - `一部の気温は取得できなかったため未入力のままです。`

### 保存時

- null のまま通常保存できる current 仕様を維持する

---

## 取得結果の整合ルール

- `weather_code` が取れたら気温 null でも反映可能
- `weather_code` が `other` にしかできない場合でも、MVP では反映可能
- ただし `telop` 自体が欠落している場合は失敗扱いにする

---

## current / planned / 要再判断

### current

- 手動登録のみ
- `forecast_area_code` は保存できるが通常 UI では主入力にしていない

### planned

- 保存済み地域だけ `天気を取得`
- `weather.tsukumijima.net` から当該日予報を取得
- フォーム反映のみ
- 保存時に `source_type=forecast_api`, `source_name=tsukumijima`

### 要再判断

- `一時` を `with_occasional` に寄せるか
- `other` に落ちたときのユーザー向け補助表示
- 取得結果を memo に自動記録するか
- 将来の historical API との UI 共存

---

## 今回やらないこと

- 自動保存
- 今回だけの地域への予報取得対応
- forecast 取得後の自動 import/export 拡張
- `was_exposed_to_rain` 実装
- `chanceOfRain` を DB 保存すること
- カレンダーセルへの予報アイコン表示

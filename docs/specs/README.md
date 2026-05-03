# Specs Index

主な spec の入口です。

## items

- [items: tops](./items/tops.md)
- [items: underwear](./items/underwear.md)
- [items: status management](./items/status-management.md)
- [items: detail status UI](./items/detail-status-ui.md)
- [items: material composition](./items/material-composition.md)
- [items: closet view](./items/closet-view.md)
- [items: list filters / currentSeason](./items/list-filters.md)

## outfits

- [outfits: list filters / currentSeason](./outfits/list-filters.md)
- [outfits: create / edit](./outfits/create-edit.md)
- [outfits: item candidate rules](./outfits/item-candidate-rules.md)

## wear logs

- [wear logs: wear logs](./wears/wear-logs.md)

### weather

- [wear logs: weather current status](./wears/weather-current-status.md)
  - 天気機能全体の現在地・索引
- [wear logs: weather records](./wears/weather-records.md)
  - `weather_records` と保存方針
- [wear logs: weather fetching](./wears/weather-fetching.md)
  - Open-Meteo forecast / historical と fallback
- [wear logs: Open-Meteo redesign note](./wears/weather-open-meteo-redesign.md)
  - Open-Meteo 移行検討メモ
- [wear logs: forecast integration legacy note](./wears/weather-forecast-integration.md)
  - JMA forecast JSON / tsukumijima legacy メモ
- [wear logs: historical integration legacy note](./wears/weather-historical-integration.md)
  - JMA latest CSV / 観測所 legacy メモ

## settings

- [settings: weather locations](./settings/weather-locations.md)
  - 地域設定・座標正本・Geocoding
- [settings: brand candidates](./settings/brand-candidates.md)

## recommendation

- [recommendation: weather and feedback](./recommendation/weather-and-feedback.md)
  - 着用履歴フィードバックと天気の関係

## shared

- [color thumbnails](./color-thumbnails.md)
- [purchase candidates](./purchase-candidates.md)
- [ui: page header guidelines](./ui/page-header-guidelines.md)
- [planning: next features](./planning/next-features.md)
- [tags](./tags.md)

## 使い分けの目安

- 実装仕様の正本を見たいときは各 spec を参照する
- API の request / response は `../api/openapi.yaml` を参照する
- DB 構造や保存対象を見たいときは `../data/database.md` を参照する
- 実装メモや経緯を見たいときは `../project/implementation-notes.md` を参照する
- docs の書き方を確認したいときは `../project/docs-writing-guidelines.md` を参照する

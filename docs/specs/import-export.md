# インポート・エクスポート

## 概要

データをバックアップ・復元するための機能です。

Web UI:

- `/settings/import-export`
- 設定画面からエクスポート / インポートを実行できます

対象データ:

- アイテム（`items`）
- 購入検討（`purchase_candidates`）
- コーディネート（`outfits`）
- 着用履歴（`wear_logs`）

対象範囲:

- ログインユーザーのデータのみを対象にします
- 他ユーザーのデータは含まれません
- import 実行時も、ログイン中のユーザーの対象データのみ削除して復元します

## エクスポート

エンドポイント:

- `GET /api/export`

説明:

- 全対象データを JSON で取得します
- 画像は Base64 で JSON に含まれます

レスポンス例:

```json
{
  "version": 1,
  "exported_at": "2026-04-24T12:34:56+09:00",
  "owner": {
    "user_id": 1
  },
  "items": [],
  "purchase_candidates": [],
  "outfits": [],
  "wear_logs": []
}
```

- `purchase_candidates` では `release_date` / `sale_ends_at` / `discount_ends_at` / `sheerness` も export / import 対象に含める
- `items.colors[*].custom_label` も export / import 対象に含める
- `items.sheerness` も export / import 対象に含める

注意:

- 画像を Base64 で含むため、ファイルサイズが大きくなる場合があります

## インポート

エンドポイント:

- `POST /api/import`

説明:

- エクスポートした JSON を使ってデータを復元します

重要:

- import を実行すると、現在の対象データはすべて削除されます
- 復元後の ID は再採番されます
- `shape` / `spec` はエクスポート時の値をそのまま使います
- 画像もあわせて復元されます
- バックアップファイルは作成したユーザー本人のみ復元できます
- 他ユーザーのバックアップファイルは復元できません
- 復元に失敗した場合、既存データは削除されません
- `owner.user_id` を含まない古い形式のバックアップファイルは復元できません

着用履歴の参照:

- `wear_logs.source_outfit_id` は import 時に新しい outfit ID へ張り替えます
- `wear_logs.items[*].source_item_id` は import 時に新しい item ID へ張り替えます
- 復元対象に存在しない item / outfit を参照している着用履歴は復元できません

## 注意事項

- import すると現在のデータはすべて消えます
- `version` が異なるバックアップファイルは失敗する可能性があります
- 古いバックアップファイルは互換性がない可能性があります
- 画像が多い場合は処理時間が長くなることがあります

## 推奨フロー

1. `GET /api/export` でバックアップを取得する
2. JSON ファイルを安全な場所に保存する
3. 必要なときに `POST /api/import` で復元する

## 制限事項

- 差分更新はできません
- ZIP 形式ではなく JSON のみです

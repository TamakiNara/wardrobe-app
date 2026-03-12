# Docs Guide

## 目的

このメモは、`docs/` 配下にある資料の一覧と、それぞれの役割・使い分けをまとめたものです。
新しく作業に入るときや、どの資料を更新すべきか迷ったときの入口として使います。

---

## 使い分けの基本方針

- 実装の現況や次にやることを知りたいときは `implementation-notes.md`
- API の入出力やエンドポイントを見たいときは `api.md`
- DB 構造を見たいときは `database.md`
- 認証の流れを確認したいときは `auth-flow.md`
- アーキテクチャ全体を見たいときは `system-architecture.md`
- 設計判断の理由を残すときは `decision-log.md`
- tops の詳細仕様を見たいときは `item-spec-tops.md`

---

## 資料一覧

### `docs/implementation-notes.md`

役割:

- 実装の進捗共有
- 引き継ぎメモ
- 次にやることの整理

使う場面:

- 今このプロジェクトがどこまで進んでいるか知りたいとき
- 次の着手ポイントを決めたいとき
- 作業後に「今回何をやったか」を残したいとき

更新する内容:

- 実装済み機能の追記
- 今回の変更点
- 次にやること
- 作業上の注意点

補足:

- 設計の正本というより、運用中の作業ログ・引き継ぎ資料
- 細かな日報ではなく、次の作業者が困らない粒度で保つ

### `docs/api.md`

役割:

- API の一覧と payload の概要整理

使う場面:

- フロントからどの API を叩くか確認したいとき
- request / response の形を確認したいとき
- API 変更時に影響範囲を整理したいとき

更新する内容:

- エンドポイント追加・削除
- payload / schema 変更
- 認証要否の変更

補足:

- 詳細な厳密 schema は将来的に `openapi.yaml` と合わせて管理する
- 現時点では実装寄りの概要資料

### `docs/openapi.yaml`

役割:

- API schema の機械可読な定義

使う場面:

- Swagger / OpenAPI ベースで API を管理したいとき
- request / response の厳密定義を追加したいとき
- 将来的にドキュメント生成や検証に使いたいとき

更新する内容:

- API schema の正式定義
- request body / response body
- path / parameter / status code

補足:

- `api.md` より厳密な定義を書く場所
- 実装が先行している場合は、後追いで整合を取る

### `docs/database.md`

役割:

- DB テーブル構造と保存方針の整理

使う場面:

- migration を追加・変更するとき
- JSON で持つか正規化するか判断したいとき
- テーブルやカラムの役割を確認したいとき

更新する内容:

- テーブル追加・削除
- カラム追加・削除
- JSON 構造の変更
- リレーションの変更

補足:

- コード上の migration だけでは読み取りにくい設計意図を補足する場所
- `items.spec` のような JSON カラムはここに必ず反映する

### `docs/auth-flow.md`

役割:

- 認証フローの説明
- Cookie / CSRF / Session の流れの整理

使う場面:

- ログインまわりの挙動を確認したいとき
- BFF と Laravel の認証分担を確認したいとき
- 認証エラーの原因切り分けをしたいとき

更新する内容:

- ログイン / ログアウトの流れ変更
- CSRF 取得方法の変更
- セッション運用の変更

補足:

- 認証は実装依存で混乱しやすいので、図やシーケンスを保守する価値が高い

### `docs/system-architecture.md`

役割:

- システム全体の責務分割を説明する

使う場面:

- Next.js / BFF / Laravel / DB の責務を確認したいとき
- 新しく入った人へ全体像を説明したいとき
- 処理をどこに置くか迷ったとき

更新する内容:

- 構成変更
- 責務分担の変更
- 新しい主要コンポーネントの追加

補足:

- 実装詳細より「どこが何を担当するか」を整理する資料

### `docs/decision-log.md`

役割:

- 設計判断の理由を残す

使う場面:

- なぜその方式を選んだかを後から追いたいとき
- 将来の見直し時に過去判断を比較したいとき
- 一時的な妥協か、意図的な決定かを明確にしたいとき

更新する内容:

- 主要な設計判断
- 採用案 / 不採用案
- 判断理由とトレードオフ

補足:

- 「何を作ったか」ではなく「なぜそうしたか」を残す場所
- `implementation-notes.md` と役割が重なりやすいが、こちらは意思決定の記録が中心

### `docs/item-spec-tops.md`

役割:

- tops の spec 定義をまとめる

使う場面:

- `spec.tops` の属性を確認したいとき
- shape ごとの許可値を確認したいとき
- UI / SVG / API / DB で同じ spec を扱うときの参照元にしたいとき

更新する内容:

- `shape / sleeve / length / neck / design / fit` の定義変更
- 許可値の追加・削除
- `TOPS_RULES` の変更
- SVG や UI の前提変更

補足:

- item 固有仕様の一次資料
- 将来的に bottoms / outer / shoes などが増えたら、同じ粒度の spec 資料を追加する

---

## 更新ルールの目安

### 実装を変えたとき

最低限、次を確認する:

- `implementation-notes.md`
- `api.md`
- `database.md`

### 設計判断をしたとき

必要に応じて更新する:

- `decision-log.md`
- `system-architecture.md`

### item spec を変えたとき

必ず確認する:

- `item-spec-tops.md`
- `api.md`
- `database.md`
- `implementation-notes.md`

### 認証まわりを変えたとき

必ず確認する:

- `auth-flow.md`
- `api.md`
- `system-architecture.md`
- `implementation-notes.md`

---

## おすすめの読み順

新しく状況を把握するときは、次の順が分かりやすいです。

1. `docs/implementation-notes.md`
2. `docs/system-architecture.md`
3. `docs/api.md`
4. `docs/database.md`
5. 必要に応じて個別仕様 (`docs/item-spec-tops.md` など)

---

## 今後の整理候補

- `openapi.yaml` と `api.md` の整合強化
- `system-architecture.md` と `auth-flow.md` の文字化け修正
- item spec 資料を tops 以外にも拡張

# Logging

この docs は、アプリ全体のログ設計方針を整理するための正本とする。  
今回は **実装変更なし** で、current の状況確認と、今後実装する場合の方針整理だけを扱う。

## 概要

ログ設計の目的は、主に次の 3 つである。

- 障害調査
  - 500 error
  - 外部 API failure
  - import / export 失敗
  - 想定外例外
- 業務 / 操作追跡
  - 重要なユーザー操作を後から確認する
  - 復旧判断や誤操作調査に使う
- 開発中のデバッグ
  - local / dev で一時的に詳細を追う

## current 状況

### current backend

- Laravel の標準 logging 設定は存在する
  - `config/logging.php`
  - default channel は `stack`
  - `single` / `daily` / `stderr` などの標準 channel は利用可能
- ただし、**明示的な `Log::info` / `Log::warning` / `Log::error` の structured log はまだ限定的**
- current では import / export に初期的な structured log を導入済み
- current backend は主に
  - validation error を `ValidationException`
  - 想定外例外を Laravel の既定 handler
    に任せている

### current frontend

- Next.js BFF route / API helper / import-export UI に、**明示的な structured log はほぼない**
- client 側で確認できた明示的な console 出力は、現状では `logout-button.tsx` の `console.error` が主
- import/export UI や weather UI は、基本的に
  - ユーザー向け message を画面表示する
  - console へ詳細を出しすぎない
    方針になっている

### current の不足

current では、次のような処理で「ユーザー向け error は返るが、運用確認用の log は不足しやすい」。

- import / restore
- weather external API failure
- shopping memo bulk add / remove
- item delete / disposed / reactivate
- purchase candidate の item 化
- 大きめの settings 変更

## current backend API / UI のログ状況

### import / export

current:

- backend service / controller は存在する
- counts は response に返す
- 次の operation 名で structured log を出す
  - `import_export.export.start`
  - `import_export.export.completed`
  - `import_export.export.failed`
  - `import_export.import.start`
  - `import_export.import.completed`
  - `import_export.import.partial_skipped`
  - `import_export.import.failed`
- export completed では entity count を残す
- import completed では restored count を残す
- import の missing relation skip は warning で残す
- raw payload / import file 全文は残さない

残る不足:

- import の skipped count を response にまで広げるかの判断
- request_id / correlation_id 連携

### weather

current:

- weather fetch / geocoding は service / controller がある
- external API failure 時は 502 で user-facing message を返す
- current では weather external API failure の structured log を導入済み
  - `weather.forecast.fetch.failed`
  - `weather.historical.fetch.failed`
  - `weather.geocoding.fetch.completed`
  - `weather.geocoding.fetch.failed`
- context は `provider / source_type / user_id / location_id / weather_date / elapsed_ms` を中心に残す
- raw provider response 全文は残さない

不足:

- forecast / historical の success log を常時出すかの判断
- request_id / correlation_id
- weather 保存処理そのものの info log

### shopping memo

current:

- bulk add / item remove の structured log を導入済み
  - `shopping_memo.items.add.start`
  - `shopping_memo.items.add.completed`
  - `shopping_memo.items.add.failed`
  - `shopping_memo.items.remove.completed`
  - `shopping_memo.items.remove.failed`
- completed log では `result / requested_count / added_count / skipped_count / duplicate_count / invalid_status_count / elapsed_ms` を残す
- remove completed log では `shopping_memo_item_id / purchase_candidate_id / elapsed_ms` を残す
- shopping memo memo 本文や purchase candidate 名は log に出さない

- bulk add / item remove / import-export は機能として存在する
- user-facing message は返す
- shopping memo については、上記の add/remove structured log を current とする
- memo delete など一部の重要操作ログはまだ未整備

不足:

- bulk add 開始 / 完了
- duplicate / invalid / skipped 件数
- item remove
- memo delete

### purchase candidate

current:

- create / update / duplicate / color variant / item 化などの機能はある
- ただし通常操作ログはほぼ未整備

不足:

- item 化
- duplicate / color variant
- bulk 操作に近い変更

### item

current:

- create / update / delete / disposed / reactivate 相当の処理はある
- ただし structured log はほぼ未整備

不足:

- delete
- disposed / reactivate
- image sync failure

### wear log

current:

- create / update / calendar summary などの機能はある
- ただし通常 create / update を監査する仕組みはない

不足:

- 異常時の context
- bulk / summary failure の把握

### settings / auth

current:

- settings 更新 UI / API はある
- auth では logout button 側の console error が一部ある
- ただし監査レベルの記録は未整備

不足:

- TPO / category / weather location 変更
- 影響の大きい preference 変更

## ログ目的の分類

### 障害調査ログ

対象:

- 予期しない例外
- DB 整合性違反
- external API failure
- import / export の致命的失敗
- auth / CSRF 周りの想定外エラー

主な level:

- `error`
- 一部 `warning`

### 業務 / 操作追跡ログ

対象:

- import 実行
- restore 実行
- item delete
- item disposed / reactivate
- shopping memo bulk add / remove
- purchase candidate の item 化
- 大きい settings 変更

主な level:

- `info`
- partial success を含む場合は `warning`

### デバッグログ

対象:

- payload の詳細確認
- provider response の詳細確認
- 開発中の原因切り分け

主な level:

- `debug`

## ログレベル方針

### error

- 予期しない例外
- 外部 API failure
- import / export の致命的失敗
- DB 整合性違反
- 保存失敗により処理全体が失敗した場合

### warning

- 一部 skip しながら処理継続
- import で一部レコードを復元できなかった
- missing purchase candidate / missing relation
- fallback はしたが、注意が必要な状態
- retry 可能だが結果が不完全な状態

### info

- import / export 開始 / 完了
- weather fetch 成功
- shopping memo bulk add / remove 完了
- item delete / disposed / reactivate
- purchase candidate item 化
- settings の重要変更

### debug

- request payload の詳細
- provider response の詳細
- 一時的な調査用の追加 context

原則:

- production では `debug` 依存にしない
- local / dev だけで使う

## ログに含める情報

基本項目の第一候補:

- `user_id`
- `operation`
- `target_type`
- `target_id`
- `result`
- `counts`
- `skipped_count`
- `error_code`
- `exception_class`
- `external_provider`
- `elapsed_ms`

処理に応じて追加候補:

- `status`
- `location_id`
- `weather_date`
- `source_type`
- `memo_id`
- `purchase_candidate_id`
- `item_id`

例:

```json
{
  "operation": "import.execute",
  "user_id": 1,
  "result": "partial_success",
  "shopping_memos": 3,
  "shopping_memo_items": 8,
  "skipped_shopping_memo_items": 1
}
```

## ログに含めない情報

production では、次を原則ログに含めない。

- raw request body 全体
- memo 本文全文
- item / purchase candidate の長い memo 全文
- cookie
- auth token
- CSRF token
- password
- import file 全文
- external API raw response 全文
- 画像 URL 全量

補足:

- URL は必要でも domain や provider 名までに抑える
- memo は `has_memo: true` のような flag や length 程度で足りるなら本文を出さない

## 機能別ログ方針

### import / export

優先度:

- high

残す候補:

- export 開始 / 完了
- import 開始 / 完了
- restore 件数
- skipped count
- validation error
- missing relation
- shopping memo import の skip

level 方針:

- 開始 / 完了: `info`
- partial success / skip: `warning`
- 全体失敗: `error`

### weather

優先度:

- high

残す候補:

- Open-Meteo forecast fetch
- Open-Meteo historical fetch
- geocoding
- external API failure
- source_type
- location_id
- weather_date
- elapsed_ms

level 方針:

- 成功: `info` または集計しない
- provider failure: `warning` または `error`

### item

優先度:

- medium

残す候補:

- delete
- disposed
- reactivate
- image sync failure

通常の create / update:

- current MVP では必須ではない
- audit log 導入時に再判断

### purchase candidate

優先度:

- medium

残す候補:

- item 化
- duplicate / color variant
- deadline 系の大きな変化は将来候補

通常の create / update:

- current MVP では通常ログ不要寄り

### shopping memo

優先度:

- high

残す候補:

- bulk add
- item remove
- memo delete
- duplicate skip / invalid status count

level 方針:

- 完了: `info`
- partial success / skip: `warning`
- 全体失敗: `error`

### wear log

優先度:

- low から medium

残す候補:

- bulk / calendar summary failure
- weather relation の不整合

通常の create / update:

- current では通常ログ不要寄り

### settings

優先度:

- medium

残す候補:

- TPO / category / weather location 設定変更
- 影響範囲が大きい設定変更

## audit log を DB に持つか

### 案A: Laravel log のみ

長所:

- 実装が軽い
- まず始めやすい

短所:

- ユーザー操作履歴として検索しづらい
- アプリ画面から見られない

### 案B: `audit_logs` table を作る

候補 fields:

- `id`
- `user_id`
- `action`
- `target_type`
- `target_id`
- `metadata_json`
- `created_at`

長所:

- 操作履歴を追いやすい
- 将来 UI で確認できる

短所:

- DB 設計と保存方針が必要
- 個人情報管理が必要
- 過剰設計になりやすい

### 案C: 重要操作だけ DB audit log

候補:

- import
- restore
- item delete
- shopping memo delete
- bulk operation
- settings major change

長所:

- 履歴が必要な操作だけに絞れる
- Laravel log と DB 監査の中間案になる

短所:

- どこまでを「重要操作」にするか設計が必要
- file log と audit log の二重管理になる

### 推奨

current の推奨は次のとおり。

- 短期
  - Laravel log 中心
  - structured な `info / warning / error` をまず足す
- 中期
  - import / restore / delete / bulk operation を DB audit log 候補として再判断
- 長期
  - 必要なら案C

現時点では、いきなり `audit_logs` table を入れるより、**file log / structured log の整理を先に行う** 方が自然。

## request_id / correlation_id

current:

- request ごとの `request_id` は未実装
- Next.js BFF と Laravel API 間の correlation id 伝搬も未実装

整理:

- 個人開発 MVP としては今すぐ必須ではない
- ただし、次の条件で必要性が上がる
  - BFF と backend の往復が増える
  - import / weather のような複数段処理の調査が増える
  - 外部 API 失敗の切り分け頻度が高い

方針:

- current: 未実装
- planned: 後続候補として保持

## 環境別方針

### local / dev

- `debug` 多めでもよい
- payload の一部を確認してよい
- ただし token / password / cookie は出さない

### production

- `info / warning / error` 中心
- 個人情報を避ける
- raw payload 全文を出さない
- 外部 API response 全文を出さない

## 実装する場合の初期ステップ

1. import / export に structured log を追加する
2. weather external API failure に `warning / error` log を追加する
3. shopping memo bulk add / remove に `info` log を追加する
4. item delete / disposed / reactivate に `info` log を追加する
5. 共通の log context builder / helper を作るか判断する
6. `request_id / correlation_id` は後続判断にする
7. DB audit log は import / delete / bulk operation だけ候補として別設計する

## current / planned / 要再判断

### current

- Laravel の標準 logging 設定は存在する
- ただし structured application log は未整備
- import-export と weather external API failure には structured log を導入済み
- shopping memo bulk add / item remove にも structured log を導入済み
- item state change は引き続き未整備

### planned

- item delete / disposed / reactivate

から順に structured log を入れる

### 要再判断

- DB audit log を持つか
- `request_id / correlation_id` を導入するか
- create / update 系の通常操作まで記録するか
- frontend console と server log の役割分担

## 関連 docs

- [error-message-guidelines](./error-message-guidelines.md)
- [import-export](./import-export.md)
- [shopping-memos](./shopping-memos.md)
- [purchase-candidates](./purchase-candidates.md)
- [task-backlog](./task-backlog.md)

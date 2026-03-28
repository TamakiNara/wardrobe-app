# TPO 任意追加 実装前影響整理メモ

この資料は、`docs/specs/settings/tpos.md` を実装へ落とす前に、影響範囲と段階的な実装順を整理するための補助メモです。  
Phase 1 実装後は、current / planned の境界確認と wear log 後段対応の起点として使うことを目的とします。

正本:

- 仕様: `docs/specs/settings/tpos.md`
- API: `docs/api/api-overview.md`
- OpenAPI: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`

---

## 目的

- TPO 任意追加を実装する前に、DB / API / settings 画面 / 利用先画面への影響を整理する
- 既存の `items.tpos` / `outfits.tpos` / wear log 側の保存構造と、`user_tpos` / `tpo_ids` をどう接続するかを明確にする
- 一括実装ではなく、段階的に current 化できる順序を整理する

---

## 前提

- `docs/specs/settings/tpos.md` では、TPO を settings 配下で管理するユーザー単位マスタとして扱う方針を正本としている
- プリセット TPO は `仕事 / 休日 / フォーマル` を初期候補とする
- 削除より無効化を優先し、既存データでは inactive TPO を保持・表示できる前提を採る
- item / outfit / wear log は、当面 TPO を複数選択の補助分類として扱う
- 今回は実装ではなく、影響整理と実装順序の整理だけを行う

---

## current / planned / 要再判断

### current

- item / outfit / wear log には TPO の概念があり、複数値を扱う前提がある
- settings + item + outfit では、TPO の選択肢正本を `user_tpos` として扱う
- settings + item + outfit の保存方式は ID ベースで、item / outfit は `tpo_ids` を保存正本とする
- ユーザー作成時に、プリセット `仕事 / 休日 / フォーマル` を `user_tpos` へ初期投入する
- 既存ユーザーは `user_tpos` 導入 migration で backfill し、runtime の補完処理は防御コードとして残す
- つまり、正本は「既存ユーザーは migration で一括補完 / 新規ユーザーは作成時に初期投入」であり、runtime 補完は想定外の欠損を救済する保険として扱う
- inactive TPO は新規候補に出さず、既存データでは表示・保持する
- プリセット TPO の名称変更は不可、並び替え UI は上下移動を採用する

### planned

- wear log は後段対応として planned に残す
- wear log の入力 UI / 表示 UI を `user_tpos` 正本へ接続する
- wear log の保存方式を ID ベースへ揃える

### 要再判断

- inactive TPO の表示方法を一覧 / 詳細 / 編集でどこまで揃えるか
- wear log で TPO をどの粒度まで使うか

---

## 既存保存構造との接続案

### Phase 1 の方針

- settings 側の選択肢正本を `user_tpos` に置く
- item / outfit の保存値は TPO ID ベースとする
- wear log は後段対応とし、初期版では保存構造を変更しない

### この方針の利点

- settings 側の正本と利用先の参照先を揃えやすい
- inactive 化や並び順変更と整合しやすい
- 将来の集計や絞り込みへ広げやすい

### この方針の注意点

- item / outfit 側の既存保存構造と API / UI の更新が必要になる
- wear log を初期版対象外とすることを docs / 実装依頼で明確に分ける必要がある

---

## DB 影響

### 追加が想定されるもの

- `user_tpos`
  - `id`
  - `user_id`
  - `name`
  - `sort_order`
  - `is_active`
  - `is_preset`
  - timestamps

### 初期版で触らずに済ませたいもの

- wear log 側の TPO 保存構造

### DB 方針メモ

- 初期版では `user_tpos` を追加し、item / outfit は TPO ID を参照する構造へ寄せる
- inactive 化前に保存された TPO を既存データ側から一律除去しない
- wear log は後段対応とし、初期版では既存保存構造に手を入れない

---

## API 影響

### settings API

初期版で追加が想定されるのは次の 3 本である。

- `GET /api/settings/tpos`
- `POST /api/settings/tpos`
- `PATCH /api/settings/tpos/{id}`

### 既存 API への影響

- item / outfit の upsert API は、TPO ID ベース保存へ寄せる変更が必要になる
- wear log は初期版対象外とすることで、既存 API 変更を避ける

### API 方針メモ

- まずは settings API を独立に成立させる
- item / outfit は初期版から ID ベース前提で揃える
- inactive TPO を既存データ表示でどう返すかは、item / outfit API 側の説明に反映が必要になる

---

## settings 画面影響

### 初期版で必要なもの

- TPO 一覧
- 新規追加
- 有効 / 無効切替
- 並び順変更
- プリセット / 追加 TPO の区別表示

### 先に実装しやすい理由

- settings 画面は利用先画面より責務が閉じている
- 選択肢正本を先に作れば、item / outfit / wear log 側は後続で接続しやすい
- `user_tpos` と settings API だけでも、TPO 管理の current を先に成立させやすい

### 注意点

- settings だけ先に実装しても、利用先が固定 TPO のままだと UX 上の分断が残る
- そのため「管理はできるが、利用先ではまだ使えない」期間を許容するかは要判断になる

---

## item / outfit / wear log 影響

### item

- TPO 選択 UI を固定値から settings 管理値へ切り替える影響がある
- inactive TPO を持つ既存 item は、編集時に表示・保持できる必要がある
- 初期版では TPO ID ベース保存へ移行する前提で整理する

### outfit

- item と同様に、選択肢切替の影響がある
- 一覧 / 詳細 / 編集で inactive TPO をどう見せるか整理が必要になる
- current の一覧絞り込みや補助表示と衝突しないか確認が必要

### wear log

- 初期版の対象外とし、後段対応に分ける
- item / outfit と同時に着手しない前提でも docs 上は成立する
- 着手する段階では、一覧 / 詳細 / 編集 / カレンダー周辺の表示責務まで連動確認が必要になる

---

## 段階的実装案

### Phase 1

- `user_tpos` 導入
- settings API 導入
- settings 画面で TPO 一覧 / 追加 / 無効化 / 並び替えを実装
- item / outfit の選択肢を settings 管理値へ接続
- inactive TPO の表示 / 保持ルールを item / outfit で整理
- item / outfit 側の保存を TPO ID ベースへ寄せる

### 後段

- wear log へ適用するかを再判断
- 必要なら、wear log の入力 UI・表示 UI へ段階導入する
- この段階で wear log 側の保存構造と表示責務を再評価する

### この順序を推奨する理由

- settings 側を先に成立させることで、選択肢正本を固定しやすい
- item / outfit を初期版対象に絞ることで、ID ベース保存の影響範囲を限定しやすい
- wear log は利用粒度が未確定のため、Phase 1 から同時対応しなくてもよい

---

## テスト影響

### settings 側

- 一覧取得
- 追加
- 重複エラー
- 無効化 / 再有効化
- 並び順変更
- 自分の TPO のみ操作可能

### item / outfit 側

- active TPO のみ選択肢に出る
- inactive TPO を持つ既存データを表示・保持できる
- TPO ID ベース保存へ寄せた場合、保存 payload と response の整合が崩れない

### wear log 側

- 初期版で未対応なら、未対応であることを docs と test 方針で明示する
- 同時対応する場合は、入力 / 詳細 / 一覧の責務を改めて確認する必要がある

---

## 今決めるべきこと

1. 初期版は `user_tpos` を選択肢正本にする
2. 初期版の保存構造は ID ベースにする
3. 削除より無効化を優先する
4. settings 側を先に実装する
5. Phase 1 の対象は settings + item + outfit とし、wear log は後段に分ける

---

## 保留でよいこと

- wear log の TPO 利用粒度
- inactive TPO の詳細表示文言
- TPO 使用回数集計や分析表示

---

## 現時点の整理

TPO 任意追加は、**settings 側のユーザー単位マスタを先に成立させ、初期版は settings + item + outfit を対象に ID ベースで揃える** 進め方が最も現実的である。  
wear log は後段対応として切り分けることで、初期版の影響範囲を抑えつつ、inactive TPO の表示・保持ルールを item / outfit で先に固めやすい。  
一方で、wear log への適用粒度や inactive TPO の詳細表示文言はまだ確定しきらないため、今回は `要再判断` として残し、実装依頼時にスコープを切って扱うのが適切である。

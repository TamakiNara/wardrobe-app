# TPO 任意追加 実装前影響整理メモ

この資料は、`docs/specs/settings/tpos.md` を実装へ落とす前に、影響範囲と段階的な実装順を整理するための補助メモです。  
current 実装の正本ではなく、今後の実装依頼や仕様確認の起点として使うことを目的とします。

正本:

- 仕様: `docs/specs/settings/tpos.md`
- API: `docs/api/api-overview.md`
- OpenAPI: `docs/api/openapi.yaml`
- DB: `docs/data/database.md`

---

## 目的

- TPO 任意追加を実装する前に、DB / API / settings 画面 / 利用先画面への影響を整理する
- 既存の `items.tpos` / `outfits.tpos` / wear log 側の保存構造と、`user_tpos` をどう接続するかを明確にする
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
- TPO は固定値寄りの運用だが、将来 settings 配下で管理する方向性は合意済み
- `docs/specs/settings/tpos.md` では、TPO をユーザー単位マスタとして扱う planned を整理済み

### planned

- `user_tpos` テーブル相当の導入
- settings 配下の TPO 管理画面
- `GET /api/settings/tpos`
- `POST /api/settings/tpos`
- `PATCH /api/settings/tpos/{id}`
- item / outfit / wear log の選択肢を、登録済み TPO ベースへ切り替える

### 要再判断

- 初期版で `items.tpos` / `outfits.tpos` / wear log 側の保存値を name ベースのまま維持するか
- wear log を初期版から同時対応に含めるか
- inactive TPO の表示方法を一覧 / 詳細 / 編集でどこまで揃えるか
- プリセット TPO の名称変更を完全不可にするか
- 並び替え UI を上下移動にするか、ドラッグにするか

---

## 既存保存構造との接続案

### 案A: 当面は name ベース保存を維持する

- settings 側の選択肢正本だけ `user_tpos` に寄せる
- item / outfit / wear log の保存値は、当面は既存どおり文字列配列を維持する
- UI では `user_tpos.name` を選択肢に使い、保存時も name をそのまま配列へ入れる

### この案の利点

- 既存 DB / API / frontend 型への影響が最も小さい
- 既存データ移行を初期版でほぼ避けられる
- settings 側から先に段階導入しやすい

### この案の注意点

- 将来の名称変更に弱い
- inactive TPO や名称変更後の表示整合は、表示側で吸収する設計が必要になる
- 将来的に ID 参照へ移る場合、移行作業は別途必要になる

### 現時点の第一候補

現時点では **案A を初期版の第一候補** とするのが現実的である。  
理由は、settings 側の管理機能を先に成立させつつ、既存 item / outfit / wear log 保存構造への影響を最小化できるためである。

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

- `items.tpos`
- `outfits.tpos`
- wear log 側の TPO 保存構造

### DB 方針メモ

- 初期版では `user_tpos` 追加に留め、利用先の保存構造は既存維持を第一候補とする
- inactive 化前に保存された TPO を既存データ側から一律除去しない
- ID 参照化は、初期版で必須にしない

---

## API 影響

### settings API

初期版で追加が想定されるのは次の 3 本である。

- `GET /api/settings/tpos`
- `POST /api/settings/tpos`
- `PATCH /api/settings/tpos/{id}`

### 既存 API への影響

- item / outfit / wear log の upsert API は、初期版では payload shape を大きく変えずに済む可能性が高い
- 選択肢取得だけを settings API に寄せ、保存値は name ベース配列を維持するなら、既存 API の変更量は比較的少ない

### API 方針メモ

- まずは settings API を独立に成立させる
- 利用先 API の ID 化や schema 変更は、初期版では後回しにできる
- inactive TPO を既存データ表示でどう返すかは、利用先 API 側の説明に後で反映が必要になる

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
- 初期版では保存構造を name ベースのまま維持しやすい

### outfit

- item と同様に、選択肢切替の影響がある
- 一覧 / 詳細 / 編集で inactive TPO をどう見せるか整理が必要になる
- current の一覧絞り込みや補助表示と衝突しないか確認が必要

### wear log

- 現時点では TPO 利用の粒度自体が `要再判断` である
- そのため、初期版では item / outfit までを先行し、wear log は後続でも成立しうる
- wear log を同時対応に含める場合は、一覧 / 詳細 / 編集 / カレンダー周辺の表示責務まで連動確認が必要になる

---

## 段階的実装案

### 第1段階

- `user_tpos` 導入
- settings API 導入
- settings 画面で TPO 一覧 / 追加 / 無効化 / 並び替えを実装
- 利用先画面への接続はまだ行わない、または限定的に行う

### 第2段階

- item の TPO 選択肢を settings 管理値へ接続
- inactive TPO の表示 / 保持ルールを item で整理
- 既存保存構造は name ベース維持を第一候補とする

### 第3段階

- outfit の TPO 選択肢を settings 管理値へ接続
- inactive TPO の表示 / 保持ルールを outfit で整理
- 一覧 / 詳細 / 編集の見え方を揃える

### 第4段階

- wear log へ適用するかを再判断
- 必要なら、wear log の入力 UI・表示 UI へ段階導入する
- この段階で ID 化や保存構造再整理の必要性を再評価する

### この順序を推奨する理由

- settings 側を先に成立させることで、選択肢正本を固定しやすい
- item / outfit までは既存構造を維持したまま接続しやすい
- wear log は利用粒度が未確定のため、初期版から同時対応しなくてもよい

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
- name ベース保存を維持する場合、保存 payload と response の整合が崩れない

### wear log 側

- 初期版で未対応なら、未対応であることを docs と test 方針で明示する
- 同時対応する場合は、入力 / 詳細 / 一覧の責務を改めて確認する必要がある

---

## 今決めるべきこと

1. 初期版は `user_tpos` を選択肢正本にする
2. 初期版の保存構造は name ベース維持を第一候補にする
3. 削除より無効化を優先する
4. settings 側を先に実装する
5. wear log は初期版から同時対応に含めるかを明示的に切り分ける

---

## 保留でよいこと

- TPO 保存値の全面 ID 化
- wear log の TPO 利用粒度
- プリセット名称変更を完全不可にするか
- 並び替え UI の最終形式
- inactive TPO の詳細表示文言
- TPO 使用回数集計や分析表示

---

## 現時点の整理

TPO 任意追加は、**settings 側のユーザー単位マスタを先に成立させ、利用先は段階的に接続する** 進め方が最も現実的である。  
特に初期版では、`user_tpos` を選択肢正本にしつつ、item / outfit / wear log の保存構造は当面 name ベース維持を第一候補とすることで、既存データ移行と API 変更の負荷を抑えやすい。  
一方で、wear log への適用範囲や ID 化の時期はまだ確定しきらないため、今回は `要再判断` として残し、実装依頼時にスコープを切って扱うのが適切である。

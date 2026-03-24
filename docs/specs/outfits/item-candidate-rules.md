# Outfit Item Candidate Rules

Outfit の item 候補表示と、`disposed` item の扱いを整理する。  
この資料は既存 docs の内容を item 候補表示観点でまとめたものであり、大きな仕様変更は行わない。

関連資料:

- outfit 作成 / 編集正本: `docs/specs/outfits/create-edit.md`
- item status 正本: `docs/specs/items/status-management.md`
- DB: `docs/data/database.md`
- API: `docs/api/openapi.yaml`

---

## 基本方針

- outfit の新規作成・編集では、通常候補として `active` item のみを扱う
- `disposed` item は新規候補に出さない
- ただし編集時に既存構成として含まれていた `disposed` item は、状態が分かる形で表示する
- `disposed` item を含んだままの保存は不可とする

---

## 新規作成時の候補

- 新規作成では `disposed` item を候補に出さない
- ユーザーが通常選択できるのは `active` item のみとする
- この導線では「手放し済み item を選び直す」ための候補一覧は作らない

---

## 編集時の候補

### 新規候補

- 編集時でも `disposed` item を新規候補に出さない
- 追加・入れ替えで選べるのは `active` item のみとする

### 既存構成 item

- ただし、既存構成に含まれていた `disposed` item は表示を残す
- これは「以前は構成 item だったが、現在は候補に使えない」ことを明示するためとする

---

## 複製時の候補

- `duplicate` は新規作成画面へ渡す初期値 payload を返す前提とする
- active outfit の複製では、構成 item を通常どおり初期選択に含める
- invalid outfit の複製では、`disposed` item を初期選択に含めない
- ただし「元のコーディネートには含まれていたが現在は候補に使えない」ことが分かる表示は残す
- その後の候補表示と保存条件は、新規作成時のルールに従う

---

## `disposed` item の表示

### 必須表示

- `disposed` item には「手放し済み」表示を出す
- 補助表示として「このアイテムは現在の候補には使えません」を出す

### 意図

- 単に非表示にするのではなく、なぜ保存できないかが分かる状態を保つ
- 既存構成の崩れを隠さず、ユーザーが差し替えが必要と判断できるようにする

---

## 保存可否の扱い

### 保存ルール

- `disposed` item を含んだままでは保存不可とする
- outfit の保存は `active` item のみで構成されていることが条件である
- backend 側でも「自分の item かつ `active` であること」を最終確認する

### UI での明示

- `disposed` item が構成に残っている場合は、保存前に「このままでは保存できません」を明示する
- エラーは簡潔に案内し、差し替えまたは削除が必要であることが分かる文脈に寄せる

---

## 現時点のまとめ

- 新規作成では `disposed` item を候補に出さない
- 編集では `disposed` item を新規候補に出さない
- ただし既存構成に含まれていた `disposed` item は表示する
- `disposed` item には「手放し済み」表示を出す
- 補助表示として「このアイテムは現在の候補には使えません」を出す
- `disposed` item を含んだままの保存は不可とする
- 保存前に「このままでは保存できません」を明示する

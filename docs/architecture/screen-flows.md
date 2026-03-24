# Screen Flows

この資料は、主な画面導線を Mermaid で確認するための画面遷移図まとめです。

対象:

- ログイン 〜 ログアウト
- 新規登録 〜 カテゴリ設定 〜 item 登録 〜 outfit 登録
- purchase_candidates 一覧 〜 詳細 〜 item 作成初期値導線

---

## ログイン 〜 ログアウト

```mermaid
flowchart TD
  Start[未ログイン状態]
  PublicHome["/ (未ログインホーム)"]
  Login["/login"]
  Register["/register"]
  LoggedIn[ログイン済み状態]
  AppHome["/ (ログイン後ホーム)"]
  Items["/items"]
  Outfits["/outfits"]
  Settings["/settings"]
  Logout["ログアウトボタン"]

  Start --> PublicHome
  PublicHome --> Login
  PublicHome --> Register
  Login -->|success| LoggedIn
  Register -->|success| LoggedIn
  LoggedIn --> AppHome
  AppHome --> Items
  AppHome --> Outfits
  AppHome --> Settings
  AppHome --> Logout
  Items --> Logout
  Outfits --> Logout
  Settings --> Logout
  Logout --> Login
```

補足:

- 現在の実装では `login` 成功後は `/` へ、`logout` 後は `/login` へ遷移する
- 未認証で保護画面に入った場合は `/login` へ戻す振る舞いを基本とする

---

## 新規登録 〜 カテゴリ設定 〜 items 〜 outfits

```mermaid
flowchart TD
  Register["/register"]
  Preset[カテゴリプリセット選択]
  PresetMF[プリセット: Men / Women]
  PresetCustom[プリセット: Custom]
  CategoryAdjust[カテゴリ調整 / カテゴリ設定]
  Home["/ (ホーム)"]
  ItemsNew["/items/new"]
  ItemsList["/items"]
  ItemDetail["/items/[id]"]
  OutfitsNew["/outfits/new"]
  OutfitsList["/outfits"]
  OutfitDetail["/outfits/[id]"]
  Settings["/settings"]

  Register -->|success| Preset
  Preset --> PresetMF
  Preset --> PresetCustom
  PresetMF -->|visible_category_ids を保存| Home
  PresetCustom --> CategoryAdjust
  CategoryAdjust -->|save| Home
  Home --> ItemsNew
  ItemsNew -->|create| ItemsList
  ItemsList --> ItemDetail
  Home --> OutfitsNew
  ItemsList --> OutfitsNew
  ItemDetail --> OutfitsNew
  OutfitsNew -->|create| OutfitsList
  OutfitsList --> OutfitDetail
  Home --> Settings
  Settings --> CategoryAdjust
```

補足:

- この図は、現在の実装と、docs で既に整理済みのカテゴリプリセット導線を含む
- `Custom` ではすぐに確定せず、カテゴリ調整画面で保存する想定
- items が 1 件もない場合は、outfits 新規作成で選択可能なアイテムがないため、先に item 登録が実質的な前提となる

---

## purchase_candidates 〜 item 作成

```mermaid
flowchart TD
  Home["/ (ホーム)"]
  CandidatesList["/purchase-candidates"]
  CandidateNew["/purchase-candidates/new"]
  CandidateDetail["/purchase-candidates/[id]"]
  CandidateEdit["/purchase-candidates/[id]/edit"]
  ItemDraft["item draft 生成"]
  ItemNew["/items/new (candidate 初期値)"]
  ItemsList["/items"]

  Home --> CandidatesList
  CandidatesList --> CandidateNew
  CandidatesList --> CandidateDetail
  CandidateDetail --> CandidateEdit
  CandidateDetail --> ItemDraft
  CandidateEdit --> CandidateDetail
  ItemDraft --> ItemNew
  ItemNew -->|create| ItemsList
```

補足:

- この導線は `docs/specs/purchase-candidates.md` を前提にした planned flow
- candidate から item へは保存済み item を直接作らず、item 作成画面に初期値を渡す前提とする
- 比較結果の詳細表示や item 保存後の candidate 更新責務は後続整理とする

---

## 関連資料

- `docs/architecture/auth-flow.md`
- `docs/specs/settings/category-preset-selection.md`
- `docs/specs/settings/category-settings.md`
- `docs/specs/navigation/global-navigation.md`

# テスト観点表 / 使える状態チェックリスト

## 目的

このドキュメントは、Wardrobe App の各機能について  
「実装があるか」ではなく **「使える状態か」** を判断するための確認表です。

ここでいう「使える状態」とは、少なくとも以下を満たす状態を指します。

- 画面から自然に到達できる
- 正常系の操作が最後まで完了する
- 異常系で何が悪いか分かる
- 関連機能との整合が取れている
- 最低限の確認手段（手動 / テスト / seed）がある

---

## ステータス定義

- 未着手: まだ確認・実装していない
- backendのみ: API や内部処理はあるが、画面導線やUI確認が弱い
- frontendのみ: 画面はあるが、保存やデータ反映が未確認
- 一通り通る: 日常利用想定の主導線は確認できている
- 要修正: 動くが、仕様差分・不整合・UX問題がある

---

## 確認方法の定義

- 手動確認: 実際に画面操作して確認
- Feature Test: Laravel 側の API / 状態遷移確認
- Vitest: Frontend の表示・ロジック確認
- seed確認: テストデータを使った再現確認

---

## 1. 認証

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | 画面導線 | 未ログイン時に Home から login / register に遷移できる | 高 | 一通り通る | 手動確認 | Home から導線あり |
| AUTH-02 | 正常系 | register 成功後にログイン状態になる | 高 | 一通り通る | Feature Test / 手動確認 | |
| AUTH-03 | 正常系 | login 成功後に認証済み画面へ入れる | 高 | 一通り通る | Feature Test / 手動確認 | |
| AUTH-04 | 正常系 | logout 後に未認証状態へ戻る | 高 | 一通り通る | Feature Test / 手動確認 | |
| AUTH-05 | 異常系 | 不正な認証情報で適切なエラーになる | 高 | 一通り通る | Feature Test / 手動確認 | |
| AUTH-06 | 異常系 | 未認証で `/api/me` を叩くと 401 になる | 高 | 一通り通る | Feature Test | |
| AUTH-07 | 整合性 | logout 後に CSRF 再取得で再ログインできる | 高 | 一通り通る | Feature Test | |
| AUTH-08 | テスト | 認証主要導線に対する Feature Test がある | 高 | 一通り通る | Feature Test | 認証系 Feature Test あり |

---

## 2. Home

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| HOME-01 | 画面導線 | ログイン時に主要機能への導線が見える | 高 | 一通り通る | 手動確認 | items / outfits / wear-logs / purchase-candidates / settings |
| HOME-02 | 正常系 | summary 件数が表示される | 高 | 一通り通る | 手動確認 | |
| HOME-03 | 整合性 | 実データ件数と summary の値が一致する | 高 | 未確認 | 手動確認 / Feature Test | |
| HOME-04 | UI/UX | 未ログイン時とログイン時の表示切替が自然 | 中 | 一通り通る | 手動確認 | |
| HOME-05 | UI/UX | 主要CTAの優先度が分かりやすい | 中 | 要確認 | 手動確認 | 追加導線が多いため視認性確認 |

---

## 3. Settings

### 3-1. カテゴリ表示設定

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| SET-CAT-01 | 正常系 | 現在の visibleCategoryIds を取得できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-CAT-02 | 正常系 | visibleCategoryIds を更新できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-CAT-03 | 異常系 | 存在しないカテゴリIDで 422 になる | 高 | backendのみ | Feature Test | |
| SET-CAT-04 | 整合性 | 非表示カテゴリが item / outfit 候補表示に反映される | 高 | 未確認 | 手動確認 | ここは画面側の確認が重要 |
| SET-CAT-05 | UI/UX | ON/OFF の結果が画面上で理解しやすい | 中 | 未確認 | 手動確認 | |

### 3-2. ブランド候補

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| SET-BRAND-01 | 正常系 | ブランド候補一覧を取得できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-BRAND-02 | 正常系 | ブランド候補を追加できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-BRAND-03 | 正常系 | ブランド候補を更新できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-BRAND-04 | 異常系 | 空名・長すぎる値でエラーになる | 中 | backendのみ | Feature Test | |
| SET-BRAND-05 | 整合性 | item 作成時のブランド候補として矛盾なく利用できる | 高 | 未確認 | 手動確認 | |

### 3-3. Preferences

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| SET-PREF-01 | 正常系 | preferences を取得できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-PREF-02 | 正常系 | preferences を更新できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-PREF-03 | 異常系 | 不正 enum でバリデーションエラーになる | 中 | backendのみ | Feature Test | |
| SET-PREF-04 | 整合性 | currentSeason が一覧初期値に反映される | 高 | 実装済み | 手動確認 | 保存処理と参照処理は実装済み。items / outfits 一覧で URL に `season` がない時だけ初期 filter に使う。 |
| SET-PREF-05 | 整合性 | defaultWearLogStatus が wear-log 新規作成初期値に反映される | 高 | 実装済み | 手動確認 | 保存処理と参照処理は実装済み。wear-log 新規作成画面の初期ステータスに使う。 |
| SET-PREF-06 | 整合性 | calendarWeekStart が着用履歴カレンダー表示に反映される | 中 | 実装済み | 手動確認 | 保存処理と参照処理は実装済み。曜日ヘッダー順、月初セル位置、補完セル位置、月送り後の維持、日別詳細導線の日付ずれを確認済み。 |
| SET-PREF-07 | 整合性 | skinTonePreset がサムネイル表示に反映される | 中 | 実装済み | 手動確認 | 保存処理と参照処理は実装済み。items / outfits / wear logs 系の thumbnail 表示で使う。 |

#### SET-PREF-04 補足メモ

- 項目名: `currentSeason`
- 現時点の仮判定: `実装済み`
- 主な保存先:
  - settings 画面の表示・初期値設定
  - `PUT /api/settings/preferences`
  - `user_preferences.current_season`
- 主な反映先:
  - アイテム一覧
  - コーディネート一覧
- 実装済みとした根拠:
  - settings 画面で保存 UI がある
  - `/api/settings/preferences` で保存 / 取得できる
  - items / outfits 一覧で、URL に `season` がない時だけ初期 filter に使う
- 手動確認で残っている観点:
  - settings 保存後に items / outfits 一覧の初期季節が変わるか
  - URL 指定がある時に preference が無視されるか

#### SET-PREF-05 補足メモ

- 項目名: `defaultWearLogStatus`
- 現時点の仮判定: `実装済み`
- 主な保存先:
  - settings 画面の表示・初期値設定
  - `PUT /api/settings/preferences`
  - `user_preferences.default_wear_log_status`
- 主な反映先:
  - 着用履歴の新規作成画面
- 実装済みとした根拠:
  - settings 画面で保存 UI がある
  - `/api/settings/preferences` で保存 / 取得できる
  - wear-log 新規画面の初期ステータスに使う
- 手動確認で残っている観点:
  - `予定 / 着用済み` の切替後、新規画面初期値が変わるか
  - URL クエリや他の初期化ロジックと競合しないか

#### SET-PREF-06 補足メモ

- 項目名: `calendarWeekStart`
- 現時点の仮判定: `実装済み`
- 主な保存先:
  - settings 画面の表示・初期値設定
  - `PUT /api/settings/preferences`
  - `user_preferences.calendar_week_start`
- 主な反映先:
  - 着用履歴一覧のカレンダー表示
- 実装済みとした根拠:
  - settings 画面で保存 UI がある
  - `/api/settings/preferences` で保存 / 取得できる
  - wear-logs 一覧が preferences を読み、`WearLogCalendar` に `weekStart` を渡している
  - `WearLogCalendar` は曜日ラベル順と月初セル計算に `weekStart` を使っている
  - 月曜始まり / 日曜始まりの切替で曜日ヘッダー順、月初セル位置、補完セル位置、月送り後の維持、日別詳細 / 新規作成導線の日付整合を手動確認済み
- 手動確認で残っている観点:
  - 今回確認した範囲では特になし

#### SET-PREF-07 補足メモ

- 項目名: `skinTonePreset`
- 現時点の仮判定: `実装済み`
- 主な保存先:
  - settings 画面の表示・初期値設定
  - `PUT /api/settings/preferences`
  - `user_preferences.skin_tone_preset`
- 主な反映先:
  - アイテム一覧 / 詳細のサムネイル表示
  - コーディネート一覧 / 詳細のサムネイル表示
  - 着用履歴一覧 / カレンダー / 日別詳細のサムネイル表示
- 実装済みとした根拠:
  - settings 画面で保存 UI がある
  - `/api/settings/preferences` で保存 / 取得できる
  - items / outfits / wear logs 系の thumbnail 表示で参照している
- 手動確認で残っている観点:
  - preset 切替時に一覧 / 詳細 thumbnail の色味が変わるか
  - 画面によって適用粒度に差がないか
  - purchase candidate 側にも同じ考え方を広げるかは別途整理余地がある

### 3-4. TPO 設定

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| SET-TPO-01 | 正常系 | TPO 一覧を取得できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-TPO-02 | 正常系 | TPO を追加できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-TPO-03 | 正常系 | TPO を更新できる | 高 | backendのみ | Feature Test / 手動確認 | |
| SET-TPO-04 | 異常系 | 不正な sortOrder / name でエラーになる | 中 | backendのみ | Feature Test | |
| SET-TPO-05 | 整合性 | item / outfit 側の TPO 候補と一致する | 高 | 未確認 | 手動確認 | |

---

## 4. Items

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| ITEM-01 | 画面導線 | 一覧→詳細→編集→戻るが自然に通る | 高 | 未確認 | 手動確認 | |
| ITEM-02 | 画面導線 | 新規作成→保存→詳細 or 一覧遷移が自然に通る | 高 | 未確認 | 手動確認 | |
| ITEM-03 | 正常系 | item を作成できる | 高 | 一部通る | 手動確認 / Feature Test | |
| ITEM-04 | 正常系 | 一覧取得できる | 高 | 一部通る | 手動確認 / Feature Test | |
| ITEM-05 | 正常系 | disposed 一覧取得できる | 中 | backendのみ | 手動確認 / Feature Test | |
| ITEM-06 | 正常系 | 詳細取得できる | 高 | 一部通る | 手動確認 / Feature Test | |
| ITEM-07 | 正常系 | 更新できる | 高 | 一部通る | 手動確認 / Feature Test | |
| ITEM-08 | 正常系 | 削除できる | 高 | 一部通る | 手動確認 / Feature Test | |
| ITEM-09 | 正常系 | dispose できる | 高 | backendのみ | 手動確認 / Feature Test | |
| ITEM-10 | 正常系 | reactivate できる | 高 | backendのみ | 手動確認 / Feature Test | |
| ITEM-11 | 正常系 | care-status を更新できる | 中 | backendのみ | 手動確認 / Feature Test | |
| ITEM-12 | 正常系 | 画像を追加できる | 中 | backendのみ | 手動確認 / Feature Test | |
| ITEM-13 | 正常系 | 画像を削除できる | 中 | backendのみ | 手動確認 / Feature Test | |
| ITEM-14 | 異常系 | 必須不足で保存失敗し、項目単位でエラーが見える | 高 | 未確認 | 手動確認 / Feature Test | |
| ITEM-15 | 異常系 | 無効 category / shape / tpo_ids で失敗する | 高 | backendのみ | Feature Test | |
| ITEM-16 | 異常系 | 他人の item を参照・更新・削除できない | 高 | backendのみ | Feature Test | |
| ITEM-17 | 整合性 | dispose で関連 outfit が invalid 化される | 高 | backendのみ | Feature Test / 手動確認 | 重要 |
| ITEM-18 | 整合性 | reactivate しても outfit は自動 restore されない | 高 | backendのみ | Feature Test / 手動確認 | 重要 |
| ITEM-19 | 整合性 | disposed item が新規 outfit 候補に入らない | 高 | 未確認 | 手動確認 | |
| ITEM-STATE-01 | 整合性 | dispose 実行後、通常一覧から消えて disposed 一覧へ移る | 高 | 実装済み | 手動確認 / Feature Test | `手放す` 後に通常一覧から消え、disposed 一覧へ移ることを手動確認済み |
| ITEM-STATE-02 | 整合性 | reactivate 実行後、disposed 一覧から消えて通常一覧へ戻る | 高 | 実装済み | 手動確認 / Feature Test | `所持品に戻す` 後に disposed 一覧から消え、通常一覧へ戻ることを手動確認済み |
| ITEM-STATE-03 | 整合性 | disposed item を含む outfit が invalid 一覧へ移る | 高 | 実装済み | 手動確認 / Feature Test | item dispose 後に関連 outfit が invalid 一覧へ移り、detail で invalid 表示と理由を確認できることを手動確認済み |
| ITEM-STATE-04 | 整合性 | care status は補助状態として表示され、dispose と独立に扱われる | 中 | 実装済み | 手動確認 / Feature Test | ケア状態は詳細 / 着用履歴側でも補助情報として一貫している |
| ITEM-20 | UI/UX | 未画像時でも一覧・詳細が破綻しない | 中 | 未確認 | 手動確認 | |
| ITEM-21 | UI/UX | サイズ・素材・色など複数項目入力が過度に分かりにくくない | 中 | 未確認 | 手動確認 | |
| ITEM-22 | テスト | CRUD + 状態変更 + 権限系の Feature Test がある | 高 | 未着手/不足 | Feature Test | |
| ITEM-23 | seed | active / disposed / care_status ありの item がある | 高 | 要確認 | seed確認 | |

---

## 5. Outfits

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| OUTFIT-01 | 画面導線 | 一覧→詳細→編集→戻るが自然に通る | 高 | 未確認 | 手動確認 | |
| OUTFIT-02 | 画面導線 | 新規作成→保存→詳細 or 一覧遷移が自然に通る | 高 | 未確認 | 手動確認 | |
| OUTFIT-03 | 正常系 | active item のみで outfit 作成できる | 高 | backendのみ | 手動確認 / Feature Test | |
| OUTFIT-04 | 正常系 | 一覧取得できる | 高 | 一部通る | 手動確認 / Feature Test | |
| OUTFIT-05 | 正常系 | invalid 一覧取得できる | 中 | backendのみ | 手動確認 / Feature Test | |
| OUTFIT-06 | 正常系 | 詳細取得できる | 高 | 一部通る | 手動確認 / Feature Test | |
| OUTFIT-07 | 正常系 | 更新できる | 高 | 一部通る | 手動確認 / Feature Test | |
| OUTFIT-08 | 正常系 | 削除できる | 高 | 一部通る | 手動確認 / Feature Test | |
| OUTFIT-09 | 正常系 | duplicate により新規初期値を生成できる | 中 | backendのみ | 手動確認 / Feature Test | |
| OUTFIT-10 | 正常系 | restore 条件を満たす invalid outfit を復帰できる | 高 | backendのみ | 手動確認 / Feature Test | |
| OUTFIT-11 | 異常系 | disposed item を含むと作成・更新できない | 高 | backendのみ | Feature Test / 手動確認 | |
| OUTFIT-12 | 異常系 | 同一 item 重複など不正入力で失敗する | 高 | backendのみ | Feature Test | |
| OUTFIT-13 | 異常系 | 他人の outfit を参照・更新・削除できない | 高 | backendのみ | Feature Test | |
| OUTFIT-14 | 整合性 | item dispose に応じて invalid 化される | 高 | backendのみ | Feature Test / 手動確認 | 重要 |
| OUTFIT-15 | 整合性 | invalid outfit は構成 item が全部 active の時だけ restore できる | 高 | backendのみ | Feature Test / 手動確認 | 重要 |
| OUTFIT-16 | 整合性 | duplicate 時に disposed item は selectable=false になる | 中 | backendのみ | Feature Test / 手動確認 | |
| OUTFIT-17 | UI/UX | invalid の意味と復帰不可理由が分かる | 中 | 未確認 | 手動確認 | |
| OUTFIT-18 | テスト | CRUD + invalid/restore/duplicate の Feature Test がある | 高 | 未着手/不足 | Feature Test | |
| OUTFIT-19 | seed | active / invalid の両方の outfit がある | 高 | 要確認 | seed確認 | |

---

## 6. Wear Logs

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| WEAR-01 | 画面導線 | 一覧→詳細→編集→戻るが自然に通る | 高 | 未確認 | 手動確認 | |
| WEAR-02 | 画面導線 | カレンダー→日別詳細→個別詳細が自然につながる | 高 | 未確認 | 手動確認 | |
| WEAR-03 | 正常系 | source_outfit_id のみで作成できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-04 | 正常系 | items のみで作成できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-05 | 正常系 | source_outfit_id + items 併用で作成できる | 中 | backendのみ | 手動確認 / Feature Test | |
| WEAR-06 | 正常系 | 一覧取得できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-07 | 正常系 | 詳細取得できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-08 | 正常系 | 更新できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-09 | 正常系 | 削除できる | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-10 | 正常系 | calendar が月単位集約を返す | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-11 | 正常系 | by-date が日別詳細を返す | 高 | backendのみ | 手動確認 / Feature Test | |
| WEAR-12 | 異常系 | event_date / status / display_order 不正で失敗する | 高 | backendのみ | Feature Test | |
| WEAR-13 | 異常系 | 他人の wear log を参照・更新・削除できない | 高 | backendのみ | Feature Test | |
| WEAR-14 | 整合性 | outfit 更新後も過去 wear log の記録内容が壊れない | 高 | 要確認 | Feature Test / 手動確認 | 重要 |
| WEAR-15 | 整合性 | disposed item を含む既存 wear log の再編集方針が仕様通り | 高 | 要確認 | Feature Test / 手動確認 | |
| WEAR-16 | UI/UX | planned / worn の違いが一覧・カレンダーで認識しやすい | 中 | 未確認 | 手動確認 | |
| WEAR-17 | UI/UX | 同日複数件時の表示順が分かりやすい | 中 | 未確認 | 手動確認 | |
| WEAR-18 | テスト | CRUD + calendar + by-date の Feature Test がある | 高 | 未着手/不足 | Feature Test | |
| WEAR-19 | seed | planned / worn / 同日複数件 / source_outfit ありなしを用意 | 高 | 要確認 | seed確認 | |

---

## 7. Purchase Candidates

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| PC-01 | 画面導線 | 一覧→詳細→編集→戻るが自然に通る | 高 | 未確認 | 手動確認 | |
| PC-02 | 画面導線 | 新規作成→保存→詳細 or 一覧遷移が自然に通る | 高 | 未確認 | 手動確認 | |
| PC-03 | 正常系 | candidate を作成できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-04 | 正常系 | 一覧取得できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-05 | 正常系 | 詳細取得できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-06 | 正常系 | 更新できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-07 | 正常系 | 削除できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-08 | 正常系 | 画像追加できる | 中 | backendのみ | 手動確認 / Feature Test | |
| PC-09 | 正常系 | 画像削除できる | 中 | backendのみ | 手動確認 / Feature Test | |
| PC-10 | 正常系 | duplicate できる | 中 | backendのみ | 手動確認 / Feature Test | |
| PC-11 | 正常系 | item-draft を生成できる | 高 | backendのみ | 手動確認 / Feature Test | |
| PC-12 | 異常系 | 必須不足・不正入力で失敗する | 高 | backendのみ | Feature Test | |
| PC-13 | 異常系 | 他人の candidate を参照・更新・削除できない | 高 | backendのみ | Feature Test | |
| PC-14 | 異常系 | purchased candidate の更新不可項目を弾ける | 高 | backendのみ | Feature Test | 重要 |
| PC-15 | 整合性 | item 化後に candidate 状態が適切に更新される | 高 | backendのみ | Feature Test / 手動確認 | 重要 |
| PC-16 | 整合性 | candidate 画像と item 画像の役割が混ざらない | 中 | 要確認 | Feature Test / 手動確認 | |
| PC-17 | UI/UX | status / priority / converted 情報が見やすい | 中 | 未確認 | 手動確認 | |
| PC-18 | テスト | CRUD + item-draft + purchased 制約の Feature Test がある | 高 | 未着手/不足 | Feature Test | |
| PC-19 | seed | considering / on_hold / purchased / dropped を用意 | 高 | 要確認 | seed確認 | |

---

## 8. 横断観点

### 8-1. 権限・ユーザー分離

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| CROSS-AUTH-01 | 権限 | 他人の item / outfit / wear log / candidate を見られない | 高 | 一部あり | Feature Test | |
| CROSS-AUTH-02 | 権限 | 他人の設定を更新できない | 高 | 一部あり | Feature Test | |
| CROSS-AUTH-03 | 権限 | 一覧系で他人データが混ざらない | 高 | 要確認 | Feature Test | |

### 8-2. エラーメッセージ

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| CROSS-ERR-01 | UI/UX | field error が画面上で項目に紐づいて見える | 高 | 未確認 | 手動確認 | |
| CROSS-ERR-02 | UI/UX | message only の 422 が自然に表示される | 高 | 未確認 | 手動確認 | |
| CROSS-ERR-03 | UI/UX | 404 / 401 時に画面が破綻しない | 高 | 未確認 | 手動確認 | |

### 8-3. 一覧・ページング・空状態

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| CROSS-LIST-01 | UI/UX | データ0件時の空状態が分かりやすい | 高 | 未確認 | 手動確認 | |
| CROSS-LIST-02 | UI/UX | 多件数時のページングが破綻しない | 中 | 未確認 | 手動確認 / seed確認 | |
| CROSS-LIST-03 | UI/UX | 作成・削除後の戻り先が不自然でない | 高 | 未確認 | 手動確認 | |

### 8-4. README / 仕様同期

| ID | 観点 | 確認内容 | 優先 | 実装状況 | 確認方法 | メモ |
| --- | --- | --- | --- | --- | --- | --- |
| CROSS-DOC-01 | 整合性 | README の実装済み機能一覧が現状と一致する | 高 | 要修正 | 手動確認 | 現在ズレあり |
| CROSS-DOC-02 | 整合性 | OpenAPI と実 routes / payload が大きく乖離していない | 高 | 要確認 | 手動確認 / Feature Test | |
| CROSS-DOC-03 | 整合性 | seed ユーザー説明が実データと一致する | 中 | 要確認 | seed確認 | |

---

## 9. 7月までの「使える」判定基準

各主要機能について、少なくとも以下を満たしたら「使える」と判定する。

### 必須条件

- 高優先の観点がすべて「一通り通る」以上
- 主導線の手動確認が完了している
- 致命的な整合性問題がない
- 最低限の Feature Test または同等の確認手段がある
- seed で再現確認できる

### まだ「使える」と言わない条件

- API はあるが、画面から辿れない
- 正常系は通るが、異常時に何が悪いか分からない
- 関連機能との整合が崩れる
- README / docs が現実とずれていて説明できない

---

## 10. 優先実施順

### 第1優先

- 認証
- Items
- Outfits

### 第2優先

- Wear Logs
- Settings

### 第3優先

- Purchase Candidates
- 空状態 / ページング / 文言 / README同期

---

## 11. 使い方

1. 各行の「実装状況」を埋める  
2. 未確認のものを手動確認 or テスト化する  
3. 「高」優先の未確認・要修正を優先的に潰す  
4. 各機能で高優先が埋まったら「使える」と判定する  

---

## 12. 当面の重点TODO

- README と実装状況の同期
- Items の dispose / reactivate と Outfits invalid/restore の連携確認
- Wear Logs の主導線確認
- Purchase Candidates の item-draft ～ item 作成連携確認
- Settings の反映先（一覧初期値・候補表示）確認
- 高優先観点の Feature Test 追加

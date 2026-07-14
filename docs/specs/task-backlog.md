# Task Backlog

docs 内に散らばっている planned / TODO / 後続 / 要再判断を、**current 仕様とは分けて**一覧化したバックログです。  
ここでは実装履歴は扱わず、**今後の判断・実装候補・整理対象**だけをまとめます。

## 対象と整理方針

- 対象:
  - `docs/specs` 配下の spec / planning / note
- 探索キーワード:
  - `TODO`, `planned`, `future`, `後続`, `未実装`, `残課題`, `要検討`, `再判断`, `Phase`, `将来`, `FIXME`, `XXX`
- 整理方針:
  - 同じ意味のタスクは統合する
  - current 仕様と planned を混ぜない
  - docs に明示がないが手元タスクにあるものは、末尾で `docs未明記 / 要確認` として別管理する

## サマリ

- 棚卸しした docs / 手元タスク由来タスク: **51件**
- 種別別件数:
  - `バグ`: 3
  - `UI`: 16
  - `機能`: 9
  - `設計`: 13
  - `ドキュメント`: 6
  - `後回し`: 4
- 優先度案:
  - `高`: 4
  - `中`: 32
  - `低`: 13

## バグ / 違和感

### BUG-01 天気 docs の current / planned / legacy 食い違い解消

天気 docs 群で current / planned / legacy の説明がずれる箇所を再整理する

- 出典 / 対象箇所: `wears/weather-docs-reorganization.md`, `wears/weather-current-status.md`, `wears/weather-fetching.md`
- 関連機能: weather
- 種別: `バグ`
- 優先度: `中`
- 依存関係: docs 整理
- すぐ実装できるか: `可`

### BUG-02 着用履歴の日詳細モーダルの情報密度見直し

row ごとのサムネイル位置や情報密度の違和感を見直す

- 出典 / 対象箇所: `wears/wear-logs.md` / `要再判断`
- 関連機能: wear logs
- 種別: `バグ`
- 優先度: `中`
- 依存関係: current UI 確認
- すぐ実装できるか: `可`

### BUG-03 着用履歴の選択済み item がカテゴリ未設定 / 形未設定になるか確認

WearLogForm の item 選択で、選択済み item が `カテゴリ未設定 / 形未設定` と表示されるケースがある。item 候補カード側ではカテゴリ / 形を表示できているため、選択済み summary 側の data mapping や edit 初期値で category / shape が欠落していないか確認する

- 出典 / 対象箇所: 手元確認, `web/src/components/wear-logs/wear-log-form.tsx`
- 関連機能: wear logs / items
- 種別: `バグ`
- 優先度: `中`
- 依存関係: WearLogForm の item 候補 / 選択済み summary の data mapping 確認
- すぐ実装できるか: `要確認`

## UI改善

### UI-01 画面横断のアイコン活用方針統一

重いラベルを減らし、Lucide などの icon 利用を横断で揃える。weather / price / deadline / shopping memo / outfit / wear log / care / delete / remove / warning など、意味ごとの icon を整理し、アイコンだけに依存せず text / aria-label / title と併用する

- 出典 / 対象箇所: `duplicate-color-variant.md` / `アイコン候補`, `purchase-candidates.md` / `アイコン候補`, `navigation/global-navigation.md`, 手元タスク
- 関連機能: shared ui
- 種別: `UI`
- 優先度: `中`
- 依存関係: shared UI ルール整理
- すぐ実装できるか: `可`

### UI-02 買い物メモ詳細の表示改善

買い物メモ詳細の item row を中心に、期限表示、価格とのまとまり、リンク導線、group 表示の情報密度を整理する。主要な表示改善は対応済みで、残件は期限表示設計や必要性が出た場合の再検討を中心に扱う

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: current 表示仕様の維持
- すぐ実装できるか: `要確認`

#### 現状

- item row の代表期限表示は、`販売終了日` / `セール終了日` の種別ラベル付きにし、価格欄近くへ寄せて表示済み。
- item row の link は `商品ページ` / `登録内容を見る` として整理済み。`商品ページ` は外部 link、`登録内容を見る` はアプリ内詳細 link として役割を分けている。
- item row の link は pill button ではなく、通常 text link 寄りの見た目へ戻している。
- PC / 2 列表示で左 item の下だけ中途半端な罫線が出る問題は調整済み。
- group header の nearest deadline 表示は、現時点では実装前提にしない方針へ整理済み。
- summary metric block 化は試したが、改善効果が薄かったため revert 済み。

#### 残件

- 販売終了日 / セール終了日を両方個別表示する正式ルール。
- DES-05 と連動する期限表示設計。
- group 折りたたみが必要になった場合の group header 表示再検討。
- item row の memo 長文表示 / 折りたたみの要否。
- closed memo 操作ロックは UI-02 ではなく別タスクで扱う。
- 代表候補画像や summary の大きな再設計は、現時点では保留する。

#### memo

- group header の nearest deadline 表示は、現時点では実装前提にしない。item row には `販売終了日` / `セール終了日` の種別付き期限と `期限切れ` / `期限間近` badge があり、summary にも memo 全体の `一番近い期限` が表示されているため、group header にも期限を出すと全体期限 / group 期限 / item 期限が重複して情報量が増えすぎる可能性がある。
- group 内 item が多い場合、group 折りたたみを導入する場合、店舗 / domain group 単位で購入判断する場合には有効な可能性があるため、完全に削除せず要否確認として残す。
- 現状の item row は、買い物判断の本体として情報を削りすぎない方針にする。
- summary 側の大きな見た目変更より、group / item row の実用課題が出た時に戻る。
- summary metric block 化では、候補数 / 小計 / 期限 / 価格未設定を block 化したが、重要度差が出にくく事務的に見えたため採用しなかった。
- 現時点では UI-02 を無理に進めず、必要が出た段階で再検討する。

### UI-03 買い物メモ追加モードの選択中候補可視化

現在選択中の候補をより分かりやすく見せる

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: 現行 bulk add UI 維持
- すぐ実装できるか: `可`

### UI-04 closed memo の補足表示と操作ロック見せ方

`終了済みのメモです` 補足や disabled 表示をどう見せるか決める

- 出典 / 対象箇所: `shopping-memos.md` / `status / edge cases`
- 関連機能: shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: closed 方針整理
- すぐ実装できるか: `要設計`

### UI-05 item サムネイルの dedicated mode / 簡略化再判断

極小サイズ時の簡略化や `allinone + bottoms` の dedicated mode 化を判断する

- 出典 / 対象箇所: `items/thumbnail-current-reference.md`, `items/thumbnail-skin-exposure.md`
- 関連機能: items thumbnails
- 種別: `UI`
- 優先度: `低`
- 依存関係: current サムネイル責務維持
- すぐ実装できるか: `要設計`

### UI-06 dropdown / popover の viewport 下端対応と overlay ルール整理

bottom nav / AppShell / confirmation UI / dropdown の棚卸しは実施済みで、BrandFilter dropdown の z-index は `z-[60]` へ修正済み。残件として、SP 幅目視確認、viewport 下端で dropdown が見切れる場合の placement / max-height / safe-area 対応、Portal 要否、z-index / overlay ルール正式化を整理する。

- 出典 / 対象箇所: 手元タスク, ColorSelect dropdown と bottom nav 干渉修正の運用メモ, BrandFilter dropdown z-index 修正
- 関連機能: shared ui / navigation
- 種別: `UI`
- 優先度: `低`
- 依存関係: 新しい dropdown / popover UI の追加時
- すぐ実装できるか: `可`

### UI-08 購入検討削除不可理由から買い物メモへの導線検討

current では買い物メモ所属ありの購入検討は削除前に理由を表示し、削除実行しない。後続では、削除不可理由から該当する買い物メモへ辿れるリンク、買い物メモ名の表示、delete-check API が必要になる条件を検討する。

- 出典 / 対象箇所: `purchase-candidates.md`, `shopping-memos.md`, `docs/api/openapi.yaml`
- 関連機能: purchase candidates / shopping memos
- 種別: `UI`
- 優先度: `中`
- 依存関係: current 削除不可表示 / backend 422 維持
- すぐ実装できるか: `要設計`

### UI-09 詳細画面ヘッダーのレイアウトテンプレート整理

詳細画面の header / actions / footer 相当の配置ルールを整理し、`EntityDetailHeader` の `actions` にはコンパクトな操作群だけを置き、削除確認 UI・warning・補足文のような横幅を取る UI はヘッダー下段またはページ側の独立エリアへ逃がす方針を正本化する。item / outfit / purchase candidate / shopping memo へ展開できるテンプレートとしてまとめる。

- 出典 / 対象箇所: `ui/page-header-guidelines.md`, `items/delete-policy.md`, `outfits/create-edit.md`, 各 detail page current 実装
- 関連機能: shared detail header
- 種別: `UI`
- 優先度: `中`
- 依存関係: current detail header 棚卸し / confirm UI 方針
- すぐ実装できるか: `可`

### UI-10 認証エラー通知と login 後復帰の設計整理

current の 401 は `/login?message=session_expired` へ遷移し、login page 側で通知する。後続では、`return_to` / `next` によるログイン後復帰、Toast / Notification component の導入要否、一般エラー通知 UI の共通化を検討する。

- 出典 / 対象箇所: `web/src` の alert 使用箇所, 手元確認メモ
- 関連機能: auth / error notification
- 種別: `UI`
- 優先度: `中`
- 依存関係: 現状の 401 redirect helper / login message
- すぐ実装できるか: `要設計`

### UI-11 天気の予報から実績更新時の差分表示

予報から実績へ更新する際、天気 / 気温 / 最高気温 / 最低気温 / 降水 / 湿度 / 風 / 体感に関係する項目が、更新前から更新後へどう変わるか比較表示する。最高・最低気温は forecast / observed 取得値が payload / DB / frontend 表示へ反映されることを回帰テストで確認済み。取得した実績欄への最高・最低気温表示は対応済みで、残件は更新前→更新後の差分比較表示。

- 出典 / 対象箇所: 手元タスク, `wears/weather-current-status.md`
- 関連機能: weather
- 種別: `UI`
- 優先度: `中`
- 依存関係: weather update 挙動確認済み
- すぐ実装できるか: `要設計`

### UI-13 着用履歴と天気登録の相互リンク

wear log detail から当日の天気登録・天気詳細へ移動しやすくし、weather record 側から関連する着用履歴へ戻れる導線を検討する。複数着用履歴がある日の扱い、登録済み / 未登録の表示差分も整理する

- 出典 / 対象箇所: 手元タスク, `wears/wear-logs.md`, `wears/weather-current-status.md`
- 関連機能: wear logs / weather
- 種別: `UI`
- 優先度: `中`
- 依存関係: weather record と wear log の紐づけ確認
- すぐ実装できるか: `要設計`

### UI-14 着用履歴の振り返り導線改善

着用履歴詳細画面および登録 / 編集フォームでは、コーディネート・アイテム・天気などの記録内容と、服装の振り返り入力が同じ画面に混在している。まず、登録 / 編集フォームの主責務を「いつ・何を着たかを登録する」画面として整理し、`memo` は登録時メモ、`feedback_memo` / 総合評価 / 屋外・屋内の温度感 / `feedback_tags` は着用後の振り返り・服装フィードバックとして分ける方針を検討する。

#### 短期方針

WearLogForm から振り返り項目は外し、画面責務を「いつ・何を着たか」の登録 / 編集に寄せた。`memo` は登録時メモとして残し、服装フィードバック系項目は振り返り専用導線へ寄せる。backend 側には `PATCH /api/wear-logs/{id}/feedback` を追加済みで、服装フィードバック / 振り返り項目だけを更新できる。frontend 側も `/wear-logs/{id}/reflection` を追加済みで、detail 画面から「振り返りを編集する」導線で遷移し、保存後は detail へ戻る。

#### 中期方針

振り返り専用ページの MVP は実装済み。現行の `PUT /api/wear-logs/{id}` は `items` を必須にする全体更新寄りの API であり、振り返り画面から既存 API を流用すると `items` / `source_outfit_id` の再構成ミスで着用記録本体を壊すリスクがあるため、振り返り専用導線では `PATCH /api/wear-logs/{id}/feedback` を使う。

frontend route はユーザー向け概念として `/wear-logs/{id}/reflection` を使う。UI 文言は「振り返り」、backend API / field 名は `feedback` として役割を分ける。MVP では detail 画面から `振り返りを編集する` 導線を出し、保存後は `/wear-logs/{id}` へ戻る。

calendar / list からの導線は、calendar icon そのものを link にせず、wear log 単位で対象を特定できる場所から出す。calendar の日付詳細 panel 内の wear log card からは `振り返りを編集` で `/wear-logs/{id}/reflection` へ移動できる。list 表示では既存の `詳細` 導線に加えて、必要なら wear log card に `振り返りを編集` を追加する。

#### 残件

- Reflection page の MVP は実装済みで、入力 UI も WearLogForm の振り返り欄に合わせた共通 UI 部品へ整理済み。総合評価の選択カード、屋外 / 屋内の温度感のスライダー風 UI、`よかったこと` / `気になったこと` / `TPO・見た目` の feedback tag ボタン群、気になったことの折りたたみ表示、`feedback_memo` の label / placeholder は reflection page と WearLogForm で揃える。
- calendar 日付詳細 panel の wear log card から `/wear-logs/{id}/reflection` へ移動できる導線は対応済み。小さい `振り返り入力あり` icon そのものは、day 単位の目印として維持し、直接クリック対象にはしない。
- wear log list の card から `/wear-logs/{id}/reflection` へ直接移動できる導線を検討する。detail 画面と calendar 日付詳細 panel からの導線は current 対応済みのため、list 側は一覧の情報量が増えすぎないよう、必要性と表示位置を確認してから実装する。一律で `振り返りを編集` を出すか、詳細 card の action に含めるかは後続判断とする。

- 出典 / 対象箇所: 手元タスク, `wears/wear-logs.md`
- 関連機能: wear logs
- 種別: `UI`
- 優先度: `中`
- 依存関係: reflection page の運用確認
- すぐ実装できるか: `要設計`

### UI-15 コーディネート作成時のアイテム選択 UI 改善

コーディネート作成時の選択中 item の見やすさ、順番入れ替え、item 詳細リンク、色チップ、画像表示、季節 / TPO 選択位置を見直す。季節 / TPO がコーディネート自体の属性なのか、選択 item 由来なのかも UI 順序とあわせて検討する

#### 現在

- コーディネート新規 / 編集で、選択中 item を `上へ` / `下へ` ボタンで並び替えられるようにした。保存 payload の `sort_order` は画面上の並び順を反映する。
- 選択中 item に、item 詳細リンク、ブランド名、メイン色チップを表示し、同系統 item を判別しやすくした。
- コーディネート新規 / 編集の item 候補カードでは、登録済み写真 URL がある場合だけ写真サムネイルを表示するようにした。写真がない item には placeholder や余計な thumbnail frame を出さない。

#### 残件

- 季節 / TPO 選択位置の見直し、選択中 item 表示のさらなる polish は残件。
- ドラッグ & ドロップは今回採用せず、必要性と SP 操作性を確認してから再検討する。

- 出典 / 対象箇所: 手元タスク, `outfits/create-edit.md`
- 関連機能: outfits / items
- 種別: `UI`
- 優先度: `中`
- 依存関係: current outfit create/edit UI 確認
- すぐ実装できるか: `要設計`

### UI-16 item picker の候補カードにブランド名を表示する

outfit list の使用アイテム filter / WearLogForm の item 選択では、item 候補カードにブランド名を表示する対応済み。同系統 item が増えたときにカテゴリ / 形 / 色だけでは判別しづらいため、ブランド名も含めた表示情報を維持する

#### 現状

- outfit list の使用アイテム filter では、brand_name がある item にブランド名を表示する。
- WearLogForm の item 選択では、候補カードと選択中 item summary に brand_name がある場合だけブランド名を表示する。
- ブランド未設定 item では、余計な `ブランド未設定` 表示は出さない。

#### 残件

- purchase candidate 側の候補表示にも類似 UI があるか確認する。
- カテゴリ / 形 / 色 / ブランドの表示順を決める。
- ブランド未設定時の表示を決める。
- item と purchase candidate で brand field の扱いが違う場合の fallback を決める。

- 出典 / 対象箇所: 手元確認, `web/src/components/outfits/outfits-list.tsx`, `web/src/components/wear-logs/wear-log-form.tsx`
- 関連機能: outfits / wear logs / items / purchase candidates
- 種別: `UI`
- 優先度: `中`
- 依存関係: item / purchase candidate の brand field と候補表示の current 確認
- すぐ実装できるか: `要確認`

### UI-17 全体デザイン見直し / UI統一方針整理

主要画面のデザイン、余白、コンポーネント、情報密度を横断的に棚卸しし、アプリ全体の統一感と見やすさを改善する。いきなり全面改修せず、まず画面種別ごとの現状確認、共通化できる UI 要素、レイアウト方針、優先的に直す画面を整理し、方針が固まった範囲から小さく反映する

#### 画面種別

- 一覧画面: アイテム一覧、コーディネート一覧、購入検討一覧、買い物メモ一覧、着用履歴一覧。
- 詳細画面: アイテム詳細、コーディネート詳細、購入検討詳細、買い物メモ詳細、着用履歴詳細。
- 作成 / 編集フォーム: アイテム作成 / 編集、コーディネート作成 / 編集、購入検討作成 / 編集、買い物メモ作成 / 編集、着用履歴作成 / 編集。
- 候補選択 UI: アイテム選択、コーディネート選択、購入検討候補選択、買い物メモ追加 UI。
- 状態 / 操作 UI: 削除確認、手放す / クローゼットに戻す、複製、色違い追加、item 化、買い物メモ追加 / 解除。

#### 共通化候補

- ページヘッダー、セクションカード、詳細情報の定義リスト、操作エリア、主要 / 補助 / 危険ボタン、テキストリンク、外部リンク、バッジ、空状態、読み込み中 / エラー表示、アプリ内確認 UI、候補カード、選択中サマリ、絞り込みエリア、ボトムナビとの余白を横断で整理する。

#### 方針整理

- 余白、カードの角丸 / 影 / 枠線、ボタンの優先度、リンクとボタンの使い分け、バッジの色と意味、文字サイズ / 見出し階層、情報密度、PC / SP のレスポンシブ方針、一覧性と詳細性のバランス、アクションを強く見せすぎないルール、危険操作の見せ方を整理する。
- まず棚卸し、次に方針決定、その後に共通コンポーネント化と画面単位の小さな反映へ進める。見た目だけでなく、既存テストへの影響も確認する。
- `UI-01`、`UI-09`、`DOC-04` を置き換えるのではなく、横断的な UI 改善 / デザイン基準整理として扱う。

#### 試行済み

- 購入検討詳細では、購入判断サマリーカードをヘッダー直下に追加し、代表画像、価格、期限、ブランド、欲しい理由、メモ、商品ページを上部で確認できるようにした。
- 購入検討詳細では、サマリーカードを前提に基本情報 / 購入情報を下部から外し、画像は複数枚がある場合だけ画像一覧として表示する。
- 色はサマリー側へ寄せ、下部セクションは利用条件・特性として整理した。補足情報は長文時の全文確認用として残す。
- 共通コンポーネント化、他の詳細画面への展開、分類 / サイズ / 素材など詳細セクションの整理は未対応。
- アイテム詳細では、summary card をヘッダー直下に追加し、代表画像、ブランド、サイズ、色、季節 / TPO / 雨対応、ケア状態などを上部で確認できるようにした。
- 分類は summary に戻さず、既存の分類 section に残した。
- アイテム詳細では、summary card 追加後に header / summary と重複する `基本情報` section を削除した。
- アイテム詳細では、summary card の代表画像と重複するため、下部画像 section は複数画像がある場合のみ `画像一覧` として表示するよう整理した。
- アイテム詳細では、色や利用条件系情報を summary 側へ寄せ、下部の `利用条件・特性` section を削除した。状態管理 section は操作用として維持する。
- アイテム詳細では、memo 未設定時の `補足情報` section を非表示にし、補足情報は memo がある場合の詳細確認用に整理した。
- アイテム詳細では、summary card に代表画像を表示する方針に合わせて、PC 右側 preview を削除した。画像確認は summary card と、複数画像時の画像一覧に役割整理した。
- アイテム詳細では、購入情報がすべて未設定の場合は `購入情報` section を非表示にし、値がある購入情報だけを詳細確認用として表示するよう整理した。
- 着用履歴詳細では、`基本情報` section から状態変更操作と削除操作を分離し、`状態管理` section と `削除` section として整理した。
- 着用履歴詳細の `基本情報` section の重複整理、着用メモの条件付き表示、item card 情報強化は未対応。
- 着用履歴詳細では、summary card 追加を試したが、情報が整理されたというより並べ直しに見えたため revert した。現時点では summary 追加よりも、情報表示と操作の分離の方が有効だった。
- 買い物メモ詳細では、summary metric block 化を試したが、小計 / 期限 / 価格未設定の重要度差が十分に出ず改善効果が薄かったため revert した。現時点では summary より group / item row の実用課題が出てきた段階で再検討する。
- 既存 section のさらなる重複整理、共通 component 化は未対応。

#### 中間まとめ

- 購入検討詳細とアイテム詳細では、上部 summary card と下部 detail section の分担が有効だった。summary card は判断に必要な情報、下部 section は詳細確認、全文確認、操作に寄せる方針が画面整理に効いた。
- アイテム詳細では、summary card 追加後に重複 section をかなり整理済み。基本情報、画像、色 / 利用条件、補足情報、購入情報、PC 右側 preview の扱いを段階的に見直した。
- 着用履歴詳細では、summary card 追加より、基本情報 section から状態変更操作と削除操作を分離する方が改善効果があった。
- 買い物メモ詳細では、summary metric block 化だけでは買い物判断しやすさの改善が弱かったため、group / item row の比較しやすさに実用課題が出てきた段階で戻る。

#### 方針として分かったこと

- detail 画面すべてに同じ summary card を入れるのではなく、画面目的ごとに判断する。
- 画像や価格などが判断材料になる画面では summary card が有効になりやすい。
- 操作と情報が混ざっている画面では、summary 追加より操作分離を優先する方が有効な場合がある。
- 効果が薄い UI 試行は無理に残さず revert する。
- 共通 component 化はまだ早く、もう少し画面単位の実績を見てから判断する。

#### 残件

- 購入検討詳細 / アイテム詳細の summary card 共通 component 化を検討する。
- アイテム詳細のさらなる section 整理を検討する。
- 着用履歴詳細の `基本情報` section 重複整理、着用メモの条件付き表示、item card 情報強化を検討する。
- 買い物メモ詳細の group / item row 改善は、実用課題が出てから再検討する。
- button / link / badge / section card の共通化を検討する。
- 全体デザインの基準化を進める。

- 出典 / 対象箇所: 手元タスク, 主要画面の現状 UI
- 関連機能: 共通 UI / 全画面
- 種別: `UI`
- 優先度: `中`
- 依存関係: 主要機能の current UI 維持 / UI-01・UI-09・DOC-04 との整理
- すぐ実装できるか: `要設計`

### UI-18 着用履歴登録後の振り返り登録導線

着用履歴を登録したあと、続けて服装の振り返りを登録できる導線を追加する。着用内容の登録直後に総合評価、体感、よかったこと、気になったこと、メモを入力しやすくし、振り返り記録の入力漏れを減らせるか検討する。

#### 対応済み

- `worn` の新規着用履歴登録後、wear log detail へ遷移し、成功 message 内に `続けて振り返りを登録` link を表示する導線を追加済み。
- 直接 reflection page へ自動遷移する案は採用せず、detail で登録内容を確認したうえでユーザーが選べる形にした。

#### 残件

- `planned` 登録後、edit 保存後、`planned -> worn` 状態変更後に振り返り導線を出すかは後続判断。
- wear log list / calendar / detail の既存 reflection 導線との整理は UI-14 と連動して継続確認。

#### 検討観点

- 導線を出す場所: 着用履歴作成完了後の遷移先、登録成功 message / toast、着用履歴詳細、着用履歴一覧、着用履歴作成フォーム内の submit 後 action のどこで提示するかを整理する。
- 遷移先: 登録後に wear log detail へ遷移して `振り返りを登録` action を出すか、直接 `/wear-logs/{id}/reflection` へ遷移するか、`続けて振り返りを登録する` button を出してユーザーに選ばせるかを整理する。
- 文言: `続けて振り返りを登録`、`服装の振り返りを登録`、`あとで登録する`、`詳細を見る` など、登録直後の自然な次アクションとして伝わる文言を検討する。
- 対象 status: `worn` 登録時だけ出すか、`planned` 登録時は出さないか、過去日の planned を worn にした場合に出すか、outfit 由来 / item 手動登録で差をつけるかを整理する。
- 既存導線との関係: 現在の `振り返りを編集` 導線、wear log detail、wear log create / edit、wear log list、status 変更、feedback / reflection page との役割を整理する。
- 実装影響: frontend の redirect / router、API response の作成後 id、成功 message の持ち方、query parameter で action を伝えるか、test 影響、mobile bottom nav との干渉を確認する。

- 出典 / 対象箇所: 手元タスク, `web/src/app/wear-logs/new`, `web/src/app/wear-logs/[id]/reflection`
- 関連機能: wear logs / reflection
- 種別: `UI`
- 優先度: `中`
- 依存関係: wear log create flow / reflection page の current 導線確認
- すぐ実装できるか: `要設計`

## 機能追加

### FEAT-01 セットアップリンク機能

`セットアップ可` を超えて、関連 item のリンク管理まで扱う

- 出典 / 対象箇所: `tags.md` / `セットアップリンク機能`
- 関連機能: tags / items
- 種別: `機能`
- 優先度: `低`
- 依存関係: タグ運用の実績確認
- すぐ実装できるか: `要設計`

### FEAT-02 item 状態管理の完成

`disposed` / `reactivate` / delete の役割分担を完成させる

- 出典 / 対象箇所: `planning/next-features.md` / `item状態管理の完成`, `items/status-management.md`, `items/delete-policy.md`
- 関連機能: items
- 種別: `機能`
- 優先度: `中`
- 依存関係: current status 方針維持
- すぐ実装できるか: `要設計`

#### 対応済み

- `disposed` / `reactivate` / delete の基本実装は current 対応済み。
- `disposed` item の import/export roundtrip test を追加済み。
- `items/delete-policy.md` の delete UI 記述を、item detail 最下部の `削除` セクションに結線済みの inline confirmation UI として整理済み。
- wear log では、`disposed` item の新規指定不可と既存履歴保持を別の話として扱うことを docs に明記済み。
- `converted_item_id` がある item は delete blocker にせず、item detail の delete confirmation で購入検討との紐づきが解除される warning を表示済み。
- 参照あり item の物理削除拒否時に `item.delete.rejected` info log を出す対応済み。

#### 残件

- delete-check API / structured reason は、削除不可理由や warning を横断的に扱う必要が出た段階で再検討する。
- `converted_item_id` がある item の warning は current 実装で最低限対応済み。structured reason との統合は後続判断とする。
- `outfit_invalidated` 個別 event log は、運用上追跡が必要になった段階で検討する。
- dispose reason / disposed_at は、手放し理由や時期を管理したくなった段階で検討する。
- `disposed` item を複製元にした場合の UI 文言は、複製・色違い追加導線の実装時に整理する。
- 購入検討・買い物メモ上で item 状態変更をどう表示するかは、購入検討 / 買い物メモ側の表示改善とあわせて再判断する。
- 残件は設計判断・運用判断が中心のため、今すぐ高優先度で追加実装を続ける段階ではない。

### FEAT-03 素材・混率管理

素材明細 + 混率を item / purchase candidate へ導入する。基本実装は現状対応済みで、候補管理・検索・分析などの拡張は後続で扱う。

- 出典 / 対象箇所: `planning/next-features.md` / `素材・混率管理`, `items/material-composition.md`
- 関連機能: items / purchase candidates
- 種別: `機能`
- 優先度: `中`
- 依存関係: 基本実装は対応済み / 拡張は要設計
- すぐ実装できるか: `一部対応済み`

#### 現状

- `item_materials` / `purchase_candidate_materials` は存在し、`part_label / material_name / ratio` の明細構造で保存する。
- item / purchase candidate とも、素材・混率入力は任意で、空配列を許可する。
- `ratio` は整数 1〜100 とし、区分ごとに合計 100% 必須、同一区分内で同素材重複不可とする。
- `sort_order` は持たず、表示順は区分候補順、混率降順、素材名順で扱う。
- item / purchase candidate の作成 / 編集 / 詳細に素材・混率を反映済み。
- purchase candidate から item 化する際に materials を item 側へ引き継げる。
- OpenAPI、`docs/data/database.md`、`docs/specs/purchase-candidates.md` には基本構造を反映済み。
- import / export では item / purchase candidate の materials を往復復元できる。

#### 残件

- `item_materials` と `purchase_candidate_materials` の `part_label` / `material_name` の DB カラム長を 100 に揃えるか、migration を入れるか要判断。
- 素材候補の設定管理 / 素材マスタ化は、入力ゆれや検索が問題になってから検討する。
- 素材検索 / 分析・可視化は、利用データが増えてから検討する。
- 小数混率 / 品質表示全文保存は、実データで必要性が出たら検討する。
- 表示・入力 UI のさらなる調整は、運用で困りごとが出たら戻る。
- 残件は拡張・設計判断・将来対応が中心で、現状バグではないため高優先度からは外す。

### FEAT-04 検索・絞り込み強化

状態・雨対応・ブランド・色・素材などの filter を段階追加する

- 出典 / 対象箇所: `planning/next-features.md` / `検索・絞り込み強化`, `discovery/list-common-guidelines.md`
- 関連機能: discovery
- 種別: `機能`
- 優先度: `中`
- 依存関係: 素材・状態・TPO 設計
- すぐ実装できるか: `要設計`

### FEAT-05 分析・可視化 / 着用統計

着用履歴から item 単位の着用回数を集計し、今季よく着た item、着用回数、最終着用日、未着用期間、care status、手放す / クリーニング候補などを表示する。outfit 経由 / item 直接登録 / 同一 wear log 内重複 count / 期間・季節・TPO 指定 / disposed item の扱いも整理する

- 出典 / 対象箇所: `planning/next-features.md` / `分析・可視化`, 手元タスク
- 関連機能: home / wears / items
- 種別: `機能`
- 優先度: `中`
- 依存関係: wear logs 定義の固定
- すぐ実装できるか: `要設計`

### FEAT-06 買い物メモ追加導線の拡張

#### 現状

購入検討一覧の一括追加に加えて、購入検討詳細から既存 draft の買い物メモへ単体追加する導線は対応済み。追加先は draft の買い物メモのみを候補にし、closed の買い物メモは候補に出さない。選択した買い物メモに対象の購入検討がすでに含まれている場合は追加済みとして表示し、既存の `POST /api/shopping-memos/{id}/items` に購入検討 id 1件だけを送る。

#### 残件

買い物メモ詳細内で既存の購入検討を検索・選択して追加する導線は未実装。新規買い物メモを作成して即追加する導線は、買い物メモ作成成功後に候補追加が失敗する部分成功や一括処理 API の要否があるため後続で判断する。closed の買い物メモへの追加は引き続き不可とし、backend の 422 防御を維持する。

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`, `後続タスク`
- 関連機能: shopping memos / purchase candidates
- 種別: `機能`
- 優先度: `中`
- 依存関係: current bulk add 安定化
- すぐ実装できるか: `可`

### FEAT-07 アイテムからコーディネートを検索する

#### 現状

item detail から `/outfits?item_id={id}` へ遷移し、その item を含む outfit だけを一覧表示する導線と API filter は対応済み。item_id filter 付き outfit list では、対象 item の detail へ戻る `アイテム詳細へ戻る` 導線も表示する。wear log 登録 / 編集では、手動 item を1件選択した時に「このアイテムを含むコーディネート候補」を表示し、候補 outfit 選択で `source_outfit_id` を設定、手動 item 選択をクリアして outfit ベースの記録へ切り替える MVP も対応済み。選択中 item / outfit は選択中エリアから直接解除できる。item / outfit 候補一覧は初期状態では閉じ、開いた時に初回取得する構成へ変更済み。

#### 残件

item list 側の導線、複数 item 検索の要否、outfit new / edit 連携、wear log form の item / outfit 選択 UI polish は残件として扱う。単純に outfit 候補欄を item 一覧より上へ移動すると、item 選択後に上へ戻る必要があり操作の流れに反するため、選択した item カードの近くに候補を出す、候補欄へ自動スクロールする、item 一覧のさらなる折りたたみ、選択中エリアを sticky 化するなど操作導線として再検討する。あわせて、検索 / 絞り込み強化、選択中 outfit から詳細へ遷移する導線、item 手動選択と outfit 選択の状態表示、候補 outfit 欄の補足文・候補なし / loading / error 表示の見せ方を整理する。

- 出典 / 対象箇所: 手元タスク, `outfits/create-edit.md`, `items/status-management.md`, `outfits/list-filters.md`
- 関連機能: items / outfits / wear logs
- 種別: `機能`
- 優先度: `高`
- 依存関係: item_id filter MVP 維持
- すぐ実装できるか: `可`

### FEAT-08 コーディネート参考メモ・画像管理と購入検討リンク

コーディネート参考メモ、参考画像、購入検討とのリンクをどこまで outfit に持たせるか検討する。購入検討から outfit 参考へつなぐ導線、画像管理、import/export 影響も整理する

- 出典 / 対象箇所: 手元タスク
- 関連機能: outfits / purchase candidates
- 種別: `機能`
- 優先度: `低`
- 依存関係: outfit 画像・メモ責務整理
- すぐ実装できるか: `要設計`

### FEAT-09 既存 item の色違いグループ化 / 紐付け

既に作成済みの item 同士を、後から同じ商品の色違いとして group 化できるようにする。現在の `色違い追加` は現在の item を元に新しい色違い item を作成する導線、`複製` は類似 item を新規作成する導線として扱い、本タスクは既存 item を後から同じ色違い group に紐付ける機能として分けて設計する。

#### 検討観点

- 既存 item の検索・選択: item detail か item list のどちらから開始するか、名前 / ブランド / カテゴリ / 形 / 色 / status でどう候補を絞り込むか、disposed item、underwear など storage 区分が異なる item、すでに別 group に属する item を候補に含めるかを整理する。
- group 化ルール: group_id がない item 同士の新規 group 化、既存 group への item 追加、別 group からの移動可否、group_order の決め方、現在表示中 item を先頭にするか、group 内並び替えの要否を整理する。
- 解除・移動: 誤紐付け item を group から外せるか、外した item の group_id / group_order、group が 1 件になった場合の扱い、別 group への移動可否、解除時の確認 UI を整理する。
- UI: item detail に `既存アイテムを色違いに追加` のような導線を置くか、色違い候補 UI とどう共存するか、`色違いを新規作成` との文言差をどう出すか、SP でも選びやすい picker / inline confirmation にするかを整理する。native confirm / alert / prompt は使わない。
- backend / API: 既存 item を group に追加する API、group 解除 API、group 移動 API の要否、user scope、status validation、category / shape が異なる item の許容可否、outfit / wear log など既存参照への影響、import/export で group 情報を維持できるかを整理する。
- データ整合性: group_id / group_order の一意性、同じ group 内で order が重複しないこと、別 user の item と紐付かないこと、削除 / disposed / reactivate 時の group 表示、item duplication / color variant 作成との関係を整理する。

- 出典 / 対象箇所: 手元タスク, item detail / item list / color variant 導線
- 関連機能: items / color variants / import-export
- 種別: `機能`
- 優先度: `中`
- 依存関係: item group 設計 / color variant 作成導線の current 維持
- すぐ実装できるか: `要設計`

## 設計整理

### DES-01 ログ設計 / エラー設計

何を残すか、どの粒度で残すかを実装前提に落とし込む

- 出典 / 対象箇所: `logging/logging-policy.md`, `discovery/list-common-guidelines.md`
- 関連機能: shared backend
- 種別: `設計`
- 優先度: `中`
- 依存関係: current logging 方針確認
- すぐ実装できるか: `要設計`

#### 残件

- 障害対応時に、発生した状況から検索すべき log / event 名、log level、request ID、user ID、item ID、想定原因、初動確認先、関連 API を引ける逆引き表を作るか判断する。
- 逆引き表を `docs/specs/logging.md` に含めるか、別の運用資料に分けるかを決める。
- item 状態変更の success / failure log は `docs/specs/logging.md` の item logging 方針と重複しない形で参照できるようにする。

### DES-02 purchase candidate TPO の ID ベース化と wear log 適用粒度整理

settings の `user_tpos` を正本にしつつ、wear log へどこまで広げるか決める。purchase candidate 側の名称ベース `tpos: string[]` を将来 `tpo_ids` へ寄せる場合の DB / API / frontend / import-export / 複製 / 色違い追加 / item 化 draft / 表示 fallback / TPO 名変更 / 非表示設定への影響も整理する

- 出典 / 対象箇所: `settings/tpos.md`, `purchase-candidates.md`, 手元タスク
- 関連機能: settings / purchase candidates / wears
- 種別: `設計`
- 優先度: `高`
- 依存関係: current TPO 運用整理
- すぐ実装できるか: `要設計`

#### 現状

- item / outfit は `tpos` legacy 表示名配列に加えて `tpo_ids` を持ち、保存正本は実質 `tpo_ids` ベースへ寄っている。
- item / outfit の表示は `tpo_ids` から `user_tpos.name` を解決し、解決できない場合は legacy `tpos` を fallback として扱う。
- purchase candidate は `purchase_candidate_tpos.tpo` に TPO 名を保存し、API も `tpos: string[]` の name snapshot を返す。`tpo_ids` はまだ持たない。
- purchase candidate form は settings の active `user_tpos` を選択肢に使うが、保存後は name snapshot として扱うため、TPO 名変更には追従しない。
- purchase candidate から item 化する場合、candidate の name TPO を item 作成側で active `user_tpos` と name match できれば `tpo_ids` 化できる。
- purchase candidate の複製 / 色違い追加は、現状では `tpos` name array をそのまま引き継ぐ。
- wear log 本体には TPO field を持たない。wear log form の item / outfit 候補 filter は、item / outfit の表示 TPO を使う。
- wear log の feedback tag にある `TPO・見た目` は、settings の `user_tpos` とは別概念として扱う。

#### 短期方針

- 今すぐ purchase candidate を ID ベース化しない。
- purchase candidate の現状の名称スナップショット運用を維持し、import/export 互換と既存 API 契約を優先する。
- wear log 本体へ TPO field を広げない。
- wear log feedback tag と `user_tpos` は統合しない。

#### 中期候補

- purchase candidate を `tpo_id` + legacy `tpo` fallback の dual model にする案を検討する。
- API は `tpo_ids` preferred / `tpos` legacy の移行期間を検討する。
- export は可搬性のため name ベースを維持し、ID-only migration は避ける。
- item draft は `tpo_ids` と `tpos` の両方を持つ案を検討する。

#### 残件

- purchase candidate TPO dual model の詳細設計。
- migration 方針と既存 `purchase_candidate_tpos.tpo` の legacy fallback。
- API / OpenAPI / frontend type への影響整理。
- import/export の name 可搬性維持と legacy import fallback。
- inactive / renamed TPO の表示 fallback。
- item 化 draft / 複製 / 色違い追加での TPO 引き継ぎ仕様。

### DES-03 colors / seasons / tpos / brand の正規化整理

colors / seasons / tpos / brand の JSON・文字列運用をどこまで正規化するか決める。色名解決 helper を items / outfits / purchase candidates で共通化する必要があるかもあわせて確認する

- 出典 / 対象箇所: `purchase-candidates.md`, `settings/brand-candidates.md`, 手元タスク
- 関連機能: items / purchase candidates / settings
- 種別: `設計`
- 優先度: `中`
- 依存関係: TPO / brand 方針確定
- すぐ実装できるか: `要設計`

### DES-04 実寸自由項目の structured template 昇格

purchase candidate / item の実寸自由項目について、登録データを見て頻出項目名や category ごとの差を確認し、shared template へ段階昇格するか検討する

- 出典 / 対象箇所: `purchase-candidates.md` / `実寸 template 昇格方針`, 手元タスク
- 関連機能: items / purchase candidates
- 種別: `設計`
- 優先度: `中`
- 依存関係: current free-form data 調査
- すぐ実装できるか: `可`

### DES-05 購入検討・買い物メモの期限表示整理

current UI では `sale_ends_at` は「販売終了日」、`discount_ends_at` は「セール終了日」として扱い、買い物メモでは近い方を代表期限として畳んで表示している。UI 表示名、API / DB field、OpenAPI、import/export、shopping memo summary、期限切れ / 期限間近 badge、詳細での個別表示、`sale_ends_at` の rename / alias / deprecate を整理する

- 出典 / 対象箇所: `purchase-candidates.md`, `shopping-memos.md`, `import-export.md`, 手元タスク
- 関連機能: purchase candidates / shopping memos
- 種別: `設計`
- 優先度: `高`
- 依存関係: docs 上の意味固定済み / import-export 互換確認後
- すぐ実装できるか: `要設計`

#### current / 短期方針

- DB / API field rename は行わず、`sale_ends_at` / `discount_ends_at` を維持する。
- UI / docs では `sale_ends_at = 販売終了日`, `discount_ends_at = セール終了日` として統一する。
- `sale_ends_at` は候補商品の販売・掲載が終わる日時、`discount_ends_at` は `sale_price` の値引き・セール条件が終わる日時として扱う。
- shopping memo detail では近い方を代表期限として item row に 1 本表示し、種別ラベルを付ける。常時 2 行表示はしない。
- summary では memo 全体の `nearest_deadline` を表示し、group header nearest deadline は現時点では実装前提にしない。
- import/export は既存 field 名を維持し、互換を壊さない。

#### 残件

- docs / OpenAPI の意味整理を先行し、実装 rename は後回しにする。
- rename / alias / deprecate は中期以降に再判断する。
- 期限表示 helper 共通化や shopping memo item row の表示変更は、実用課題が出た段階で検討する。

### DES-06 カテゴリ別 shape / spec 粒度の再判断

bags / pants / skirts / shoes などの category ごとに shape や spec をどこまで持つか整理する

- 出典 / 対象箇所: `items/bags.md`, `items/fashion-accessories.md`, `items/kimono.md`, `items/legwear.md`, `items/outerwear.md`, `items/pants.md`, `items/shoes.md`, `items/skirts.md`, `items/swimwear.md`
- 関連機能: items
- 種別: `設計`
- 優先度: `低`
- 依存関係: 実運用フィードバック
- すぐ実装できるか: `要設計`

### DES-07 import で drop した feedback tag の通知方針整理

current の wear log feedback tag import は lenient import とし、legacy / unknown tag は保存せず import を継続する。後続では、drop した tag の件数や内容を import summary / warning log へ出すか、unknown tag を将来 strict 化するかを判断する。

- 出典 / 対象箇所: `import-export.md`, `wears/wear-logs.md`
- 関連機能: import-export / wear logs
- 種別: `設計`
- 優先度: `中`
- 依存関係: current lenient import 維持
- すぐ実装できるか: `要設計`

### DES-08 楽天 URL の店舗単位 group 化確認

買い物メモの domain group で、楽天を `item.rakuten.co.jp` だけでまとめず店舗単位に分けられるか確認する。楽天 URL の shop id / shop slug 取得可否、他 EC サイトとの差、group 表示名、domain group との優先順位、URL parser helper の必要性を整理する

- 出典 / 対象箇所: 手元タスク, `shopping-memos.md`
- 関連機能: shopping memos / purchase candidates
- 種別: `設計`
- 優先度: `中`
- 依存関係: URL サンプル確認
- すぐ実装できるか: `要設計`

### DES-09 item / purchase candidate のケア・素材系ステータス整理

伸縮性、裏地、透け感、洗濯方法、洗濯表示、アイロン可否、乾燥機可否、クリーニング要否などを item / purchase candidate のどちらに持たせるか、item 化時にどう引き継ぐか、filter / search / import-export / future analysis へどう使うか整理する

- 出典 / 対象箇所: 手元タスク, `items/material-composition.md`, `planning/next-features.md`
- 関連機能: items / purchase candidates
- 種別: `設計`
- 優先度: `低`
- 依存関係: 素材・混率管理方針
- すぐ実装できるか: `要設計`

### DES-10 特定 TPO の初期表示制御

特定 TPO を一覧や選択 UI で初期表示しない設定が必要か整理する。`settings/tpos.md` の inactive 表示とは別論点として、非表示対象、fallback、分析・filter への影響を確認する

- 出典 / 対象箇所: 手元タスク, `settings/tpos.md`
- 関連機能: settings / discovery
- 種別: `設計`
- 優先度: `低`
- 依存関係: TPO 運用整理
- すぐ実装できるか: `要設計`

### DES-11 item から outfit を検索する導線の適用画面整理

item を起点に既存 outfit を探す導線の適用画面を整理する。DES-11 では「既存 outfit を探す」参照・検索の導線までを扱い、「既存 outfit を使って新しく作る」作成補助は別機能として扱う。

#### 現状

- `GET /api/outfits?item_id={id}` は実装済み。
- item detail から `/outfits?item_id={id}` へ遷移できる。
- outfit list では、使用アイテム filter から `item_id` filter を開始でき、`item_id` filter の表示・解除ができる。
- wear log 登録 / 編集では、item 1件選択時に、その item を含む outfit 候補を表示できる。
- wear log の関連 outfit 候補選択時は `source_outfit_id` を設定し、手動 item 選択はクリアする。保存時は `source_outfit_id` あり、`items: []` の payload になり、backend 側の既存仕様で outfit 構成 item を展開する。

#### 方針

- item → outfit 検索導線は、現時点では「参照・検索」として扱う。
- MVP 範囲は item detail / outfit list / wear log 登録・編集までとする。
- outfit new / outfit edit には、今すぐ同じ検索導線を直接追加しない。
- item list への導線追加も現時点では後回しにする。

理由:

- outfit new では、作成補助・複製・重複確認と責務が混ざりやすい。
- outfit edit では、未保存変更や別 outfit への遷移の扱いが必要になる。
- item list は操作過多になりやすく、現時点では item detail 経由で代替できる。
- 検索導線と作成補助を混同しないため。

#### 残件

- outfit list の `item_id` filter 時 empty state は専用文言を維持する。
- 必要なら item detail から「このアイテムを使ってコーディネートを作成」導線を別タスク化する。
- 既存 outfit を参考にした複製作成は別タスクとして扱う。
- outfit 作成時の重複候補表示は別タスクとして扱う。
- outfit new / edit に導線を入れる場合は、複製・初期 item 選択・未保存変更確認の仕様を先に決める。

#### メモ

- DES-11 では「既存 outfit を探す」までを扱う。
- 「既存 outfit を使って新しく作る」は別機能として扱う。
- outfit new / edit に入れる場合は、検索ではなく作成補助機能として再設計する。
- 後続の複製機能や item 初期選択付き新規作成と衝突しないようにする。

- 出典 / 対象箇所: 手元タスク, `outfits/list-filters.md`, `outfits/create-edit.md`
- 関連機能: items / outfits / wear logs
- 種別: `設計`
- 優先度: `中`
- 依存関係: FEAT-07 item_id filter MVP
- すぐ実装できるか: `要設計`

### DES-12 item picker / item filter のカテゴリ / サブカテゴリ絞り込み整理

outfit list の使用アイテム filter と WearLogForm の item 選択で、カテゴリだけでなくカテゴリ → サブカテゴリの順に絞り込めるようにするか整理する。トップスなど item 数が多いカテゴリでは、カテゴリだけだと候補が残りすぎるため、サブカテゴリまで指定できる導線を検討する。コーディネート一覧だけで独自実装せず、同系統の item picker / item filter を横断して対象範囲と共通方針を確認する

#### 現在

- WearLogForm の item 選択では、カテゴリに従属する `種類` filter を追加済み。カテゴリ変更時は種類 filter をリセットする。
- outfit list の使用アイテム filter でも、カテゴリに従属する `種類` filter を追加済み。server-side query は増やさず、取得済み item 候補を frontend 側で絞り込む。
- outfit 作成 / 編集の item 選択では、既にカテゴリ / 種類 filter を持つ。
- picker 全体の共通化はまだ行わず、共通化候補は `DES-13` 側で扱う。

#### 検討対象

- outfit list の使用アイテム filter
  - 現状はカテゴリ / 種類 / 季節 / TPO で絞り込める。
  - 種類はカテゴリ選択後に対応する候補だけを出す。
- WearLogForm の item 選択
  - 着用履歴登録 / 編集でも同じカテゴリ → 種類絞り込みを使う。
  - 選択済み item summary や outfit 候補表示と競合しない配置にする。
- outfit 作成 / 編集の item 選択
  - 選択中 item の順序入れ替え、詳細リンク、色チップなどの UI と競合しない配置にする。
- その他 item picker / item selector
  - 同系統の item 選択 UI がある画面を調査し、最初に 1 画面で実装してから横展開するか、共通 helper から整えるかを判断する。

#### 判断観点

- item master のカテゴリ / 形ラベルと一致させる。
- カテゴリ未選択時にサブカテゴリをどう表示するか決める。
- カテゴリ選択後に、そのカテゴリ配下のサブカテゴリだけを表示するか決める。
- サブカテゴリは単一選択か複数選択かを決める。
- サブカテゴリ未設定 item を候補に含めるか、`サブカテゴリ未設定` として選べるようにするかを決める。
- shape まで絞り込む必要があるか、今回はサブカテゴリまでに留めるかを決める。
- ブランド / 色 / status との組み合わせは今回扱うか、後続に分けるかを決める。
- 既存の keyword / 季節 / TPO filter と併用できるようにする。
- API / DB 変更なしの client-side filter で足りるか、既存 API / `fetchItemsIndex` などの helper が category / subcategory filter を渡せるか確認する。
- サブカテゴリ変更時に item 候補を再取得するか、取得済み一覧を frontend 側で絞り込むかを決める。
- loading / empty / error 表示、現在選択中 item の見え方、SP での select 配置を整理する。
- item picker 間で完全共通 component 化するかは急がず、まず対象画面調査 → 1 画面実装 → 着用履歴側などへの横展開 → 必要に応じて共通化の順で進める。
- outfit new / edit の作成補助とは混同しない。

- 出典 / 対象箇所: 手元確認, `web/src/components/outfits/outfits-list.tsx`, `web/src/components/wear-logs/wear-log-form.tsx`
- 関連機能: outfits / wear logs / items / item picker
- 種別: `設計`
- 優先度: `中`
- 依存関係: item category / subcategory / shape master の current 表示確認
- すぐ実装できるか: `要設計`

### DES-13 item / purchase candidate picker の共通化検討

outfit list の使用アイテム filter で item picker 相当の UI が追加されたため、WearLogForm の item 選択や purchase candidate 側の候補表示と、どこまで共通化できるか整理する。item と purchase candidate は表示項目・状態・導線が異なるため、完全共通化を前提にせず、共通化できる部品と画面別に分ける責務を切り分ける

#### 検討観点

- 候補カード、色チップ、カテゴリ / 形 / ブランド表示、選択中 badge を共通化できるか確認する。
- loading / empty / error 表示を共通化できるか確認する。
- API 取得や filter 条件は画面差が大きければ分けたままにする。
- outfit list / WearLogForm / purchase candidate の導線差を壊さない。
- 共通化が大きくなる場合は、まず表示 helper や小さな候補カードから切り出す。
- WearLogForm の大量候補対策では、短期は frontend 表示上限 + `さらに表示` を採用済み。中期では modal / drawer 化や共通 picker component 化を検討する。

- 出典 / 対象箇所: 手元確認, `web/src/components/outfits/outfits-list.tsx`, `web/src/components/wear-logs/wear-log-form.tsx`
- 関連機能: outfits / wear logs / items / purchase candidates
- 種別: `設計`
- 優先度: `中`
- 依存関係: UI-16 / DES-12 と各 picker の current 実装確認
- すぐ実装できるか: `要設計`

## ドキュメント整理

### DOC-01 機能単位 docs のフォーマット化 / 重複整理

current / planned / 要再判断 の分け方を揃え、重複説明を減らす。今回の outfit / wear log item picker まわりの更新は targeted docs sync として扱い、DOC-01 の全面整理とは分ける

- current:
  - phase 1 として `docs/docs-map.md` を作成し、既存 docs の役割・正本候補・整理優先度を一覧化する
  - 既存 docs の大規模修正はまだ行わず、次に `docs/README.md` / `docs/specs/README.md` の入口整理を検討する

- 出典 / 対象箇所: `planning/next-features.md` / `docs の整合更新`, `wears/weather-docs-reorganization.md`
- 関連機能: docs全体
- 種別: `ドキュメント`
- 優先度: `高`
- 依存関係: 正本 docs の役割定義
- すぐ実装できるか: `可`

### DOC-02 specs index / backlink 整理

index から主要 spec と backlog に辿りやすくする

- 出典 / 対象箇所: `README.md`, `weather-docs-reorganization.md`
- 関連機能: docs navigation
- 種別: `ドキュメント`
- 優先度: `低`
- 依存関係: backlog 作成後
- すぐ実装できるか: `可`

### DOC-03 OpenAPI / import-export / spec の整合点検

spec と OpenAPI と import/export 説明のズレを継続的に減らす

- 出典 / 対象箇所: `import-export.md`, `docs/api/openapi.yaml`, 各 spec
- 関連機能: shared docs
- 種別: `ドキュメント`
- 優先度: `中`
- 依存関係: 実装変更ごとの追従
- すぐ実装できるか: `可`

### DOC-04 画面遷移図作成

item / outfit / purchase candidate / shopping memo / wear log / settings などの主要導線を画面遷移図として整理し、spec index から辿れるようにする

- 出典 / 対象箇所: 手元タスク
- 関連機能: docs navigation
- 種別: `ドキュメント`
- 優先度: `低`
- 依存関係: current 主要導線確認
- すぐ実装できるか: `可`

### DOC-05 仕様書記載ルールの適用・維持

`docs/project/docs-writing-guidelines.md` を docs 記載ルールの正本とする。

確定した記載ルールを他の機能仕様書へ適用し、既存仕様書との不整合を解消する。

docs 更新用 Skill には記載ルールを重複させず、`docs/project/docs-writing-guidelines.md` への参照だけを持たせる。

- 出典 / 対象箇所: `docs/project/docs-writing-guidelines.md`, docs 整理方針
- 関連機能: docs全体
- 種別: `ドキュメント`
- 優先度: `中`
- 依存関係: 機能仕様書の記載ルール確定
- すぐ実装できるか: `可`

### DOC-06 implementation-notes.md の役割整理

`docs/project/implementation-notes.md` と `docs/dev-log/` の責務を整理し、必要なら廃止・統合を検討する。
整理結果は `docs/project/docs-writing-guidelines.md` と整合させる

- 出典 / 対象箇所: `docs/project/implementation-notes.md`, `docs/dev-log/`,
  `docs/project/docs-writing-guidelines.md`
- 関連機能: docs全体
- 種別: `ドキュメント`
- 優先度: `中`
- 依存関係: docs 間の役割定義
- すぐ実装できるか: `要整理`

## 後でやる / deferred

### DEF-01 `shopping_memo_group_adjustments`

group 調整テーブルと UI を後続導入する

- 出典 / 対象箇所: `shopping-memos.md` / `未実装`
- 関連機能: shopping memos
- 種別: `後回し`
- 優先度: `低`
- 依存関係: group adjustment 設計
- すぐ実装できるか: `不可`

### DEF-02 manual group

自動 group とは別に手動 group を持つか決める

- 出典 / 対象箇所: `shopping-memos.md` / `未実装 / planned`
- 関連機能: shopping memos
- 種別: `後回し`
- 優先度: `低`
- 依存関係: DEF-01 と併せて判断
- すぐ実装できるか: `不可`

### DEF-03 weather snapshot 拡張

`forecast_snapshot / observed_snapshot` の保存・export 方針を固める

- 出典 / 対象箇所: `wears/weather-records.md` / `snapshot planned`, `import-export.md`
- 関連機能: weather / import-export
- 種別: `後回し`
- 優先度: `低`
- 依存関係: weather records 設計の成熟
- すぐ実装できるか: `要設計`

### DEF-04 旧天気 API / legacy field の Phase E 以降整理

legacy columns / 互換終了 / export 縮小を Phase E 以降で進める

- 出典 / 対象箇所: `wears/weather-legacy-cleanup.md` / `Phase E 以降`
- 関連機能: weather legacy
- 種別: `後回し`
- 優先度: `低`
- 依存関係: Phase D 完了、migration 判断
- すぐ実装できるか: `不可`

## 重複統合メモ

- 買い物メモの後続項目は、個別の phase 記録ではなく
  - `UI-02`
  - `UI-03`
  - `UI-04`
  - `FEAT-06`
  - `DEF-01`
  - `DEF-02`
    に統合した
- 天気系の phase 記録は、そのまま backlog 項目にせず
  - `BUG-01`
  - `DES-05`
  - `DEF-03`
  - `DEF-04`
    に集約した
- item カテゴリ別の `shape` / `spec` 再判断は、カテゴリごとの細分化をやめて `DES-06` に統合した
- 購入検討 docs の sale 要約表示や比較系の後続は、分析 / 可視化の流れとして `FEAT-05` に近いものは寄せ、shopping memo 追加導線は `FEAT-06` に寄せた
- 手元タスクのうち、native dialog 置き換え、BrandFilter z-index、購入検討削除不可の事前表示、backend test 既存失敗解消は完了済みとして新規追加しない
- 着用履歴の振り返り関連は、カレンダーアイコンの意味整理を `has_feedback` の current 仕様として反映済み。導線改善や calendar / list から reflection page への直接導線は `UI-14` に残す
- 着用統計と今季よく着た item は、別々のタスクにせず `FEAT-05` に統合した
- 期限表示と `sale_ends_at` / `discount_ends_at` internal name の再判断は、同じ期限設計として `DES-05` に統合した

## 手元タスクとの対応

- 適宜アイコンを使って視覚化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `UI-01`
- 実寸自由項目入力欄のレイアウト差異
  - 対応状況: 対応済み
  - 対応 backlog / メモ: item / purchase candidate 共通の `ItemSizeDetailsFields` で自由項目の単一値 / 注記配置を template 項目に合わせた
- 伸縮性 / 裏地 / 洗濯方法 / 洗濯表示
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-09`。素材・混率の実装タスクは `FEAT-03`
- セットアップ登録・リンク追加
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `FEAT-01`
- 今季よく着たアイテムの統計
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `FEAT-05`
- アイテム削除
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `FEAT-02`
- コーディネート参考メモ・画像管理、購入検討とのリンク
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `FEAT-08`
- 着用履歴からアイテム単位での着用回数集計
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `FEAT-05`
- 特定TPOを一覧で初期表示しない
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-10`。`settings/tpos.md` の inactive 表示とは別論点
- ログ設計
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DES-01`
- 機能単位のdocsフォーマット化 / 重複整理
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DOC-01`
- 画面遷移図
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DOC-04`
- 正規化
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DES-02`, `DES-03`
- 旧天気API関連のPhase E以降
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `DEF-04`
- purchase candidate TPOのIDベース化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-02`
- 色名解決helper共通化
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-03`
- 実寸自由項目のtemplate昇格
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-04`
- `sale_ends_at` / `discount_ends_at` のinternal name見直し
  - 対応状況: backlog 統合済み
  - 対応 backlog / メモ: `DES-05`
- 買い物メモの期限表示詳細化
  - 対応状況: docs 明記あり
  - 対応 backlog / メモ: `UI-02`
- custom dropdown / popover とボトムナビの重なり確認
  - 対応状況: 一部対応済み
  - 対応 backlog / メモ: `UI-06`。BrandFilter z-index は修正済み。viewport 下端 / placement / overlay ルールは残件
- 天気の予報→実績更新時の差分表示
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-11`
- 振り返り未記入時の振り返りありアイコン表示条件修正
  - 対応状況: 対応済み
  - 対応 backlog / メモ: `has_feedback` は reflection page の対象 field に何らかの入力がある状態として維持し、calendar の文言を `振り返り入力あり` に整理した。導線改善は `UI-14` に残す
- 着用履歴カレンダー凡例の色整理
  - 対応状況: 対応済み
  - 対応 backlog / メモ: 予定は amber の破線 outline、着用済みは indigo の塗り、予報は sky、実績は emerald として凡例と実表示を揃えた
- 着用履歴と天気登録の相互リンク
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-13`
- 着用履歴の振り返り導線改善
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-14`
- アイテムからコーディネートを検索する
  - 対応状況: MVP 対応済み / 残件は backlog 維持
  - 対応 backlog / メモ: `FEAT-07`。コーディネート一覧 / 新規 / 編集へ導線を広げるかは `DES-11`
- コーディネート作成時のアイテム選択 UI 改善
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `UI-15`
- 楽天URLの店単位 group 化確認
  - 対応状況: backlog 追加済み
  - 対応 backlog / メモ: `DES-08`

## 次に進める候補 3 件

1. `UI-14` 着用履歴の振り返り導線改善
   理由: reflection page と `振り返り入力あり` 表示は整ったため、次は calendar / list から reflection page への直接導線や導線全体の polish を検討しやすい。
2. `UI-15` コーディネート作成時のアイテム選択 UI 改善
   理由: outfit 作成体験に直結し、item 詳細リンク・選択済み item の見やすさ・季節 / TPO の入力順整理をまとめて改善しやすい。
3. `DOC-01` 機能単位 docs のフォーマット化 / 重複整理
   理由: 他タスクの判断コストを下げやすく、今後の依頼の前提整理になる。

## 運用案

- 実装済み spec には、原則として大きな backlog を本文へ積み上げず、このファイルへリンクする
- 各 spec には
  - current
  - planned
  - 要再判断
    までを最小限に残し、詳細な棚卸しは本ファイルへ寄せる
- 新しい後続タスクを追加するときは
  - 既存 backlog ID と重複しないか確認する
  - `出典 docs / 関連機能 / 優先度 / 依存関係 / すぐ実装できるか`
    を埋める

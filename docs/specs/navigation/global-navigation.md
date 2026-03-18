# Global Navigation Specification

## 概要

アプリ全体で共通利用する **グローバルナビゲーション** を追加する。

初期実装では **PC / スマホ共通で画面下部固定のボトムナビ** とし、
将来的に **PC では上部ナビへ切り替える余地** を残す。

対象タブ:

| key | 表示ラベル | 遷移先 | Lucide icon |
| --- | ---------- | ------ | ----------- |
| `home` | `ホーム` | `/` | `home` |
| `items` | `アイテム` | `/items` | `tshirt` |
| `outfits` | `コーディネート` | `/outfits` | `sparkles` |
| `settings` | `設定` | `/settings` | `settings` |

---

## 初期実装方針

- 表示位置は全デバイスで画面下部固定とする
- 表示は常設とし、主要画面から同じ導線で移動できるようにする
- アクティブ中のタブは色と背景で判別できるようにする
- アイコンは当面 Lucide で統一する
- 文言はアイコンの下に小さめのラベルとして表示する

---

## レイアウト方針

- `fixed bottom-0 left-0 right-0`
- `z-50`
- `h-16` を目安にする
- `safe-area-inset-bottom` を考慮する
- `max-w-screen-sm` を基本として中央寄せで表示する
- 画面本文はナビに隠れないよう下部余白を確保する

---

## 表示対象画面

- ホーム
- アイテム一覧 / 詳細 / 新規作成 / 編集
- コーディネート一覧 / 詳細 / 新規作成 / 編集
- 設定
- `login` と `register` では初期実装では非表示とする想定

---

## 遷移仕様

- タブ押下で対応ルートへ画面遷移する
- 現在地に応じてアクティブタブを判定する
- `items/[id]` や `items/[id]/edit` では `アイテム` をアクティブ扱いにする
- `outfits/[id]` や `outfits/[id]/edit` では `コーディネート` をアクティブ扱いにする
- `settings` 配下では `設定` をアクティブ扱いにする

---

## 実装配置の推奨

- `web/src/app/layout.tsx` : アプリ全体の共通レイアウトへナビを差し込む基点
- `web/src/components/navigation/global-bottom-nav.tsx` : ナビ本体 UI と active 判定を担当
- `web/src/lib/navigation/global-nav-items.ts` : タブ定義、href、icon、matcher を集約
- 将来 PC 用上部ナビを足す場合は `global-top-nav.tsx` を候補とし、タブ定義は共通化する

---

## 将来拡張

- PC のみ上部ナビへ切り替える
- 画面サイズで bottom / top を出し分ける
- 未読数や件数バッジを表示する
- まずは全画面共通の下部ナビを安定導入することを優先する

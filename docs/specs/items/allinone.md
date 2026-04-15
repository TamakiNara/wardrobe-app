# ITEM_SPEC: ALLINONE

## 概要

`allinone` は、UI 上は `subcategory` 主導で扱うカテゴリです。

ユーザーには種類のみを選ばせる前提で扱い、`shape` 入力は new / edit ともに表示しません。

一方で、内部実装では mapping / 保存 / fallback / read model / purchase candidate mapping の都合で `shape` 値を保持してよいものとします。この内部 `shape` はユーザー入力の正本ではなく、互換・内部処理のための補助値です。

現時点では、この構成を `allinone` の正式方針として採用します。

## UI 方針

- `allinone` は `subcategory` 主導で扱う
- `shape` は入力 UI に出さない
- 種類選択のみで成立する入力フローとする
- new / edit とも同じ挙動に揃える

## 内部実装の扱い

`allinone` は UI では `shape` を使いませんが、内部実装では `shape` 値を保持します。

理由は以下です。

- master data が `subcategory` ごとの `shape` 値を持っているため
- read model が `shape` を前提に visible category や `subcategory` を解釈する箇所を持つため
- backend が保存時の既定値 / fallback として `shape` を使っているため
- purchase candidate mapping が `shape` を含む解決を残しているため

このため、`allinone` は現状では「UI 上は shape を使わない」が、「内部でも完全に shape を持たない」カテゴリではありません。

## 保存 / fallback の考え方

- `shape` が UI から入力されなくても、保存時には既定値へ寄せる
- 現状は `shape` を完全に `NULL` / 未指定としては扱わない
- 内部では `shape` を持つ前提のまま保存・復元・解釈する
- ただし、内部 `shape` はユーザーが選んだ値ではなく、互換・内部処理のための補助値として扱う

## 現在の方針を採用する理由

- 現在の UI / 入力 / 表示は、`subcategory` 主導かつ `shape` 非表示の構成で自然に成立している
- `shape` を完全に排除するには、read model / backend / mapping / 既存データまで横断的な修正が必要になる
- その修正はコストが大きく、現時点のユーザー価値に対して優先度が低い

そのため、今は `allinone` を「UI 上は shape を使わないが、内部では shape を補助値として保持するカテゴリ」として閉じます。

## 将来検討

以下は現時点では実装しません。将来、カテゴリ横断で再検討します。

- `allinone` を truly shape-less（内部 `shape` も持たない）カテゴリにするか
- `shape` を `NULL` / 未指定で扱えるようにするか
- 他カテゴリも含めて、内部 `shape` の扱いを横断的に再設計するか

## 再検討の発火条件

以下のいずれかに当てはまる場合は、`allinone` の `shape` 方針を再検討します。

- `allinone` の spec や分類を拡張したくなった場合
- 一覧・検索・フィルタで内部 `shape` が制約になり始めた場合
- カテゴリ横断で `shape` 未指定 / `NULL` 許容に寄せたくなった場合
- データ構造の整理や migration を伴う改修フェーズに入った場合

## 横断方針との関係

- カテゴリ横断の内部 `shape` 方針は `docs/project/implementation-notes.md` を参照する
- `allinone` は、その横断方針に含まれる代表例の一つとして位置づける
- `allinone` 固有の問題としてではなく、将来の `shape` 未指定 / `NULL` 許容方針の判断対象の一部として扱う

## TODO（直近課題）

### 仕様検討

- `allinone` を truly shape-less（内部 `shape` も持たない）カテゴリにするか
- `shape` を残す場合、どこまで内部依存を許容するか

### 技術的負債 / 将来対応

- read model / backend / mapping から `shape` 前提を外すか検討
- nullable / 未指定扱いへの統一検討

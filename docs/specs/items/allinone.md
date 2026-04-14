# ITEM_SPEC: ALLINONE

## 概要

allinone は、UI 上は shape を使わないカテゴリです。

ユーザーには種類のみを選ばせる前提で扱い、shape 入力は new / edit ともに表示しません。

一方で、現行実装では shape 値を完全には排除しておらず、内部では mapping / read model / backend fallback のために shape を保持しています。

## UI 方針

- shape は常時非表示とする
- 種類選択のみで成立する入力フローとする
- new / edit ともに同じ挙動にそろえる

## 内部実装の扱い

allinone は UI では shape を使いませんが、内部実装では shape 値を保持しています。

理由は以下です。

- master data が subcategory ごとの shape 値を持っているため
- read model が shape を前提に visible category や subcategory を解釈するため
- backend が保存時の既定値 / fallback として shape を使っているため
- purchase candidate mapping が shape を含む解決を残しているため

そのため、allinone は現状では完全に shape を持たないカテゴリではありません。

## 保存 / fallback の考え方

- shape が UI から入力されなくても、保存時には既定値へ寄せる
- 現状は shape を完全に null / 未指定としては扱っていない
- 内部では shape を持つ前提のまま保存・解釈している

## 現状の位置づけ

allinone は、UI 上は shape を使わない一方で、内部では shape を持つ暂定設計です。

このズレは現状では意図的なものであり、mapping / read model / backend の整合を保つために残しています。

将来的に shape を完全に排除するかどうかは未確定です。

## 補足

- カテゴリ横断の shape 方針は `docs/project/implementation-notes.md` を参照する
- allinone はその代表例の 1 つとして位置づける

## TODO（直近課題）

### 仕様検討
- allinone を本当に shape を持たないカテゴリにするか
- shape を残す場合、どこまで内部依存を許容するか

### 技術的負債 / 将来対応
- read model / backend / mapping から shape 前提を外すか検討
- nullable / 未指定扱いへの統一検討

---
name: setup
description: kobunsho の textlint をプロジェクトに導入する手順。オーナーが明示的に頼んだときだけ使う
disable-model-invocation: true
---

# kobunsho の導入

プロジェクトに textlint を入れ、kobunsho の hook が文書を検査できるようにする。プロジェクトで一度だけ行う。

## 手順

1. プロジェクトのルートに `package.json` があるかを確かめる。ない場合は、`npm init -y` で作ってよいかをオーナーに確認してから作る。
2. 次のパッケージを開発用の依存として入れる。

       npm install --save-dev textlint textlint-rule-preset-ja-technical-writing textlint-rule-prh @textlint-ja/textlint-rule-morpheme-match textlint-rule-joyo-kanji textlint-filter-rule-allowlist

3. このスキルのディレクトリから見て `../../templates/` にあるひな形を複写する。
   - `templates/.textlintrc.json` → プロジェクトのルート
   - `templates/textlint/kobunsho-prh.yml`、`templates/textlint/kobunsho-check.js` → プロジェクトの `.textlint/`
4. `package.json` の `scripts` に、手で検査するためのコマンドを足す。

       "lint:ja": "textlint \"**/*.md\""

5. `npm run lint:ja` を一度実行し、エラーと警告の件数をオーナーに報告する。既存の文書の指摘は、この作業では直さない。直すかどうかはオーナーが決める。

## 報告に含めること

- 入れたパッケージと版
- 複写したファイル
- 既存の文書に対するエラーと警告の件数、多い規則の上位3件
- 固有名詞で常用漢字の検査に掛かった字があれば、その字（`.textlintrc.json` の `allowlist` に足す候補）

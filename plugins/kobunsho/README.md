# kobunsho プラグイン

日本語の開発文書を、「公用文作成の考え方」（令和4年1月7日 文化審議会建議）に沿って書かせる一式。README、規定文書、Issue、プルリクエストの本文などを対象とする。

## 構成

| 種類 | 名前 | 役割 |
|---|---|---|
| スキル | `kobunsho` | 書き方の規則。日本語の文書を書くときに自動で読み込まれる |
| スキル | `setup` | textlint をプロジェクトに導入する手順。`/kobunsho:setup` で呼び出す |
| エージェント | `kobunsho-reviewer` | lint で拾えない文の書き方を読んで指摘するレビュー役 |
| hook | PostToolUse | Write・Edit のあと、書き換えた範囲を textlint で検査し、指摘を Claude に返す |
| ひな形 | `templates/` | textlint の設定と、kobunsho の辞書3種 |

規則は三つの層で守らせる。

1. スキルが、書く前に規則を示す。
2. hook が、書いた直後に機械的に検査する。表記の誤りはエラー、文脈で判断が要る語は警告として返す。
3. レビュー役が、結論の位置や文の長さのように機械では判定できない点を読む。

## 導入

    /plugin marketplace add 0o-taro-o0/dev-claude-plugins
    /plugin install kobunsho@taro-plugins

スキルとレビュー役は、導入するだけで使える。

## プロジェクトへの適用

hook による検査を使うプロジェクトでだけ、一度行う。`/kobunsho:setup` を実行すると、Claude が次の手順を行う。

1. textlint と規則のパッケージを開発用の依存として入れる
2. `templates/.textlintrc.json` をルートへ、`templates/textlint/` の3ファイルを `.textlint/` へ複写する
3. `package.json` に `lint:ja` を足し、既存の文書に一度実行して件数を報告する

手で行う場合のコマンドは次のとおり。

    npm install --save-dev textlint textlint-rule-preset-ja-technical-writing textlint-rule-prh @textlint-ja/textlint-rule-morpheme-match textlint-rule-kobunsho-kana@npm:@textlint-ja/textlint-rule-morpheme-match textlint-rule-joyo-kanji textlint-filter-rule-allowlist

`textlint-rule-kobunsho-kana` は、形態素で照合する規則を別名で入れたものである。同じ規則を、エラー用（補助動詞）と警告用（文脈で判断する語）の二つとして読み込むために使う。

hook は、textlint の設定ファイルと textlint 本体がそろっているプロジェクトでだけ動く。どちらかがなければ何もしない。Node.js が入っていない環境でも何もしない。hook のコマンドは sh の書式で書いているため、Windows では Git Bash が必要である。

## hook の動き

- 対象は `.md`、`.markdown`、`.txt` である。
- Write ではファイル全体を、Edit では書き換えた行だけを検査する。既存の文書の古い指摘を、頼まれていないのに直し始めないようにするためである。
- エラーがあれば、Claude に返して直させる。警告だけなら、判断材料として Claude に渡す。

## 規則の内訳

| 規則 | 扱い | 内容 |
|---|---|---|
| `preset-ja-technical-writing` | エラー | 文の長さ、二重否定、助詞の連続、冗長な表現、常体と敬体の混在など |
| `joyo-kanji` | エラー | 常用漢字表にない漢字。「塡」「頰」「剝」「々」は許可している |
| `prh`（`kobunsho-prh.yml`） | エラー | 字面で確実に判定できる表記。「3ヶ所→3か所」「出来る→できる」「以下の通り→以下のとおり」「サーバ→サーバー」など |
| `kobunsho-kana`（`kobunsho-kana.js`） | エラー | 補助動詞。接続助詞の「て」「で」に補助動詞が続く場合だけを品詞で判定する（進めて行く→進めていく、修正して下さい→修正してください）。格助詞の「で」（電車で行く）には一致しない |
| `morpheme-match`（`kobunsho-check.js`） | 警告 | 文脈で正誤が変わる語。形式名詞の「事・時・所・物・者」、補助動詞の「見る・頂く」、「有る・無い」、「等」、「-ry」で終わる外来語など |

建議と食い違う既存の規則は、次のように扱った。

- `arabic-kanji-numbers`（`preset-ja-technical-writing` に含まれる）：「一つ→1つ」を求めるが、建議では「一つ、二つ」と書く。`.textlintrc.json` で無効にした
- ひらがな化の規則（`textlint-rule-ja-hiragana-keishikimeishi`、`-fukushi`、`-hojodoushi`）：建議では漢字で書く「既に」や、特定の対象を指す「達した時」まで仮名にさせる。採用せず、kobunsho の辞書で建議の語の一覧どおりに判定する

## 調整

- 文書種別を変える場合（利用者向けの案内を「解説・広報等」として書くなど）は、プロジェクトの `CLAUDE.md` に書く。スキルはプロジェクトの定めを優先する。
- 敬体で統一するプロジェクトでは、`.textlintrc.json` の `no-mix-dearu-desumasu` の `preferInBody` を `"ですます"` にする。
- 固有名詞で常用漢字の検査に掛かる字は、`.textlintrc.json` の `allowlist` に足す。
- 辞書（`kobunsho-prh.yml`）の各規則には、`specs` で正例と反例を書いてある。規則を足すときは `specs` も足す。読み込みのときに自動で検査される。

## 制限

- 形式名詞が仮名で書くべき用法か、漢字のままでよい用法かは、形態素解析では区別できない。警告にとどめ、Claude とレビュー役が判断する。
- 送り仮名を省く186語（打合せ、手続など）は、名詞か動詞かを字面で区別できないため、lint の対象にしていない。スキルの参照資料に一覧を載せ、Claude とレビュー役が確かめる。
- 「から」と「より」の使い分け、結論の位置、論点の数などは lint では判定できない。レビュー役が読む。

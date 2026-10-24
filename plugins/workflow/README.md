# workflow プラグイン

指揮役・実装役・レビュー役の3役でプルリクエストを回す開発体制の一式。
依頼と報告の書式のスキル、`CLAUDE.md` と `CONTRIBUTING.md` の雛形、
Issue テンプレート2種を含む。

## 導入

    /plugin marketplace add 0o-taro-o0/dev-claude-plugins
    /plugin install workflow@taro-plugins

## プロジェクトへの適用

適用先のプロジェクトで一度だけ行う。

1. 雛形2枚(`templates/CLAUDE.md`、`templates/CONTRIBUTING.md`)をプロジェクトルートへ複写し、`<>` の欄を埋める
2. Issue テンプレート2種(`templates/ISSUE_TEMPLATE/task.md`、同 `decision-request.md`)を `.github/ISSUE_TEMPLATE/` へ複写する
3. ラベルを作る(プルリクエストの状態を示す4種と、Issue の種別を示す2種・重要度を示す3種)

ラベルは次のコマンドで作る。

    gh label create 実装中 --color FBCA04 --description "実装役が作業している"
    gh label create レビュー中 --color 1D76DB --description "レビュー役が読んでいる、または指摘に対応している"
    gh label create 保留 --color D93F0B --description "保留した指摘があり、判断依頼 Issue の裁定を待っている"
    gh label create マージ可 --color 0E8A16 --description "指摘がすべて解消し、検証も通っている"
    gh label create 課題 --color C5DEF5 --description "作業中に気づいた課題"
    gh label create 判断依頼 --color D4C5F9 --description "オーナーへ判断を求める"
    gh label create 重要度:高 --color B60205 --description "放置すると実害が出る"
    gh label create 重要度:中 --color E36209 --description "進行を妨げる"
    gh label create 重要度:低 --color BFBFBF --description "放置しても支障はないが、直すと品質が上がる"

ラベルの色は、このコマンドの `--color` が唯一の定義箇所である。複数のリポジトリで
色を揃える場合も、この手順の色をそのまま使う。既存のラベルと色が異なる場合は
`gh label edit <ラベル名> --color <色>` で合わせる。

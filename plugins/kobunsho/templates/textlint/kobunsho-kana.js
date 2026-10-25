// kobunsho: 品詞で確実に判定できる補助動詞の辞書（@textlint-ja/textlint-rule-morpheme-match 用、エラー）
//
// 根拠は「公用文作成の考え方」（令和4年1月7日 文化審議会建議）の解説 Ⅰ-1(3)ア。
// 「〜ていく」「〜てくる」「〜てください」「〜てほしい」「〜てよい」は仮名で書く。
//
// 接続助詞の「て」「で」に、補助動詞（形態素解析で「非自立」となるもの）が続く場合だけに一致させる。
// そのため、格助詞の「で」（電車で行く、PDFで欲しい）や、「すべて」「初めて」のような副詞には一致しない。
// 「見る」「頂く」は補助動詞でも「自立」と判定されるため、ここには入れず kobunsho-check.js（警告）で扱う。

"use strict";

const PARTICLES = ["て", "で"];

const AUXILIARIES = [
  { pos: "動詞", basic_form: "行く", kana: "〜ていく" },
  { pos: "動詞", basic_form: "来る", kana: "〜てくる" },
  { pos: "動詞", basic_form: "下さる", kana: "〜てください" },
  { pos: "形容詞", basic_form: "欲しい", kana: "〜てほしい" },
  { pos: "形容詞", basic_form: "良い", kana: "〜てよい" }
];

module.exports = PARTICLES.flatMap((particle) =>
  AUXILIARIES.map(({ pos, basic_form, kana }) => ({
    message: `補助動詞は仮名で書く（${kana}）。実際に「${basic_form}」の意味で使う場合は、「て」「で」で文を区切っていないか確かめる。`,
    tokens: [
      { surface_form: particle, pos: "助詞", pos_detail_1: "接続助詞" },
      { pos, pos_detail_1: "非自立", basic_form }
    ]
  }))
);

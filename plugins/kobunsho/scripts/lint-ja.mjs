#!/usr/bin/env node
// kobunsho: PostToolUse hook
//
// Claude が Write / Edit で文書を書いたあと、プロジェクトの textlint で検査し、
// 指摘を Claude に返す。
//
// - プロジェクトに textlint の設定ファイルと textlint 本体がなければ何もしない（オプトイン）
// - Edit では、書き換えた行の指摘だけを返す。頼まれていない箇所まで直し始めないようにするため
// - エラーがあれば exit 2 で返す（Claude が読んで直す）
// - 警告だけなら additionalContext として渡す（Claude が文脈で判断する）

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const TARGET_EXT = /\.(md|markdown|txt)$/i;
const CONFIG_NAMES = [
  ".textlintrc",
  ".textlintrc.json",
  ".textlintrc.yml",
  ".textlintrc.yaml",
  ".textlintrc.js",
  ".textlintrc.cjs"
];
const MAX_ITEMS = 40;

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

// ファイルのある場所から上へたどり、設定ファイルと textlint 本体がそろう場所を探す
function findLintRoot(startDir) {
  let dir = startDir;
  for (;;) {
    const hasConfig = CONFIG_NAMES.some((name) => existsSync(path.join(dir, name)));
    const bin = path.join(dir, "node_modules", ".bin", process.platform === "win32" ? "textlint.cmd" : "textlint");
    if (hasConfig && existsSync(bin)) return { root: dir, bin };
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// 書き換えた文字列が、編集後のファイルのどの行にあるかを求める
function editedLineRanges(input, content) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  if (tool === "Write") return null; // ファイル全体が対象

  const newStrings =
    tool === "MultiEdit" && Array.isArray(ti.edits)
      ? ti.edits.map((e) => e.new_string)
      : [ti.new_string];

  const ranges = [];
  for (const s of newStrings) {
    if (typeof s !== "string" || s.length === 0) continue;
    let from = 0;
    for (;;) {
      const idx = content.indexOf(s, from);
      if (idx === -1) break;
      const startLine = content.slice(0, idx).split("\n").length;
      const endLine = startLine + s.split("\n").length - 1;
      ranges.push([startLine, endLine]);
      from = idx + s.length;
    }
  }
  return ranges;
}

function format(messages, relPath) {
  return messages
    .slice(0, MAX_ITEMS)
    .map((m) => `- ${relPath}:${m.line}:${m.column} [${m.ruleId}] ${String(m.message).split("\n")[0]}`)
    .join("\n");
}

const input = readInput();
const filePath = input?.tool_input?.file_path;
if (!filePath || !TARGET_EXT.test(filePath) || !existsSync(filePath)) process.exit(0);

const found = findLintRoot(path.dirname(path.resolve(filePath)));
if (!found) process.exit(0);

const result = spawnSync(found.bin, ["--format", "json", filePath], {
  cwd: found.root,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
  shell: process.platform === "win32"
});

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  // 設定の誤りなどで textlint 自体が失敗した。Claude の作業は止めず、利用者に知らせる
  process.stderr.write(`kobunsho: textlint を実行できませんでした。\n${(result.stderr || result.stdout || "").slice(0, 2000)}\n`);
  process.exit(1);
}

const content = readFileSync(filePath, "utf8");
const ranges = editedLineRanges(input, content);
const inRange = (m) => ranges === null || ranges.some(([a, b]) => m.line >= a && m.line <= b);

const messages = (report[0]?.messages || []).filter(inRange).sort((a, b) => a.line - b.line || a.column - b.column);
const errors = messages.filter((m) => m.severity === 2);
const warnings = messages.filter((m) => m.severity !== 2);
if (messages.length === 0) process.exit(0);

const relPath = path.relative(found.root, filePath) || filePath;
const scope = ranges === null ? "このファイル" : "いま書き換えた範囲";

if (errors.length > 0) {
  const parts = [
    `kobunsho: ${scope}に、公用文の表記・書き方に反する箇所がある（textlint）。`,
    "エラーは直す。コード、識別子、コマンド、引用、固有名詞は直さない。",
    "joyo-kanji の指摘が固有名詞の場合は直さず、.textlintrc.json の allowlist への追加を提案する。",
    "",
    `エラー ${errors.length} 件:`,
    format(errors, relPath)
  ];
  if (warnings.length > 0) {
    parts.push(
      "",
      `警告 ${warnings.length} 件（文脈で判断する。漢字のままが正しければ直さなくてよい）:`,
      format(warnings, relPath)
    );
  }
  process.stderr.write(parts.join("\n") + "\n");
  process.exit(2);
}

const context = [
  `kobunsho: ${scope}に、文脈で判断が必要な箇所がある（textlint の警告）。`,
  "形式名詞なら仮名に直す。具体的な対象を指す、プロジェクトの表記に合っているなど、そのままが正しければ直さない。",
  "",
  format(warnings, relPath)
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context }
  })
);
process.exit(0);

#!/usr/bin/env bun
/**
 * File length guard — source files may not exceed 250 lines. Split a long file into modules.
 *
 * Usage: bun scripts/check-file-length.ts [--root <dir>] [files...]
 *   files   check only these files (lint-staged passes staged files); default: every tracked file
 *   Exit 1 when a file is over the limit.
 *
 * Checked: .ts .tsx .js .jsx .mjs .cjs .sh .css. Exempt: test, spec and stories files, and any
 * path matching a glob in .husky/large-files-allowlist.txt (one glob per line, # for comments).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const LIMIT = 250;
const CHECKED = /\.(ts|tsx|js|jsx|mjs|cjs|sh|css)$/;
const EXEMPT = /\.(test|spec|stories)\.[jt]sx?$|[\\/]__tests__[\\/]/;
const ALLOWLIST = ".husky/large-files-allowlist.txt";

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = resolve(rootIdx >= 0 ? (argv[rootIdx + 1] ?? process.cwd()) : process.cwd());
const files = argv.filter((a, i) => !a.startsWith("--") && !(rootIdx >= 0 && i === rootIdx + 1));

function globToRegExp(glob: string): RegExp {
  const pattern = glob
    .split("**")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join(".*");
  return new RegExp(`^${pattern}$`);
}

function allowlist(): RegExp[] {
  const file = resolve(root, ALLOWLIST);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map(globToRegExp);
}

function candidates(): string[] {
  if (files.length > 0) return files.map((f) => resolve(root, f));
  const listed = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" });
  return listed
    .split("\0")
    .filter(Boolean)
    .map((f) => resolve(root, f));
}

const allowed = allowlist();
const tooLong: string[] = [];
for (const abs of candidates()) {
  const rel = relative(root, abs).split(sep).join("/");
  if (!CHECKED.test(rel) || EXEMPT.test(rel) || !existsSync(abs)) continue;
  if (allowed.some((re) => re.test(rel))) continue;
  const text = readFileSync(abs, "utf-8");
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  if (lines > LIMIT) tooLong.push(`${rel}: ${lines} lines (limit ${LIMIT})`);
}

if (tooLong.length > 0) {
  for (const line of tooLong) console.error(line);
  console.error(
    `\ncheck-file-length: ${tooLong.length} file(s) over ${LIMIT} lines. Split them into modules.`,
  );
  process.exit(1);
}
console.log(`check-file-length: OK (limit ${LIMIT} lines)`);

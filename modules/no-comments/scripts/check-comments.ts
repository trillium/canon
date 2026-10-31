#!/usr/bin/env bun
/**
 * check-comments.ts - fails on any code comment that is not a tool directive, a license header,
 * or a citation of an external fact (an RFC number or an http(s) URL).
 *
 * Usage:
 *   bun scripts/check-comments.ts [files ignored]   check against the baseline (lint-staged, CI)
 *   bun scripts/check-comments.ts --baseline        write the allow-list (create it, or shrink it)
 *   Options: --root <dir>  --config <path>
 *
 * Config (no-comments.config.json): { "dirs": [...], "exclude": [...], "baseline": "<path>" }
 * Baseline (.no-comments-baseline.json): { "files": { "<path>": <count> } }. Counts only shrink.
 *
 * Exit codes: 0 clean, 1 violations, 2 usage or setup problem.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export interface Config {
  dirs: string[];
  exclude: string[];
  baseline: string;
}

export interface Baseline {
  files: Record<string, number>;
}

export interface CommentHit {
  line: number;
  text: string;
}

const DEFAULT_CONFIG: Config = {
  dirs: ["src", "e2e", "supabase"],
  exclude: [],
  baseline: ".no-comments-baseline.json",
};

const SCRIPT_EXT = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);

const DIRECTIVE =
  /^\s*(?:\/\s*<reference\b|@vitest-environment\b|biome-ignore\b|eslint-(?:disable|enable)\b|@ts-(?:expect-error|ignore|nocheck|check)\b|ds-ignore\b|ds-ignore-file\b|istanbul ignore\b|c8 ignore\b|prettier-ignore\b)/;
const LICENSE = /^\s*(?:!|@license\b|@preserve\b|copyright\b|spdx-license-identifier\b)/i;
const EXTERNAL_FACT = /https?:\/\/\S|\bRFC[\s-]?\d{3,}\b/i;
const SQL_TICKET = /\b[A-Za-z][A-Za-z0-9]*-\d+\b|\bspec\b|\bticket\b|(?:^|\s)#\d+\b/i;

function body(raw: string): string {
  if (raw.startsWith("//")) return raw.slice(2);
  return raw.slice(2, raw.endsWith("*/") ? -2 : undefined).replace(/^\s*\*+/gm, " ");
}

export function isAllowedComment(raw: string, opts: { sqlHeader?: boolean } = {}): boolean {
  const text = body(raw);
  if (DIRECTIVE.test(text) || LICENSE.test(text) || EXTERNAL_FACT.test(text)) return true;
  return opts.sqlHeader === true && SQL_TICKET.test(text);
}

function lineOf(source: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos; i++) if (source.charCodeAt(i) === 10) line++;
  return line;
}

export function scanScript(source: string, fileName = "file.ts"): CommentHit[] {
  const kind = /\.[jt]sx$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const seen = new Set<number>();
  const hits: CommentHit[] = [];
  const collect = (r: ts.CommentRange) => {
    if (seen.has(r.pos)) return;
    seen.add(r.pos);
    const raw = source.slice(r.pos, r.end);
    if (!isAllowedComment(raw)) hits.push({ line: lineOf(source, r.pos), text: raw.trim() });
  };
  const visit = (node: ts.Node) => {
    ts.forEachLeadingCommentRange(source, node.getFullStart(), (pos, end, k) =>
      collect({ pos, end, kind: k }),
    );
    ts.forEachTrailingCommentRange(source, node.getEnd(), (pos, end, k) =>
      collect({ pos, end, kind: k }),
    );
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  return hits.sort((a, b) => a.line - b.line);
}

export function scanSql(source: string): CommentHit[] {
  const hits: CommentHit[] = [];
  let i = 0;
  let header = true;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const two = source.slice(i, i + 2);
    if (two === "--" || two === "/*") {
      let end: number;
      if (two === "--") {
        end = source.indexOf("\n", i);
        if (end < 0) end = n;
      } else {
        let depth = 1;
        end = i + 2;
        while (end < n && depth > 0) {
          const pair = source.slice(end, end + 2);
          if (pair === "/*") {
            depth++;
            end += 2;
          } else if (pair === "*/") {
            depth--;
            end += 2;
          } else end++;
        }
      }
      const raw = source.slice(i, end);
      const text = two === "--" ? raw.slice(2) : raw.slice(2, -2);
      if (!isAllowedComment(`//${text}`, { sqlHeader: header })) {
        hits.push({ line: lineOf(source, i), text: raw.trim() });
      }
      i = end;
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      while (i < n) {
        if (source[i] === c) {
          if (source[i + 1] === c) i += 2;
          else break;
        } else i++;
      }
      i++;
      header = false;
      continue;
    }
    if (c === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(source.slice(i));
      if (tag) {
        const close = source.indexOf(tag[0], i + tag[0].length);
        i = close < 0 ? n : close + tag[0].length;
        header = false;
        continue;
      }
    }
    if (!/\s/.test(c)) header = false;
    i++;
  }
  return hits;
}

export function scanFile(fileName: string, source: string): CommentHit[] {
  if (fileName.endsWith(".sql")) return scanSql(source);
  if (SCRIPT_EXT.test(fileName)) return scanScript(source, fileName);
  return [];
}

export interface Comparison {
  errors: string[];
  stale: string[];
}

export function compareToBaseline(counts: Record<string, number>, baseline: Baseline): Comparison {
  const errors: string[] = [];
  const stale: string[] = [];
  for (const [file, count] of Object.entries(counts)) {
    const allowed = baseline.files[file];
    if (allowed === undefined) {
      errors.push(`${file}: ${count} comment(s) in a file not on the allow-list`);
    } else if (count > allowed) {
      errors.push(`${file}: ${count} comment(s), allow-list permits ${allowed}`);
    }
  }
  for (const [file, allowed] of Object.entries(baseline.files)) {
    const count = counts[file] ?? 0;
    if (count < allowed) stale.push(`${file}: allow-list says ${allowed}, found ${count}`);
  }
  return { errors, stale };
}

export function nextBaseline(counts: Record<string, number>, existing: Baseline | null): Baseline {
  if (existing) {
    const { errors } = compareToBaseline(counts, existing);
    if (errors.length > 0) {
      throw new Error(`the allow-list may only shrink:\n  ${errors.join("\n  ")}`);
    }
  }
  const files: Record<string, number> = {};
  for (const file of Object.keys(counts).sort()) files[file] = counts[file];
  return { files };
}

function walk(dir: string, out: string[]) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCRIPT_EXT.test(name) || name.endsWith(".sql")) out.push(full);
  }
}

function globToRegExp(glob: string): RegExp {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*");
  return new RegExp(`^${re}$`);
}

export function collectCounts(root: string, config: Config) {
  const excluded = config.exclude.map(globToRegExp);
  const files: string[] = [];
  for (const dir of config.dirs) walk(join(root, dir), files);
  const counts: Record<string, number> = {};
  const details: Record<string, CommentHit[]> = {};
  for (const full of files) {
    const rel = relative(root, full).split(sep).join("/");
    if (excluded.some((re) => re.test(rel))) continue;
    const hits = scanFile(rel, readFileSync(full, "utf-8"));
    if (hits.length > 0) {
      counts[rel] = hits.length;
      details[rel] = hits;
    }
  }
  return { counts, details };
}

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as T) : null;
}

export function main(argv: string[]): number {
  const opt = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = resolve(opt("--root") ?? process.cwd());
  const configPath = resolve(root, opt("--config") ?? "no-comments.config.json");
  const config: Config = { ...DEFAULT_CONFIG, ...(readJson<Partial<Config>>(configPath) ?? {}) };
  const baselinePath = join(root, config.baseline);
  const existing = readJson<Baseline>(baselinePath);
  const { counts, details } = collectCounts(root, config);

  if (argv.includes("--baseline")) {
    try {
      const next = nextBaseline(counts, existing);
      writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
      const total = Object.values(next.files).reduce((a, b) => a + b, 0);
      console.log(
        `${config.baseline}: ${Object.keys(next.files).length} file(s), ${total} comment(s)`,
      );
      return 0;
    } catch (e) {
      console.error(`check-comments: ${(e as Error).message}`);
      return 1;
    }
  }

  const { errors, stale } = compareToBaseline(counts, existing ?? { files: {} });
  const problems = [
    ...errors,
    ...stale.map((s) => `${s} - run: pnpm run check:comments -- --baseline`),
  ];
  if (problems.length === 0) return 0;
  for (const file of Object.keys(details)) {
    if (errors.some((e) => e.startsWith(`${file}:`))) {
      for (const h of details[file]) console.error(`${file}:${h.line}: ${h.text.split("\n")[0]}`);
    }
  }
  console.error("");
  console.error(problems.join("\n"));
  console.error("");
  console.error(
    "Delete the comment and put the intent in a name, a type or a test. Allowed: tool directives, license headers, RFC numbers, http(s) URLs.",
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}

#!/usr/bin/env bun
/**
 * check-data-seam.ts - fails when a file outside the seam folder imports a database client package.
 *
 * Usage:
 *   bun scripts/check-data-seam.ts [files ignored]   check against the baseline (lint-staged, CI)
 *   bun scripts/check-data-seam.ts --baseline        write the allow-list (create it, or shrink it)
 *   Options: --root <dir>  --config <path>
 *
 * Config (data-seam.config.json):
 *   { "dirs": [...], "exclude": [...], "seam": "<folder>", "packages": [...], "baseline": "<path>" }
 * Baseline (.data-seam-baseline.json): { "files": { "<path>": <count> } }. Counts only shrink.
 * Import forms caught: import / export-from, dynamic import(), require(), import type.
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
  seam: string;
  packages: string[];
  baseline: string;
}

export interface Baseline {
  files: Record<string, number>;
}

export interface ImportHit {
  line: number;
  specifier: string;
}

const DEFAULT_CONFIG: Config = {
  dirs: ["src", "e2e"],
  exclude: [],
  seam: "src/lib/supabase",
  packages: ["@supabase/supabase-js", "@supabase/ssr"],
  baseline: ".data-seam-baseline.json",
};

const SCRIPT_EXT = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);

export function isClientSpecifier(specifier: string, packages: string[]): boolean {
  return packages.some((pkg) => specifier === pkg || specifier.startsWith(`${pkg}/`));
}

export function scanImports(source: string, packages: string[], fileName = "file.ts"): ImportHit[] {
  const info = ts.preProcessFile(source, true, true);
  const hits: ImportHit[] = [];
  for (const ref of info.importedFiles) {
    if (!isClientSpecifier(ref.fileName, packages)) continue;
    const line = source.slice(0, ref.pos).split("\n").length;
    hits.push({ line, specifier: ref.fileName });
  }
  return hits.sort((a, b) => a.line - b.line);
}

export function isInSeam(rel: string, seam: string): boolean {
  const folder = seam.replace(/\/+$/, "");
  return rel === folder || rel.startsWith(`${folder}/`);
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
      errors.push(`${file}: ${count} client import(s) in a file not on the allow-list`);
    } else if (count > allowed) {
      errors.push(`${file}: ${count} client import(s), allow-list permits ${allowed}`);
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
    else if (SCRIPT_EXT.test(name)) out.push(full);
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
  const details: Record<string, ImportHit[]> = {};
  for (const full of files) {
    const rel = relative(root, full).split(sep).join("/");
    if (isInSeam(rel, config.seam) || excluded.some((re) => re.test(rel))) continue;
    const hits = scanImports(readFileSync(full, "utf-8"), config.packages, rel);
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
  const configPath = resolve(root, opt("--config") ?? "data-seam.config.json");
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
        `${config.baseline}: ${Object.keys(next.files).length} file(s), ${total} import(s)`,
      );
      return 0;
    } catch (e) {
      console.error(`check-data-seam: ${(e as Error).message}`);
      return 1;
    }
  }

  const { errors, stale } = compareToBaseline(counts, existing ?? { files: {} });
  const problems = [
    ...errors,
    ...stale.map((s) => `${s} - run: pnpm run check:seam -- --baseline`),
  ];
  if (problems.length === 0) return 0;
  for (const file of Object.keys(details)) {
    if (errors.some((e) => e.startsWith(`${file}:`))) {
      for (const h of details[file]) console.error(`${file}:${h.line}: imports ${h.specifier}`);
    }
  }
  console.error("");
  console.error(problems.join("\n"));
  console.error("");
  console.error(
    `Only ${config.seam} may import ${config.packages.join(", ")}. Add a typed function there and call it instead.`,
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}

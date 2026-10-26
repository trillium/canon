#!/usr/bin/env bun
/**
 * check-design-system.ts — pattern-based guard against raw HTML elements that
 * should use design-system components.
 *
 * Usage:
 *   bun scripts/check-design-system.ts <file> [<file> ...]       lint-staged (files as argv)
 *   bun scripts/check-design-system.ts --staged-only <file> ...  only lines added in the staged diff
 *   bun scripts/check-design-system.ts --all                     sweep the whole repo (pre-push, CI)
 *   bun scripts/check-design-system.ts --claude-hook             Claude Code PreToolUse hook (JSON on stdin)
 *
 * Exit codes:
 *   0  clean
 *   1  one or more files violated a rule
 *   2  setup problem — or, in --claude-hook mode, a violation (exit 2 blocks the tool call)
 *
 * Escape hatches:
 *   - `// ds-ignore` (or `{/* ds-ignore *\/}` in JSX) — skips findings within 3 lines of the comment
 *   - `/* ds-ignore-file *\/` on its own line anywhere in the file — skips the whole file
 *   Directives count only at the start of a line, so a string that quotes one exempts nothing.
 *   Neither works for rules marked `noEscapeHatch`.
 *
 * Rules come from <ui dir>/manifest.ts. Files inside the UI dir are exempt:
 * that is where raw tags are allowed to live.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkSource, type DsRule, type Finding, hasFileOptOut } from "./lib/ds-check";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const UI_DIR_CANDIDATES = ["src/components/ui", "components/ui"];
const WALK_SKIP_ANYWHERE = new Set(["node_modules", ".next", ".git"]);
const WALK_SKIP_TOP_LEVEL = new Set([
  ".vercel",
  "dist",
  "build",
  "coverage",
  "public",
  "supabase",
  "e2e",
  "scripts",
]);

function findUiDir(): string | null {
  const candidates = process.env.DS_UI_DIR ? [process.env.DS_UI_DIR] : UI_DIR_CANDIDATES;
  for (const candidate of candidates) {
    const abs = resolve(ROOT, candidate);
    if (existsSync(join(abs, "manifest.ts"))) return abs;
  }
  return null;
}

function isJsxFile(file: string): boolean {
  return /\.(tsx|jsx)$/.test(file);
}

function shouldSkipPath(abs: string, uiDir: string): boolean {
  const rel = relative(ROOT, abs).split(sep).join("/");
  if (rel.startsWith("..")) return true;
  if (abs.startsWith(uiDir + sep)) return true;
  if (/(^|\/)(node_modules|\.next|__tests__)\//.test(rel)) return true;
  if (/^(scripts|e2e)\//.test(rel)) return true;
  return /\.(test|spec)\.(tsx|jsx)$/.test(rel);
}

function getStagedLineNumbers(file: string): Set<number> | null {
  try {
    const diff = execFileSync("git", ["diff", "--cached", "-U0", "--", file], {
      encoding: "utf8",
    });
    const added = new Set<number>();
    let cur = 0;
    for (const line of diff.split("\n")) {
      const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        cur = Number.parseInt(m[1], 10) - 1;
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        cur++;
        added.add(cur);
      }
    }
    return added.size > 0 ? added : null;
  } catch {
    return null;
  }
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (WALK_SKIP_ANYWHERE.has(entry)) continue;
    if (dir === ROOT && WALK_SKIP_TOP_LEVEL.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (stat.isFile()) out.push(full);
  }
}

function report(findings: Finding[], displayRoot: string): void {
  process.stderr.write("check-design-system: design system violation\n\n");
  for (const f of findings) {
    const noEscape = f.noEscapeHatch ? "  [no escape hatch]" : "";
    const shown = f.file.startsWith(displayRoot) ? relative(displayRoot, f.file) : f.file;
    process.stderr.write(
      `  ${shown}:${f.line}  [${f.rule}]${noEscape}\n  → ${f.action}\n      ${f.excerpt}\n\n`,
    );
  }
  process.stderr.write(
    "Escape hatch: `// ds-ignore` or `/* ds-ignore-file */` — not available for rules marked [no escape hatch].\n",
  );
}

interface HookPayload {
  cwd?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
    edits?: { old_string?: string; new_string?: string }[];
  };
}

function runClaudeHook(rules: DsRule[], uiDir: string): never {
  let payload: HookPayload;
  try {
    payload = JSON.parse(readFileSync(0, "utf8")) as HookPayload;
  } catch {
    process.exit(0);
  }
  const input = payload.tool_input ?? {};
  if (typeof input.file_path !== "string") process.exit(0);
  const abs = resolve(payload.cwd ?? ROOT, input.file_path);
  if (!isJsxFile(abs) || shouldSkipPath(abs, uiDir)) process.exit(0);

  const onDisk = existsSync(abs) ? readFileSync(abs, "utf8") : "";
  const chunks: { text: string; before: string }[] = [];
  if (typeof input.content === "string") chunks.push({ text: input.content, before: onDisk });
  if (typeof input.new_string === "string") {
    chunks.push({ text: input.new_string, before: input.old_string ?? "" });
  }
  for (const edit of input.edits ?? []) {
    if (typeof edit.new_string === "string") {
      chunks.push({ text: edit.new_string, before: edit.old_string ?? "" });
    }
  }

  const findings = chunks.flatMap((chunk) =>
    checkSource(abs, chunk.text, rules, {
      baseline: new Set(chunk.before.split("\n").map((l) => l.trim())),
      fileIgnored: hasFileOptOut(onDisk) || hasFileOptOut(chunk.text),
    }),
  );
  if (findings.length === 0) process.exit(0);
  report(findings, payload.cwd ?? ROOT);
  process.exit(2);
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const stagedOnly = rawArgs.includes("--staged-only");
  const sweepAll = rawArgs.includes("--all");
  const hookMode = rawArgs.includes("--claude-hook");
  const args = rawArgs.filter((a) => !a.startsWith("-"));

  const uiDir = findUiDir();
  if (!uiDir) {
    process.stderr.write(
      "check-design-system: cannot find components/ui/manifest.ts (looked in src/components/ui and components/ui; set DS_UI_DIR to override).\n",
    );
    process.exit(2);
  }
  const mod = (await import(pathToFileURL(join(uiDir, "manifest.ts")).href)) as {
    DS_RULES: DsRule[];
  };
  const rules = mod.DS_RULES;

  if (hookMode) runClaudeHook(rules, uiDir);
  if (rules.length === 0) process.exit(0);

  let candidates = args.map((f) => resolve(f));
  if (sweepAll) {
    candidates = [];
    walk(ROOT, candidates);
  }
  const files = candidates.filter((f) => isJsxFile(f) && !shouldSkipPath(f, uiDir));

  const findings: Finding[] = [];
  for (const file of files) {
    if (!existsSync(file) || !statSync(file).isFile()) continue;
    let found = checkSource(file, readFileSync(file, "utf8"), rules);
    if (stagedOnly && found.length > 0) {
      const staged = getStagedLineNumbers(file);
      found = staged ? found.filter((f) => staged.has(f.line)) : [];
    }
    findings.push(...found);
  }

  if (findings.length === 0) process.exit(0);
  report(findings, ROOT);
  process.exit(1);
}

await main();

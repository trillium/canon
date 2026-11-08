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

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  checkSource,
  type DsRule,
  type Finding,
  findUiDir,
  getStagedLineNumbers,
  isJsxFile,
  ROOT,
  report,
  runClaudeHook,
  shouldSkipPath,
  walk,
} from "./design-system";

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

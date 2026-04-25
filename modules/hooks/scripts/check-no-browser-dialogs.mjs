#!/usr/bin/env node

/**
 * Browser dialog guard — prevents alert(), confirm(), and prompt() in source files.
 *
 * Native browser dialogs block the main thread and provide no styling
 * control. Use a UI component (toast, modal, confirmation dialog) instead.
 *
 * Usage:  node scripts/check-no-browser-dialogs.mjs file1.ts file2.tsx ...
 * lint-staged passes the staged file list as positional args.
 *
 * Only scans added lines in the git diff (not whole files), so existing
 * calls in untouched code won't trigger failures — safe for incremental
 * adoption on legacy codebases.
 */

import { execSync } from "node:child_process";

// Match standalone calls: alert(...), confirm(...), prompt(...)
// Avoid matching: window.alert (same thing, still bad)
// Avoid false positives: alertMessage, confirmOrder, promptText (word boundary)
const DIALOG_RE = /\b(alert|confirm|prompt)\s*\(/;

// Skip lines that are clearly comments
const COMMENT_RE = /^\+\s*(\/\/|\/\*|\*)/;

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0);

let failed = false;

const diff = execSync(
  `git diff --cached -U0 -- ${files.map((f) => `'${f}'`).join(" ")}`,
  { encoding: "utf8" },
);

let currentFile = "";

for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    currentFile = line.slice("+++ b/".length);
    continue;
  }

  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
    continue;
  }

  if (line.startsWith("+") && !COMMENT_RE.test(line) && DIALOG_RE.test(line)) {
    const match = line.match(DIALOG_RE);
    console.error(
      `${currentFile}: ${match[1]}() detected — use a UI component instead`,
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    "\nBrowser dialog guard: replace alert/confirm/prompt with toast or modal components.",
  );
  process.exit(1);
}

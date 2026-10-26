#!/usr/bin/env bun
/**
 * No-literal-text linter — component files may contain NO literal user-visible text.
 * Every string is a variable imported from a JSON content file. Runs on Bun; the scan itself is in
 * lib/literals-scan.ts.
 *
 * Usage: bun scripts/lint-literals.ts [--root <dir>] [--no-list] [files...]
 *   files     check only these files (lint-staged passes staged files); default: scan the source dir
 *   --no-list do not print the escape-hatch listing
 *   Exit 1 on any violation; 2 on a usage or setup problem.
 *
 * Flagged, in .tsx/.jsx files:
 *   - JSX text containing a letter:            <h1>Welcome</h1>
 *   - string literals as JSX children:         {"Welcome"}, {ok ? "Yes" : "No"}, {`Hi`}
 *   - strings in user-visible attributes:      placeholder, title, alt, aria-label, label, ...
 * Not flagged: numbers, punctuation, symbols, entities (&nbsp;), className and other non-copy props,
 * and anything inside a content directory, test, spec or stories file.
 *
 * Escape hatches (rare — every one needs a reason and is listed in the output):
 *   - same line, or the line above:   // content-ok: reason     {/* content-ok: reason *\/}
 *   - whole subtree:                  <div data-content-skip="reason"> ... </div>
 *
 * Config (optional): content-acceptance.config.json at --root:
 *   { "sourceDir": "src", "contentDir": "src/content" }   // defaults: src (or app), src/content
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { walk } from "./lib/fs";
import { type Escape, IGNORED_DIR, IGNORED_FILE, scan, type Violation } from "./lib/literals-scan";

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = resolve(rootIdx >= 0 ? (argv[rootIdx + 1] ?? process.cwd()) : process.cwd());
const files = argv.filter((a, i) => !a.startsWith("--") && !(rootIdx >= 0 && i === rootIdx + 1));
const listEscapes = !argv.includes("--no-list");

const cfgPath = join(root, "content-acceptance.config.json");
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf-8")) : {};
const sourceDir = join(root, cfg.sourceDir ?? (existsSync(join(root, "src")) ? "src" : "app"));
const contentDirs = [cfg.contentDir ?? "src/content", "content"].map(
  (d: string) => join(root, d) + sep,
);

const candidates = files.length
  ? files.map((f) => resolve(root, f))
  : existsSync(sourceDir)
    ? walk(sourceDir, IGNORED_DIR)
    : null;
if (!candidates) {
  console.error(`lint-literals: source dir not found: ${sourceDir}`);
  process.exit(2);
}

const targets = candidates.filter(
  (f) =>
    /\.[jt]sx$/.test(f) &&
    existsSync(f) &&
    !IGNORED_FILE.test(f) &&
    !contentDirs.some((d) => f.startsWith(d)),
);

const violations: Violation[] = [];
const escapes: Escape[] = [];
for (const f of targets) {
  const r = scan(f);
  violations.push(...r.violations);
  escapes.push(...r.escapes);
}

const rel = (f: string): string => relative(root, f);
if (violations.length) {
  console.log("Literal text in components — move it to a JSON content file:\n");
  for (const v of violations) console.log(`  ${rel(v.file)}:${v.line}  ${v.what}: ${v.shown}`);
  console.log(`\n${violations.length} violation(s).`);
} else {
  console.log(`No literal text in ${targets.length} component file(s).`);
}
if (listEscapes && escapes.length) {
  console.log(`\nEscape hatches in use (${escapes.length}):`);
  for (const e of escapes) console.log(`  ${rel(e.file)}:${e.line}  ${e.kind}: ${e.reason}`);
}
process.exit(violations.length ? 1 : 0);

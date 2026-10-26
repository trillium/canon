#!/usr/bin/env bun
/**
 * API message guard — server response messages live in JSON files under src/content, not in route code.
 *
 * Flags a string or template literal with letters used as the `error` or `message` of a
 * `NextResponse.json({...})` / `Response.json({...})` response. Read the text from src/content
 * (see src/lib/format-message.ts for placeholders) instead.
 *
 * Usage: bun scripts/check-api-messages.ts [--root <dir>] [files...]
 *   files   check only these files (lint-staged passes staged files); default: every .ts file under src
 *   Exit 1 on any violation.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { walk } from "./lib/fs";

const MESSAGE_KEYS = new Set(["error", "message"]);
const RESPONSE_CALL = /^(NextResponse|Response)\.json$/;
const IGNORED_FILE = /\.(test|spec)\.tsx?$|^src\/content\//;
const IGNORED_DIR = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = resolve(rootIdx >= 0 ? (argv[rootIdx + 1] ?? process.cwd()) : process.cwd());
const files = argv.filter((a, i) => !a.startsWith("--") && !(rootIdx >= 0 && i === rootIdx + 1));

const hasLetter = (s: string): boolean => /\p{L}/u.test(s);

function isInlineText(node: ts.Expression): boolean {
  if (ts.isStringLiteralLike(node)) return hasLetter(node.text);
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].some(hasLetter);
  }
  return false;
}

function scan(file: string): string[] {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf-8"), ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      RESPONSE_CALL.test(node.expression.getText(sf)) &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const prop of node.arguments[0].properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          MESSAGE_KEYS.has(prop.name.getText(sf)) &&
          isInlineText(prop.initializer)
        ) {
          const line = sf.getLineAndCharacterOfPosition(prop.getStart(sf)).line + 1;
          found.push(
            `${relative(root, file)}:${line}  inline response message: ${prop.initializer.getText(sf)}`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return found;
}

const srcDir = join(root, "src");
const targets = (
  files.length > 0
    ? files.map((f) => resolve(root, f))
    : existsSync(srcDir)
      ? walk(srcDir, IGNORED_DIR)
      : []
).filter(
  (f) =>
    /\.tsx?$/.test(f) &&
    !IGNORED_FILE.test(relative(root, f).split(sep).join("/")) &&
    existsSync(f),
);

const violations = targets.flatMap(scan);
if (violations.length > 0) {
  for (const v of violations) console.error(v);
  console.error(
    `\ncheck-api-messages: ${violations.length} violation(s). Move the text to a JSON file in src/content.`,
  );
  process.exit(1);
}
console.log(`check-api-messages: OK (${targets.length} files)`);

/**
 * Parses one .tsx/.jsx file and reports letter-bearing strings rendered as JSX text, JSX children or
 * user-visible attributes. Escape hatches: `content-ok: reason` comments and `data-content-skip`.
 */
import { readFileSync } from "node:fs";
import ts from "typescript";
import { COPY_ATTRS, SKIP_ATTR } from "./constants";
import { hasLetter, literalsIn } from "./expressions";
import type { Escape, ScanResult, Violation } from "./types";

export function scan(file: string): ScanResult {
  const text = readFileSync(file, "utf-8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines = text.split("\n");
  const violations: Violation[] = [];
  const escapes: Escape[] = [];
  const lineOf = (pos: number): number => sf.getLineAndCharacterOfPosition(pos).line;

  /** Look for `content-ok` on the node's first line or the line above. */
  function escapeFor(pos: number): { line: number; reason: string | undefined } | null {
    const l = lineOf(pos);
    for (const i of [l, l - 1]) {
      if (i !== l && !/^\s*(?:\{\s*)?(?:\/\/|\/\*)/.test(lines[i] ?? "")) continue;
      const m = lines[i]?.match(/content-ok(?::[ \t]*(\S[^*]*?))?[ \t]*(?:\*\/|$)/);
      if (m) return { line: i + 1, reason: m[1]?.trim() };
    }
    return null;
  }

  function report(node: ts.Node, what: string, shown: string): void {
    const start = node.getStart(sf);
    const line = lineOf(start) + 1;
    const esc = escapeFor(start);
    if (esc?.reason) {
      escapes.push({ file, line: esc.line, kind: "content-ok", reason: esc.reason });
    } else if (esc) {
      violations.push({
        file,
        line: esc.line,
        what: "content-ok needs a reason",
        shown: "// content-ok: <why>",
      });
    } else {
      violations.push({ file, line, what, shown: shown.replace(/\s+/g, " ").trim().slice(0, 60) });
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attrs = (ts.isJsxElement(node) ? node.openingElement : node).attributes.properties;
      const skip = attrs.find(
        (a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText(sf) === SKIP_ATTR,
      );
      if (skip) {
        const v = skip.initializer;
        const reason = v && ts.isStringLiteral(v) ? v.text.trim() : "";
        if (reason) {
          escapes.push({ file, line: lineOf(skip.getStart(sf)) + 1, kind: SKIP_ATTR, reason });
          return;
        }
        violations.push({
          file,
          line: lineOf(skip.getStart(sf)) + 1,
          what: `${SKIP_ATTR} needs a reason`,
          shown: `${SKIP_ATTR}="<why>"`,
        });
      }
    }
    if (ts.isJsxText(node)) {
      if (hasLetter(node.text)) report(node, "literal JSX text", node.text);
    } else if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      for (const lit of literalsIn(node.expression)) {
        report(lit, "string literal rendered as JSX child", lit.getText(sf));
      }
    } else if (
      ts.isJsxAttribute(node) &&
      COPY_ATTRS.has(node.name.getText(sf)) &&
      node.initializer
    ) {
      const init = node.initializer;
      const lits: ts.Node[] =
        ts.isJsxExpression(init) && init.expression
          ? literalsIn(init.expression)
          : literalsIn(init);
      for (const lit of lits) {
        report(lit, `literal text in \`${node.name.getText(sf)}\``, lit.getText(sf));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return { violations, escapes };
}

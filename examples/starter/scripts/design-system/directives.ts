/**
 * The ds-ignore opt-out directives. A directive counts only at the start of a line, so a string
 * that quotes one exempts nothing.
 */

export const IGNORE_WINDOW = 3;
const FILE_OPT_OUT = "/* ds-ignore-file */";
const LINE_OPT_OUT = "// ds-ignore";
const LINE_OPT_OUT_JSX = "{/* ds-ignore */}";

export function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function hasDirective(line: string, directive: string): boolean {
  return line.trim().startsWith(directive);
}

export function hasFileOptOut(source: string): boolean {
  return source.split("\n").some((l) => hasDirective(l, FILE_OPT_OUT));
}

/** True when `line` carries a line-level opt-out (`// ds-ignore` or its JSX form). */
export function hasLineOptOut(line: string): boolean {
  return hasDirective(line, LINE_OPT_OUT) || hasDirective(line, LINE_OPT_OUT_JSX);
}

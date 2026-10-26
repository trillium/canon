/**
 * The matching engine behind check-design-system.ts: given a source file and the manifest rules,
 * returns the raw-HTML findings, honouring the ds-ignore directives. Directives count only at the
 * start of a line, so a string that quotes one exempts nothing.
 */

interface DsRulePattern {
  jsx?: RegExp;
  className?: RegExp;
  jsxStyle?: { element: RegExp; styling: RegExp };
}

export interface DsRule {
  name: string;
  component: string;
  importPath: string;
  hint?: string;
  noEscapeHatch?: boolean;
  patterns: DsRulePattern[];
}

export interface Finding {
  file: string;
  line: number;
  rule: string;
  action: string;
  noEscapeHatch: boolean;
  excerpt: string;
}

const FILE_OPT_OUT = "/* ds-ignore-file */";
const LINE_OPT_OUT = "// ds-ignore";
const LINE_OPT_OUT_JSX = "{/* ds-ignore */}";
const IGNORE_WINDOW = 3;

function lineMatches(line: string, rule: DsRule): boolean {
  for (const p of rule.patterns) {
    if (p.jsx?.test(line)) return true;
    if (p.className?.test(line)) return true;
    if (p.jsxStyle?.element.test(line) && p.jsxStyle.styling.test(line)) return true;
  }
  return false;
}

function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function hasDirective(line: string, directive: string): boolean {
  return line.trim().startsWith(directive);
}

export function hasFileOptOut(source: string): boolean {
  return source.split("\n").some((l) => hasDirective(l, FILE_OPT_OUT));
}

interface CheckOptions {
  /** Trimmed lines that already existed; matching lines are not new violations */
  baseline?: Set<string>;
  fileIgnored?: boolean;
}

export function checkSource(
  file: string,
  source: string,
  rules: DsRule[],
  options: CheckOptions = {},
): Finding[] {
  const fileIgnored = options.fileIgnored ?? hasFileOptOut(source);
  const lines = source.split("\n");
  const findings: Finding[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line) || options.baseline?.has(line.trim())) continue;
    const window = lines.slice(Math.max(0, i - IGNORE_WINDOW), i + IGNORE_WINDOW + 1);
    const lineIgnored = window.some(
      (l) => hasDirective(l, LINE_OPT_OUT) || hasDirective(l, LINE_OPT_OUT_JSX),
    );
    for (const rule of rules) {
      if ((fileIgnored || lineIgnored) && !rule.noEscapeHatch) continue;
      if (!lineMatches(line, rule)) continue;
      findings.push({
        file,
        line: i + 1,
        rule: rule.name,
        action: rule.hint ?? `use ${rule.component} from ${rule.importPath}`,
        noEscapeHatch: Boolean(rule.noEscapeHatch),
        excerpt: line.trim(),
      });
    }
  }
  return findings;
}

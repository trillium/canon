/** The matching engine: finds raw-HTML violations in a source file for a set of manifest rules. */
import { hasFileOptOut, hasLineOptOut, IGNORE_WINDOW, isCommentLine } from "./directives";
import type { DsRule, Finding } from "./types";

function lineMatches(line: string, rule: DsRule): boolean {
  for (const p of rule.patterns) {
    if (p.jsx?.test(line)) return true;
    if (p.className?.test(line)) return true;
    if (p.jsxStyle?.element.test(line) && p.jsxStyle.styling.test(line)) return true;
  }
  return false;
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
    const lineIgnored = window.some(hasLineOptOut);
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

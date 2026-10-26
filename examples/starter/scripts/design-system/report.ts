/** Prints violations to stderr. */
import { relative } from "node:path";
import type { Finding } from "./types";

export function report(findings: Finding[], displayRoot: string): void {
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

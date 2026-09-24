#!/usr/bin/env node
/**
 * check-design-system.ts
 *
 * Scans staged .tsx files for hand-rolled UI that should use a design
 * system component instead. Rule patterns come from
 * `src/components/ui/manifest.ts` — resolved from the current working
 * directory so this file is byte-identical in the canon module and in
 * every project it is copied to. Never import the manifest via `@/`.
 *
 * Runs under plain `node` (no bun, no tsx): both this file and the
 * manifest use erasable TypeScript only, loaded via type stripping.
 *
 * Escape hatches:
 *   - `// ds-ignore` on a line suppresses that line
 *   - `/* ds-ignore-file *\/` at top of file suppresses entire file
 *
 * Usage (lint-staged — file paths):
 *   node scripts/check-design-system.ts src/components/Foo.tsx
 *
 * Usage (full audit):
 *   node scripts/check-design-system.ts src/
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const TSX_EXTS = new Set([".tsx"]);

async function loadManifest(cwd: string): Promise<{
  DS_COMPONENT_NAMES: string[];
  DS_RULES: ManifestRule[];
}> {
  const url = pathToFileURL(join(cwd, "src", "components", "ui", "manifest.ts"));
  return await import(url.href);
}

interface ManifestPattern {
  jsx?: RegExp;
  className?: RegExp;
  jsxStyle?: {
    element: RegExp;
    styling: RegExp;
  };
}

interface ManifestRule {
  name: string;
  component: string;
  importPath: string;
  category: string;
  selfExempt?: boolean;
  hint?: string;
  patterns: ManifestPattern[];
  description: string;
  rawPattern: string;
}

interface Warning {
  file: string;
  line: number;
  rule: string;
  component: string;
  importPath: string;
  hint?: string;
}

/** Paths to skip wholesale (the DS itself, emails, design-system docs). */
const SKIP_PATTERNS = [
  /src\/components\/ui\//,
  /src\/emails\//,
  /design-system\//,
  /node_modules\//,
  /\.next\//,
  /\.(test|spec)\.tsx$/,
  /__tests__\//,
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

/**
 * True if `selfExempt` is set on the rule AND the file being scanned is
 * the one that DEFINES the target component.
 */
function isSelfExemptFile(rule: ManifestRule, filePath: string): boolean {
  if (!rule.selfExempt) return false;
  const componentModule = rule.importPath.split("/").at(-1) ?? "";
  if (!componentModule) return false;
  const fileBase = basename(filePath, extname(filePath));
  return fileBase === componentModule;
}

/**
 * Returns true if ANY pattern strategy on the rule matches the line.
 * The three strategies (`jsx`, `className`, `jsxStyle`) are equivalent
 * at the rule level — they make rule intent explicit, not composed.
 */
function patternMatchesLine(pattern: ManifestPattern, line: string): boolean {
  if (pattern.jsx?.test(line)) return true;
  if (pattern.className?.test(line)) return true;
  if (pattern.jsxStyle) {
    if (pattern.jsxStyle.element.test(line) && pattern.jsxStyle.styling.test(line)) {
      return true;
    }
  }
  return false;
}

function checkFile(filePath: string, rules: ManifestRule[]): Warning[] {
  if (!TSX_EXTS.has(extname(filePath))) return [];
  if (shouldSkip(filePath)) return [];

  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  if (content.includes("/* ds-ignore-file */")) {
    const reason = content.match(/\/\*\s*ds-ignore-file\s*(.*?)\s*\*\//)?.[1]?.trim();
    process.stderr.write(
      `[ds-ignore] ${filePath} — whole file suppressed` + (reason ? ` (${reason})` : "") + "\n",
    );
    return [];
  }

  const lines = content.split("\n");
  const warnings: Warning[] = [];

  const importedComponents = new Set<string>();
  for (const line of lines) {
    const importMatch = line.match(/from\s+["']@\/components\/ui\/(\w+)["']/);
    if (importMatch) {
      importedComponents.add(importMatch[1]);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.includes("// ds-ignore")) {
      const reason = line.match(/\/\/\s*ds-ignore\s*(.*)/)?.[1]?.trim();
      process.stderr.write(
        `[ds-ignore] ${filePath}:${i + 1} — suppressed` + (reason ? ` (${reason})` : "") + "\n",
      );
      continue;
    }

    for (const rule of rules) {
      // focus-ring-inconsistency is a global utility-class rule — it
      // fires regardless of which DS components the file imports.
      if (rule.name !== "focus-ring-inconsistency") {
        const componentModule = rule.importPath.split("/").at(-1) ?? "";
        if (componentModule && importedComponents.has(componentModule)) {
          continue;
        }
      }
      if (isSelfExemptFile(rule, filePath)) continue;

      const matched = rule.patterns.some((p) => patternMatchesLine(p, line));
      if (matched) {
        warnings.push({
          file: filePath,
          line: i + 1,
          rule: rule.name,
          component: rule.component,
          importPath: rule.importPath,
          hint: rule.hint,
        });
      }
    }
  }

  return warnings;
}

/**
 * Coverage notice: every component name registered in
 * `DS_COMPONENT_NAMES` should appear in `src/app/design-system/`
 * source. Warn-only — the blocking check is check-ds-coverage.ts.
 */
function checkDsPageCoverage(cwd: string, dsComponentNames: string[]): void {
  const dsDir = join(cwd, "src", "app", "design-system");
  let dsContent = "";
  try {
    const dsCatalogue = collectFiles(dsDir);
    for (const f of dsCatalogue) {
      try {
        dsContent += `${readFileSync(f, "utf8")}\n`;
      } catch {
        // Ignore unreadable files — coverage notice is best-effort.
      }
    }
  } catch {
    return;
  }

  if (dsContent.length === 0) return;

  const missing = dsComponentNames.filter((name) => !dsContent.includes(name));
  for (const name of missing) {
    console.warn(
      `WARN ds-page-missing-component: \`${name}\` is registered in the ` +
        `manifest but does not appear in src/app/design-system/. ` +
        `Add it to the catalogue.`,
    );
  }
}

function collectFiles(pathArg: string): string[] {
  let stat: ReturnType<typeof statSync> | undefined;
  try {
    stat = statSync(pathArg);
  } catch {
    return [];
  }
  if (stat.isDirectory()) {
    const files: string[] = [];
    for (const entry of readdirSync(pathArg, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      files.push(...collectFiles(join(pathArg, entry.name)));
    }
    return files;
  }
  return TSX_EXTS.has(extname(pathArg)) ? [pathArg] : [];
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage:");
  console.error("  node scripts/check-design-system.ts src/components/Foo.tsx");
  console.error("  node scripts/check-design-system.ts src/  # full audit");
  process.exit(0);
}

const cwd = process.cwd();
const { DS_COMPONENT_NAMES, DS_RULES } = await loadManifest(cwd);
const files = args.flatMap(collectFiles);

checkDsPageCoverage(cwd, DS_COMPONENT_NAMES);

const allWarnings = files.flatMap((f) => checkFile(f, DS_RULES));

if (allWarnings.length > 0) {
  console.error("\n--- Design System Violations ---\n");

  for (const w of allWarnings) {
    const rel = relative(cwd, w.file) || w.file;
    const hint = w.hint ? ` — ${w.hint}` : "";
    console.error(
      `ERROR ${rel}:${w.line} — raw ${w.rule} detected. ` +
        `Use ${w.component} from ${w.importPath}${hint}`,
    );
  }

  console.error(`\n${allWarnings.length} design system violation(s).`);
  console.error("Commit blocked. Pages must use components — not raw HTML.");
  console.error("Extract the pattern into src/components/ui/ first, then use it.");
  process.exit(1);
}

process.exit(0);

#!/usr/bin/env node
/**
 * check-ds-coverage.ts
 *
 * Fails if any component in src/components/ui/ is not imported in the
 * design system catalogue (src/app/design-system/page.tsx, directly or
 * via a file under src/app/design-system/_sections/).
 *
 * Runs automatically from the pre-commit hook when ui/ files are staged,
 * and from lint-staged on `src/components/ui/*.tsx`. Also runnable
 * standalone:
 *   node scripts/check-ds-coverage.ts
 *
 * Resolves paths from the current working directory so this file is
 * byte-identical in the canon module and in every project it is copied
 * to. Runs under plain `node` (no bun, no tsx).
 *
 * Opt-out: add `// ds-coverage-skip` on the export line in the component
 * file to exclude it (for non-visual utilities, internal primitives).
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const ROOT = process.cwd();
const UI_DIR = join(ROOT, "src", "components", "ui");
const DS_PAGE = join(ROOT, "src", "app", "design-system", "page.tsx");
const DS_SECTIONS_DIR = join(ROOT, "src", "app", "design-system", "_sections");

let uiFiles: string[];
try {
  uiFiles = readdirSync(UI_DIR).filter((f) => extname(f) === ".tsx");
} catch {
  console.error("ERROR: src/components/ui/ not found.");
  process.exit(1);
}

const uiComponents = uiFiles
  .filter((file) => {
    const src = readFileSync(join(UI_DIR, file), "utf8");
    return !src.includes("ds-coverage-skip");
  })
  .map((file) => basename(file, ".tsx"));

let dsPageSrc: string;
try {
  dsPageSrc = readFileSync(DS_PAGE, "utf8");
} catch {
  console.error("");
  console.error("ERROR: Design system page not found at:");
  console.error("  src/app/design-system/page.tsx");
  console.error("");
  console.error("Create the page before committing new components");
  console.error("to src/components/ui/.");
  process.exit(1);
}

const sectionsBySource = new Map<string, string>();
sectionsBySource.set("page.tsx", dsPageSrc);

for (const match of dsPageSrc.matchAll(
  /from\s+["']\.\/_sections\/([^"']+)["']/g,
)) {
  const name = match[1];
  const sectionPath = join(DS_SECTIONS_DIR, `${name}.tsx`);
  try {
    sectionsBySource.set(name, readFileSync(sectionPath, "utf8"));
  } catch {
    // Section file referenced from page.tsx but not on disk — skip.
  }
}

const importedSlugs = new Set<string>();
for (const src of sectionsBySource.values()) {
  for (const match of src.matchAll(
    /from\s+["']@\/components\/ui\/([^"']+)["']/g,
  )) {
    importedSlugs.add((match[1] ?? "").split("/")[0] ?? "");
  }
}

const missing = uiComponents.filter((slug) => !importedSlugs.has(slug));

if (missing.length === 0) {
  console.log("Design system coverage: all components represented.");
  process.exit(0);
}

console.error("");
console.error(
  "ERROR: The following components are missing from the design system page:",
);
console.error("  src/app/design-system/page.tsx");
console.error("");
for (const slug of missing) {
  console.error(`  MISSING ${slug}  ->  src/components/ui/${slug}.tsx`);
}
console.error("");
console.error("Add each missing component to the design system page.");
console.error("");
process.exit(1);

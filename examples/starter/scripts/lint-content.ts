#!/usr/bin/env bun
/**
 * Content model linter — warns about pages and text not in the content system.
 * Runs on Bun, no dependencies. Page and content-file discovery is in content/model.ts.
 *
 * Usage: bun scripts/lint-content.ts [--strict] [--root <dir>]
 *   --strict  exit 1 if any warnings are found
 */
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { discoverPages, keyFor, loadContentModel, scanBareText } from "./content";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const { root, appDir, contentDir, skipRoutes, routeOverrides } = loadContentModel(args);

let warnings = 0;
console.log("Content Lint\n============\n");

if (!existsSync(appDir)) {
  console.error(`App dir not found: ${appDir}`);
  process.exit(2);
}

for (const { route, file } of discoverPages(appDir)) {
  if (skipRoutes.has(route)) continue;
  const key = keyFor(route, routeOverrides);
  const rel = relative(root, file);

  if (!existsSync(join(contentDir, `${key}.json`))) {
    console.log(
      `warn  ${route} → content key "${key}"\n   Missing ${relative(root, contentDir)}/${key}.json\n`,
    );
    warnings++;
  }

  const bare = scanBareText(file);
  if (bare.length > 0) {
    console.log(
      `warn  ${route} (${rel})\n   ${bare.length} bare text string(s) not in content system:`,
    );
    for (const b of bare) console.log(`     line ${b.line}: "${b.text}"`);
    console.log();
    warnings++;
  }
}

console.log(
  warnings === 0 ? "All pages follow the content model.\n" : `${warnings} warning(s) found.\n`,
);
if (strict && warnings > 0) process.exit(1);

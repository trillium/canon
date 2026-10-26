#!/usr/bin/env bun
/**
 * Project profile check — keeps project-profile.json and the scaffold decisions honest.
 *
 * Checks:
 *   1. project-profile.json classifies every module with a valid status and a reason.
 *   2. Tailwind CSS v4 is installed and wired (package.json, postcss config, globals.css).
 *   3. Every design-system preset is enabled in manifest.config.ts, so raw HTML stays banned
 *      outside components/ui.
 *   4. .env.example holds placeholders only (empty values or URLs), never a secret.
 *   5. scripts/ holds only .ts and .sh files (see scripts/README.md).
 *   6. The visual, e2e and accessibility workflows run in the Playwright image that matches the
 *      pinned @playwright/test version, so baselines stay stable and no browser install is needed.
 *   7. Every page route has a visual test in e2e/visual.spec.ts.
 *
 * Usage: bun scripts/check-project-profile.ts [--root <dir>]
 *   Exit 1 on any violation.
 */
import { existsSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { discoverPages } from "./content";
import { walk } from "./shared/fs";

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = resolve(rootIdx >= 0 ? argv[rootIdx + 1] : process.cwd());

const PROFILE_MODULES = [
  "agent-guardrails",
  "analytics",
  "auth",
  "ci",
  "content-acceptance",
  "design-system",
  "email",
  "errors",
  "feedtack",
  "hooks",
  "linting",
  "migration-allocator",
  "spellcheck",
  "styling",
  "testing",
  "theming",
];
const STATUSES = ["conformant", "partial", "missing", "not-applicable"];

interface ProfileEntry {
  status: string;
  reason?: unknown;
}

const errors: string[] = [];

function read(name: string): string | null {
  const file = join(root, name);
  if (!existsSync(file)) {
    errors.push(`${name}: not found`);
    return null;
  }
  return readFileSync(file, "utf-8");
}

// 1. Profile
const profileText = read("project-profile.json");
if (profileText) {
  let modules: Record<string, ProfileEntry | undefined> = {};
  try {
    modules = JSON.parse(profileText).modules ?? {};
  } catch (e) {
    errors.push(`project-profile.json: invalid JSON (${(e as Error).message})`);
  }
  for (const name of PROFILE_MODULES) {
    const entry = modules[name];
    if (!entry) errors.push(`project-profile.json: module "${name}" is not classified`);
    else if (!STATUSES.includes(entry.status))
      errors.push(`project-profile.json: module "${name}" has invalid status "${entry.status}"`);
    else if (typeof entry.reason !== "string" || entry.reason.trim() === "")
      errors.push(`project-profile.json: module "${name}" has no reason`);
  }
  for (const name of Object.keys(modules)) {
    if (!PROFILE_MODULES.includes(name))
      errors.push(`project-profile.json: unknown module "${name}"`);
  }
  if (errors.length === 0) {
    console.log("Project profile");
    for (const name of PROFILE_MODULES)
      console.log(`  ${modules[name]?.status.padEnd(15)} ${name}`);
  }
}

// 2. Tailwind v4
const pkgText = read("package.json");
if (pkgText) {
  const pkg = JSON.parse(pkgText);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const tailwind = deps.tailwindcss ?? "";
  if (!/^[\^~]?4\./.test(tailwind))
    errors.push(`package.json: tailwindcss must be v4 (found "${tailwind || "none"}")`);
  if (!deps["@tailwindcss/postcss"]) errors.push("package.json: @tailwindcss/postcss is missing");
}
const postcss = read("postcss.config.mjs");
if (postcss && !postcss.includes("@tailwindcss/postcss"))
  errors.push("postcss.config.mjs: must use @tailwindcss/postcss");
const globals = read("src/app/globals.css");
if (globals && !/@import\s+["']tailwindcss["']/.test(globals))
  errors.push('src/app/globals.css: must start from @import "tailwindcss"');

// 3. Raw HTML ban: every preset enabled
const manifest = read("src/components/ui/manifest.ts");
const config = read("src/components/ui/manifest.config.ts");
if (manifest && config) {
  const defs = manifest.slice(manifest.indexOf("const PRESET_DEFS"));
  const presets = [...defs.matchAll(/^ {2}"(raw-[a-z]+)": \{/gm)].map((m) => m[1]);
  const enabledBlock = config.match(/ENABLED_RULES[^=]*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const enabled = [...enabledBlock.matchAll(/"(raw-[a-z]+)"/g)].map((m) => m[1]);
  if (presets.length === 0) errors.push("manifest.ts: no design-system presets found");
  for (const preset of presets) {
    if (!enabled.includes(preset))
      errors.push(`manifest.config.ts: preset "${preset}" is not enabled in ENABLED_RULES`);
  }
}

// 4. Env example: placeholders only
const env = read(".env.example");
if (env) {
  for (const [i, line] of env.split("\n").entries()) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const value = m[2].trim();
    if (value !== "" && !/^https?:\/\/[^\s]*$/.test(value))
      errors.push(`.env.example:${i + 1}: ${m[1]} must be empty or a URL placeholder, not a value`);
  }
}

// 5. Scripts are TypeScript (or shell wrappers)
const scriptsDir = join(root, "scripts");
if (existsSync(scriptsDir)) {
  for (const file of walk(scriptsDir)) {
    const ext = extname(file);
    if (ext !== ".ts" && ext !== ".sh" && !file.endsWith("README.md"))
      errors.push(
        `${relative(root, file)}: scripts must be .ts (or .sh where a shell script is simpler)`,
      );
  }
}

// 6. Playwright jobs run in the image that matches the pinned version (stable baselines, no install)
const PLAYWRIGHT_WORKFLOWS = ["visual", "e2e", "accessibility"];
if (pkgText) {
  const pinned = JSON.parse(pkgText).devDependencies?.["@playwright/test"] ?? "";
  if (!/^\d+\.\d+\.\d+$/.test(pinned))
    errors.push(`package.json: @playwright/test must be an exact version (found "${pinned}")`);
  for (const name of PLAYWRIGHT_WORKFLOWS) {
    const workflow = `.github/workflows/${name}.yml`;
    const text = read(workflow);
    const image = text?.match(/image:\s*mcr\.microsoft\.com\/playwright:v([\w.]+)-/)?.[1];
    if (text && image !== pinned)
      errors.push(
        `${workflow}: Playwright image v${image ?? "?"} must match @playwright/test ${pinned}`,
      );
  }
}

// 7. Every page route has a visual test
const appDir = join(root, "src/app");
if (existsSync(appDir)) {
  const spec = read("e2e/visual.spec.ts");
  if (spec) {
    for (const { route } of discoverPages(appDir)) {
      if (!spec.includes(`path: "${route}"`))
        errors.push(`e2e/visual.spec.ts: no visual test for the ${route} page (add it to PAGES)`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  console.error(`\ncheck-project-profile: ${errors.length} violation(s)`);
  process.exit(1);
}
console.log("check-project-profile: OK");

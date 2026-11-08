/** Where the checker looks: the repository root, the UI directory and which files to skip. */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const UI_DIR_CANDIDATES = ["src/components/ui", "components/ui"];
const WALK_SKIP_ANYWHERE = new Set(["node_modules", ".next", ".git"]);
const WALK_SKIP_TOP_LEVEL = new Set([
  ".vercel",
  "dist",
  "build",
  "coverage",
  "public",
  "supabase",
  "e2e",
  "scripts",
]);

export function findUiDir(): string | null {
  const candidates = process.env.DS_UI_DIR ? [process.env.DS_UI_DIR] : UI_DIR_CANDIDATES;
  for (const candidate of candidates) {
    const abs = resolve(ROOT, candidate);
    if (existsSync(join(abs, "manifest.ts"))) return abs;
  }
  return null;
}

export function isJsxFile(file: string): boolean {
  return /\.(tsx|jsx)$/.test(file);
}

export function shouldSkipPath(abs: string, uiDir: string): boolean {
  const rel = relative(ROOT, abs).split(sep).join("/");
  if (rel.startsWith("..")) return true;
  if (abs.startsWith(uiDir + sep)) return true;
  if (/(^|\/)(node_modules|\.next|__tests__)\//.test(rel)) return true;
  if (/^(scripts|e2e)\//.test(rel)) return true;
  return /\.(test|spec)\.(tsx|jsx)$/.test(rel);
}

export function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (WALK_SKIP_ANYWHERE.has(entry)) continue;
    if (dir === ROOT && WALK_SKIP_TOP_LEVEL.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (stat.isFile()) out.push(full);
  }
}

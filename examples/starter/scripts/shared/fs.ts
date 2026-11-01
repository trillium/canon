import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every file under `dir`, recursively, skipping directories named in `ignore`. */
export function walk(dir: string, ignore: ReadonlySet<string> = new Set()): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path, ignore));
    else out.push(path);
  }
  return out;
}

/** Which lines of a file are added in the staged git diff. */
import { execFileSync } from "node:child_process";

export function getStagedLineNumbers(file: string): Set<number> | null {
  try {
    const diff = execFileSync("git", ["diff", "--cached", "-U0", "--", file], {
      encoding: "utf8",
    });
    const added = new Set<number>();
    let cur = 0;
    for (const line of diff.split("\n")) {
      const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        cur = Number.parseInt(m[1], 10) - 1;
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        cur++;
        added.add(cur);
      }
    }
    return added.size > 0 ? added : null;
  } catch {
    return null;
  }
}

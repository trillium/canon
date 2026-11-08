import { readFileSync } from "node:fs";

export interface BareText {
  line: number;
  text: string;
}

/** JSX text between > and <, outside data-content / data-content-skip regions. */
export function scanBareText(file: string): BareText[] {
  const lines = readFileSync(file, "utf-8").split("\n");
  const found: BareText[] = [];
  let inMetadata = false;
  let skipDepth = 0;
  for (const [i, line] of lines.entries()) {
    if (/export\s+const\s+metadata/.test(line)) inMetadata = true;
    if (inMetadata) {
      if (line.includes("}")) inMetadata = false;
      continue;
    }
    if (line.includes("data-content-skip")) skipDepth++;
    if (skipDepth > 0) continue;
    if (line.includes("data-content=")) continue;
    for (const m of line.matchAll(/>([^<>{]+)</g)) {
      const text = (m[1] ?? "").trim();
      if (text.length <= 2) continue;
      if (/^[→←↑↓▾▸•·×&\\]/.test(text)) continue;
      if (/^&\w+;$/.test(text)) continue;
      found.push({ line: i + 1, text: text.slice(0, 60) });
    }
  }
  return found;
}

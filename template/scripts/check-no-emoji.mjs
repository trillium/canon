#!/usr/bin/env node

/**
 * Emoji guard — prevents raw emoji from landing in source files.
 *
 * Raw emoji render inconsistently across platforms. Use lucide-react
 * (or react-icons) SVG icons instead for deterministic rendering.
 *
 * Usage:  node scripts/check-no-emoji.mjs file1.ts file2.tsx ...
 * lint-staged passes the staged file list as positional args.
 */

import { readFileSync } from "node:fs";

// Matches most emoji: emoticons, dingbats, symbols, flags, skin-tone modifiers
const EMOJI_RE =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/u;

const files = process.argv.slice(2);
let failed = false;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (EMOJI_RE.test(lines[i])) {
      console.error(`${file}:${i + 1}: raw emoji detected — use lucide-react icons instead`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("\nEmoji guard: replace raw emoji with lucide-react SVG icons.");
  process.exit(1);
}

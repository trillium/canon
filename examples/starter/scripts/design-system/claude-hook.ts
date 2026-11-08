/**
 * The Claude Code PreToolUse hook mode: reads the pending Write/Edit from stdin and rejects it
 * (exit 2) when the new text introduces a raw tag. Existing lines are not flagged.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkSource } from "./check-source";
import { hasFileOptOut } from "./directives";
import { isJsxFile, ROOT, shouldSkipPath } from "./paths";
import { report } from "./report";
import type { DsRule, HookPayload } from "./types";

export function runClaudeHook(rules: DsRule[], uiDir: string): never {
  let payload: HookPayload;
  try {
    payload = JSON.parse(readFileSync(0, "utf8")) as HookPayload;
  } catch {
    process.exit(0);
  }
  const input = payload.tool_input ?? {};
  if (typeof input.file_path !== "string") process.exit(0);
  const abs = resolve(payload.cwd ?? ROOT, input.file_path);
  if (!isJsxFile(abs) || shouldSkipPath(abs, uiDir)) process.exit(0);

  const onDisk = existsSync(abs) ? readFileSync(abs, "utf8") : "";
  const chunks: { text: string; before: string }[] = [];
  if (typeof input.content === "string") chunks.push({ text: input.content, before: onDisk });
  if (typeof input.new_string === "string") {
    chunks.push({ text: input.new_string, before: input.old_string ?? "" });
  }
  for (const edit of input.edits ?? []) {
    if (typeof edit.new_string === "string") {
      chunks.push({ text: edit.new_string, before: edit.old_string ?? "" });
    }
  }

  const findings = chunks.flatMap((chunk) =>
    checkSource(abs, chunk.text, rules, {
      baseline: new Set(chunk.before.split("\n").map((l) => l.trim())),
      fileIgnored: hasFileOptOut(onDisk) || hasFileOptOut(chunk.text),
    }),
  );
  if (findings.length === 0) process.exit(0);
  report(findings, payload.cwd ?? ROOT);
  process.exit(2);
}

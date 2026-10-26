// @vitest-environment node
/**
 * Proves the API message guard rejects inline response text and accepts messages read from a content
 * file, dynamic values and non-message properties.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/check-api-messages.ts");

let root: string;

function run(name: string, source: string) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, source);
  const r = spawnSync("bun", [script, "--root", root, name], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "api-messages-"));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("check-api-messages", () => {
  it("rejects an inline error string", () => {
    const r = run(
      "src/app/api/a/route.ts",
      'export const f = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });\n',
    );
    expect(r.code).toBe(1);
    expect(r.out).toContain('inline response message: "Forbidden"');
  });

  it("rejects an inline template message", () => {
    const r = run(
      "src/app/api/b/route.ts",
      "export const f = (p: string) => Response.json({ message: `Not found: ${p}` });\n",
    );
    expect(r.code).toBe(1);
  });

  it("checks routes under a directory named content", () => {
    const r = run(
      "src/app/api/content/x/route.ts",
      'export const f = () => NextResponse.json({ error: "Provide {path}" }, { status: 400 });\n',
    );
    expect(r.code).toBe(1);
  });

  it("skips the src/content directory", () => {
    const r = run(
      "src/content/x.ts",
      'export const f = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });\n',
    );
    expect(r.code).toBe(0);
  });

  it("accepts text read from a content file, upstream errors and data fields", () => {
    const r = run(
      "src/app/api/c/route.ts",
      [
        "export const f = (err: Error) => [",
        "  NextResponse.json({ error: api.forbidden }, { status: 403 }),",
        "  NextResponse.json({ error: err.message }, { status: 500 }),",
        '  NextResponse.json({ ok: true, field: "x" }),',
        "];",
        "",
      ].join("\n"),
    );
    expect(r.code).toBe(0);
  });
});

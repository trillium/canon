// @vitest-environment node
/**
 * Proves the file length guard rejects a source file over 250 lines and accepts one at the limit,
 * a test file of any length, and a file named in the allowlist.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/check-file-length.ts");

let root: string;

function put(name: string, lineCount: number) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "const x = 1;\n".repeat(lineCount));
}

function run(...files: string[]) {
  const r = spawnSync("bun", [script, "--root", root, ...files], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "file-length-"));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("check-file-length", () => {
  it("accepts a file at the limit", () => {
    put("src/at-limit.ts", 250);
    expect(run("src/at-limit.ts").code).toBe(0);
  });

  it("rejects a file over the limit and names it", () => {
    put("src/too-long.ts", 251);
    const r = run("src/too-long.ts");
    expect(r.code).toBe(1);
    expect(r.out).toContain("src/too-long.ts: 251 lines");
  });

  it("counts the last line of a file without a trailing newline", () => {
    const file = join(root, "scripts/no-newline.sh");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${"echo x\n".repeat(250)}echo x`);
    const r = run("scripts/no-newline.sh");
    expect(r.code).toBe(1);
    expect(r.out).toContain("scripts/no-newline.sh: 251 lines");
  });

  it("rejects a long file with deprecated in its name", () => {
    put("src/lib/deprecatedHelpers.ts", 251);
    expect(run("src/lib/deprecatedHelpers.ts").code).toBe(1);
  });

  it("exempts test files", () => {
    put("src/big.test.ts", 400);
    expect(run("src/big.test.ts").code).toBe(0);
  });

  it("exempts files named in the allowlist", () => {
    put("src/generated/api.ts", 400);
    mkdirSync(join(root, ".husky"), { recursive: true });
    writeFileSync(join(root, ".husky/large-files-allowlist.txt"), "# generated\nsrc/generated/*\n");
    expect(run("src/generated/api.ts").code).toBe(0);
  });
});

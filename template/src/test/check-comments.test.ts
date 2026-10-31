// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  compareToBaseline,
  isAllowedComment,
  nextBaseline,
  scanScript,
  scanSql,
} from "../../scripts/check-comments";

describe("scanScript", () => {
  it("finds line, block and trailing comments", () => {
    const source = "const a = 1; // trailing\n/* block */\n/** doc */\nexport const b = 2;\n";
    expect(scanScript(source).map((h) => h.line)).toEqual([1, 2, 3]);
  });

  it("ignores comment markers inside strings, templates, regexes and JSX text", () => {
    const source = [
      'const a = "// not a comment";',
      "const b = `/* nor this */`;",
      "const c = /\\/\\/x/;",
      "const d = <p>see // here</p>;",
      "const e = 'http://x.test';",
    ].join("\n");
    expect(scanScript(source, "file.tsx")).toEqual([]);
  });

  it("finds a comment inside a JSX expression", () => {
    const source = "export const a = <div>{/* why */}</div>;\n";
    expect(scanScript(source, "file.tsx")).toHaveLength(1);
  });

  it("allows tool directives", () => {
    const source = [
      "// @vitest-environment node",
      "// biome-ignore lint/suspicious/noExplicitAny: legacy",
      "// eslint-disable-next-line no-console",
      "// @ts-expect-error the fixture is wrong on purpose",
      '/// <reference types="node" />',
      "export const a = 1;",
    ].join("\n");
    expect(scanScript(source)).toEqual([]);
  });

  it("allows license headers", () => {
    const source = "/*! MIT */\n/* Copyright 2026 Someone */\nexport const a = 1;\n";
    expect(scanScript(source)).toEqual([]);
  });

  it("allows comments citing an RFC number or a URL, and nothing else", () => {
    const source = [
      "// per RFC 9110 section 15",
      "// see https://example.test/spec",
      "// increment the counter",
      "export const a = 1;",
    ].join("\n");
    expect(scanScript(source).map((h) => h.text)).toEqual(["// increment the counter"]);
  });

  it("does not treat a shebang as a comment", () => {
    expect(scanScript("#!/usr/bin/env bun\nexport const a = 1;\n")).toEqual([]);
  });
});

describe("scanSql", () => {
  it("finds line and block comments but not markers inside strings", () => {
    const source = "select '-- no', \"/* no */\", $$ -- no $$;\n-- yes\n/* yes */\n";
    expect(scanSql(source).map((h) => h.line)).toEqual([2, 3]);
  });

  it("allows a header naming a ticket or spec, and comment on statements", () => {
    const source = [
      "-- ABC-123 add the table (spec: tables.md)",
      "create table t (id int);",
      "comment on table t is 'what it holds';",
    ].join("\n");
    expect(scanSql(source)).toEqual([]);
  });

  it("rejects a ticket-less comment, and a ticket comment after the header", () => {
    const source = "-- adds a table\ncreate table t (id int);\n-- ABC-123\n";
    expect(scanSql(source).map((h) => h.line)).toEqual([1, 3]);
  });
});

describe("isAllowedComment", () => {
  it("rejects plain prose", () => {
    expect(isAllowedComment("// TODO fix later")).toBe(false);
  });
});

describe("baseline", () => {
  it("fails when a count grows or a new file appears", () => {
    const { errors } = compareToBaseline({ "a.ts": 3, "b.ts": 1 }, { files: { "a.ts": 2 } });
    expect(errors).toHaveLength(2);
  });

  it("passes at the baseline and reports a shrink as stale", () => {
    const result = compareToBaseline({ "a.ts": 1 }, { files: { "a.ts": 2, "gone.ts": 1 } });
    expect(result.errors).toEqual([]);
    expect(result.stale).toHaveLength(2);
  });

  it("writes a shrunken baseline and refuses to grow one", () => {
    expect(nextBaseline({ "a.ts": 1 }, { files: { "a.ts": 2, "b.ts": 1 } })).toEqual({
      files: { "a.ts": 1 },
    });
    expect(() => nextBaseline({ "a.ts": 3 }, { files: { "a.ts": 2 } })).toThrow(/only shrink/);
    expect(() => nextBaseline({ "c.ts": 1 }, { files: {} })).toThrow(/only shrink/);
  });

  it("creates a baseline when none exists", () => {
    expect(nextBaseline({ "a.ts": 2 }, null)).toEqual({ files: { "a.ts": 2 } });
  });
});

describe("cli", () => {
  const script = resolve(process.cwd(), "scripts/check-comments.ts");
  let root: string;

  function put(name: string, text: string) {
    const file = join(root, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }

  function run(...args: string[]) {
    return spawnSync("bun", [script, "--root", root, ...args], { encoding: "utf-8" });
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "check-comments-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("passes a clean tree and fails a new comment", () => {
    put("src/a.ts", "export const a = 1;\n");
    expect(run().status).toBe(0);
    put("src/a.ts", "// why\nexport const a = 1;\n");
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("src/a.ts:1");
  });

  it("ratchets: baseline admits existing comments, then only shrinks", () => {
    put("src/a.ts", "// one\n// two\nexport const a = 1;\n");
    expect(run("--baseline").status).toBe(0);
    expect(run().status).toBe(0);
    put("src/a.ts", "// one\nexport const a = 1;\n");
    expect(run().status).toBe(1);
    expect(run("--baseline").status).toBe(0);
    expect(run().status).toBe(0);
    expect(JSON.parse(readFileSync(join(root, ".no-comments-baseline.json"), "utf-8"))).toEqual({
      files: { "src/a.ts": 1 },
    });
    put("src/a.ts", "// one\n// two\nexport const a = 1;\n");
    expect(run().status).toBe(1);
    expect(run("--baseline").status).toBe(1);
  });

  it("honours exclude globs", () => {
    put("no-comments.config.json", JSON.stringify({ exclude: ["src/vendored/**"] }));
    put("src/vendored/a.ts", "// vendored\n");
    expect(run().status).toBe(0);
  });
});

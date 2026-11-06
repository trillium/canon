// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  compareToBaseline,
  isInSeam,
  nextBaseline,
  scanImports,
} from "../../scripts/check-data-seam";

const PACKAGES = ["@supabase/supabase-js", "@supabase/ssr"];

describe("scanImports", () => {
  it("finds static, type, re-export, dynamic and require imports", () => {
    const source = [
      'import { createClient } from "@supabase/supabase-js";',
      'import type { SupabaseClient } from "@supabase/supabase-js";',
      'export { createServerClient } from "@supabase/ssr";',
      'const lazy = await import("@supabase/ssr");',
      'const old = require("@supabase/supabase-js");',
    ].join("\n");
    expect(scanImports(source, PACKAGES).map((h) => h.line)).toEqual([1, 2, 3, 4, 5]);
  });

  it("matches subpaths but not look-alike packages or strings", () => {
    const source = [
      'import x from "@supabase/ssr/helpers";',
      'import y from "@supabase/supabase-js-extra";',
      'const s = "@supabase/supabase-js";',
    ].join("\n");
    expect(scanImports(source, PACKAGES).map((h) => h.specifier)).toEqual([
      "@supabase/ssr/helpers",
    ]);
  });

  it("ignores imports of the seam itself", () => {
    expect(scanImports('import { getDb } from "@/lib/supabase/server";', PACKAGES)).toEqual([]);
  });
});

describe("isInSeam", () => {
  it("matches the folder and its children only", () => {
    expect(isInSeam("src/lib/supabase/server.ts", "src/lib/supabase")).toBe(true);
    expect(isInSeam("src/lib/supabase-extra/a.ts", "src/lib/supabase")).toBe(false);
    expect(isInSeam("src/lib/supabase/a.ts", "src/lib/supabase/")).toBe(true);
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
  const script = resolve(process.cwd(), "scripts/check-data-seam.ts");
  const importClient = 'import { createClient } from "@supabase/supabase-js";\n';
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
    root = mkdtempSync(join(tmpdir(), "check-data-seam-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("allows the seam folder and fails an import anywhere else", () => {
    put("src/lib/supabase/server.ts", importClient);
    expect(run().status).toBe(0);
    put("src/app/page.ts", importClient);
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("src/app/page.ts:1");
  });

  it("ratchets: baseline admits existing imports, then only shrinks", () => {
    put("src/a.ts", `${importClient}${importClient}`);
    expect(run("--baseline").status).toBe(0);
    expect(run().status).toBe(0);
    put("src/a.ts", importClient);
    expect(run().status).toBe(1);
    expect(run("--baseline").status).toBe(0);
    expect(run().status).toBe(0);
    expect(JSON.parse(readFileSync(join(root, ".data-seam-baseline.json"), "utf-8"))).toEqual({
      files: { "src/a.ts": 1 },
    });
    put("src/a.ts", `${importClient}${importClient}`);
    expect(run().status).toBe(1);
    expect(run("--baseline").status).toBe(1);
  });

  it("honours a custom seam and exclude globs", () => {
    put("data-seam.config.json", JSON.stringify({ seam: "src/db", exclude: ["src/vendored/**"] }));
    put("src/db/index.ts", importClient);
    put("src/vendored/a.ts", importClient);
    expect(run().status).toBe(0);
    put("src/lib/supabase/server.ts", importClient);
    expect(run().status).toBe(1);
  });
});

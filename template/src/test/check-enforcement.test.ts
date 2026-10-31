// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/check-enforcement.mjs");

let root: string;

function put(name: string, text: string) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function table(...rows: string[]) {
  return ["| Rule | Kind | Enforcer | Exception |", "|---|---|---|---|", ...rows].join("\n");
}

function check(...args: string[]) {
  return spawnSync("node", [script, "--root", root, "--today", "2026-10-24", ...args], {
    encoding: "utf-8",
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "check-enforcement-"));
  put("CLAUDE.md", "@ENFORCEMENT.md\n");
  put("scripts/guard.mjs", "");
  put("package.json", JSON.stringify({ scripts: { lint: "biome check ." } }));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("check-enforcement: passes", () => {
  it("when every rule names an enforcer that exists", () => {
    put(
      "ENFORCEMENT.md",
      table(
        "| No foo | hook | `scripts/guard.mjs` | - |",
        "| Lint is clean | ci | `pnpm run lint` | - |",
      ),
    );
    const res = check();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("2 rule(s), 0 defect(s)");
  });

  it("on a dated exception, and lists it as a defect", () => {
    put("ENFORCEMENT.md", table("| Be kind | convention | - | 2026-12-31 no check possible yet |"));
    const res = check();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("defect:");
  });

  it("reads every table in the file", () => {
    put(
      "ENFORCEMENT.md",
      `${table("| A | hook | `scripts/guard.mjs` | - |")}\n\n## More\n\n${table("| B | hook | `scripts/missing.mjs` | - |")}`,
    );
    const res = check();
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("scripts/missing.mjs");
  });
});

describe("check-enforcement: fails", () => {
  const bad: Record<string, string> = {
    "a convention rule with no exception": "| Be kind | convention | - | - |",
    "a review rule with no expiry date": "| Be kind | review | - | someday |",
    "an expired exception": "| Be kind | audit | - | 2026-01-01 was temporary |",
    "an enforcer file that does not exist": "| No foo | hook | `scripts/missing.mjs` | - |",
    "a pnpm script that does not exist": "| Lint | ci | `pnpm run nope` | - |",
    "a mechanical rule that names no file": "| No foo | lint | biome | - |",
    "an unknown kind": "| No foo | vibes | `scripts/guard.mjs` | - |",
  };

  for (const [name, row] of Object.entries(bad)) {
    it(name, () => {
      put("ENFORCEMENT.md", table(row));
      const res = check();
      expect(res.status).toBe(1);
      expect(res.stderr).toContain("ENFORCEMENT.md:3");
    });
  }

  it("when ENFORCEMENT.md is missing", () => {
    expect(check().status).toBe(1);
  });

  it("when there is no agent instruction file", () => {
    put("ENFORCEMENT.md", table("| No foo | hook | `scripts/guard.mjs` | - |"));
    rmSync(join(root, "CLAUDE.md"));
    const res = check();
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("CLAUDE.md or AGENTS.md");
    expect(check("--table-only").status).toBe(0);
  });

  it("when the instruction file does not point at the table", () => {
    put("ENFORCEMENT.md", table("| No foo | hook | `scripts/guard.mjs` | - |"));
    put("CLAUDE.md", "be good\n");
    expect(check().stderr).toContain("does not reference ENFORCEMENT.md");
  });
});

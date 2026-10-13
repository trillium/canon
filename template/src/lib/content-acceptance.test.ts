import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectFields, STRUCTURAL_KEYS } from "./content-acceptance";

const script = resolve(process.cwd(), "scripts/content-acceptance.mjs");

let root: string;

function run(args: string[], env: Record<string, string> = {}) {
  const base = { ...process.env };
  delete base.CI;
  delete base.CLAUDECODE;
  delete base.AGENT;
  delete base.CONTENT_ACCEPTANCE_GATE;
  return spawnSync("node", [script, ...args, "--root", root], {
    encoding: "utf-8",
    env: { ...base, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writePage(name: string, content: unknown) {
  writeFileSync(join(root, "content", `${name}.json`), JSON.stringify(content));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "content-acceptance-"));
  mkdirSync(join(root, "content"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("sidecar gate", () => {
  beforeEach(() => writePage("home", { hero: { heading: "Hello" } }));

  it("warns and exits 0 by default when fields are unaccepted", () => {
    const res = run(["gate"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("home.hero.heading");
  });

  it("exits 1 with --hard", () => {
    expect(run(["gate", "--hard"]).status).toBe(1);
  });

  it("exits 1 when CONTENT_ACCEPTANCE_GATE=hard", () => {
    expect(run(["gate"], { CONTENT_ACCEPTANCE_GATE: "hard" }).status).toBe(1);
  });

  it("exits 0 under --hard once everything is accepted", () => {
    writeFileSync(
      join(root, "content", ".accepted.json"),
      JSON.stringify({
        "home.hero.heading": { hash: "185f8db32271", by: ["a@example.com"], at: "x" },
      }),
    );
    expect(run(["gate", "--hard"]).status).toBe(0);
  });
});

describe("sidecar accept guard", () => {
  beforeEach(() => writePage("home", { hero: { heading: "Hello" } }));

  it("refuses without an interactive terminal", () => {
    const res = run(["accept", "--all"]);
    expect(res.status).toBe(3);
    expect(run(["status", "--json"]).stdout).toContain('"totalUnaccepted": 1');
  });

  for (const name of ["CI", "CLAUDECODE", "AGENT"]) {
    it(`refuses when ${name} is set`, () => {
      const res = run(["accept", "home.hero.heading"], { [name]: "1" });
      expect(res.status).toBe(3);
      expect(run(["status", "--json"]).stdout).toContain('"totalUnaccepted": 1');
    });
  }
});

describe("sidecar structural keys", () => {
  it("skips the same keys as lib/content-acceptance.ts", () => {
    const probes = [...STRUCTURAL_KEYS, "title", "description", "label", "name", "url", "slug"];
    const page: Record<string, string> = {};
    for (const key of probes) page[key] = `value of ${key}`;
    writePage("probe", page);

    const expected: Record<string, string> = {};
    collectFields(page, "probe", expected);

    const res = run(["status", "--json"]);
    expect(res.status).toBe(0);
    const { unaccepted_fields } = JSON.parse(res.stdout) as { unaccepted_fields: string[] };
    expect([...unaccepted_fields].sort()).toEqual(Object.keys(expected).sort());
  });
});

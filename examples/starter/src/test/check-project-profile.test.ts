// @vitest-environment node
/**
 * Proves the project profile check passes on this repo and fails on an unreasoned classification,
 * a Tailwind v3 install, a disabled design-system preset and a secret in .env.example.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repo = process.cwd();
const script = resolve(repo, "scripts/check-project-profile.ts");
const FILES = [
  "project-profile.json",
  "package.json",
  "postcss.config.mjs",
  ".env.example",
  ".github/workflows/visual.yml",
  ".github/workflows/e2e.yml",
  ".github/workflows/accessibility.yml",
  "src/app/globals.css",
  "src/components/ui/manifest.ts",
  "src/components/ui/manifest.config.ts",
];

let root: string;

function run(rootDir = root) {
  const r = spawnSync("bun", [script, "--root", rootDir], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function edit(name: string, fn: (text: string) => string) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, fn(readFileSync(file, "utf8")));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "project-profile-"));
  for (const name of FILES) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    cpSync(join(repo, name), join(root, name));
  }
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("check-project-profile", () => {
  it("passes on this repo", () => {
    expect(run(repo).code).toBe(0);
  });

  it("fails when a module has no reason", () => {
    edit("project-profile.json", (t) => t.replace(/("linting": \{[^}]*"reason": )"[^"]*"/, '$1""'));
    const r = run();
    expect(r.code).toBe(1);
    expect(r.out).toContain('module "linting" has no reason');
  });

  it("fails when tailwindcss is not v4", () => {
    edit("package.json", (t) => t.replace(/"tailwindcss": "[^"]*"/, '"tailwindcss": "^3.4.0"'));
    expect(run().out).toContain("tailwindcss must be v4");
  });

  it("fails when a design-system preset is not enabled", () => {
    edit("src/components/ui/manifest.config.ts", (t) => t.replace('  "raw-div",\n', ""));
    expect(run().out).toContain('preset "raw-div" is not enabled');
  });

  it("fails when scripts holds a .mjs file", () => {
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(join(root, "scripts/legacy.mjs"), "");
    expect(run().out).toContain("scripts/legacy.mjs: scripts must be .ts");
  });

  it.each(["visual", "e2e", "accessibility"])(
    "fails when the %s workflow image does not match the Playwright version",
    (name) => {
      edit(`.github/workflows/${name}.yml`, (t) =>
        t.replace(/playwright:v[\d.]+-/, "playwright:v1.0.0-"),
      );
      expect(run().out).toContain(
        `${name}.yml: Playwright image v1.0.0 must match @playwright/test`,
      );
    },
  );

  it("fails when @playwright/test is not an exact version", () => {
    edit("package.json", (t) =>
      t.replace(/"@playwright\/test": "[^"]*"/, '"@playwright/test": "^1.64.0"'),
    );
    expect(run().out).toContain("@playwright/test must be an exact version");
  });

  it("fails when a page has no visual test", () => {
    mkdirSync(join(root, "src/app/pricing"), { recursive: true });
    writeFileSync(join(root, "src/app/pricing/page.tsx"), "");
    mkdirSync(join(root, "e2e"), { recursive: true });
    writeFileSync(join(root, "e2e/visual.spec.ts"), 'const PAGES = [{ name: "home", path: "/" }];');
    writeFileSync(join(root, "src/app/page.tsx"), "");
    expect(run().out).toContain("no visual test for the /pricing page");
  });

  it("fails when .env.example holds a value", () => {
    edit(".env.example", (t) => `${t}\nRESEND_API_KEY=re_live_abc123\n`);
    expect(run().out).toContain("RESEND_API_KEY must be empty or a URL placeholder");
  });
});

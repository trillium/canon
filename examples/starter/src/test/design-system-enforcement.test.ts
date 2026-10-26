// @vitest-environment node
/**
 * Proves the design-system gates BLOCK, in a throwaway git repo wired the same way a real
 * project is: lint-staged in the pre-commit hook, a full sweep in the pre-push hook.
 *
 *   - a commit that introduces a raw <div> is rejected and creates no commit
 *   - the same markup inside components/ui, or via a design-system component, is accepted
 *   - `git commit --no-verify` gets past pre-commit, but the sweep (pre-push and CI) still fails
 *   - a push of a raw <div> is rejected by pre-push
 *
 * Needs `git` and `bun` on PATH (CI installs bun via oven-sh/setup-bun).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PROJECT = process.cwd();
const LINT_STAGED = join(PROJECT, "node_modules/lint-staged/bin/lint-staged.js");
const COPIED_FILES = [
  "scripts/check-design-system.ts",
  "scripts/lib/ds-check.ts",
  "src/components/ui/manifest.ts",
  "src/components/ui/manifest.config.ts",
];

let repo = "";
let remote = "";

function cleanEnv(): NodeJS.ProcessEnv {
  // Hooks and the agent harness export GIT_* variables that would redirect git to another repo.
  const entries = Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"));
  return Object.fromEntries(entries) as NodeJS.ProcessEnv;
}

function run(cmd: string, args: string[], cwd = repo) {
  const result = spawnSync(cmd, args, { cwd, env: cleanEnv(), encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function git(...args: string[]) {
  return run("git", [
    "-c",
    `core.hooksPath=${join(repo, ".git/hooks")}`,
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@example.com",
    "-c",
    "commit.gpgsign=false",
    ...args,
  ]);
}

function write(path: string, content: string) {
  const abs = join(repo, path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function installHook(name: string, body: string) {
  const path = join(repo, ".git/hooks", name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

function commitCount(): number {
  const { status, output } = git("rev-list", "--count", "HEAD");
  return status === 0 ? Number(output.trim()) : 0;
}

const RAW_DIV = "export const A = () => <div>hello</div>;\n";

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "ds-enforcement-"));
  remote = mkdtempSync(join(tmpdir(), "ds-enforcement-remote-"));
  for (const file of COPIED_FILES) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    copyFileSync(resolve(PROJECT, file), join(repo, file));
  }
  // Fixture project config: enforce the raw-div rule.
  write(
    "src/components/ui/manifest.config.ts",
    [
      'import type { DsPresetName, DsPresetOverride, DsRule } from "./manifest";',
      'export const ENABLED_RULES: DsPresetName[] = ["raw-div"];',
      "export const PRESET_OVERRIDES: Partial<Record<DsPresetName, DsPresetOverride>> = {};",
      "export const CUSTOM_RULES: DsRule[] = [];",
      "",
    ].join("\n"),
  );
  write(
    ".lintstagedrc.json",
    '{"*.{jsx,tsx}":"bun scripts/check-design-system.ts --staged-only"}\n',
  );
  expect(run("git", ["init", "-q", "-b", "main"]).status).toBe(0);
  expect(run("git", ["init", "-q", "--bare"], remote).status).toBe(0);
  git("remote", "add", "origin", remote);
  git("add", ".");
  expect(git("commit", "-q", "-m", "chore: fixture").status).toBe(0);
  installHook("pre-commit", `node "${LINT_STAGED}" --config .lintstagedrc.json`);
  installHook("pre-push", "bun scripts/check-design-system.ts --all");
}, 60_000);

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
  if (remote) rmSync(remote, { recursive: true, force: true });
});

describe("design-system enforcement blocks", () => {
  it("rejects a commit that introduces a raw <div>", () => {
    const before = commitCount();
    write("src/app/raw.tsx", RAW_DIV);
    git("add", "src/app/raw.tsx");
    const result = git("commit", "-m", "feat: add raw div");
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("raw-div");
    expect(commitCount()).toBe(before);
    git("reset", "-q", "--hard");
    run("git", ["clean", "-fdq"]);
  }, 30_000);

  it("accepts raw tags inside components/ui and design-system components elsewhere", () => {
    write("src/components/ui/box.tsx", RAW_DIV);
    write("src/app/ok.tsx", "export const B = () => <Box>hello</Box>;\n");
    git("add", ".");
    const result = git("commit", "-m", "feat: add box");
    expect(result.status, result.output).toBe(0);
  }, 30_000);

  it("catches a --no-verify commit in the full sweep that pre-push and CI run", () => {
    write("src/app/sneaky.tsx", RAW_DIV);
    git("add", "src/app/sneaky.tsx");
    const commit = git("commit", "--no-verify", "-m", "feat: bypass hooks");
    expect(commit.status, commit.output).toBe(0);
    const sweep = run("bun", ["scripts/check-design-system.ts", "--all"]);
    expect(sweep.status).toBe(1);
    expect(sweep.output).toContain("src/app/sneaky.tsx");
  }, 30_000);

  it("sweeps nested directories named like top-level skip dirs", () => {
    write("src/app/build/page.tsx", RAW_DIV);
    const sweep = run("bun", ["scripts/check-design-system.ts", "--all"]);
    expect(sweep.status).toBe(1);
    expect(sweep.output).toContain("src/app/build/page.tsx");
  }, 30_000);

  it("honours opt-out directives only as comments, not inside strings", () => {
    const quoted = [
      'export const D = ["/* ds-ignore-file */", "// ds-ignore", "{/* ds-ignore */}"];',
      RAW_DIV,
    ].join("\n");
    write("src/app/quoted.tsx", quoted);
    const quotedRun = run("bun", ["scripts/check-design-system.ts", "src/app/quoted.tsx"]);
    expect(quotedRun.status, quotedRun.output).toBe(1);
    expect(quotedRun.output).toContain("src/app/quoted.tsx");

    write("src/app/opted-out.tsx", `/* ds-ignore-file */\n${RAW_DIV}`);
    write("src/app/line-opted-out.tsx", `// ds-ignore\n${RAW_DIV}`);
    const optedOut = run("bun", [
      "scripts/check-design-system.ts",
      "scripts/lib/ds-check.ts",
      "src/app/opted-out.tsx",
      "src/app/line-opted-out.tsx",
    ]);
    expect(optedOut.status, optedOut.output).toBe(0);
  }, 30_000);

  it("rejects a push containing a raw <div>", () => {
    const push = git("push", "origin", "main");
    expect(push.status).not.toBe(0);
    expect(push.output).toContain("raw-div");
  }, 30_000);
});

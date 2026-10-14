import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/lint-literals.mjs");

let root: string;

function component(name: string, source: string) {
  const file = join(root, "src", name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, source);
}

function lint(...files: string[]) {
  return spawnSync("node", [script, "--root", root, ...files], {
    encoding: "utf-8",
    // typescript resolves from the cwd (template/node_modules), not from the tmp root
    cwd: process.cwd(),
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "lint-literals-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("lint-literals: fails on literal text", () => {
  const bad: Record<string, string> = {
    "JSX text": `export const A = () => <h1>Welcome home</h1>;`,
    "multi-line JSX text": `export const A = () => (\n  <p>\n    Welcome home\n  </p>\n);`,
    "string literal child": `export const A = () => <p>{"Welcome home"}</p>;`,
    "ternary string child": `export const A = ({ ok }: { ok: boolean }) => <p>{ok ? "Yes" : "No"}</p>;`,
    "template literal child": "export const A = () => <p>{`Welcome`}</p>;",
    "placeholder attribute": `export const A = () => <input placeholder="Your name" />;`,
    "aria-label attribute": `export const A = () => <button type="button" aria-label="Close" />;`,
    "nested in a component": `export const A = () => <Card><Button>Submit</Button></Card>;`,
  };

  for (const [name, source] of Object.entries(bad)) {
    it(name, () => {
      component("A.tsx", source);
      const res = lint();
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("src/A.tsx");
    });
  }

  it("checks only the files it is given", () => {
    component("A.tsx", `export const A = () => <h1>Welcome home</h1>;`);
    component("B.tsx", `export const B = () => <h1>{"x1"}</h1>;`);
    component("C.tsx", `export const C = ({ t }: { t: string }) => <h1>{t}</h1>;`);
    expect(lint("src/C.tsx").status).toBe(0);
    expect(lint("src/A.tsx").status).toBe(1);
  });
});

describe("lint-literals: passes on content variables", () => {
  it("variables, numbers, symbols and entities", () => {
    component(
      "A.tsx",
      [
        `import { home } from "@/content";`,
        `export const A = ({ n }: { n: number }) => (`,
        `  <section className="hero" data-content="home.title">`,
        `    <h1>{home.title}</h1>`,
        `    <p>{n} &rarr; 12 • —</p>`,
        `    <input placeholder={home.placeholder} alt="" />`,
        `  </section>`,
        `);`,
      ].join("\n"),
    );
    const res = lint();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("No literal text");
  });

  it("ignores content, test, spec and stories files", () => {
    const bad = `export const A = () => <h1>Welcome home</h1>;`;
    component("content/A.tsx", bad);
    component("A.test.tsx", bad);
    component("A.spec.tsx", bad);
    component("A.stories.tsx", bad);
    component("__tests__/A.tsx", bad);
    expect(lint().status).toBe(0);
  });
});

describe("lint-literals: escape hatches need a reason and are listed", () => {
  it("accepts a same-line content-ok: reason and lists it", () => {
    component(
      "A.tsx",
      `export const A = () => (\n  <span>Beta</span>{/* content-ok: product badge */}\n);`,
    );
    const res = lint();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("Escape hatches in use (1)");
    expect(res.stdout).toContain("product badge");
  });

  it("accepts a content-ok comment on the line above", () => {
    component(
      "A.tsx",
      `export const A = () => (\n  <>\n    {/* content-ok: brand name */}\n    <span>Acme</span>\n  </>\n);`,
    );
    expect(lint().status).toBe(0);
  });

  it("rejects a bare content-ok", () => {
    component("A.tsx", `export const A = () => (\n  <span>Beta</span>{/* content-ok */}\n);`);
    const res = lint();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("content-ok needs a reason");
  });

  it("accepts data-content-skip with a reason for the whole subtree", () => {
    component(
      "A.tsx",
      `export const A = ({ e }: { e: string }) => (\n  <div data-content-skip="dynamic error from API">\n    <p>{e}</p>\n    <p>Contact support if this persists.</p>\n  </div>\n);`,
    );
    const res = lint();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("data-content-skip: dynamic error from API");
  });

  it("rejects data-content-skip without a reason", () => {
    for (const attr of ["data-content-skip", `data-content-skip=""`]) {
      component("A.tsx", `export const A = () => <div ${attr}><p>Hello there</p></div>;`);
      const res = lint();
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("data-content-skip needs a reason");
    }
  });
});

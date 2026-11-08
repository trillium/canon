import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../../scripts/check-css-normalize.mjs";

const GOOD_NORMALIZE = `
@font-face { font-family: "Brand"; src: url("/fonts/b.woff2") format("woff2"); font-display: swap; }
@font-face { font-family: "Brand Fallback"; src: local("Arial"); size-adjust: 100%; ascent-override: 90%; }
@theme { --font-sans: "Brand", "Brand Fallback", sans-serif; }
@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html { text-size-adjust: 100%; tab-size: 4; font-synthesis: style; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  button { font: inherit; }
}
`;

function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "css-normalize-"));
  const all = {
    "src/app/normalize.css": GOOD_NORMALIZE,
    "src/app/globals.css": '@import "tailwindcss";\n@import "./normalize.css";\n',
    "public/fonts/b.woff2": "x",
    ...files,
  };
  for (const [p, c] of Object.entries(all)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  }
  return root;
}

describe("check-css-normalize", () => {
  it("passes a conforming project", () => {
    expect(run(project({}))).toEqual([]);
  });

  it("fails when the normalize stylesheet is missing", () => {
    const root = project({ "src/app/normalize.css": "" });
    expect(run(root).join("\n")).toContain("missing box-sizing");
  });

  it("fails on a system font stack in CSS", () => {
    const root = project({ "src/app/x.css": "body { font-family: system-ui, sans-serif; }" });
    expect(run(root).join("\n")).toContain('system font "system-ui"');
  });

  it("fails on a system font stack in TSX", () => {
    const root = project({
      "src/a.tsx": 'export const s = { fontFamily: "Helvetica Neue, Arial" };',
    });
    expect(run(root).join("\n")).toContain("system font");
  });

  it("fails when a stack starts with a generic family", () => {
    const root = project({ "src/app/x.css": "p { font-family: sans-serif; }" });
    expect(run(root).join("\n")).toContain("starts with generic");
  });

  it("fails on a remote font and a missing font-display", () => {
    const root = project({
      "src/app/x.css":
        '@font-face { font-family: "R"; src: url("https://fonts.gstatic.com/a.woff2"); }',
    });
    const out = run(root).join("\n");
    expect(out).toContain("no font-display");
    expect(out).toContain("remote URL");
  });

  it("fails when the font file does not exist", () => {
    const root = project({
      "src/app/normalize.css": GOOD_NORMALIZE.replace("/fonts/b.woff2", "/fonts/missing.woff2"),
    });
    expect(run(root).join("\n")).toContain("not found");
  });

  it("fails when the element rules are not in @layer base", () => {
    const root = project({
      "src/app/normalize.css": GOOD_NORMALIZE.replace("@layer base {", "@media all {"),
    });
    expect(run(root).join("\n")).toContain("@layer base");
  });

  it("fails when only a test file mentions normalize.css", () => {
    const root = project({
      "src/app/globals.css": '@import "tailwindcss";\n',
      "src/test/x.test.ts": 'const css = \'@import "./normalize.css";\'; import "./normalize.css";',
    });
    expect(run(root).join("\n")).toContain("never imported");
  });

  it("accepts the url() import forms", () => {
    for (const form of ['url("./normalize.css")', "url(./normalize.css)"]) {
      const globals = `@import "tailwindcss";\n@import ${form};\n`;
      const root = project({ "src/app/globals.css": globals });
      expect(run(root)).toEqual([]);
    }
  });

  it("fails on an unquoted url() import of a remote font stylesheet", () => {
    const root = project({
      "src/app/x.css": "@import url(https://fonts.example.com/font.css);",
    });
    expect(run(root).join("\n")).toContain("remote font stylesheet");
  });

  it("fails on a system font in a font shorthand", () => {
    const css = project({ "src/app/x.css": "p { font: 700 14px/1.4 Arial, sans-serif; }" });
    expect(run(css).join("\n")).toContain('system font "arial"');
    const keyword = project({ "src/app/x.css": "p { font: menu; }" });
    expect(run(keyword).join("\n")).toContain("system font keyword");
    const tsx = project({ "src/a.tsx": 'export const s = { font: "12px system-ui" };' });
    expect(run(tsx).join("\n")).toContain('system font "system-ui"');
  });

  it("allows a font shorthand without a system font", () => {
    const root = project({
      "src/app/x.css": "p { font: italic 1rem var(--font-sans); } q { font: inherit; }",
    });
    expect(run(root)).toEqual([]);
  });

  it("runs the CLI from a path containing a space", () => {
    const root = project({ "src/app/x.css": "p { font-family: system-ui; }" });
    const script = join(root, "dir with space", "check-css-normalize.mjs");
    mkdirSync(dirname(script), { recursive: true });
    copyFileSync(resolve(__dirname, "../../scripts/check-css-normalize.mjs"), script);
    const res = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf-8" });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("check:css failed");
  });

  it("allows var() references", () => {
    const root = project({ "src/app/x.css": "p { font-family: var(--font-sans); }" });
    expect(run(root)).toEqual([]);
  });
});

#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = resolve(rootIdx >= 0 ? argv[rootIdx + 1] : process.cwd());

const layoutPath = ["src/app/layout.tsx", "app/layout.tsx"]
  .map((p) => join(root, p))
  .find((p) => existsSync(p));
const cssPath = ["src/app/globals.css", "app/globals.css"]
  .map((p) => join(root, p))
  .find((p) => existsSync(p));

if (!layoutPath) {
  console.error("check-page-frame: no root layout (src/app/layout.tsx or app/layout.tsx)");
  process.exit(2);
}

const layout = readFileSync(layoutPath, "utf-8");
const css = cssPath ? readFileSync(cssPath, "utf-8") : "";
const problems = [];

const body = layout.match(/<body\b([^>]*)>/)?.[1] ?? "";
const bodyRule = css.match(/\bbody\s*\{([^}]*)\}/)?.[1] ?? "";
const bodyStyle = `${body} ${bodyRule}`;

if (!body) problems.push("root layout has no <body> element");

if (!/\bmin-h-dvh\b|min-height:\s*100dvh/.test(bodyStyle)) {
  problems.push("<body> needs min-h-dvh (or min-height: 100dvh); 100vh alone overflows on phones");
}
if (
  !/\bflex\b[^"]*\bflex-col\b|\bflex-col\b[^"]*\bflex\b|display:\s*flex[^}]*flex-direction:\s*column/.test(
    bodyStyle,
  )
) {
  problems.push("<body> needs flex and flex-col so the content area can take the spare space");
}
if (/(?<![\w-])(h-screen|h-dvh|h-svh|h-lvh)(?![\w-])|(?<![-\w])height:\s*100d?vh/.test(bodyStyle)) {
  problems.push(
    "<body> must use min-height, never height; a fixed height makes the page scroll inside itself",
  );
}
if (/(?<![\w-])min-h-screen(?![\w-])/.test(body) && !/\bmin-h-dvh\b/.test(body)) {
  problems.push("<body> uses min-h-screen (100vh); use min-h-dvh");
}

const footerAt = layout.search(/<footer\b/);
if (footerAt >= 0) {
  const beforeFooter = layout.slice(0, footerAt);
  if (!/\bflex-1\b/.test(beforeFooter.slice(beforeFooter.search(/<body\b/)))) {
    problems.push("layout holds a <footer> but no flex-1 element comes before it in <body>");
  }
  const footerTag = layout.slice(footerAt).match(/<footer\b[^>]*>/)?.[0] ?? "";
  if (/(?<![\w-])(fixed|sticky)(?![\w-])/.test(footerTag)) {
    problems.push("<footer> must be a normal flex child, not fixed or sticky");
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`check-page-frame: ${p}`);
  console.error(`check-page-frame: ${problems.length} problem(s) in ${layoutPath}`);
  process.exit(1);
}
console.log("check-page-frame: ok");

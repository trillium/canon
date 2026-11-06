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
const bodyRule = [...css.matchAll(/(?<![\w-])body\s*\{([^}]*)\}/g)].map((m) => m[1]).join(";");
const tokens = (s) => new Set(s.split(/[\s"'`{}(),]+/));
const bodyClasses = tokens(body);

if (!body) problems.push("root layout has no <body> element");

if (!bodyClasses.has("min-h-dvh") && !/min-height:\s*100dvh/.test(bodyRule)) {
  problems.push("<body> needs min-h-dvh (or min-height: 100dvh); 100vh alone overflows on phones");
}
const cssFlexCol =
  /display:\s*flex(?![\w-])/.test(bodyRule) && /flex-direction:\s*column/.test(bodyRule);
if (!(bodyClasses.has("flex") && bodyClasses.has("flex-col")) && !cssFlexCol) {
  problems.push("<body> needs flex and flex-col so the content area can take the spare space");
}
if (
  ["h-screen", "h-dvh", "h-svh", "h-lvh"].some((c) => bodyClasses.has(c)) ||
  /(?<![-\w])height:\s*100d?vh/.test(bodyRule)
) {
  problems.push(
    "<body> must use min-height, never height; a fixed height makes the page scroll inside itself",
  );
}
if (bodyClasses.has("min-h-screen") && !bodyClasses.has("min-h-dvh")) {
  problems.push("<body> uses min-h-screen (100vh); use min-h-dvh");
}

const footerAt = layout.search(/<footer\b/);
if (footerAt >= 0) {
  const beforeFooter = layout.slice(0, footerAt);
  if (!tokens(beforeFooter.slice(beforeFooter.search(/<body\b/))).has("flex-1")) {
    problems.push("layout holds a <footer> but no flex-1 element comes before it in <body>");
  }
  const footerTag = layout.slice(footerAt).match(/<footer\b[^>]*>/)?.[0] ?? "";
  const footerClasses = tokens(footerTag);
  if (footerClasses.has("fixed") || footerClasses.has("sticky")) {
    problems.push("<footer> must be a normal flex child, not fixed or sticky");
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`check-page-frame: ${p}`);
  console.error(`check-page-frame: ${problems.length} problem(s) in ${layoutPath}`);
  process.exit(1);
}
console.log("check-page-frame: ok");

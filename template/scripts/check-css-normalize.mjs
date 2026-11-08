#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SYSTEM_FONTS = new Set([
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "-apple-system",
  "blinkmacsystemfont",
  "segoe ui",
  "roboto",
  "helvetica",
  "helvetica neue",
  "arial",
  "noto sans",
  "noto color emoji",
  "apple color emoji",
  "segoe ui emoji",
  "segoe ui symbol",
  "sf pro",
  "san francisco",
  "menlo",
  "monaco",
  "consolas",
  "courier new",
  "courier",
  "liberation mono",
  "sfmono-regular",
  "times new roman",
  "georgia",
  "verdana",
  "tahoma",
  "cantarell",
  "ubuntu",
  "oxygen",
  "fira sans",
  "droid sans",
]);

const GENERIC = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "math",
  "emoji",
  "fangsong",
]);

const REQUIRED_NORMALIZE = [
  [/box-sizing\s*:\s*border-box/, "box-sizing: border-box"],
  [/text-size-adjust\s*:\s*100%/, "text-size-adjust: 100%"],
  [/-webkit-font-smoothing\s*:\s*antialiased/, "-webkit-font-smoothing: antialiased"],
  [/-moz-osx-font-smoothing\s*:\s*grayscale/, "-moz-osx-font-smoothing: grayscale"],
  [/font-synthesis\s*:\s*style\b/, "font-synthesis: style"],
  [/tab-size\s*:/, "tab-size"],
  [/font\s*:\s*inherit/, "font: inherit on form controls"],
  [/@layer\s+base\s*\{/, "@layer base around the element rules"],
];

const SYSTEM_KEYWORDS = /^(caption|icon|menu|message-box|small-caption|status-bar)$/i;
const SHORTHAND_FAMILY =
  /(?:^|\s)(?:[\d.]+(?:px|r?em|%|pt|pc|vw|vh|vmin|vmax|ch|ex|r?lh|cm|mm|in|q)|(?:xxx-|xx-|x-)?(?:small|large)|medium|larger|smaller)(?:\s*\/\s*\S+)?\s+(.+)$/i;

const STYLE_EXT = /\.(css|scss|pcss)$/;
const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs|html|mdx)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitFamilies(value) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts
    .map((p) =>
      p
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

export function checkFamilyValue(value, where) {
  const errors = [];
  const families = splitFamilies(value.replace(/!important/g, ""));
  if (families.length === 0) return errors;
  const first = families[0];
  const isRef = (f) => /^(var|inherit|initial|unset|revert|theme)\b/.test(f);
  for (const f of families) {
    if (isRef(f)) continue;
    if (SYSTEM_FONTS.has(f))
      errors.push(`${where}: system font "${f}" in a font stack; load a self-hosted font`);
  }
  if (GENERIC.has(first))
    errors.push(
      `${where}: font stack starts with generic "${first}"; start with the self-hosted family`,
    );
  return errors;
}

export function checkFontShorthand(value, where) {
  const v = value.replace(/!important/g, "").trim();
  if (SYSTEM_KEYWORDS.test(v))
    return [`${where}: system font keyword "${v}"; load a self-hosted font`];
  const family = SHORTHAND_FAMILY.exec(v)?.[1];
  return family ? checkFamilyValue(family, where) : [];
}

function checkDeclaration(prop, value, where) {
  return prop === "font" ? checkFontShorthand(value, where) : checkFamilyValue(value, where);
}

export function checkStyle(file, raw) {
  const errors = [];
  const css = stripComments(raw);
  const faceRe = /@font-face\s*\{([^}]*)\}/g;
  let m = faceRe.exec(css);
  while (m) {
    const body = m[1];
    const family =
      /font-family\s*:\s*([^;]+)/
        .exec(body)?.[1]
        ?.trim()
        .replace(/^["']|["']$/g, "") ?? "?";
    const isFallback = /fallback$/i.test(family);
    if (!/font-display\s*:/.test(body) && !isFallback)
      errors.push(`${file}: @font-face "${family}" has no font-display`);
    const src = /src\s*:\s*([^;]+)/.exec(body)?.[1] ?? "";
    if (/url\(\s*["']?(https?:)?\/\//.test(src))
      errors.push(`${file}: @font-face "${family}" loads from a remote URL; self-host it`);
    if (isFallback) {
      if (!/size-adjust\s*:/.test(body) || !/ascent-override\s*:/.test(body))
        errors.push(`${file}: fallback face "${family}" must set size-adjust and ascent-override`);
    } else if (!/url\(/.test(src)) {
      errors.push(
        `${file}: @font-face "${family}" has no url() source; local() only belongs in a "* Fallback" face`,
      );
    }
    m = faceRe.exec(css);
  }
  const withoutFaces = css.replace(/@font-face\s*\{[^}]*\}/g, "");
  const declRe = /(^|[;{\s])(font-family|font|--font-[\w-]+)\s*:\s*([^;}]+)/g;
  let d = declRe.exec(withoutFaces);
  while (d) {
    errors.push(...checkDeclaration(d[2], d[3], `${file}: ${d[2]}`));
    d = declRe.exec(withoutFaces);
  }
  const imports = [...withoutFaces.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/g)].map(
    (i) => i[1],
  );
  for (const i of imports)
    if (/^(https?:)?\/\//.test(i) && /font/i.test(i))
      errors.push(`${file}: @import of remote font stylesheet "${i}"; self-host it`);
  return errors;
}

export function checkCode(file, src) {
  const errors = [];
  const re = /\b(fontFamily|font-family|font)["']?\s*:\s*(["'`])([\s\S]*?)\2/g;
  let m = re.exec(src);
  while (m) {
    errors.push(...checkDeclaration(m[1], m[3], `${file}: ${m[1]}`));
    m = re.exec(src);
  }
  if (/fonts\.(googleapis|gstatic)\.com|use\.typekit\.net|fonts\.bunny\.net/.test(src))
    errors.push(`${file}: remote font host; self-host the font`);
  return errors;
}

export function run(root, config = {}) {
  const cfg = {
    dirs: ["src"],
    normalize: "src/app/normalize.css",
    fontsDir: "public",
    ...config,
  };
  const errors = [];
  const normalizePath = resolve(root, cfg.normalize);
  if (!existsSync(normalizePath)) {
    errors.push(`${cfg.normalize}: normalize stylesheet is missing`);
  } else {
    const css = stripComments(readFileSync(normalizePath, "utf-8"));
    for (const [re, label] of REQUIRED_NORMALIZE)
      if (!re.test(css)) errors.push(`${cfg.normalize}: missing ${label}`);
    if (!/@font-face/.test(css))
      errors.push(`${cfg.normalize}: no @font-face; UI text must use a self-hosted font`);
    if (!/--font-sans\s*:/.test(css))
      errors.push(
        `${cfg.normalize}: --font-sans is not overridden; the default stack is system-ui`,
      );
  }

  const files = cfg.dirs.flatMap((d) => walk(resolve(root, d)));
  const styles = files.filter((f) => STYLE_EXT.test(f));
  const normalizeBase = cfg.normalize.split("/").pop();
  const importRe = new RegExp(
    `@import\\s+(?:url\\(\\s*)?["']?(?:[^"')\\s;]*/)?${normalizeBase.replace(".", "\\.")}["')\\s;]`,
  );
  const importsNormalize = styles.some(
    (f) => f !== normalizePath && importRe.test(stripComments(readFileSync(f, "utf-8"))),
  );
  if (existsSync(normalizePath) && !importsNormalize)
    errors.push(`${normalizeBase} is never imported by a stylesheet`);

  for (const f of styles)
    errors.push(...checkStyle(f.slice(resolve(root).length + 1), readFileSync(f, "utf-8")));
  for (const f of files.filter((x) => CODE_EXT.test(x) && !/\.test\.[tj]sx?$/.test(x)))
    errors.push(...checkCode(f.slice(resolve(root).length + 1), readFileSync(f, "utf-8")));

  if (existsSync(normalizePath)) {
    const css = stripComments(readFileSync(normalizePath, "utf-8"));
    for (const m of css.matchAll(/url\(\s*["']?(\/[^"')]+)["']?\s*\)/g)) {
      const target = resolve(root, cfg.fontsDir, m[1].slice(1));
      if (!existsSync(target))
        errors.push(`${cfg.normalize}: font file ${m[1]} not found under ${cfg.fontsDir}/`);
    }
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const root = process.cwd();
  const cfgPath = resolve(root, "css-normalize.config.json");
  const config = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf-8")) : {};
  const errors = run(root, config);
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    console.error(`\ncheck:css failed: ${errors.length} problem(s)`);
    process.exit(1);
  }
  console.log("check:css ok");
}

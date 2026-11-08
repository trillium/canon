# Module: CSS Normalize (opt-in)

Text rendered with system fonts differs between Mac, Linux and CI, so screenshot baselines differ by several percent of pixels and visual tests need a pinned OS image. Normalizing CSS and self-hosting fonts makes rendering identical everywhere, so visual tests run without Docker. `check:css` fails on system-font stacks, a missing normalize stylesheet and unsafe `@font-face` rules.

## Check

- [ ] `src/app/normalize.css` exists, is imported by the global stylesheet, and contains `box-sizing: border-box`, `text-size-adjust: 100%`, `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `font-synthesis: none`, `tab-size` and `font: inherit` for form controls
- [ ] Every UI font is declared with `@font-face` from a local file (`url()` to a file that exists, no remote host) with `font-display`
- [ ] A `"<Family> Fallback"` face sets `size-adjust` and `ascent-override`
- [ ] `--font-sans` and `--font-mono` are overridden in `@theme` so Tailwind's `system-ui` default never applies
- [ ] No `font-family`, `--font-*` or `fontFamily` value names a system font (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`, `Menlo`, ...) and none starts with a generic family
- [ ] No Google Fonts, Typekit or other remote font host
- [ ] `scripts/check-css-normalize.mjs`, `css-normalize.config.json` and `src/test/check-css-normalize.test.ts` match this module's copies; the test passes
- [ ] `package.json` has `"check:css": "node scripts/check-css-normalize.mjs"`
- [ ] `.github/workflows/css-normalize.yml` exists and runs `pnpm run check:css`
- [ ] `ENFORCEMENT.md` has the css-normalize row
- [ ] Visual tests wait for `document.fonts.ready` before capturing
- [ ] `pnpm run check:css` exits 0

## Apply

1. Copy `scripts/check-css-normalize.mjs`, `css-normalize.config.json`, `src/test/check-css-normalize.test.ts`, `src/app/normalize.css` and `.github/workflows/css-normalize.yml` from this module. Set `dirs` in the config to the project's source directories.
2. Put the project's font files (woff2) under `public/fonts/` and edit the `@font-face` blocks in `normalize.css`. The bundled Assistant files (SIL OFL) are a placeholder; keep the license notice of whatever ships. Tune the fallback face's `size-adjust` and overrides to the chosen font.
3. Add `@import "./normalize.css";` after `@import "tailwindcss";` in the global CSS.
4. Add `"check:css": "node scripts/check-css-normalize.mjs"` to `package.json` scripts.
5. Replace every system-font stack in CSS and TSX with `var(--font-sans)` / `var(--font-mono)` or a Tailwind `font-sans` / `font-mono` class.
6. Add the css-normalize row to `ENFORCEMENT.md`.
7. In visual tests, `await page.evaluate(() => document.fonts.ready)` before screenshots, then regenerate baselines once. Drop the pinned OS image.
8. Run `pnpm run check:css`; it must exit 0.

## Conflicts

- A project using `next/font/local`: it self-hosts correctly, but keep an `@font-face` in `normalize.css` or point `dirs` and `normalize` at where the faces live; the check requires a local `@font-face` and `--font-sans` override
- A project using `next/font/google`: it self-hosts at build time, yet this check rejects remote font hosts in source; switch to local font files
- Icon or emoji fonts: use SVG icons (lucide-react), not font stacks
- A reset already in place (Tailwind preflight, modern-normalize): keep it; `normalize.css` only adds the cross-platform text and form rules the check requires
- Email templates: inline styles must use system fonts because mail clients cannot load them; keep `src/emails` out of `dirs`

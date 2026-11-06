# Module: Styling

## Check

- [ ] `tailwindcss` v4 in dependencies
- [ ] `@tailwindcss/postcss` in devDependencies
- [ ] PostCSS config references `@tailwindcss/postcss`
- [ ] Global CSS imports Tailwind via `@import "tailwindcss"`
- [ ] shadcn/ui initialized (`components.json` exists)
- [ ] `class-variance-authority` in dependencies
- [ ] `lucide-react` in dependencies
- [ ] `clsx` and `tailwind-merge` in dependencies
- [ ] `cn()` utility exists in `src/lib/utils.ts`
- [ ] `scripts/check-page-frame.mjs` exists and is byte-identical to this module's copy
- [ ] `package.json` has a `"check:page-frame"` script running `node scripts/check-page-frame.mjs`
- [ ] Root layout `<body>` has `min-h-dvh` (or `min-height: 100dvh` in global CSS, with `min-height: 100vh` on the line before as fallback) together with `flex` and `flex-col`
- [ ] The root layout wraps `{children}` in a frame (`flex flex-1 flex-col`) and a content area (`flex flex-1 flex-col`); a layout that holds a `<footer>` has a `flex-1` element before it and the footer is a normal flex child
- [ ] No `h-screen`, `h-dvh`, `height: 100vh` or `overflow: auto` on `<body>`, the frame or the content area
- [ ] No `fixed` or `sticky` footer; a fixed bottom notice (cookie bar) has a spacer in the flow
- [ ] `pnpm run check:page-frame` exits 0

## Page frame

The page is at least as tall as the device screen, the content area takes the spare space, and the footer sits at the bottom edge. On a short page (sign-in, a thank-you state) the footer would otherwise follow the content and float in the middle of a tall screen. It applies to every page of an app: pages with a footer put it in the frame; pages without one (signed-in app, admin) use the same frame with no footer, so the content still fills the screen.

```tsx
<html>
  <body className="flex min-h-dvh flex-col">
    <header>...</header>
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <main>...</main>
      </div>
      <footer>...</footer>
    </div>
  </body>
</html>
```

Plain CSS equivalent: `body { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; } .frame { flex: 1; display: flex; flex-direction: column; } .content { flex: 1; }`

Common mistakes:

- `100vh` alone: on phones it is taller than the visible screen when the browser bar shows, so the footer is pushed off screen. Use `100dvh`; keep `100vh` only as the fallback line before it.
- A fixed or sticky footer covers content, and the last lines can never be read. The footer is a normal flex child.
- No `flex-1` on the content area or the frame: the footer sits right under the content again.
- Nested scroll containers (`overflow: auto` or a fixed height on the frame or content): the page scrolls inside itself and the footer is no longer the bottom of the page. Use `min-height`, never `height`.
- A fixed notice at the bottom (cookie bar) that is not allowed for: reserve its height with a spacer in the flow so the footer is not buried.

`scripts/check-page-frame.mjs` reads the root layout and global CSS and fails on the first four mistakes; the cookie-bar spacer is a manual check.

## Apply

1. Run `pnpm add tailwindcss @tailwindcss/postcss`
2. Create/update `postcss.config.mjs`:
   ```js
   export default {
     plugins: {
       "@tailwindcss/postcss": {},
     },
   };
   ```
3. Update global CSS to use `@import "tailwindcss"`
4. Run `pnpm dlx shadcn@latest init` — select New York style, neutral color
5. Run `pnpm add class-variance-authority lucide-react clsx tailwind-merge`
6. Ensure `cn()` utility exists in `src/lib/utils.ts`:
   ```ts
   import { clsx, type ClassValue } from "clsx";
   import { twMerge } from "tailwind-merge";
   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```

7. Copy `scripts/check-page-frame.mjs` from this module and add `"check:page-frame": "node scripts/check-page-frame.mjs"` to `package.json`
8. Give the root layout `<body className="flex min-h-dvh flex-col">` and wrap `{children}` in the frame and content area shown under Page frame; add the check to CI

## Conflicts

- If project uses Tailwind v3, migration to v4 may require config changes — flag for review
- If project uses Headless UI, it can coexist with shadcn but components should migrate incrementally
- If the root layout already sets `h-screen`, `h-dvh` or `overflow` on `<body>` or a wrapper, replace it with `min-h-dvh`; flag nested scroll containers for review
- If project uses a different icon library, lucide can coexist — no need to remove

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

## Reuse-First Rule (blocking)

Pages compose design-system primitives; they never hand-roll raw UI.
This is enforced mechanically by the design-system module, not by review
diligence:

- [ ] No new self-rolled primitive where the library covers it — check
      `/design-system` (the catalogue) first, use what exists
- [ ] When the library falls short, state the reason and build the missing
      piece as a shared `src/components/ui/` primitive (tokens + CVA
      variants), catalogue it, then use it — never inline it in a page
- [ ] Exceptions (one-off marketing surfaces, OG images) are listed in the
      manifest review, never silent
- [ ] `node scripts/check-design-system.ts` passes on staged files;
      `// ds-ignore` / `/* ds-ignore-file */` are the only escape hatches

See `modules/design-system/audit.md` for the scripts, hook wiring, and CI
job that enforce this rule.

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

## Conflicts

- If project uses Tailwind v3, migration to v4 may require config changes — flag for review
- If project uses Headless UI, it can coexist with shadcn but components should migrate incrementally
- If project uses a different icon library, lucide can coexist — no need to remove

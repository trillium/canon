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

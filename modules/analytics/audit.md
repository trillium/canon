# Module: Analytics

## Check

- [ ] `posthog-js` in dependencies
- [ ] `posthog-node` in dependencies (for server-side)
- [ ] PostHog provider in `src/providers/` wrapping the app
- [ ] Environment variables: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

## Apply

1. Run `pnpm add posthog-js posthog-node`
2. Create `src/providers/PostHogProvider.tsx`:
   ```tsx
   "use client";
   import posthog from "posthog-js";
   import { PostHogProvider as PHProvider } from "posthog-js/react";
   import { useEffect, type ReactNode } from "react";

   export function PostHogProvider({ children }: { children: ReactNode }) {
     useEffect(() => {
       posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
         api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
         capture_pageview: false,
       });
     }, []);
     return <PHProvider client={posthog}>{children}</PHProvider>;
   }
   ```
3. Wrap root layout with `<PostHogProvider>`
4. Add page view capture component
5. Add to `.env.local.example`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

## Conflicts

- If project uses a different analytics provider (Google Analytics, Plausible, Fathom), they can coexist — no need to remove

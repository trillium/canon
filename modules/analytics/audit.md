# Module: Analytics

## Check

- [ ] `posthog-js` in dependencies
- [ ] `posthog-node` in dependencies (for server-side)
- [ ] PostHog provider in `src/providers/` wrapping the app
- [ ] Provider uses `api_host: "/ingest"` (not direct PostHog URL)
- [ ] `/ingest` proxy handler in `proxy.ts` using manual `fetch()` (not `NextResponse.rewrite()`)
- [ ] Proxy matcher includes `"/ingest/:path*"`
- [ ] Environment variables: `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] CSP headers allow `us.i.posthog.com` (connect-src) and `us-assets.i.posthog.com` (script-src)

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
       if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
         posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
           api_host: "/ingest",
           ui_host: "https://us.i.posthog.com",
           capture_pageview: false,
         });
       }
     }, []);

     if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
       return <>{children}</>;
     }

     return <PHProvider client={posthog}>{children}</PHProvider>;
   }
   ```
3. Wrap root layout with `<PostHogProvider>`
4. Add page view capture component
5. Add `/ingest` reverse proxy to `proxy.ts`:
   ```ts
   // At the top of your proxy() function, before other logic:
   if (request.nextUrl.pathname.startsWith("/ingest")) {
     return handlePostHogProxy(request);
   }
   ```
   See `modules/analytics/posthog-proxy.ts` for the full `handlePostHogProxy` implementation.

   **Why manual fetch?** `NextResponse.rewrite()` silently drops POST request bodies
   on Vercel. Events appear to send client-side but never arrive at PostHog.
   The manual `fetch()` approach preserves the body correctly.

   The proxy:
   - Routes `/ingest/static/*` to `us-assets.i.posthog.com` (CDN/static assets)
   - Routes all other `/ingest/*` to `us.i.posthog.com` (API)
   - Strips `content-encoding` header to prevent `ERR_CONTENT_DECODING_FAILED`
6. Add `"/ingest/:path*"` to the proxy matcher config:
   ```ts
   export const config = {
     matcher: [
       "/ingest/:path*",
       // ... existing matchers
     ],
   };
   ```
7. Add to `.env.local.example`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=
   ```

## Conflicts

- If project uses a different analytics provider (Google Analytics, Plausible, Fathom), they can coexist — no need to remove
- If project already has a `proxy.ts` / `middleware.ts`, the `/ingest` handler must be integrated into the existing file (only one proxy file per Next.js app)
- If CSP headers are managed elsewhere, the PostHog domains must be added to the existing policy

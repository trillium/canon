/**
 * PostHog reverse proxy handler for Next.js 16 proxy.ts
 *
 * Proxies /ingest/* requests through the app's own domain to bypass ad blockers.
 *
 * IMPORTANT: Uses manual fetch() instead of NextResponse.rewrite() because
 * rewrite() silently drops POST bodies on Vercel — events appear to send but
 * never arrive at PostHog.
 *
 * Usage: import and call from your proxy.ts when pathname starts with "/ingest".
 *
 * CSP headers must allow:
 *   connect-src: us.i.posthog.com
 *   script-src:  us-assets.i.posthog.com
 */

import type { NextRequest } from "next/server";

const POSTHOG_API = "https://us.i.posthog.com";
const POSTHOG_ASSETS = "https://us-assets.i.posthog.com";

export async function handlePostHogProxy(
  request: NextRequest,
): Promise<Response> {
  const pathname = request.nextUrl.pathname;

  let targetUrl: URL;
  if (pathname.startsWith("/ingest/static/")) {
    targetUrl = new URL(
      pathname.replace("/ingest/static/", "/static/"),
      POSTHOG_ASSETS,
    );
  } else {
    targetUrl = new URL(pathname.replace("/ingest", ""), POSTHOG_API);
  }

  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set("host", targetUrl.host);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.blob(),
  });

  const responseHeaders = new Headers(response.headers);
  // Strip encoding header — edge runtimes decompress upstream responses,
  // so forwarding the header causes ERR_CONTENT_DECODING_FAILED.
  responseHeaders.delete("content-encoding");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

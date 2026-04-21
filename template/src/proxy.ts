import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const POSTHOG_API = "https://us.i.posthog.com";
const POSTHOG_ASSETS = "https://us-assets.i.posthog.com";

/**
 * Proxy PostHog /ingest requests through the app's own domain.
 *
 * Why manual fetch instead of NextResponse.rewrite()?
 * NextResponse.rewrite() silently drops POST request bodies on Vercel,
 * so events appear to send but never arrive. Using fetch() preserves the body.
 *
 * Static assets (/ingest/static/) route to the PostHog CDN.
 * All other /ingest requests route to the PostHog API.
 * The content-encoding header is stripped to prevent ERR_CONTENT_DECODING_FAILED.
 */
async function handlePostHogProxy(request: NextRequest): Promise<Response> {
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

export async function proxy(request: NextRequest) {
  // PostHog reverse proxy — bypass ad blockers
  if (request.nextUrl.pathname.startsWith("/ingest")) {
    return handlePostHogProxy(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/ingest/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

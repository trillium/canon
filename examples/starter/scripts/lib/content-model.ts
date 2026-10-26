/**
 * Shared by lint-content.ts and content-report.ts: where pages and their content files live.
 *
 * Config (optional): content-acceptance.config.json at --root:
 *   {
 *     "appDir": "src/app",            // where page.tsx files live (auto: src/app, app)
 *     "contentDir": "content",        // one <key>.json per page
 *     "skipRoutes": ["/admin"],       // infrastructure routes, never linted
 *     "routes": { "/pricing": "plans" } // route -> content key overrides
 *   }
 * Default key: "/" -> "home", "/a/b" -> "a-b". Route groups "(x)" are ignored.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { walk } from "./fs";

export interface ContentModel {
  root: string;
  appDir: string;
  contentDir: string;
  skipRoutes: Set<string>;
  routeOverrides: Record<string, string>;
}

export interface Page {
  route: string;
  file: string;
}

export const PAGE_FILE = /[\\/]page\.(tsx|jsx)$/;

export function loadContentModel(args: string[]): ContentModel {
  const rootIdx = args.indexOf("--root");
  const root = rootIdx >= 0 ? (args[rootIdx + 1] ?? process.cwd()) : process.cwd();
  const cfgPath = join(root, "content-acceptance.config.json");
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf-8")) : {};
  return {
    root,
    appDir: join(root, cfg.appDir ?? (existsSync(join(root, "src/app")) ? "src/app" : "app")),
    contentDir: join(root, cfg.contentDir ?? "content"),
    skipRoutes: new Set<string>(cfg.skipRoutes ?? ["/admin", "/admin/callback"]),
    routeOverrides: cfg.routes ?? {},
  };
}

export function discoverPages(appDir: string): Page[] {
  return walk(appDir)
    .filter((f) => PAGE_FILE.test(f))
    .map((file) => {
      const segs = relative(appDir, file)
        .split(/[\\/]/)
        .slice(0, -1)
        .filter((s) => !/^\(.*\)$/.test(s));
      return { route: `/${segs.join("/")}`, file };
    });
}

export function keyFor(route: string, overrides: Record<string, string>): string {
  const override = overrides[route];
  if (override) return override;
  return route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
}

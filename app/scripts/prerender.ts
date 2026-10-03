import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderHeadTags,
  pathForRoute,
  LOCALES,
  type RouteKey,
  type DebateMeta,
} from "../src/seo/head";

// Runs AFTER `vite build`. Reads the built dist/index.html shell and writes one
// HTML file per (route × locale): same shell, but the head's data-pxh tags are
// stripped and replaced with the route+locale-correct ones, and <html lang> is
// rewritten. React is never rendered (no jsdom, no browser globals touched):
// the body stays the empty #root, exactly as the SPA ships — createRoot()
// overwrites it on mount, so there is no hydration and no mismatch.
//
// Non-root documents are emitted as `route.html`, not `route/index.html`.
// Cloudflare's default HTML handling serves a flat HTML asset at the slashless
// route (`route.html` -> `/route`) but makes a directory index canonical at the
// trailing-slash route. The application canonicals and links are slashless.
//
// Fixtures are read via fs (NOT imported from src/data): the fixtures' top-level
// `arguments` key breaks esbuild/Node JSON named-export codegen under tsx.

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "../dist");
const DATA = join(here, "../src/data");
const template = readFileSync(join(DIST, "index.html"), "utf8");

const slugOf = (id: string) => id.replace(/^topic_/, "").replace(/_/g, "-");

function loadDebates(dir: string): DebateMeta[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const j = JSON.parse(readFileSync(join(dir, f), "utf8")) as {
        topic?: { id?: string; question?: string; summary?: string };
      };
      if (!j.topic?.id) return null;
      return {
        slug: slugOf(j.topic.id),
        question: j.topic.question ?? "",
        summary: j.topic.summary,
      };
    })
    .filter((d): d is DebateMeta => d !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const debatesByLocale: Record<"en" | "fr", DebateMeta[]> = {
  en: loadDebates(DATA),
  fr: loadDebates(join(DATA, "fr")),
};

const staticRoutes: RouteKey[] = [
  { kind: "home" },
  { kind: "debates" },
  { kind: "method" },
];

function strip(html: string): string {
  return html
    .replace(/[ \t]*<title\b[^>]*\bdata-pxh="1"[^>]*>[\s\S]*?<\/title>\n?/g, "")
    .replace(/[ \t]*<(?:meta|link)\b[^>]*\bdata-pxh="1"[^>]*\/>\n?/g, "");
}

function compose(route: RouteKey, locale: "en" | "fr", debate?: DebateMeta): string {
  const head = renderHeadTags(route, locale, debate);
  return strip(template)
    .replace(/<html\b([^>]*)\blang="[a-z-]+"/i, `<html$1lang="${locale}"`)
    .replace("</head>", `    ${head}\n  </head>`);
}

function write(urlPath: string, doc: string) {
  const outFile = urlPath === "/"
    ? join(DIST, "index.html")
    : join(DIST, `${urlPath.replace(/^\//, "")}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, doc);
}

let count = 0;
for (const locale of LOCALES) {
  const entries: { route: RouteKey; debate?: DebateMeta }[] = [
    ...staticRoutes.map((route) => ({ route })),
    ...debatesByLocale[locale].map((d) => ({
      route: { kind: "debate", slug: d.slug } as RouteKey,
      debate: d,
    })),
  ];
  for (const { route, debate } of entries) {
    const p = pathForRoute(route);
    const urlPath = locale === "fr" ? (p === "/" ? "/fr" : `/fr${p}`) : p;
    write(urlPath, compose(route, locale, debate));
    count += 1;
  }
}
// 404 (EN head) — served by CF Pages on a hard miss.
writeFileSync(join(DIST, "404.html"), compose({ kind: "notfound" }, "en"));
count += 1;

console.log(`[prerender] wrote ${count} files`);

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { localizedPath } from "../src/i18n/paths";
import {
  renderHeadTags,
  pathForRoute,
  LOCALES,
  type RouteKey,
  type DebateMeta,
} from "../src/seo/head";

// Runs after the client build. Bundle the same App for Node with Vite (including
// its JSON fixtures), then use React 19 static prerender to await lazy routes.
// The client hydrates this body; no browser globals or inline scripts are needed.
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
const serverDist = join(here, "../node_modules/.prerender");
await build({
  build: {
    ssr: "src/entry-server.tsx",
    outDir: serverDist,
    emptyOutDir: true,
  },
});
const { renderPage } = await import(
  pathToFileURL(join(serverDist, "entry-server.js")).href
) as { renderPage: (pathname: string) => Promise<string> };


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
  { kind: "project" },
];

function strip(html: string): string {
  return html
    .replace(/[ \t]*<title\b[^>]*\bdata-pxh="1"[^>]*>[\s\S]*?<\/title>\n?/g, "")
    .replace(/[ \t]*<(?:meta|link)\b[^>]*\bdata-pxh="1"[^>]*\/>\n?/g, "");
}

async function compose(route: RouteKey, locale: "en" | "fr", debate?: DebateMeta): Promise<string> {
  const head = renderHeadTags(route, locale, debate);
  const body = await renderPage(localizedPath(pathForRoute(route), locale));
  if (/<script\b/i.test(body)) throw new Error("Prerender emitted an inline script");
  return strip(template)
    .replace(/<html\b([^>]*)\blang="[a-z-]+"/i, `<html$1lang="${locale}"`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function write(urlPath: string, doc: string) {
  const outFile = urlPath.endsWith("/")
    ? join(DIST, urlPath.replace(/^\//, ""), "index.html")
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
    const urlPath = localizedPath(p, locale);
    write(urlPath, await compose(route, locale, debate));
    count += 1;
  }
}
// 404 (FR head) — served by CF Pages on a hard miss.
writeFileSync(join(DIST, "404.html"), await compose({ kind: "notfound" }, "fr"));
count += 1;

console.log(`[prerender] wrote ${count} files`);

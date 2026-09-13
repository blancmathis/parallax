import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Dependency-free sitemap.xml + robots.txt. Reads the EN fixtures for the debate
// slugs (never imports src/ React). Indexable set only: /, /debates,
// /debates/<slug>×N, /method — × {en, fr}. /review and /you are noindex and are
// kept OUT of the sitemap (their crawlable <meta robots=noindex,follow> handles
// the rest). Reciprocal hreflang clusters (en, fr, x-default→en).

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, "../src/data");
const DIST = join(here, "../dist");

// Fail closed: a deployable build must declare its canonical origin. Baking a
// guessed domain into sitemap/robots/og is a real launch hazard (wrong canonical,
// leaked placeholder), so refuse unless SITE_ORIGIN is set — or the operator
// explicitly opts into the default for a throwaway local build.
if (!process.env.SITE_ORIGIN && process.env.SITE_ORIGIN_ALLOW_LOCAL !== "1") {
  throw new Error(
    "[gen-seo] SITE_ORIGIN is not set. Set SITE_ORIGIN (and VITE_SITE_ORIGIN) to the controlled canonical origin, or explicitly set SITE_ORIGIN_ALLOW_LOCAL=1 for a local-only build.",
  );
}
const ORIGIN = (process.env.SITE_ORIGIN || "http://127.0.0.1:4173").replace(/\/+$/, "");

const slugOf = (id) => id.replace(/^topic_/, "").replace(/_/g, "-");
const slugs = readdirSync(DATA)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    try {
      const j = JSON.parse(readFileSync(join(DATA, f), "utf8"));
      return j && j.topic && j.topic.id ? slugOf(j.topic.id) : null;
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort();

const enPaths = ["/", "/debates", ...slugs.map((s) => `/debates/${s}`), "/method"];
const frPath = (en) => (en === "/" ? "/fr" : `/fr${en}`);
const abs = (p) => `${ORIGIN}${p}`;

function urlEntry(loc, en) {
  const alts = [
    ["en", abs(en)],
    ["fr", abs(frPath(en))],
    ["x-default", abs(en)],
  ];
  const links = alts
    .map(([hl, href]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${href}" />`)
    .join("\n");
  return `  <url>\n    <loc>${loc}</loc>\n${links}\n  </url>`;
}

const urls = enPaths.flatMap((en) => [urlEntry(abs(en), en), urlEntry(abs(frPath(en)), en)]);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);

if (!process.env.SITE_ORIGIN) {
  console.warn(`[gen-seo] LOCAL-ONLY opt-in used ${ORIGIN}; set SITE_ORIGIN and VITE_SITE_ORIGIN for any deployable build.`);
}
console.log(`[gen-seo] sitemap.xml: ${urls.length} urls + robots.txt (origin ${ORIGIN})`);

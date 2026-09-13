import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "../dist");
const SRC = join(here, "../src");
let fail = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const bad = (m) => {
  console.error(`  FAIL ${m}`);
  fail += 1;
};
const read = (p) => readFileSync(join(DIST, p), "utf8");
const has = (p) => existsSync(join(DIST, p));

// 0. origin must be explicitly configured for a deployable build, and the
// prerendered canonical must actually use it — never a guessed placeholder.
const ORIGIN_ENV = process.env.SITE_ORIGIN?.replace(/\/+$/, "");
const EXPECTED_ORIGIN = ORIGIN_ENV ?? (
  process.env.SITE_ORIGIN_ALLOW_LOCAL === "1" ? "http://127.0.0.1:4173" : null
);
if (EXPECTED_ORIGIN) {
  read("index.html").includes(`rel="canonical" href="${EXPECTED_ORIGIN}/"`)
    ? ok(`canonical uses configured origin (${EXPECTED_ORIGIN})`)
    : bad(`home canonical does not use configured origin (${EXPECTED_ORIGIN}) — set VITE_SITE_ORIGIN too`);
  read("sitemap.xml").includes(`<loc>${EXPECTED_ORIGIN}/`)
    ? ok("sitemap uses SITE_ORIGIN")
    : bad("sitemap origin != SITE_ORIGIN");
} else {
  bad(
    "SITE_ORIGIN not set — refusing to ship a guessed canonical. Set SITE_ORIGIN + VITE_SITE_ORIGIN (or SITE_ORIGIN_ALLOW_LOCAL=1 for a local-only build).",
  );
}

// 1. prerendered files exist
const files = [
  "index.html", "debates.html", "method.html", "review.html", "you.html",
  "debates/congestion-pricing.html", "debates/smartphones-schools.html", "debates/nuclear-power.html",
  "fr.html", "fr/debates.html", "fr/method.html", "fr/review.html", "fr/you.html",
  "fr/debates/congestion-pricing.html", "fr/debates/smartphones-schools.html", "fr/debates/nuclear-power.html",
  "404.html", "sitemap.xml", "robots.txt",
];
for (const f of files) (has(f) ? ok(`exists ${f}`) : bad(`missing ${f}`));

const legacyDirectoryIndexes = [
  "debates/index.html",
  "method/index.html",
  "fr/index.html",
  "fr/method/index.html",
];
for (const f of legacyDirectoryIndexes) {
  !has(f) ? ok(`no trailing-slash prerender ${f}`) : bad(`legacy trailing-slash prerender exists: ${f}`);
}

// 2. <html lang>
/<html lang="fr"/.test(read("fr.html")) ? ok("fr lang") : bad("fr.html lang!=fr");
/<html lang="en"/.test(read("index.html")) ? ok("en lang") : bad("index.html lang!=en");

// 3. FR title is localized
/<title[^>]*>[^<]*désaccord/i.test(read("fr.html")) ? ok("fr title localized") : bad("fr title not localized");

// 4. reciprocal hreflang trio
const fr = read("fr/debates/smartphones-schools.html");
['hreflang="en"', 'hreflang="fr"', 'hreflang="x-default"'].every((h) => fr.includes(h))
  ? ok("hreflang trio") : bad("hreflang trio missing");

// 5. og:locale per locale
/og:locale" content="fr_FR"/.test(read("fr/method.html")) ? ok("fr og:locale fr_FR") : bad("fr og:locale");
/og:locale" content="en_US"/.test(read("method.html")) ? ok("en og:locale en_US") : bad("en og:locale");

// 6. debate is og:type article
/og:type" content="article"/.test(read("debates/nuclear-power.html")) ? ok("debate og:type article") : bad("debate og:type not article");

// 7. review/you noindex; indexable pages not noindex
for (const f of ["review.html", "you.html", "fr/review.html", "fr/you.html"])
  /robots" content="noindex/.test(read(f)) ? ok(`noindex ${f}`) : bad(`missing noindex ${f}`);
/robots" content="noindex/.test(read("index.html")) ? bad("home is noindex!") : ok("home indexable");
/robots" content="noindex/.test(read("debates/nuclear-power.html")) ? bad("debate is noindex!") : ok("debate indexable");

// 8. sitemap
const sm = read("sitemap.xml");
const locs = (sm.match(/<loc>/g) || []).length;
locs === 12 ? ok("sitemap 12 <loc>") : bad(`sitemap ${locs} <loc> (want 12)`);
sm.includes('hreflang="x-default"') ? ok("sitemap x-default") : bad("sitemap missing x-default");
!/<loc>[^<]*\/(review|you)\b/.test(sm) ? ok("sitemap excludes review/you") : bad("sitemap lists review/you");

// 9. Link-import guard: only i18n/links.tsx may import Link/NavLink from react-router-dom
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const linksFile = join("i18n", "links.tsx");
const offenders = walk(SRC)
  .filter((p) => /\.tsx?$/.test(p) && !p.endsWith(linksFile))
  .filter((p) =>
    /import\s*\{[^}]*\b(?:Link|NavLink)\b[^}]*\}\s*from\s*["']react-router(?:-dom)?["']/.test(
      readFileSync(p, "utf8"),
    ),
  );
offenders.length === 0
  ? ok("no raw Link/NavLink imports outside i18n/links.tsx")
  : bad(`raw Link/NavLink import in: ${offenders.map((p) => p.replace(SRC, "src")).join(", ")}`);

if (fail) {
  console.error(`\n[check-seo] ${fail} failure(s).`);
  process.exit(1);
}
console.log(`\n[check-seo] all SEO assertions passed.`);

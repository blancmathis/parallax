import { dictionaries, type Locale } from "../i18n";

/** Minimal per-debate facts the head needs. Injected by the caller (the client
 *  reads it from the fixtures via getDebates; the prerender reads JSON via fs) so
 *  this module never imports the data fixtures — keeping it safe to run under
 *  Node/tsx, where the fixtures' `arguments` key breaks JSON named-export codegen. */
export type DebateMeta = { slug: string; question: string; summary?: string };

// One origin var, two readers: client build sees VITE_SITE_ORIGIN; the Node
// prerender (tsx) sees process.env.SITE_ORIGIN. Same value, set both in CF Pages.
const PROCESS_ENV = (globalThis as {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;
const ENV_ORIGIN =
  (import.meta.env?.VITE_SITE_ORIGIN as string | undefined) ??
  PROCESS_ENV?.SITE_ORIGIN;
const LOCAL_FALLBACK_ALLOWED =
  Boolean(import.meta.env?.DEV) || PROCESS_ENV?.SITE_ORIGIN_ALLOW_LOCAL === "1";
if (!ENV_ORIGIN && !LOCAL_FALLBACK_ALLOWED) {
  throw new Error(
    "VITE_SITE_ORIGIN and SITE_ORIGIN are unset. Refusing to generate a guessed public canonical.",
  );
}
export const SITE_ORIGIN = (
  ENV_ORIGIN ?? (import.meta.env?.DEV ? "http://127.0.0.1:5173" : "http://127.0.0.1:4173")
).replace(/\/+$/, "");
const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const LOCALES: Locale[] = ["en", "fr"];
const OG_LOCALE: Record<Locale, string> = { en: "en_US", fr: "fr_FR" };

export type RouteKey =
  | { kind: "home" }
  | { kind: "debates" }
  | { kind: "method" }
  | { kind: "debate"; slug: string }
  | { kind: "notfound" };

export function pathForRoute(r: RouteKey): string {
  switch (r.kind) {
    case "home":
      return "/";
    case "debates":
      return "/debates";
    case "method":
      return "/method";
    case "debate":
      return `/debates/${r.slug}`;
    case "notfound":
      return "/404";
  }
}

export function urlFor(localePath: string, locale: Locale): string {
  const clean = localePath === "/" ? "" : localePath;
  const path = locale === "fr" ? `/fr${clean}` : clean;
  return `${SITE_ORIGIN}${path === "" ? "/" : path}`;
}

function clamp(s: string, max = 160): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${cut.slice(0, sp > 80 ? sp : max).trimEnd()}…`;
}

export type HeadModel = {
  lang: Locale;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogType: "website" | "article";
  ogUrl: string;
  ogLocale: string;
  ogLocaleAlternate: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  robots?: string;
  alternates: { hreflang: string; href: string }[];
};

export function buildHead(
  route: RouteKey,
  locale: Locale,
  debate?: DebateMeta,
  options: { debateLookupUnavailable?: boolean } = {},
): HeadModel {
  const t = dictionaries[locale];
  const other: Locale = locale === "en" ? "fr" : "en";
  const localePath = pathForRoute(route);
  const canonical = urlFor(localePath, locale);

  let title = t.meta.titleHome;
  let description = t.meta.descriptionShort;
  let ogTitle = t.meta.ogTitle;
  let ogDescription = t.meta.ogDescription;
  let ogType: HeadModel["ogType"] = "website";
  let robots: string | undefined;

  switch (route.kind) {
    case "debates":
      title = t.meta.titleDebates;
      description = t.meta.descriptionDebates;
      ogTitle = title;
      ogDescription = description;
      break;
    case "method":
      title = t.meta.titleMethod;
      description = t.meta.descriptionMethod;
      ogTitle = title;
      ogDescription = description;
      break;
    case "notfound":
      title = t.meta.titleNotFound;
      description = t.meta.descriptionNotFound;
      ogTitle = title;
      ogDescription = description;
      robots = "noindex,follow";
      break;
    case "debate": {
      if (!debate) {
        if (!options.debateLookupUnavailable) {
          return buildHead({ kind: "notfound" }, locale);
        }
        // The client may still be loading a backend-only debate, or the live
        // corpus may be temporarily unavailable. Keep the requested canonical
        // instead of falsely declaring /404, but do not index an unresolved page.
        title = t.meta.titleDebates;
        description = t.meta.descriptionDebates;
        ogTitle = title;
        ogDescription = description;
        robots = "noindex,follow";
        break;
      }
      title = `${debate.question} — Parallax`;
      const raw = (debate.summary ?? "").trim();
      description = raw.length ? raw : `${debate.question} ${t.meta.debateTail}`;
      ogTitle = debate.question;
      ogDescription = description;
      ogType = "article";
      break;
    }
  }

  description = clamp(description);
  ogDescription = clamp(ogDescription);

  return {
    lang: locale,
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogType,
    ogUrl: canonical,
    ogLocale: OG_LOCALE[locale],
    ogLocaleAlternate: OG_LOCALE[other],
    ogImage: OG_IMAGE,
    twitterTitle: title,
    twitterDescription: ogDescription,
    twitterImage: OG_IMAGE,
    robots,
    alternates: [
      { hreflang: "en", href: urlFor(localePath, "en") },
      { hreflang: "fr", href: urlFor(localePath, "fr") },
      { hreflang: "x-default", href: urlFor(localePath, "en") },
    ],
  };
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Server/Node-side: the per-page head tag block injected by the prerender. */
export function renderHeadTags(
  route: RouteKey,
  locale: Locale,
  debate?: DebateMeta,
): string {
  const h = buildHead(route, locale, debate);
  const m = (a: string, k: string, v: string) =>
    `<meta ${a}="${k}" content="${esc(v)}" data-pxh="1" />`;
  const lines = [
    `<title data-pxh="1">${esc(h.title)}</title>`,
    m("name", "description", h.description),
    `<link rel="canonical" href="${esc(h.canonical)}" data-pxh="1" />`,
    ...(h.robots ? [m("name", "robots", h.robots)] : []),
    m("property", "og:title", h.ogTitle),
    m("property", "og:description", h.ogDescription),
    m("property", "og:type", h.ogType),
    m("property", "og:url", h.ogUrl),
    m("property", "og:locale", h.ogLocale),
    m("property", "og:locale:alternate", h.ogLocaleAlternate),
    m("property", "og:image", h.ogImage),
    m("name", "twitter:title", h.twitterTitle),
    m("name", "twitter:description", h.twitterDescription),
    m("name", "twitter:image", h.twitterImage),
    ...h.alternates.map(
      (a) =>
        `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" data-pxh="alt" />`,
    ),
  ];
  return lines.join("\n    ");
}

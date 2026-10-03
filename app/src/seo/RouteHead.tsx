/* eslint-disable react-refresh/only-export-components -- routeFromPath is a pure
   helper exported alongside the RouteHead component for the prerender's use. */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildHead, type RouteKey, type DebateMeta } from "./head";
import { getDebates, slugOf } from "../data";
import { useI18n } from "../i18n";
import { unlocalizedPath } from "../i18n/paths";

/** Map a (locale-stripped) pathname to the SEO route key. */
export function routeFromPath(pathname: string): RouteKey {
  const p = unlocalizedPath(pathname).replace(/\/+$/, "") || "/";
  if (p === "/") return { kind: "home" };
  if (p === "/debates") return { kind: "debates" };
  if (p.startsWith("/debates/"))
    return { kind: "debate", slug: p.slice("/debates/".length).replace(/\/$/, "") };
  if (p === "/method") return { kind: "method" };
  if (p === "/projet") return { kind: "project" };
  if (p === "/mentions-legales") return { kind: "legal" };
  if (p === "/confidentialite") return { kind: "privacy" };
  if (p === "/contact") return { kind: "contact" };
  return { kind: "notfound" };
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("data-pxh", "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    el.setAttribute("data-pxh", "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function apply(
  route: RouteKey,
  locale: "en" | "fr",
  debate?: DebateMeta,
  debateLookupUnavailable = false,
) {
  const h = buildHead(route, locale, debate, { debateLookupUnavailable });
  document.documentElement.lang = h.lang;
  document.title = h.title;
  upsertMeta("name", "description", h.description);
  upsertCanonical(h.canonical);
  if (h.robots) upsertMeta("name", "robots", h.robots);
  else document.head.querySelector('meta[name="robots"]')?.remove();
  upsertMeta("property", "og:title", h.ogTitle);
  upsertMeta("property", "og:description", h.ogDescription);
  upsertMeta("property", "og:type", h.ogType);
  upsertMeta("property", "og:url", h.ogUrl);
  upsertMeta("property", "og:locale", h.ogLocale);
  upsertMeta("property", "og:locale:alternate", h.ogLocaleAlternate);
  upsertMeta("property", "og:image", h.ogImage);
  upsertMeta("name", "twitter:title", h.twitterTitle);
  upsertMeta("name", "twitter:description", h.twitterDescription);
  upsertMeta("name", "twitter:image", h.twitterImage);
  document.head.querySelectorAll('link[data-pxh="alt"]').forEach((n) => n.remove());
  for (const a of h.alternates) {
    const l = document.createElement("link");
    l.setAttribute("rel", "alternate");
    l.setAttribute("hreflang", a.hreflang);
    l.setAttribute("href", a.href);
    l.setAttribute("data-pxh", "alt");
    document.head.appendChild(l);
  }
}

/** Mounted once under the router + i18n provider; re-asserts the head on every
 *  client navigation. All writes are in an effect → never runs under prerender. */
export function RouteHead() {
  const { pathname } = useLocation();
  const { locale } = useI18n();
  const debates = getDebates(locale);
  const route = routeFromPath(pathname);
  let debate: DebateMeta | undefined;
  if (route.kind === "debate") {
    const d = debates.find((x) => slugOf(x) === route.slug);
    if (d)
      debate = { slug: route.slug, question: d.topic.question, summary: d.topic.summary };
  }
  const debateLookupUnavailable = false;
  const key = [
    route.kind,
    route.kind === "debate" ? route.slug : "",
    debate?.question ?? "",
    debate?.summary ?? "",
    debateLookupUnavailable ? "unavailable" : "resolved",
  ].join(":");
  useEffect(() => {
    apply(route, locale, debate, debateLookupUnavailable);
    // route/debate reconstructed each render; `key` captures their identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, locale]);
  return null;
}

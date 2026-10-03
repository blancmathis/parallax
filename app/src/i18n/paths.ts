import type { Locale } from "./index";

const translatedPaths: Record<string, string> = {
  "/projet": "/project",
  "/mentions-legales": "/legal",
  "/confidentialite": "/privacy",
};

/** French is unprefixed; English has its own /en route tree. */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

export function unlocalizedPath(pathname: string): string {
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return Object.entries(translatedPaths).find(([, en]) => en === path)?.[0] ?? path;
}

export function localizedPath(pathname: string, locale: Locale): string {
  const path = unlocalizedPath(pathname);
  if (locale === "fr") return path;
  return path === "/" ? "/en/" : `/en${translatedPaths[path] ?? path}`;
}

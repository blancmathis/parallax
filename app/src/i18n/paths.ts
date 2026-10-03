import type { Locale } from "./index";

/** French is unprefixed; English has its own /en route tree. */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

export function unlocalizedPath(pathname: string): string {
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return path === "/project" ? "/projet" : path;
}

export function localizedPath(pathname: string, locale: Locale): string {
  const path = unlocalizedPath(pathname);
  if (locale === "fr") return path;
  if (path === "/projet") return "/en/project";
  return path === "/" ? "/en/" : `/en${path}`;
}

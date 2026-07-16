/* eslint-disable react-refresh/only-export-components -- co-locates the link
   components with their helper hooks; HMR granularity is not a concern here. */
import { forwardRef } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateOptions,
  type To,
} from "react-router-dom";
import { useI18n } from "./index";

/**
 * Locale-aware routing. Locale is URL-derived (EN at `/`, FR under `/fr`), so
 * every internal link must carry the prefix in FR. Rather than wrap ~30 call
 * sites by hand, components import `LocaleLink as Link` / `LocaleNavLink as
 * NavLink` and the prefix is applied here. Non-internal targets (mailto:, http,
 * #hash, already-localized) pass through untouched.
 */
export function useLocalePath() {
  const { locale } = useI18n();
  return (to: To): To => {
    if (locale !== "fr" || typeof to !== "string") return to;
    if (!to.startsWith("/")) return to; // mailto:, http(s):, #hash, relative
    if (to === "/fr" || to.startsWith("/fr/")) return to; // already localized
    return to === "/" ? "/fr" : `/fr${to}`;
  };
}

export const LocaleLink = forwardRef<HTMLAnchorElement, LinkProps>(
  function LocaleLink({ to, ...rest }, ref) {
    const lp = useLocalePath();
    return <Link ref={ref} to={lp(to)} {...rest} />;
  },
);

export const LocaleNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function LocaleNavLink({ to, ...rest }, ref) {
    const lp = useLocalePath();
    return <NavLink ref={ref} to={lp(to)} {...rest} />;
  },
);

/** `useNavigate` that prefixes internal string/`To` targets with the locale. */
export function useLocaleNavigate() {
  const navigate = useNavigate();
  const lp = useLocalePath();
  return (to: To, opts?: NavigateOptions) => navigate(lp(to), opts);
}

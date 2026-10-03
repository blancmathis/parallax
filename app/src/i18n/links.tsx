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
import { localizedPath } from "./paths";

/**
 * Locale-aware routing. Locale is URL-derived (FR at `/`, EN under `/en/`), so
 * every internal link must carry the prefix in EN. Rather than wrap ~30 call
 * sites by hand, components import `LocaleLink as Link` / `LocaleNavLink as
 * NavLink` and the prefix is applied here. Non-internal targets (mailto:, http,
 * #hash, already-localized) pass through untouched.
 */
export function useLocalePath() {
  const { locale } = useI18n();
  return (to: To): To => {
    if (typeof to !== "string" || !to.startsWith("/")) return to;
    if (to === "/en" || to.startsWith("/en/")) return to;
    return localizedPath(to, locale);
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

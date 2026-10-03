/* eslint-disable react-refresh/only-export-components -- localeFromPath is a
   pure helper shared with the chrome switcher; co-located with the provider. */
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { I18nContext, dictionaries, type Locale } from "./index";
import { localeFromPath } from "./paths";

const STORAGE_KEY = "parallax.locale";

export { localeFromPath } from "./paths";

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);

  // Kept for API/type stability; the locale switcher navigates instead.
  const setLocale = useCallback((_next: Locale) => {
    if (import.meta.env.DEV)
      console.warn("setLocale is a no-op; navigate to change locale.");
  }, []);

  // Browser writes ONLY in effects → never run under prerender/SSR.
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // persistence is best-effort
    }
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { en, type Messages } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "en";

export const dictionaries: Record<Locale, Messages> = {
  en,
  fr,
};

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}

export { I18nProvider } from "./provider";

import { LOCALES, type Locale } from "./types";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

export type { Locale } from "./types";
export { LOCALES, LOCALE_LABELS } from "./types";

export const translations = { en, vi } as const;

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

export function getLocaleFromCookieValue(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}



type Dict = Record<string, unknown>;

function lookup(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let value = lookup(translations[locale] as Dict, key) ?? lookup(translations.en as Dict, key);
  if (value === undefined) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}

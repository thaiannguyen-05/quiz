import { cookies } from "next/headers";

import { DEFAULT_LOCALE, getLocaleFromCookieValue, LOCALE_COOKIE, type Locale } from "./index";

export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    return getLocaleFromCookieValue(store.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export { LOCALE_COOKIE };

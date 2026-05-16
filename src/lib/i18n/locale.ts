import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./types";
import { messages } from "./messages";
import type { Messages } from "./messages/de";
import { createT, type TranslateFn } from "./create-t";

export function getLocale(cookieStore: ReadonlyRequestCookies): Locale {
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function createServerT(cookieStore: ReadonlyRequestCookies): TranslateFn {
  const locale = getLocale(cookieStore);
  return createT(getMessages(locale));
}

import config from "@payload-config";
import { getPayload, type Payload } from "payload";
import { type Locale, routing } from "@/i18n/routing";

/*
 * Pages read Payload through the Local API, in server components, without
 * an HTTP request to the site itself (BRIEF.md section 5). getPayload keeps
 * one instance per process, so calling it again is cheap.
 */
export const payloadClient = (): Promise<Payload> => getPayload({ config });

/**
 * Options for every read from the site:
 * - the page's locale, German where an English field is empty;
 * - access as an anonymous visitor, never more than the public sees.
 */
export const readOptions = (locale: Locale) =>
  ({
    locale,
    fallbackLocale: routing.defaultLocale,
    overrideAccess: false,
  }) as const;

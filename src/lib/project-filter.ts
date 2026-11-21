import type { Locale } from "@/i18n/routing";

/*
 * The filter of /referenzen by service. It is a set of plain links with
 * the service in the address (?leistung=kuechen, /en/projects?service=kitchens),
 * so it works without JavaScript and every filtered list has its own URL.
 */

/** The name of the query parameter, in the page's language. */
export const PROJECT_FILTER_PARAM: Record<Locale, string> = {
  de: "leistung",
  en: "service",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The service the address asks for, or null for all projects. An unknown
 * slug, an empty value or the parameter given twice count as no filter.
 */
export function selectedService<T extends { slug: string }>(
  searchParams: SearchParams,
  locale: Locale,
  services: readonly T[],
): T | null {
  const value = searchParams[PROJECT_FILTER_PARAM[locale]];
  if (typeof value !== "string") return null;
  return services.find(({ slug }) => slug === value) ?? null;
}

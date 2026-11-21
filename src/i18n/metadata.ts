import type { Metadata } from "next";
import { getPathname } from "./navigation";
import { type Locale, routing } from "./routing";

type PathHref = Parameters<typeof getPathname>[0]["href"];

/**
 * canonical and the language alternates of a page, BRIEF.md section 5.
 * `hrefFor` gives the page's route per language: the same route for static
 * pages, the translated slug for services, projects and jobs.
 * Paths are relative; metadataBase in the layout makes them absolute.
 */
export function pageAlternates(
  locale: Locale,
  hrefFor: (locale: Locale) => PathHref,
): NonNullable<Metadata["alternates"]> {
  const path = (code: Locale) =>
    getPathname({ locale: code, href: hrefFor(code) });

  return {
    canonical: path(locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((code) => [code, path(code)])),
      "x-default": path(routing.defaultLocale),
    },
  };
}

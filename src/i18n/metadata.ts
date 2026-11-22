import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "./navigation";
import { type Locale, routing } from "./routing";

type PathHref = Parameters<typeof getPathname>[0]["href"];

/** Open Graph wants language_TERRITORY; the English texts are British. */
const OG_LOCALE: Record<Locale, string> = {
  de: "de_DE",
  en: "en_GB",
};

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

/**
 * The alternates and the Open Graph data of a page. og:url is the
 * canonical URL. og:title and og:description are left out on purpose:
 * Next.js fills them from the page's resolved title and description, so
 * they never differ from <title>. The preview images come in stage 6.
 */
export async function pageMetadata(
  locale: Locale,
  hrefFor: (locale: Locale) => PathHref,
): Promise<Pick<Metadata, "alternates" | "openGraph">> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    alternates: pageAlternates(locale, hrefFor),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((code) => code !== locale)
        .map((code) => OG_LOCALE[code]),
      url: getPathname({ locale, href: hrefFor(locale) }),
    },
  };
}

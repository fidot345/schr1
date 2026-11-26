import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PREVIEW_SIZE,
  PREVIEW_TYPE,
  type Preview,
  sitePreview,
} from "@/lib/preview";
import { type PathHref, pagePaths } from "./page-paths";
import { type Locale, routing } from "./routing";

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
  const paths = pagePaths(hrefFor);

  return {
    canonical: paths[locale],
    languages: {
      ...paths,
      "x-default": paths[routing.defaultLocale],
    },
  };
}

/**
 * The alternates, the Open Graph data and the X card of a page. og:url is
 * the canonical URL. og:title and og:description are left out on purpose:
 * Next.js fills them from the page's resolved title and description, so
 * they never differ from <title>. og:image is the page's preview image
 * (src/lib/preview.ts): the site's image unless the page passes its own,
 * as the home page and the jobs do. X takes the title, the description and
 * the image from Open Graph (Next.js fills twitter:* from it); only the
 * size of the card is set here.
 */
export async function pageMetadata(
  locale: Locale,
  hrefFor: (locale: Locale) => PathHref,
  preview?: Preview,
): Promise<Pick<Metadata, "alternates" | "openGraph" | "twitter">> {
  const [t, image] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    preview ?? sitePreview(locale),
  ]);

  return {
    alternates: pageAlternates(locale, hrefFor),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((code) => code !== locale)
        .map((code) => OG_LOCALE[code]),
      url: pagePaths(hrefFor)[locale],
      images: [
        {
          url: image.path,
          ...PREVIEW_SIZE,
          type: PREVIEW_TYPE,
          alt: image.alt,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

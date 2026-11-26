import type { MetadataRoute } from "next";
import { type PathHref, pagePaths } from "@/i18n/page-paths";
import { type Locale, routing } from "@/i18n/routing";
import { getSitemapSlugs } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

/*
 * /sitemap.xml, BRIEF.md section 5: every public page in both languages,
 * each address with the alternates of its page (hreflang), as in the
 * pages' <head>. The thank-you pages are noindex and stay out. It is the
 * same with and without SITE_INDEXING; in the demo robots.txt neither
 * names it nor lets anyone read it.
 */

/** The pages with a fixed address. */
const STATIC_PAGES = [
  "/",
  "/leistungen",
  "/referenzen",
  "/ueber-uns",
  "/karriere",
  "/anfrage",
  "/kontakt",
  "/impressum",
  "/datenschutz",
] as const satisfies readonly PathHref[];

type HrefFor = (locale: Locale) => PathHref;

/** A page with a slug: its route with the slug of each language. */
const withSlug =
  (
    pathname: "/leistungen/[slug]" | "/referenzen/[slug]" | "/karriere/[slug]",
  ) =>
  (slugs: Record<Locale, string>): HrefFor =>
  (locale) => ({ pathname, params: { slug: slugs[locale] } });

/** One entry per language, each with all versions of the page. */
const entries = (hrefFor: HrefFor): MetadataRoute.Sitemap => {
  const paths = pagePaths(hrefFor);
  const languages = {
    ...Object.fromEntries(
      routing.locales.map((code) => [code, absoluteUrl(paths[code])]),
    ),
    "x-default": absoluteUrl(paths[routing.defaultLocale]),
  };

  return routing.locales.map((locale) => ({
    url: absoluteUrl(paths[locale]),
    alternates: { languages },
  }));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, projects, jobs } = await getSitemapSlugs();

  return [
    ...STATIC_PAGES.map((pathname) => (): PathHref => pathname),
    ...services.map(withSlug("/leistungen/[slug]")),
    ...projects.map(withSlug("/referenzen/[slug]")),
    ...jobs.map(withSlug("/karriere/[slug]")),
  ].flatMap(entries);
}

import type { getPathname } from "./navigation";
import { type Locale, routing } from "./routing";

/** A route of the site as getPathname takes it: a pathname, with params for a slug. */
export type Href = Parameters<typeof getPathname>[0]["href"];
type Pathname = keyof typeof routing.pathnames;
export type SlugPathname = Extract<Pathname, `${string}/[slug]`>;

/** A slug of this language → the same page's slug in another language. */
export type SlugMap = Record<string, string>;

/**
 * Translated slugs per route and target language, for example
 * { "/leistungen/[slug]": { en: { kuechen: "kitchens" } } } on a German page.
 */
export type SlugTranslations = Partial<
  Record<SlugPathname, Partial<Record<Locale, SlugMap>>>
>;

export const isSlugPathname = (pathname: Pathname): pathname is SlugPathname =>
  pathname.endsWith("/[slug]");

/**
 * The current page as an href that next-intl can translate into another
 * locale. `pathname` is the internal pathname from next-intl's usePathname
 * ("/leistungen/[slug]"), `params` the route params from useParams.
 *
 * `slugMap` translates the slug for the target language (services,
 * projects, jobs have their own slug per language). A slug it does not
 * know is kept as it is.
 *
 * An address that is no route of the site (the 404 of /gibt-es-nicht, where
 * usePathname returns the address itself) has no counterpart in the other
 * language, so the switch leads to that language's home page.
 */
export function localeSwitchHref(
  pathname: Pathname,
  params: Record<string, string | string[] | undefined>,
  slugMap?: SlugMap,
): Href {
  if (!Object.hasOwn(routing.pathnames, pathname)) {
    return "/";
  }
  if (!isSlugPathname(pathname)) {
    return pathname;
  }

  const { slug } = params;
  if (typeof slug !== "string") {
    return "/";
  }
  const translated =
    slugMap && Object.hasOwn(slugMap, slug) ? slugMap[slug] : undefined;
  return { pathname, params: { slug: translated ?? slug } };
}

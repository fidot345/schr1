import type { ComponentProps } from "react";
import type { Link } from "./navigation";
import type { Locale, routing } from "./routing";

export type Href = ComponentProps<typeof Link>["href"];
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
 */
export function localeSwitchHref(
  pathname: Pathname,
  params: Record<string, string | string[] | undefined>,
  slugMap?: SlugMap,
): Href {
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

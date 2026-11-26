import { getPathname } from "./navigation";
import { type Locale, routing } from "./routing";

/** A route of the site: a pathname of routing.ts, with params for a slug. */
export type PathHref = Parameters<typeof getPathname>[0]["href"];

/**
 * The path of one page in every language. `hrefFor` gives the page's route
 * per language: the same route for static pages, the translated slug for
 * services, projects and jobs. /leistungen/kuechen ↔ /en/services/kitchens.
 */
export const pagePaths = (
  hrefFor: (locale: Locale) => PathHref,
): Record<Locale, string> =>
  Object.fromEntries(
    routing.locales.map((code) => [
      code,
      getPathname({ locale: code, href: hrefFor(code) }),
    ]),
  ) as Record<Locale, string>;

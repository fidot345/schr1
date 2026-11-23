import { useParams } from "next/navigation";
import { usePathname } from "./navigation";
import { routing } from "./routing";

type Pathname = keyof typeof routing.pathnames;

const PATHNAMES = Object.keys(routing.pathnames) as Pathname[];

/**
 * The route template of the current page ("/leistungen/[slug]").
 *
 * next-intl's usePathname returns the template only when it can match the
 * address against the current language's paths. While an English page is
 * prerendered it sees the internal address ("/en/leistungen/kitchens"),
 * which matches no English path, and returns "/leistungen/kitchens". In
 * the browser it returns the template. Matching that raw address with the
 * page's slug gives the template on the server too, so the HTML and the
 * hydrated page agree.
 */
export function resolveRoutePathname(
  pathname: Pathname,
  slug: unknown,
): Pathname {
  if (Object.hasOwn(routing.pathnames, pathname) || typeof slug !== "string") {
    return pathname;
  }
  const template = PATHNAMES.find(
    (key) =>
      key.endsWith("/[slug]") && key.replace("[slug]", slug) === pathname,
  );
  return template ?? pathname;
}

/** usePathname from next-intl, always as the route template. */
export function useRoutePathname(): Pathname {
  const pathname = usePathname();
  const { slug } = useParams();
  return resolveRoutePathname(pathname, slug);
}

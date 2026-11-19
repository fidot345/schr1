import type { ComponentProps } from "react";
import type { Link } from "./navigation";
import type { routing } from "./routing";

export type Href = ComponentProps<typeof Link>["href"];
type Pathname = keyof typeof routing.pathnames;
type SlugPathname = Extract<Pathname, `${string}/[slug]`>;

const isSlugPathname = (pathname: Pathname): pathname is SlugPathname =>
  pathname.endsWith("/[slug]");

/**
 * The current page as an href that next-intl can translate into another
 * locale. `pathname` is the internal pathname from next-intl's usePathname
 * ("/leistungen/[slug]"), `params` the route params from useParams.
 *
 * The slug is kept as it is. Pages whose slug differs between languages
 * (services, projects, jobs) pass the other language's href to the switcher.
 */
export function localeSwitchHref(
  pathname: Pathname,
  params: Record<string, string | string[] | undefined>,
): Href {
  if (!isSlugPathname(pathname)) {
    return pathname;
  }

  const { slug } = params;
  return typeof slug === "string" ? { pathname, params: { slug } } : "/";
}

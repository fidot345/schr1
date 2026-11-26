import { routing } from "@/i18n/routing";

/*
 * A stand-in for src/i18n/navigation.ts, whose next-intl navigation needs
 * the Next.js runtime:
 *
 *   vi.mock("@/i18n/navigation", () => import("./support/navigation"));
 */

type Internal = keyof typeof routing.pathnames;

/**
 * Paths from routing.pathnames the way next-intl builds them: German
 * without a prefix, English under /en. The real paths are checked in the
 * built pages (tests/e2e/metadata.spec.ts).
 */
export const getPathname = ({
  locale,
  href,
}: {
  locale: "de" | "en";
  href: Internal | { pathname: Internal; params?: Record<string, string> };
}): string => {
  const internal = typeof href === "string" ? href : href.pathname;
  const params = typeof href === "string" ? {} : (href.params ?? {});
  const path = Object.entries(params).reduce(
    (result, [key, value]) => result.replace(`[${key}]`, value),
    routing.pathnames[internal][locale] as string,
  );
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
};

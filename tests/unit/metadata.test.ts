import { describe, expect, it, vi } from "vitest";
import { pageAlternates } from "@/i18n/metadata";

/*
 * next-intl's navigation needs the Next.js runtime. The stand-in builds
 * paths from routing.pathnames the same way: German without a prefix,
 * English under /en. The real paths are checked in the built pages.
 */
vi.mock("@/i18n/navigation", async () => {
  const { routing } = await import("@/i18n/routing");
  type Internal = keyof typeof routing.pathnames;
  return {
    getPathname: ({
      locale,
      href,
    }: {
      locale: "de" | "en";
      href: Internal | { pathname: Internal; params?: Record<string, string> };
    }) => {
      const internal = typeof href === "string" ? href : href.pathname;
      const params = typeof href === "string" ? {} : (href.params ?? {});
      const path = Object.entries(params).reduce(
        (result, [key, value]) => result.replace(`[${key}]`, value),
        routing.pathnames[internal][locale] as string,
      );
      if (locale === routing.defaultLocale) return path;
      return path === "/" ? `/${locale}` : `/${locale}${path}`;
    },
  };
});

describe("pageAlternates", () => {
  it("gives a static page its translated paths", () => {
    expect(pageAlternates("de", () => "/leistungen")).toEqual({
      canonical: "/leistungen",
      languages: {
        de: "/leistungen",
        en: "/en/services",
        "x-default": "/leistungen",
      },
    });
    expect(pageAlternates("en", () => "/leistungen").canonical).toBe(
      "/en/services",
    );
  });

  it("puts each language's own slug into a service page", () => {
    const slugs = { de: "kuechen", en: "kitchens" } as const;
    const alternates = pageAlternates("en", (code) => ({
      pathname: "/leistungen/[slug]",
      params: { slug: slugs[code] },
    }));
    expect(alternates).toEqual({
      canonical: "/en/services/kitchens",
      languages: {
        de: "/leistungen/kuechen",
        en: "/en/services/kitchens",
        "x-default": "/leistungen/kuechen",
      },
    });
  });

  it("keeps the home page at / and /en", () => {
    expect(pageAlternates("de", () => "/").languages).toEqual({
      de: "/",
      en: "/en",
      "x-default": "/",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { pageAlternates, pageMetadata } from "@/i18n/metadata";

vi.mock("next-intl/server", () => import("./support/translations"));
vi.mock("@/i18n/navigation", () => import("./support/navigation"));

const TAGLINE = vi.hoisted(() => ({
  de: "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
  en: "Joinery with its own workshop in Wendelfing, since 1989.",
}));

vi.mock("@/lib/content", () => ({
  getSiteSettings: async (locale: "de" | "en") => ({
    company: { logoWord: "Tannrieder" },
    tagline: TAGLINE[locale],
  }),
}));

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

describe("pageMetadata", () => {
  it("gives Open Graph the canonical URL and both languages", async () => {
    const slugs = { de: "kuechen", en: "kitchens" } as const;
    const metadata = await pageMetadata("en", (code) => ({
      pathname: "/leistungen/[slug]",
      params: { slug: slugs[code] },
    }));
    expect(metadata.alternates).toEqual(
      pageAlternates("en", (code) => ({
        pathname: "/leistungen/[slug]",
        params: { slug: slugs[code] },
      })),
    );
    expect(metadata.openGraph).toEqual({
      type: "website",
      siteName: "Schreinerei Tannrieder",
      locale: "en_GB",
      alternateLocale: ["de_DE"],
      url: "/en/services/kitchens",
      images: [
        {
          url: "/en/og/site.png",
          width: 1200,
          height: 630,
          type: "image/png",
          alt: `Schreinerei Tannrieder: ${TAGLINE.en}`,
        },
      ],
    });
  });

  it("gives the site's image in the page's language to a page without its own", async () => {
    const { openGraph } = await pageMetadata("de", () => "/kontakt");
    expect(openGraph?.images).toEqual([
      expect.objectContaining({
        url: "/de/og/site.png",
        alt: `Schreinerei Tannrieder: ${TAGLINE.de}`,
      }),
    ]);
  });

  it("takes the page's own image when it has one", async () => {
    const { openGraph } = await pageMetadata("de", () => "/", {
      path: "/de/og/home.png",
      alt: "Startseite",
      content: {
        descriptor: "Schreinerei",
        logoWord: "Tannrieder",
        title: "T",
      },
    });
    expect(openGraph?.images).toEqual([
      {
        url: "/de/og/home.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Startseite",
      },
    ]);
  });

  it("asks X for the large card; Next.js fills it from Open Graph", async () => {
    const { twitter } = await pageMetadata("en", () => "/");
    expect(twitter).toEqual({ card: "summary_large_image" });
  });

  it("leaves the title and description to the page", async () => {
    const { openGraph } = await pageMetadata("de", () => "/");
    expect(openGraph).toMatchObject({ locale: "de_DE", url: "/" });
    expect(openGraph).not.toHaveProperty("title");
    expect(openGraph).not.toHaveProperty("description");
  });
});

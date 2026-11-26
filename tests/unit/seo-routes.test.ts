import type { MetadataRoute } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { absoluteUrl, robotsMetadata, siteIndexing } from "@/lib/seo";

vi.mock("@/i18n/navigation", () => import("./support/navigation"));
vi.mock("@/lib/content", () => ({
  getSitemapSlugs: async () => ({
    services: [
      { de: "kuechen", en: "kitchens" },
      { de: "einbauschraenke", en: "built-in-wardrobes" },
    ],
    projects: [{ de: "wohnkueche-in-eiche", en: "open-plan-kitchen-in-oak" }],
    jobs: [{ de: "schreiner", en: "joiner" }],
  }),
}));

const SITE = "https://schr1.vercel.app";

/** The demo (SITE_INDEXING unset, empty or not "true") and the open site. */
const DEMO_VALUES = [undefined, "", "false", "1", "yes", "TRUE"];

const setIndexing = (value: string | undefined) => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
  vi.stubEnv("SITE_INDEXING", value);
};

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * Whether robots.txt closes a path to every crawler: the longest matching
 * rule wins, as Google reads it, and Allow wins a tie.
 */
const isClosed = (result: MetadataRoute.Robots, path: string): boolean => {
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const list = (value: string | string[] | undefined) =>
    value === undefined ? [] : [value].flat();
  let best = { length: -1, closed: false };
  for (const rule of rules.filter((rule) =>
    list(rule.userAgent).includes("*"),
  )) {
    for (const [prefixes, closed] of [
      [list(rule.allow), false],
      [list(rule.disallow), true],
    ] as const) {
      for (const prefix of prefixes) {
        if (!path.startsWith(prefix)) continue;
        if (
          prefix.length > best.length ||
          (prefix.length === best.length && !closed)
        ) {
          best = { length: prefix.length, closed };
        }
      }
    }
  }
  return best.closed;
};

describe("SITE_INDEXING", () => {
  it.each(DEMO_VALUES)("%j is the demo", (value) => {
    setIndexing(value);
    expect(siteIndexing()).toBe(false);
  });

  it('"true" lets search engines in', () => {
    setIndexing("true");
    expect(siteIndexing()).toBe(true);
    setIndexing(" true ");
    expect(siteIndexing()).toBe(true);
  });

  it("makes every page noindex, nofollow in the demo, also one with its own rule", () => {
    setIndexing("false");
    expect(robotsMetadata()).toEqual({ index: false, follow: false });
    expect(robotsMetadata({ index: false, follow: true })).toEqual({
      index: false,
      follow: false,
    });
  });

  it("leaves the pages their own rule with SITE_INDEXING=true", () => {
    setIndexing("true");
    expect(robotsMetadata()).toBeUndefined();
    expect(robotsMetadata({ index: false, follow: true })).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("absoluteUrl", () => {
  it("puts NEXT_PUBLIC_SITE_URL in front of a path", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    expect(absoluteUrl("/en/careers/joiner")).toBe(`${SITE}/en/careers/joiner`);
  });

  it("leaves the path relative without it, instead of making one up", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(absoluteUrl("/kontakt")).toBe("/kontakt");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "no url");
    expect(absoluteUrl("/kontakt")).toBe("/kontakt");
  });
});

describe("robots.txt", () => {
  it.each(DEMO_VALUES)(
    "closes the whole site and names no sitemap with SITE_INDEXING=%j",
    (value) => {
      setIndexing(value);
      expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    },
  );

  it("opens the site and names the sitemap with SITE_INDEXING=true", () => {
    setIndexing("true");
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      sitemap: `${SITE}/sitemap.xml`,
    });
  });

  it.each([
    ["demo", "false"],
    ["open site", "true"],
  ])("keeps /admin and /api closed: %s", (_, value) => {
    setIndexing(value);
    const result = robots();
    for (const path of ["/admin", "/admin/login", "/api", "/api/media/x"]) {
      expect(isClosed(result, path), path).toBe(true);
    }
    for (const path of ["/", "/en/careers/joiner", "/kontakt"]) {
      expect(isClosed(result, path), path).toBe(value !== "true");
    }
  });

  it("leaves the sitemap out without NEXT_PUBLIC_SITE_URL", () => {
    setIndexing("true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(robots()).not.toHaveProperty("sitemap");
  });
});

describe("sitemap.xml", () => {
  const urls = (entries: MetadataRoute.Sitemap) =>
    entries.map((entry) => entry.url);

  it.each([
    ["demo", "false"],
    ["open site", "true"],
  ])("lists every public page in both languages: %s", async (_, value) => {
    setIndexing(value);
    const entries = await sitemap();

    expect(urls(entries)).toEqual([
      `${SITE}/`,
      `${SITE}/en`,
      `${SITE}/leistungen`,
      `${SITE}/en/services`,
      `${SITE}/referenzen`,
      `${SITE}/en/projects`,
      `${SITE}/ueber-uns`,
      `${SITE}/en/about`,
      `${SITE}/karriere`,
      `${SITE}/en/careers`,
      `${SITE}/anfrage`,
      `${SITE}/en/request`,
      `${SITE}/kontakt`,
      `${SITE}/en/contact`,
      `${SITE}/impressum`,
      `${SITE}/en/imprint`,
      `${SITE}/datenschutz`,
      `${SITE}/en/privacy`,
      `${SITE}/leistungen/kuechen`,
      `${SITE}/en/services/kitchens`,
      `${SITE}/leistungen/einbauschraenke`,
      `${SITE}/en/services/built-in-wardrobes`,
      `${SITE}/referenzen/wohnkueche-in-eiche`,
      `${SITE}/en/projects/open-plan-kitchen-in-oak`,
      `${SITE}/karriere/schreiner`,
      `${SITE}/en/careers/joiner`,
    ]);
  });

  it("is the same with and without SITE_INDEXING", async () => {
    setIndexing("false");
    const demo = await sitemap();
    setIndexing("true");
    expect(await sitemap()).toEqual(demo);
  });

  it("gives both versions of a page their hreflang alternates", async () => {
    setIndexing("false");
    const entries = await sitemap();
    const job = {
      de: `${SITE}/karriere/schreiner`,
      en: `${SITE}/en/careers/joiner`,
      "x-default": `${SITE}/karriere/schreiner`,
    };

    for (const url of [job.de, job.en]) {
      expect(entries.find((entry) => entry.url === url)?.alternates).toEqual({
        languages: job,
      });
    }
    expect(
      entries.find((entry) => entry.url === `${SITE}/en`)?.alternates,
    ).toEqual({
      languages: { de: `${SITE}/`, en: `${SITE}/en`, "x-default": `${SITE}/` },
    });
  });

  it("leaves out the noindex thank-you pages", async () => {
    setIndexing("false");
    for (const url of urls(await sitemap())) {
      expect(url).not.toMatch(/danke|thank-you/);
    }
  });
});

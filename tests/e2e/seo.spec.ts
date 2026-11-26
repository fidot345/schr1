import { expect, type Page, test } from "@playwright/test";

/*
 * Search engines in the demo, BRIEF.md sections 5 and 7: e2e runs against
 * a build without SITE_INDEXING=true (as production), so every page is
 * noindex, nofollow in its <head> and in the X-Robots-Tag header, and
 * robots.txt closes the site. Plus the sitemap, the preview images and the
 * Google markup of the pages.
 */

const NOINDEX = "noindex, nofollow";

/** Every kind of page, both languages, the thank-you pages and a 404. */
const PAGES = [
  "/",
  "/en",
  "/leistungen/kuechen",
  "/en/services/kitchens",
  "/referenzen",
  "/karriere/schreiner",
  "/en/careers/joiner",
  "/kontakt",
  "/anfrage",
  "/anfrage/danke",
  "/en/careers/thank-you",
  "/datenschutz",
  "/gibt-es-nicht",
];

// Absolute with NEXT_PUBLIC_SITE_URL, relative without it.
const pathOf = (url: string) => new URL(url, "http://localhost").pathname;

type Markup = Record<string, unknown> & { "@type": string };

/** The JSON-LD blocks of the open page. */
const markupOf = (page: Page): Promise<Markup[]> =>
  page.$$eval('script[type="application/ld+json"]', (scripts) =>
    scripts.map((script) => JSON.parse(script.textContent ?? "{}")),
  );

const ofType = (markup: Markup[], type: string) =>
  markup.filter((block) => block["@type"] === type);

type Crumb = { position: number; name: string; item: string };

/** A BreadcrumbList as [name, path] pairs, checked to count from 1. */
const trailOf = (markup: Markup[]): [string, string][] => {
  const [list] = ofType(markup, "BreadcrumbList");
  const items = (list?.itemListElement ?? []) as Crumb[];
  expect(items.map(({ position }) => position)).toEqual(
    items.map((_, index) => index + 1),
  );
  return items.map(({ name, item }) => [name, pathOf(item)]);
};

/** The content of every robots meta tag of the open page. */
const robotsTags = (page: Page): Promise<string[]> =>
  page
    .locator('meta[name="robots"]')
    .evaluateAll((metas) =>
      metas.map((meta) => meta.getAttribute("content") ?? ""),
    );

test.describe("noindex in the demo", () => {
  for (const path of PAGES) {
    test(`${path} is noindex, nofollow in <head> and header`, async ({
      page,
    }) => {
      const response = await page.goto(path);

      expect(response?.headers()["x-robots-tag"]).toBe(NOINDEX);
      // A 404 has Next.js's own "noindex" next to the demo's tag; search
      // engines follow the strictest of them.
      const tags = await robotsTags(page);
      expect(tags).toContain(NOINDEX);
      expect(tags.filter((tag) => tag !== NOINDEX)).toEqual(
        path === "/gibt-es-nicht" ? ["noindex"] : [],
      );
    });
  }
});

test.describe("robots.txt and sitemap.xml", () => {
  test("robots.txt closes the whole site and names no sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const lines = (await response.text())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    expect(lines).toEqual(["User-Agent: *", "Disallow: /"]);
  });

  test("sitemap.xml lists the pages of both languages with their alternates", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
      pathOf(match[1]),
    );

    for (const path of [
      "/",
      "/en",
      "/leistungen",
      "/en/services",
      "/leistungen/kuechen",
      "/en/services/kitchens",
      "/referenzen/wohnkueche-in-eiche",
      "/en/projects/open-plan-kitchen-in-oak",
      "/karriere/schreiner",
      "/en/careers/joiner",
      "/impressum",
      "/en/privacy",
    ]) {
      expect(locs, path).toContain(path);
    }
    expect(locs.some((path) => /danke|thank-you/.test(path))).toBe(false);
    expect(new Set(locs).size).toBe(locs.length);

    const job = xml.match(
      /<url>\s*<loc>[^<]*\/karriere\/schreiner<\/loc>[\s\S]*?<\/url>/,
    )?.[0];
    expect(job).toMatch(/hreflang="en" href="[^"]*\/en\/careers\/joiner"/);
    expect(job).toMatch(
      /hreflang="x-default" href="[^"]*\/karriere\/schreiner"/,
    );
  });
});

test.describe("preview images", () => {
  for (const path of ["/", "/en/contact", "/karriere/schreiner"]) {
    test(`the og:image of ${path} is a 1200 x 630 PNG`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const url = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      const response = await request.get(pathOf(url ?? ""));

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      const png = await response.body();
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
    });
  }

  test("a job that does not exist has no image", async ({ request }) => {
    const response = await request.get("/de/og/jobs/gibt-es-nicht/image.png");
    expect(response.status()).toBe(404);
  });
});

test.describe("markup for Google", () => {
  test("a job has its JobPosting and the trail to it", async ({ page }) => {
    await page.goto("/karriere/schreiner");
    const markup = await markupOf(page);

    expect(markup.map((block) => block["@type"]).sort()).toEqual([
      "BreadcrumbList",
      "JobPosting",
    ]);
    expect(ofType(markup, "JobPosting")[0]).toMatchObject({
      "@context": "https://schema.org",
      title: "Schreiner (m/w/d)",
      employmentType: "FULL_TIME",
      hiringOrganization: { name: "Schreinerei Tannrieder" },
      jobLocation: { address: { addressLocality: "Wendelfing" } },
    });
    expect(trailOf(markup)).toEqual([
      ["Startseite", "/"],
      ["Karriere", "/karriere"],
      ["Schreiner (m/w/d)", "/karriere/schreiner"],
    ]);
  });

  test("an English job has it in English", async ({ page }) => {
    await page.goto("/en/careers/joiner");
    const markup = await markupOf(page);

    expect(ofType(markup, "JobPosting")[0]).toMatchObject({
      title: "Joiner (m/f/d)",
    });
    expect(trailOf(markup)).toEqual([
      ["Home", "/en"],
      ["Careers", "/en/careers"],
      ["Joiner (m/f/d)", "/en/careers/joiner"],
    ]);
  });

  for (const path of ["/", "/kontakt"]) {
    test(`${path} describes the workshop from SiteSettings`, async ({
      page,
    }) => {
      await page.goto(path);
      const [business] = ofType(
        await markupOf(page),
        "HomeAndConstructionBusiness",
      );

      expect(business).toMatchObject({
        "@context": "https://schema.org",
        name: "Schreinerei Tannrieder",
        telephone: "+498999998412",
        email: "info@tannrieder.example",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Werkstattweg 4",
          postalCode: "85999",
          addressLocality: "Wendelfing",
          addressCountry: "DE",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
            opens: "07:00",
            closes: "16:30",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Friday"],
            opens: "07:00",
            closes: "12:00",
          },
        ],
      });
      expect(business?.areaServed).toMatch(/Wendelfing/);
      expect(pathOf(String(business?.url))).toBe("/");
    });
  }

  test("the inner pages have their trail, the home page has none", async ({
    page,
  }) => {
    const trails: [string, [string, string][]][] = [
      [
        "/leistungen/kuechen",
        [
          ["Startseite", "/"],
          ["Leistungen", "/leistungen"],
          ["Küchen", "/leistungen/kuechen"],
        ],
      ],
      [
        "/en/projects",
        [
          ["Home", "/en"],
          ["Projects", "/en/projects"],
        ],
      ],
      [
        "/impressum",
        [
          ["Startseite", "/"],
          ["Impressum", "/impressum"],
        ],
      ],
    ];
    for (const [path, trail] of trails) {
      await page.goto(path);
      expect(trailOf(await markupOf(page)), path).toEqual(trail);
    }

    await page.goto("/");
    expect(ofType(await markupOf(page), "BreadcrumbList")).toEqual([]);
  });
});

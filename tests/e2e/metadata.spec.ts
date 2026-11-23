import { expect, type Page, test } from "@playwright/test";

/*
 * The metadata of every page type of stage 3 in both languages, BRIEF.md
 * section 5: one title and description, canonical, hreflang and Open Graph.
 * Each page lists its German and English path; canonical and og:url are
 * the page itself, the alternates point to both versions.
 */
const PAGES: [de: string, en: string][] = [
  ["/", "/en"],
  ["/leistungen", "/en/services"],
  ["/leistungen/kuechen", "/en/services/kitchens"],
  ["/referenzen", "/en/projects"],
  ["/referenzen/wohnkueche-in-eiche", "/en/projects/open-plan-kitchen-in-oak"],
  ["/ueber-uns", "/en/about"],
  ["/karriere", "/en/careers"],
  ["/karriere/schreiner", "/en/careers/joiner"],
  ["/kontakt", "/en/contact"],
  ["/impressum", "/en/imprint"],
  ["/datenschutz", "/en/privacy"],
];

type PageMetadata = {
  titles: string[];
  descriptions: string[];
  canonicals: string[];
  alternates: Record<string, string>;
  og: Record<string, string[]>;
};

async function readMetadata(page: Page): Promise<PageMetadata> {
  return page.evaluate(() => {
    const values = (selector: string, attribute: string) =>
      [...document.head.querySelectorAll(selector)].map(
        (element) => element.getAttribute(attribute) ?? "",
      );
    const og: Record<string, string[]> = {};
    for (const meta of document.head.querySelectorAll(
      'meta[property^="og:"]',
    )) {
      const key = meta.getAttribute("property")?.slice(3) ?? "";
      og[key] = [...(og[key] ?? []), meta.getAttribute("content") ?? ""];
    }
    return {
      titles: [...document.head.querySelectorAll("title")].map(
        (title) => title.textContent ?? "",
      ),
      descriptions: values('meta[name="description"]', "content"),
      canonicals: values('link[rel="canonical"]', "href"),
      alternates: Object.fromEntries(
        [
          ...document.head.querySelectorAll('link[rel="alternate"][hreflang]'),
        ].map((link) => [
          link.getAttribute("hreflang"),
          link.getAttribute("href"),
        ]),
      ),
      og,
    };
  });
}

// Absolute with NEXT_PUBLIC_SITE_URL, relative without it.
const pathOf = (url: string) => new URL(url, "http://localhost").pathname;

for (const [de, en] of PAGES) {
  for (const [locale, path] of [
    ["de", de],
    ["en", en],
  ] as const) {
    test(`${path} has its title, description, links and Open Graph`, async ({
      page,
    }) => {
      await page.goto(path);
      const meta = await readMetadata(page);

      expect(meta.titles).toHaveLength(1);
      expect(meta.descriptions).toHaveLength(1);
      expect(meta.descriptions[0]).not.toBe("");
      expect(meta.canonicals).toHaveLength(1);
      expect(pathOf(meta.canonicals[0])).toBe(path);
      expect(Object.keys(meta.alternates).sort()).toEqual([
        "de",
        "en",
        "x-default",
      ]);
      expect(pathOf(meta.alternates.de)).toBe(de);
      expect(pathOf(meta.alternates.en)).toBe(en);
      expect(pathOf(meta.alternates["x-default"])).toBe(de);

      expect(meta.og).toEqual({
        title: meta.titles,
        description: meta.descriptions,
        url: meta.canonicals,
        site_name: ["Schreinerei Tannrieder"],
        locale: [locale === "de" ? "de_DE" : "en_GB"],
        "locale:alternate": [locale === "de" ? "en_GB" : "de_DE"],
        type: ["website"],
      });
    });
  }
}

test("no two pages share a title or a description", async ({ page }) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const path of PAGES.flat()) {
    await page.goto(path);
    const meta = await readMetadata(page);
    expect(titles.get(meta.titles[0]), `title of ${path}`).toBeUndefined();
    expect(
      descriptions.get(meta.descriptions[0]),
      `description of ${path}`,
    ).toBeUndefined();
    titles.set(meta.titles[0], path);
    descriptions.set(meta.descriptions[0], path);
  }
});

for (const [path, list] of [
  ["/referenzen?leistung=kuechen", "/referenzen"],
  ["/en/projects?service=kitchens", "/en/projects"],
]) {
  test(`${path} points canonical and og:url to the full list`, async ({
    page,
  }) => {
    await page.goto(path);
    const meta = await readMetadata(page);
    expect(meta.canonicals.map(pathOf)).toEqual([list]);
    expect(meta.og.url.map(pathOf)).toEqual([list]);
  });
}

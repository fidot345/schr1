import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * The projects list and a project page in both languages: no console
 * messages, no axe violations, one h1, no sideways scrolling from 360 to
 * 1920 px, canonical and language alternates, the filter by service with
 * and without JavaScript, the language switch keeps the project, and every
 * link to a project from the home page, the service pages and the project
 * pages opens a page. BRIEF.md stage 3. Slugs and counts are the seed's:
 * six projects, one kitchen, three cabinets.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const PROJECT_PAGES = [
  "/referenzen",
  "/en/projects",
  "/referenzen?leistung=schraenke-und-moebel",
  "/referenzen/wohnkueche-in-eiche",
  "/en/projects/open-plan-kitchen-in-oak",
] as const;

const PROJECT_PATH = /^(\/en)?\/(referenzen|projects)\/[^/]+$/;

/** The paths of all links on the page. */
const linkPaths = (page: Page): Promise<string[]> =>
  page.$$eval("a[href]", (links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  );

/** The project cards of the list, named by the page's h1. */
const cards = (page: Page, title: string) =>
  page
    .getByRole("region", { name: title })
    .locator("li > a[href*='/referenzen/'], li > a[href*='/projects/']");

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`projects pages at ${name}`, () => {
    test.use({ viewport: { width, height } });

    for (const path of PROJECT_PAGES) {
      test(`${path} has no console errors or warnings`, async ({ page }) => {
        const problems = watchConsole(page);

        await openAndScroll(page, path);

        expect(problems).toEqual([]);
      });

      test(`${path} has one h1 and no axe violations`, async ({ page }) => {
        await openAndScroll(page, path);

        await expect(page.locator("h1")).toHaveCount(1);
        expect(await axeViolations(page)).toEqual([]);
      });
    }
  });
}

test.describe("projects pages from 360 to 1920 px", () => {
  for (const path of PROJECT_PAGES) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, `${width} px`).toBe(0);
      }
    });
  }
});

test.describe("projects metadata", () => {
  test("the list has its title, canonical and both languages", async ({
    page,
  }) => {
    await page.goto("/referenzen?leistung=kuechen");

    await expect(page).toHaveTitle("Referenzen | Schreinerei Tannrieder");
    // A filtered list points to the whole list.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/referenzen$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/projects$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("a project names the same project in the other language", async ({
    page,
  }) => {
    await page.goto("/en/projects/open-plan-kitchen-in-oak");

    await expect(page).toHaveTitle(
      "Open-plan kitchen in oak | Schreinerei Tannrieder",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/projects\/open-plan-kitchen-in-oak$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", /\/referenzen\/wohnkueche-in-eiche$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });
});

for (const javaScriptEnabled of [false, true]) {
  test.describe(`the filter ${javaScriptEnabled ? "with" : "without"} JavaScript`, () => {
    test.use({ javaScriptEnabled, viewport: { width: 1440, height: 900 } });

    test("shows the projects of one service and all again", async ({
      page,
    }) => {
      await page.goto("/referenzen");
      const filter = page.getByRole("navigation", {
        name: "Referenzen nach Leistung filtern",
      });
      await expect(filter.getByRole("link", { name: "Alle" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(cards(page, "Referenzen")).toHaveCount(6);

      await filter.getByRole("link", { name: "Schränke & Möbel" }).click();
      await expect(page).toHaveURL(
        /\/referenzen\?leistung=schraenke-und-moebel$/,
      );
      await expect(
        filter.getByRole("link", { name: "Schränke & Möbel" }),
      ).toHaveAttribute("aria-current", "page");
      await expect(filter.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(cards(page, "Referenzen")).toHaveCount(3);

      await filter.getByRole("link", { name: "Küchen" }).click();
      await expect(page).toHaveURL(/\/referenzen\?leistung=kuechen$/);
      await expect(cards(page, "Referenzen")).toHaveCount(1);
      await expect(cards(page, "Referenzen")).toHaveAttribute(
        "href",
        "/referenzen/wohnkueche-in-eiche",
      );

      await filter.getByRole("link", { name: "Alle" }).click();
      await expect(page).toHaveURL(/\/referenzen$/);
      await expect(cards(page, "Referenzen")).toHaveCount(6);
    });

    test("uses the English parameter and slugs on /en", async ({ page }) => {
      await page.goto("/en/projects");
      const filter = page.getByRole("navigation", {
        name: "Filter projects by service",
      });

      await filter.getByRole("link", { name: "Kitchens" }).click();
      await expect(page).toHaveURL(/\/en\/projects\?service=kitchens$/);
      await expect(cards(page, "Projects")).toHaveCount(1);
      await expect(cards(page, "Projects")).toHaveAttribute(
        "href",
        "/en/projects/open-plan-kitchen-in-oak",
      );
    });
  });
}

test("an unknown service in the filter shows all projects", async ({
  page,
}) => {
  await page.goto("/referenzen?leistung=gibt-es-nicht");

  await expect(cards(page, "Referenzen")).toHaveCount(6);
  await expect(
    page
      .getByRole("navigation", { name: "Referenzen nach Leistung filtern" })
      .getByRole("link", { name: "Alle" }),
  ).toHaveAttribute("aria-current", "page");
});

test.describe("language switch on a project page at 1440 px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("goes to the same project with the other slug", async ({ page }) => {
    await page.goto("/referenzen/wohnkueche-in-eiche");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en\/projects\/open-plan-kitchen-in-oak$/);

    await page.getByRole("link", { name: "DE – Deutsch" }).click();
    await expect(page).toHaveURL(/\/referenzen\/wohnkueche-in-eiche$/);
  });
});

test.describe("a project page", () => {
  test("has the facts, the link to its service and the next project", async ({
    page,
  }) => {
    await page.goto("/referenzen/wohnkueche-in-eiche");

    for (const label of ["Objekt", "Jahr", "Dauer", "Material", "Leistung"]) {
      await expect(
        page.getByRole("term").filter({ hasText: label }),
      ).toHaveCount(1);
    }
    await expect(
      page.locator("dd").getByRole("link", { name: "Küchen" }),
    ).toHaveAttribute("href", "/leistungen/kuechen");
    await expect(
      page.getByRole("region", { name: "Die Aufgabe" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Unsere Lösung" }),
    ).toBeVisible();
    // The first project in the order has no previous one.
    const more = page.getByRole("region", { name: "Weitere Referenzen" });
    await expect(more.getByRole("link")).toHaveCount(1);
    await expect(more.getByRole("link")).toContainText("Nächste Referenz");
  });
});

test.describe("links to the projects", () => {
  for (const path of [
    "/",
    "/en",
    "/leistungen/schraenke-und-moebel",
    "/en/services/cabinets-and-furniture",
    "/referenzen",
    "/en/projects",
    "/referenzen/garderobe-mit-sitzbank",
    "/en/projects/hallway-unit-with-bench",
  ] as const) {
    test(`every project link on ${path} opens a page`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const targets = [
        ...new Set(
          (await linkPaths(page)).filter((link) => PROJECT_PATH.test(link)),
        ),
      ];
      expect(targets.length).toBeGreaterThanOrEqual(2);

      for (const target of targets) {
        const response = await request.get(target);
        expect(response.status(), target).toBe(200);
      }
    });
  }

  test("an unknown project is a 404", async ({ request }) => {
    expect((await request.get("/referenzen/gibt-es-nicht")).status()).toBe(404);
    expect((await request.get("/en/projects/does-not-exist")).status()).toBe(
      404,
    );
  });
});

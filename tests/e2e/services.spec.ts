import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * The services list and a service page in both languages: no console
 * messages, no axe violations, one h1, no sideways scrolling from 360 to
 * 1920 px, canonical and language alternates, the language switch keeps the
 * service, and every link to a service from the menu, the footer and the
 * cards opens a page. BRIEF.md stage 3. The slugs are the ones of the seed.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

const SERVICE_PAGES = [
  "/leistungen",
  "/en/services",
  "/leistungen/kuechen",
  "/en/services/kitchens",
] as const;

const SERVICE_PATH = /^(\/en)?\/(leistungen|services)(\/|$)/;

/** The paths of all links on the page that go to the services. */
const serviceLinks = (page: Page): Promise<string[]> =>
  page.$$eval("a[href]", (links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  );

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`services pages at ${name}`, () => {
    test.use({ viewport: { width, height } });

    for (const path of SERVICE_PAGES) {
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

test.describe("services pages from 360 to 1920 px", () => {
  for (const path of SERVICE_PAGES) {
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

test.describe("services metadata", () => {
  test("the list has its title, canonical and both languages", async ({
    page,
  }) => {
    await page.goto("/leistungen");

    await expect(page).toHaveTitle("Leistungen | Schreinerei Tannrieder");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/leistungen$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", /\/en\/services$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("a service names the same service in the other language", async ({
    page,
  }) => {
    await page.goto("/en/services/kitchens");

    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/services\/kitchens$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", /\/leistungen\/kuechen$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });
});

test.describe("language switch on a service page at 1440 px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("goes to the same service with the other slug", async ({ page }) => {
    await page.goto("/leistungen/kuechen");
    await page.getByRole("link", { name: "EN – English" }).click();
    await expect(page).toHaveURL(/\/en\/services\/kitchens$/);

    await page.getByRole("link", { name: "DE – Deutsch" }).click();
    await expect(page).toHaveURL(/\/leistungen\/kuechen$/);
  });
});

test.describe("links to the services", () => {
  for (const path of ["/", "/en", "/leistungen", "/en/services"] as const) {
    test(`every service link on ${path} opens a page`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const targets = [
        ...new Set(
          (await serviceLinks(page)).filter((link) => SERVICE_PATH.test(link)),
        ),
      ];
      // The list (menu and footer) and the four services.
      expect(targets.length).toBeGreaterThanOrEqual(5);

      for (const target of targets) {
        const response = await request.get(target);
        expect(response.status(), target).toBe(200);
      }
    });
  }

  test("an unknown service is a 404", async ({ request }) => {
    expect((await request.get("/leistungen/gibt-es-nicht")).status()).toBe(404);
    expect((await request.get("/en/services/does-not-exist")).status()).toBe(
      404,
    );
  });
});

import { expect, type Page, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

/*
 * The home page on a desktop and on a phone: no console messages, no axe
 * violations, the phone menu works with the keyboard, and nothing comes from
 * another domain or sets a cookie. docs/REDESIGN.md, session 6. And it shows
 * the content of Payload: real photos with alt texts, the texts of the seed
 * (seed/data.ts) in both languages, no photo stand-ins or placeholder text.
 */

/** Photos of the home page: first screen, 4 services, 3 projects, jobs, about. */
const PHOTOS = 10;

/** Words of the photo stand-ins and of placeholder text that must be gone. */
const PLACEHOLDER = /Platzhalter|Placeholder|Foto:|Photo:|Lorem|ipsum/i;

/** Every photo of <main> except the flat wardrobe, with what the browser loaded. */
const photosOf = (page: Page) =>
  page.$$eval("main img", (images) =>
    images
      .map((image) => image as HTMLImageElement)
      .filter((image) => !image.currentSrc.includes("schrank-platzhalter"))
      .map((image) => ({
        alt: image.alt,
        src: image.currentSrc,
        loaded: image.complete && image.naturalWidth > 0,
      })),
  );

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const HOME_PAGES = ["/", "/en"] as const;

for (const { name, width, height } of VIEWPORTS) {
  test.describe(`home page at ${name}`, () => {
    test.use({ viewport: { width, height } });

    for (const path of HOME_PAGES) {
      test(`${path} has no console errors or warnings`, async ({ page }) => {
        const problems = watchConsole(page);

        await openAndScroll(page, path);

        expect(problems).toEqual([]);
      });

      test(`${path} has no axe violations`, async ({ page }) => {
        await openAndScroll(page, path);

        expect(await axeViolations(page)).toEqual([]);
      });
    }
  });
}

test.describe("content from Payload", () => {
  for (const { name, width, height } of VIEWPORTS) {
    test(`every photo is loaded through next/image with an alt text at ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      for (const path of HOME_PAGES) {
        await openAndScroll(page, path);
        // Lazy photos below the fold start loading while the page goes down.
        await page.waitForFunction(() =>
          [...document.querySelectorAll("main img")].every(
            (image) => (image as HTMLImageElement).complete,
          ),
        );

        const photos = await photosOf(page);
        expect(photos, path).toHaveLength(PHOTOS);
        for (const photo of photos) {
          expect(photo.loaded, photo.src).toBe(true);
          expect(photo.alt.length, photo.src).toBeGreaterThan(20);
          expect(photo.src).toContain("/_next/image?url=%2Fapi%2Fmedia%2F");
        }
        // The first screen's photo is the LCP: not lazy.
        await expect(page.locator("main img").first()).toHaveAttribute(
          "loading",
          "eager",
        );
      }
    });
  }

  for (const path of HOME_PAGES) {
    test(`${path} has no photo stand-ins and no placeholder text`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.locator(".photo-placeholder")).toHaveCount(0);
      await expect(page.locator('main div[role="img"]')).toHaveCount(0);
      // The text of the page, without the scripts that carry all messages.
      const text = await page.locator("body > :not(script)").allTextContents();
      expect(text.join(" ")).not.toMatch(PLACEHOLDER);
    });
  }

  test("/ shows the texts of the admin panel", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");

    await expect(page.locator("h1")).toHaveText(
      "Möbel nach Maß aus unserer Werkstatt in Wendelfing",
    );
    await expect(
      main.getByText("Meisterbetrieb", { exact: true }),
    ).toBeVisible();

    const services = page.getByRole("region", { name: "Was wir bauen" });
    await expect(services.getByRole("link")).toHaveCount(4);
    await expect(
      services.getByRole("link", { name: /Küchen/ }),
    ).toHaveAttribute("href", "/leistungen/kuechen");

    const scene = page.getByRole("region", { name: "Vom Brett zum Schrank" });
    await expect(scene.getByText("Zuschnitt", { exact: true })).toBeVisible();
    await expect(scene.getByText(/^Jedes Teil wird/)).toBeVisible();

    const projects = page.getByRole("region", { name: "Ausgewählte Projekte" });
    await expect(projects.locator('a[href^="/referenzen/"]')).toHaveCount(3);
    await expect(
      projects.getByText("Einfamilienhaus, 2025, 9 Wochen"),
    ).toBeVisible();

    const jobs = page.getByRole("region", { name: "Wir suchen Verstärkung" });
    await expect(jobs.locator('a[href^="/karriere/"]')).toHaveCount(3);
    await expect(
      jobs.getByText("Vollzeit, ab sofort, 19–23 € pro Stunde"),
    ).toBeVisible();

    const stories = page.getByRole("region", { name: "Was Kunden sagen" });
    await expect(stories.locator("figure")).toHaveCount(3);
    await expect(
      stories.getByText("Familie K., Einfamilienhaus"),
    ).toBeVisible();

    const contact = page.getByRole("region", { name: "Sprechen Sie mit uns" });
    await expect(contact.getByText("7:00–16:30 Uhr")).toBeVisible();
    await expect(
      contact.getByText(/Umkreis von etwa 40 km um Wendelfing/),
    ).toBeVisible();
    await expect(
      page
        .locator("footer")
        .getByText(
          "Schreinerei mit eigener Werkstatt in Wendelfing, seit 1989.",
        ),
    ).toBeVisible();
  });

  test("/en shows the English texts of the admin panel", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("h1")).toHaveText(
      "Made-to-measure furniture from our workshop in Wendelfing",
    );
    await expect(
      page
        .getByRole("region", { name: "What we build" })
        .getByRole("link", { name: /Kitchens/ }),
    ).toHaveAttribute("href", "/en/services/kitchens");
    const scene = page.getByRole("region", { name: "From board to wardrobe" });
    await expect(scene.getByText("Cutting", { exact: true })).toBeVisible();
    await expect(scene.getByText(/^Every part is cut/)).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Selected projects" })
        .getByText("Detached house, 2025, 9 weeks"),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "We're hiring" }).locator("li"),
    ).toHaveCount(3);
    await expect(
      page.locator("footer").getByText("Joinery with its own workshop"),
    ).toBeVisible();
  });
});

test.describe("phone menu at 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens and closes with the keyboard", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menü" });
    const menu = page.getByRole("dialog", { name: "Menü" });
    await expect(menu).toBeHidden();

    // Enter opens it; focus moves to "Schließen" and stays inside the menu.
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Schließen" })).toBeFocused();
    for (let tab = 0; tab < 10; tab += 1) {
      await page.keyboard.press("Tab");
      expect(
        await menu.evaluate((dialog) =>
          dialog.contains(document.activeElement),
        ),
      ).toBe(true);
    }

    // Esc closes it and gives the focus back to "Menü".
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // Space opens it again, Enter on "Schließen" closes it.
    await page.keyboard.press("Space");
    await expect(menu).toBeVisible();
    await page.getByRole("button", { name: "Schließen" }).focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});

test.describe("privacy of the home page", () => {
  for (const { name, width, height } of VIEWPORTS) {
    test(`everything comes from our own domain and no cookie is set at ${name}`, async ({
      page,
      context,
      baseURL,
    }) => {
      await page.setViewportSize({ width, height });
      const hosts = new Set<string>();
      page.on("request", (request) => {
        const { protocol, host } = new URL(request.url());
        if (protocol === "http:" || protocol === "https:") {
          hosts.add(host);
        }
      });

      for (const path of HOME_PAGES) {
        await openAndScroll(page, path);
      }

      expect([...hosts]).toEqual([new URL(baseURL ?? "").host]);
      expect(await context.cookies()).toEqual([]);
    });
  }
});

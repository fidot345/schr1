import AxeBuilder from "@axe-core/playwright";
import { type ConsoleMessage, expect, type Page, test } from "@playwright/test";

/*
 * The home page on a desktop and on a phone: no console messages, no axe
 * violations, the phone menu works with the keyboard, and nothing comes from
 * another domain or sets a cookie. docs/REDESIGN.md, session 6.
 */

const VIEWPORTS = [
  { name: "1440 px", width: 1440, height: 900 },
  { name: "390 px", width: 390, height: 844 },
] as const;

const HOME_PAGES = ["/", "/en"] as const;

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/*
 * TEMP(stage-3): the pages the home page links to but that do not exist yet
 * (request form, careers, about, projects, services, contact, legal pages),
 * in German and in English. In a production build next/link prefetches them
 * and the browser logs a 404 for each. Only such 404s are ignored; delete this
 * with the stage-3 pages.
 */
const NOT_BUILT_YET =
  /^(\/en)?\/(anfrage|request|karriere|careers|ueber-uns|about|referenzen|projects|leistungen|services|kontakt|contact|impressum|imprint|datenschutz|privacy)(\/|$)/;

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const isMissingPage = (message: ConsoleMessage): boolean =>
  /status of 404/.test(message.text()) &&
  NOT_BUILT_YET.test(pathOf(message.location().url));

/** Everything the browser reports as an error or a warning, and uncaught errors. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const type = message.type();
    if ((type === "error" || type === "warning") && !isMissingPage(message)) {
      problems.push(`${type}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

/**
 * Opens a page and goes down it once. Links are prefetched when they come into
 * view, so a request that fails below the fold shows up too. Ends at the top.
 */
async function openAndScroll(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
  // The prefetches start right after the links come into view.
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
}

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

        const { violations } = await new AxeBuilder({ page })
          .withTags(AXE_TAGS)
          .analyze();

        expect(
          violations.map(
            ({ id, nodes }) =>
              `${id}: ${nodes.map((node) => node.target.join(" ")).join(", ")}`,
          ),
        ).toEqual([]);
      });
    }
  });
}

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

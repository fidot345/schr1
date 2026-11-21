import { expect, test } from "@playwright/test";
import {
  axeViolations,
  openAndScroll,
  watchConsole,
} from "./support/page-checks";

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
